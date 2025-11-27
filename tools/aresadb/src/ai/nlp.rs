//! Natural Language Processing
//!
//! Converts natural language queries to structured database operations.

use anyhow::{Result, bail};
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

use crate::cli::config::Config;
use crate::query::{ParsedQuery, QueryOperation, Condition, Operator, OrderBy};
use crate::storage::{Database, Value};

/// NLP processor for converting natural language to queries
pub struct NlpProcessor {
    config: Config,
    client: Option<reqwest::Client>,
}

impl NlpProcessor {
    /// Create a new NLP processor
    pub fn new() -> Result<Self> {
        let config = Config::load()?;
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(30))
            .build()
            .ok();

        Ok(Self { config, client })
    }

    /// Parse a natural language query
    pub async fn parse(&self, query: &str, db: &Database) -> Result<ParsedQuery> {
        // First try rule-based parsing for common patterns
        if let Some(parsed) = self.parse_with_rules(query, db).await? {
            return Ok(parsed);
        }

        // Fall back to LLM if configured
        if self.config.llm.provider.is_empty() {
            // No LLM configured - use best-effort rule parsing
            self.parse_fallback(query)
        } else {
            self.parse_with_llm(query, db).await
        }
    }

    /// Rule-based parsing for common patterns
    async fn parse_with_rules(&self, query: &str, db: &Database) -> Result<Option<ParsedQuery>> {
        let query_lower = query.to_lowercase();
        let words: Vec<&str> = query_lower.split_whitespace().collect();

        // Pattern: "show all <type>" or "list all <type>" or "get all <type>"
        if (query_lower.starts_with("show all")
            || query_lower.starts_with("list all")
            || query_lower.starts_with("get all")
            || query_lower.starts_with("find all"))
        {
            if let Some(node_type) = words.get(2) {
                let node_type = node_type.trim_end_matches('s'); // Remove plural
                return Ok(Some(ParsedQuery {
                    operation: QueryOperation::Select,
                    target: node_type.to_string(),
                    columns: Vec::new(),
                    conditions: Vec::new(),
                    order_by: Vec::new(),
                    limit: None,
                    offset: None,
                    data: None,
                }));
            }
        }

        // Pattern: "show <type>" or "list <type>"
        if query_lower.starts_with("show ") || query_lower.starts_with("list ") {
            if let Some(node_type) = words.get(1) {
                let node_type = node_type.trim_end_matches('s');
                return Ok(Some(ParsedQuery {
                    operation: QueryOperation::Select,
                    target: node_type.to_string(),
                    columns: Vec::new(),
                    conditions: Vec::new(),
                    order_by: Vec::new(),
                    limit: Some(100),
                    offset: None,
                    data: None,
                }));
            }
        }

        // Pattern: "add <type> <name> with <field> <value>"
        if query_lower.starts_with("add ") || query_lower.starts_with("create ") || query_lower.starts_with("insert ") {
            return self.parse_insert_pattern(&words);
        }

        // Pattern: "find <type> where/with <field> <op> <value>"
        if query_lower.starts_with("find ") || query_lower.starts_with("search ") {
            return self.parse_find_pattern(&words);
        }

        // Pattern: "delete <type> where <field> = <value>"
        if query_lower.starts_with("delete ") || query_lower.starts_with("remove ") {
            return self.parse_delete_pattern(&words);
        }

        // Pattern: "count <type>"
        if query_lower.starts_with("count ") {
            if let Some(node_type) = words.get(1) {
                let node_type = node_type.trim_end_matches('s');
                return Ok(Some(ParsedQuery {
                    operation: QueryOperation::Select,
                    target: node_type.to_string(),
                    columns: vec!["COUNT(*)".to_string()],
                    conditions: Vec::new(),
                    order_by: Vec::new(),
                    limit: None,
                    offset: None,
                    data: None,
                }));
            }
        }

        Ok(None)
    }

    /// Parse insert pattern
    fn parse_insert_pattern(&self, words: &[&str]) -> Result<Option<ParsedQuery>> {
        // "add user John with email john@example.com age 30"
        if words.len() < 3 {
            return Ok(None);
        }

        let node_type = words[1].trim_end_matches('s');
        let mut data = BTreeMap::new();

        // Check if second word might be a name
        if words.len() > 2 && !["with", "where", "having"].contains(&words[2]) {
            data.insert("name".to_string(), Value::String(words[2].to_string()));
        }

        // Parse "with" or "having" clauses
        let mut i = 3;
        if words.get(3) == Some(&"with") || words.get(3) == Some(&"having") {
            i = 4;
        }

        while i < words.len() {
            let field = words[i];
            if let Some(value_str) = words.get(i + 1) {
                let value = self.parse_value(value_str);
                data.insert(field.to_string(), value);
                i += 2;
            } else {
                break;
            }
        }

        if data.is_empty() {
            return Ok(None);
        }

        Ok(Some(ParsedQuery {
            operation: QueryOperation::Insert,
            target: node_type.to_string(),
            columns: data.keys().cloned().collect(),
            conditions: Vec::new(),
            order_by: Vec::new(),
            limit: None,
            offset: None,
            data: Some(data),
        }))
    }

    /// Parse find pattern
    fn parse_find_pattern(&self, words: &[&str]) -> Result<Option<ParsedQuery>> {
        // "find users where age > 25"
        // "find users with name John"
        if words.len() < 2 {
            return Ok(None);
        }

        let node_type = words[1].trim_end_matches('s');
        let mut conditions = Vec::new();
        let mut limit = None;

        // Find "where", "with", or "having" keyword
        let condition_start = words.iter()
            .position(|w| *w == "where" || *w == "with" || *w == "having")
            .map(|p| p + 1);

        if let Some(start) = condition_start {
            let mut i = start;
            while i < words.len() {
                let field = words[i];

                // Check for operator
                if let Some(op_word) = words.get(i + 1) {
                    let (operator, value_idx) = match *op_word {
                        "=" | "==" | "is" | "equals" => (Operator::Eq, i + 2),
                        "!=" | "<>" | "not" => (Operator::Ne, i + 2),
                        ">" | "over" | "above" | "greater" => (Operator::Gt, i + 2),
                        ">=" => (Operator::Ge, i + 2),
                        "<" | "under" | "below" | "less" => (Operator::Lt, i + 2),
                        "<=" => (Operator::Le, i + 2),
                        "like" | "contains" | "matching" => (Operator::Like, i + 2),
                        _ => {
                            // Assume equality with value directly after field
                            (Operator::Eq, i + 1)
                        }
                    };

                    if let Some(value_str) = words.get(value_idx) {
                        // Skip "than" if present
                        let actual_value = if *value_str == "than" {
                            words.get(value_idx + 1)
                        } else {
                            Some(value_str)
                        };

                        if let Some(v) = actual_value {
                            let value = self.parse_value(v);
                            conditions.push(Condition {
                                column: field.to_string(),
                                operator,
                                value,
                            });
                        }

                        i = value_idx + 2;
                    } else {
                        break;
                    }
                } else {
                    break;
                }

                // Skip "and" connector
                if words.get(i) == Some(&"and") {
                    i += 1;
                }
            }
        }

        // Check for limit
        if let Some(limit_pos) = words.iter().position(|w| *w == "limit") {
            if let Some(n) = words.get(limit_pos + 1) {
                limit = n.parse().ok();
            }
        }

        // Check for "first N" or "top N"
        if let Some(first_pos) = words.iter().position(|w| *w == "first" || *w == "top") {
            if let Some(n) = words.get(first_pos + 1) {
                limit = n.parse().ok();
            }
        }

        Ok(Some(ParsedQuery {
            operation: QueryOperation::Select,
            target: node_type.to_string(),
            columns: Vec::new(),
            conditions,
            order_by: Vec::new(),
            limit,
            offset: None,
            data: None,
        }))
    }

    /// Parse delete pattern
    fn parse_delete_pattern(&self, words: &[&str]) -> Result<Option<ParsedQuery>> {
        // "delete users where id = xyz"
        if words.len() < 2 {
            return Ok(None);
        }

        let node_type = words[1].trim_end_matches('s');
        let mut conditions = Vec::new();

        if let Some(where_pos) = words.iter().position(|w| *w == "where") {
            let field = words.get(where_pos + 1);
            let value = words.get(where_pos + 3).or(words.get(where_pos + 2));

            if let (Some(f), Some(v)) = (field, value) {
                conditions.push(Condition {
                    column: f.to_string(),
                    operator: Operator::Eq,
                    value: self.parse_value(v),
                });
            }
        }

        Ok(Some(ParsedQuery {
            operation: QueryOperation::Delete,
            target: node_type.to_string(),
            columns: Vec::new(),
            conditions,
            order_by: Vec::new(),
            limit: None,
            offset: None,
            data: None,
        }))
    }

    /// Parse a value string to a Value
    fn parse_value(&self, s: &str) -> Value {
        // Try to parse as number
        if let Ok(i) = s.parse::<i64>() {
            return Value::Int(i);
        }
        if let Ok(f) = s.parse::<f64>() {
            return Value::Float(f);
        }

        // Try to parse as boolean
        match s.to_lowercase().as_str() {
            "true" | "yes" => return Value::Bool(true),
            "false" | "no" => return Value::Bool(false),
            "null" | "none" => return Value::Null,
            _ => {}
        }

        // Default to string
        Value::String(s.to_string())
    }

    /// Parse with LLM
    async fn parse_with_llm(&self, query: &str, db: &Database) -> Result<ParsedQuery> {
        let client = self.client.as_ref()
            .ok_or_else(|| anyhow::anyhow!("HTTP client not available"))?;

        // Get schema context
        let schema_context = self.get_schema_context(db).await?;

        let prompt = format!(
            r#"You are a database query assistant. Convert the following natural language query to a structured JSON response.

Available schemas:
{}

User query: "{}"

Respond with JSON in this exact format:
{{
    "operation": "select" | "insert" | "update" | "delete",
    "target": "table_name",
    "columns": ["col1", "col2"],  // empty array for all columns
    "conditions": [
        {{"column": "field_name", "operator": "eq" | "ne" | "gt" | "lt" | "ge" | "le" | "like", "value": <value>}}
    ],
    "order_by": [{{"column": "field", "descending": false}}],
    "limit": null | number,
    "data": {{"field": "value"}}  // for insert/update only
}}

Only respond with the JSON, no explanation."#,
            schema_context, query
        );

        let response = match self.config.llm.provider.as_str() {
            "openai" => self.call_openai(client, &prompt).await?,
            "anthropic" => self.call_anthropic(client, &prompt).await?,
            _ => bail!("Unsupported LLM provider: {}", self.config.llm.provider),
        };

        self.parse_llm_response(&response)
    }

    /// Get schema context for LLM prompt
    async fn get_schema_context(&self, db: &Database) -> Result<String> {
        use crate::schema::SchemaManager;

        let manager = SchemaManager::new(Database::open(db.path()).await?);
        let schemas = manager.list_schemas().await?;

        let mut context = Vec::new();
        for schema in schemas {
            let fields: Vec<String> = schema.fields.iter()
                .map(|f| format!("  - {} ({:?})", f.name, f.field_type))
                .collect();
            context.push(format!("{}:\n{}", schema.name, fields.join("\n")));
        }

        if context.is_empty() {
            Ok("(no schemas defined - data is schema-less)".to_string())
        } else {
            Ok(context.join("\n\n"))
        }
    }

    /// Call OpenAI API
    async fn call_openai(&self, client: &reqwest::Client, prompt: &str) -> Result<String> {
        let api_key = self.config.llm.api_key.as_ref()
            .ok_or_else(|| anyhow::anyhow!("OpenAI API key not configured. Run: aresadb config set llm.api_key <key>"))?;

        let base_url = self.config.llm.base_url.as_deref()
            .unwrap_or("https://api.openai.com/v1");
        let model = self.config.llm.model.as_deref()
            .unwrap_or("gpt-4o-mini");

        let body = serde_json::json!({
            "model": model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.1,
            "max_tokens": 1000
        });

        let response = client
            .post(format!("{}/chat/completions", base_url))
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await?;

        let data: serde_json::Value = response.json().await?;

        data["choices"][0]["message"]["content"]
            .as_str()
            .map(|s| s.to_string())
            .ok_or_else(|| anyhow::anyhow!("Invalid OpenAI response"))
    }

    /// Call Anthropic API
    async fn call_anthropic(&self, client: &reqwest::Client, prompt: &str) -> Result<String> {
        let api_key = self.config.llm.api_key.as_ref()
            .ok_or_else(|| anyhow::anyhow!("Anthropic API key not configured. Run: aresadb config set llm.api_key <key>"))?;

        let base_url = self.config.llm.base_url.as_deref()
            .unwrap_or("https://api.anthropic.com/v1");
        let model = self.config.llm.model.as_deref()
            .unwrap_or("claude-3-haiku-20240307");

        let body = serde_json::json!({
            "model": model,
            "max_tokens": 1000,
            "messages": [
                {"role": "user", "content": prompt}
            ]
        });

        let response = client
            .post(format!("{}/messages", base_url))
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await?;

        let data: serde_json::Value = response.json().await?;

        data["content"][0]["text"]
            .as_str()
            .map(|s| s.to_string())
            .ok_or_else(|| anyhow::anyhow!("Invalid Anthropic response"))
    }

    /// Parse LLM response into ParsedQuery
    fn parse_llm_response(&self, response: &str) -> Result<ParsedQuery> {
        // Extract JSON from response (might have markdown code blocks)
        let json_str = if response.contains("```") {
            response
                .split("```")
                .nth(1)
                .map(|s| s.trim_start_matches("json").trim())
                .unwrap_or(response)
        } else {
            response.trim()
        };

        let parsed: LlmQueryResponse = serde_json::from_str(json_str)?;

        let operation = match parsed.operation.as_str() {
            "select" => QueryOperation::Select,
            "insert" => QueryOperation::Insert,
            "update" => QueryOperation::Update,
            "delete" => QueryOperation::Delete,
            _ => bail!("Unknown operation: {}", parsed.operation),
        };

        let conditions: Vec<Condition> = parsed.conditions
            .unwrap_or_default()
            .into_iter()
            .map(|c| Condition {
                column: c.column,
                operator: match c.operator.as_str() {
                    "eq" | "=" => Operator::Eq,
                    "ne" | "!=" => Operator::Ne,
                    "gt" | ">" => Operator::Gt,
                    "ge" | ">=" => Operator::Ge,
                    "lt" | "<" => Operator::Lt,
                    "le" | "<=" => Operator::Le,
                    "like" => Operator::Like,
                    "in" => Operator::In,
                    _ => Operator::Eq,
                },
                value: Value::from_json(c.value).unwrap_or(Value::Null),
            })
            .collect();

        let order_by: Vec<OrderBy> = parsed.order_by
            .unwrap_or_default()
            .into_iter()
            .map(|o| OrderBy {
                column: o.column,
                descending: o.descending.unwrap_or(false),
            })
            .collect();

        let data: Option<BTreeMap<String, Value>> = parsed.data
            .map(|obj| {
                obj.as_object()
                    .map(|m| {
                        m.iter()
                            .map(|(k, v)| (k.clone(), Value::from_json(v.clone()).unwrap_or(Value::Null)))
                            .collect()
                    })
                    .unwrap_or_default()
            });

        Ok(ParsedQuery {
            operation,
            target: parsed.target,
            columns: parsed.columns.unwrap_or_default(),
            conditions,
            order_by,
            limit: parsed.limit,
            offset: None,
            data,
        })
    }

    /// Fallback parsing when no LLM is configured
    fn parse_fallback(&self, query: &str) -> Result<ParsedQuery> {
        // Extract likely table name from query
        let words: Vec<&str> = query.split_whitespace().collect();

        // Look for common patterns
        let target = words.iter()
            .find(|w| !["show", "find", "get", "list", "all", "from", "where", "the", "a", "an"].contains(&w.to_lowercase().as_str()))
            .map(|s| s.trim_end_matches('s').to_string())
            .unwrap_or_else(|| "data".to_string());

        Ok(ParsedQuery {
            operation: QueryOperation::Select,
            target,
            columns: Vec::new(),
            conditions: Vec::new(),
            order_by: Vec::new(),
            limit: Some(100),
            offset: None,
            data: None,
        })
    }
}

/// LLM response structure
#[derive(Debug, Deserialize)]
struct LlmQueryResponse {
    operation: String,
    target: String,
    columns: Option<Vec<String>>,
    conditions: Option<Vec<LlmCondition>>,
    order_by: Option<Vec<LlmOrderBy>>,
    limit: Option<usize>,
    data: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
struct LlmCondition {
    column: String,
    operator: String,
    value: serde_json::Value,
}

#[derive(Debug, Deserialize)]
struct LlmOrderBy {
    column: String,
    descending: Option<bool>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_value() {
        let nlp = NlpProcessor {
            config: Config::default(),
            client: None,
        };

        assert_eq!(nlp.parse_value("42"), Value::Int(42));
        assert_eq!(nlp.parse_value("3.14"), Value::Float(3.14));
        assert_eq!(nlp.parse_value("true"), Value::Bool(true));
        assert_eq!(nlp.parse_value("hello"), Value::String("hello".to_string()));
    }
}


