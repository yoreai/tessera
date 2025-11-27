//! Natural language query parser using LLM

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};

use crate::config::ConfigManager;
use super::intent::{ParsedQuery, QueryContext, QueryIntent, TargetType};

/// Query parser using LLM
pub struct QueryParser<'a> {
    config: &'a ConfigManager,
    client: reqwest::Client,
}

impl<'a> QueryParser<'a> {
    /// Create a new query parser
    pub fn new(config: &'a ConfigManager) -> Result<Self> {
        let client = reqwest::Client::new();
        Ok(Self { config, client })
    }

    /// Parse a natural language query
    pub async fn parse(&self, query: &str) -> Result<ParsedQuery> {
        // First, try simple pattern matching for common queries
        if let Some(parsed) = self.try_simple_parse(query) {
            return Ok(parsed);
        }

        // Fall back to LLM parsing
        self.parse_with_llm(query).await
    }

    /// Try simple pattern matching for common queries
    fn try_simple_parse(&self, query: &str) -> Option<ParsedQuery> {
        let query_lower = query.to_lowercase();

        // File search patterns
        if query_lower.contains("find") && (query_lower.contains("file") || query_lower.contains("in ~/") || query_lower.contains("in ./")) {
            return Some(self.parse_file_query(query));
        }

        // Content search patterns
        if query_lower.contains("search") && query_lower.contains("content") {
            return Some(self.parse_content_query(query));
        }

        // Git repository patterns
        if query_lower.contains("git") && (query_lower.contains("repo") || query_lower.contains("repository")) {
            return Some(ParsedQuery {
                original: query.to_string(),
                intent: QueryIntent::FindGitRepos,
                target_type: TargetType::Filesystem,
                target_source: None,
                sql: None,
                pattern: None,
                path: Some(".".to_string()),
                context: QueryContext::default(),
            });
        }

        // Database patterns
        if query_lower.contains("table") || query_lower.contains("database") || query_lower.contains("postgres") || query_lower.contains("bigquery") {
            return Some(self.parse_database_query(query));
        }

        None
    }

    /// Parse a file search query
    fn parse_file_query(&self, query: &str) -> ParsedQuery {
        // Extract pattern and path
        let pattern = extract_quoted_string(query)
            .or_else(|| extract_file_pattern(query))
            .unwrap_or_else(|| "*".to_string());

        let path = extract_path(query).unwrap_or_else(|| ".".to_string());

        ParsedQuery {
            original: query.to_string(),
            intent: QueryIntent::SearchFiles,
            target_type: TargetType::Filesystem,
            target_source: None,
            sql: None,
            pattern: Some(pattern),
            path: Some(path),
            context: QueryContext::default(),
        }
    }

    /// Parse a content search query
    fn parse_content_query(&self, query: &str) -> ParsedQuery {
        let pattern = extract_quoted_string(query).unwrap_or_else(|| {
            // Try to extract search term
            query
                .split_whitespace()
                .find(|w| !["search", "find", "for", "in", "content", "files"].contains(w))
                .map(String::from)
                .unwrap_or_else(|| "*".to_string())
        });

        let path = extract_path(query).unwrap_or_else(|| ".".to_string());

        ParsedQuery {
            original: query.to_string(),
            intent: QueryIntent::SearchContent,
            target_type: TargetType::Filesystem,
            target_source: None,
            sql: None,
            pattern: Some(pattern),
            path: Some(path),
            context: QueryContext::default(),
        }
    }

    /// Parse a database query
    fn parse_database_query(&self, query: &str) -> ParsedQuery {
        let query_lower = query.to_lowercase();

        // Detect target type
        let target_type = if query_lower.contains("bigquery") {
            TargetType::BigQuery
        } else if query_lower.contains("postgres") {
            TargetType::Postgres
        } else if query_lower.contains("sqlite") {
            TargetType::SQLite
        } else {
            // Try to find a configured source
            TargetType::Unknown
        };

        // Detect intent
        let intent = if query_lower.contains("list") && query_lower.contains("table") {
            QueryIntent::ListTables
        } else if query_lower.contains("describe") || query_lower.contains("schema") {
            QueryIntent::DescribeTable
        } else {
            QueryIntent::SqlQuery
        };

        // Extract table name if mentioned
        let table = extract_table_name(query);

        ParsedQuery {
            original: query.to_string(),
            intent,
            target_type,
            target_source: None,
            sql: None,
            pattern: None,
            path: None,
            context: QueryContext {
                table,
                ..Default::default()
            },
        }
    }

    /// Parse using LLM
    async fn parse_with_llm(&self, query: &str) -> Result<ParsedQuery> {
        let llm_config = self.config.get_llm_config()
            .context("No LLM provider configured. Run: aresa config set-llm openai --api-key <key>")?;

        let api_key = self.config.get_llm_api_key()?;

        // Get available data sources for context
        let sources: Vec<String> = self.config.sources().keys().cloned().collect();

        let system_prompt = format!(
            r#"You are a query parser for a CLI tool. Parse the user's natural language query and return a JSON response.

Available data sources: {}

Return JSON with these fields:
- intent: one of "search_files", "search_content", "find_git_repos", "sql_query", "list_tables", "describe_table", "search_blobs"
- target_type: one of "filesystem", "postgres", "bigquery", "sqlite", "s3", "gcs"
- target_source: name of the configured data source to use (if applicable)
- sql: generated SQL query (if applicable, for database queries)
- pattern: search pattern (for file/content searches)
- path: search path (for filesystem searches)
- table: table name (if mentioned)
- columns: list of column names (if mentioned)
- conditions: list of filter conditions (if mentioned)

Be concise and accurate. Generate valid SQL for database queries."#,
            sources.join(", ")
        );

        let response = match llm_config.provider.as_str() {
            "openai" => self.call_openai(&api_key, &system_prompt, query).await?,
            "anthropic" => self.call_anthropic(&api_key, &system_prompt, query).await?,
            _ => return Err(anyhow::anyhow!("Unsupported LLM provider: {}", llm_config.provider)),
        };

        // Parse LLM response
        self.parse_llm_response(query, &response)
    }

    /// Call OpenAI API
    async fn call_openai(&self, api_key: &str, system_prompt: &str, query: &str) -> Result<String> {
        #[derive(Serialize)]
        struct OpenAIRequest {
            model: String,
            messages: Vec<Message>,
            response_format: ResponseFormat,
        }

        #[derive(Serialize)]
        struct Message {
            role: String,
            content: String,
        }

        #[derive(Serialize)]
        struct ResponseFormat {
            #[serde(rename = "type")]
            format_type: String,
        }

        #[derive(Deserialize)]
        struct OpenAIResponse {
            choices: Vec<Choice>,
        }

        #[derive(Deserialize)]
        struct Choice {
            message: MessageContent,
        }

        #[derive(Deserialize)]
        struct MessageContent {
            content: String,
        }

        let request = OpenAIRequest {
            model: "gpt-4o-mini".to_string(),
            messages: vec![
                Message {
                    role: "system".to_string(),
                    content: system_prompt.to_string(),
                },
                Message {
                    role: "user".to_string(),
                    content: query.to_string(),
                },
            ],
            response_format: ResponseFormat {
                format_type: "json_object".to_string(),
            },
        };

        let response: OpenAIResponse = self
            .client
            .post("https://api.openai.com/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", api_key))
            .json(&request)
            .send()
            .await?
            .json()
            .await?;

        Ok(response.choices[0].message.content.clone())
    }

    /// Call Anthropic API
    async fn call_anthropic(&self, api_key: &str, system_prompt: &str, query: &str) -> Result<String> {
        #[derive(Serialize)]
        struct AnthropicRequest {
            model: String,
            max_tokens: u32,
            system: String,
            messages: Vec<Message>,
        }

        #[derive(Serialize)]
        struct Message {
            role: String,
            content: String,
        }

        #[derive(Deserialize)]
        struct AnthropicResponse {
            content: Vec<Content>,
        }

        #[derive(Deserialize)]
        struct Content {
            text: String,
        }

        let request = AnthropicRequest {
            model: "claude-3-haiku-20240307".to_string(),
            max_tokens: 1024,
            system: system_prompt.to_string(),
            messages: vec![Message {
                role: "user".to_string(),
                content: query.to_string(),
            }],
        };

        let response: AnthropicResponse = self
            .client
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .json(&request)
            .send()
            .await?
            .json()
            .await?;

        Ok(response.content[0].text.clone())
    }

    /// Parse LLM response into ParsedQuery
    fn parse_llm_response(&self, original: &str, response: &str) -> Result<ParsedQuery> {
        #[derive(Deserialize)]
        struct LlmResponse {
            intent: String,
            target_type: String,
            target_source: Option<String>,
            sql: Option<String>,
            pattern: Option<String>,
            path: Option<String>,
            table: Option<String>,
            columns: Option<Vec<String>>,
            conditions: Option<Vec<String>>,
        }

        let parsed: LlmResponse = serde_json::from_str(response)
            .context("Failed to parse LLM response")?;

        let intent = match parsed.intent.as_str() {
            "search_files" => QueryIntent::SearchFiles,
            "search_content" => QueryIntent::SearchContent,
            "find_git_repos" => QueryIntent::FindGitRepos,
            "sql_query" => QueryIntent::SqlQuery,
            "list_tables" => QueryIntent::ListTables,
            "describe_table" => QueryIntent::DescribeTable,
            "search_blobs" => QueryIntent::SearchBlobs,
            _ => QueryIntent::Unknown,
        };

        let target_type = match parsed.target_type.as_str() {
            "filesystem" => TargetType::Filesystem,
            "postgres" => TargetType::Postgres,
            "mysql" => TargetType::MySQL,
            "sqlite" => TargetType::SQLite,
            "duckdb" => TargetType::DuckDB,
            "clickhouse" => TargetType::ClickHouse,
            "bigquery" => TargetType::BigQuery,
            "s3" => TargetType::S3,
            "gcs" => TargetType::GCS,
            _ => TargetType::Unknown,
        };

        Ok(ParsedQuery {
            original: original.to_string(),
            intent,
            target_type,
            target_source: parsed.target_source,
            sql: parsed.sql,
            pattern: parsed.pattern,
            path: parsed.path,
            context: QueryContext {
                table: parsed.table,
                columns: parsed.columns.unwrap_or_default(),
                conditions: parsed.conditions.unwrap_or_default(),
                ..Default::default()
            },
        })
    }
}

/// Extract a quoted string from the query
fn extract_quoted_string(query: &str) -> Option<String> {
    let re = regex::Regex::new(r#"["']([^"']+)["']"#).ok()?;
    re.captures(query)
        .map(|c| c.get(1).unwrap().as_str().to_string())
}

/// Extract a file pattern from the query
fn extract_file_pattern(query: &str) -> Option<String> {
    // Look for patterns like *.py, *.txt, etc.
    let re = regex::Regex::new(r"\*\.\w+").ok()?;
    re.find(query).map(|m| m.as_str().to_string())
}

/// Extract a path from the query
fn extract_path(query: &str) -> Option<String> {
    // Look for paths like ~/dev, ./src, /home/user
    let re = regex::Regex::new(r"(~?/[\w./\-]+|\./[\w./\-]*)").ok()?;
    re.find(query).map(|m| m.as_str().to_string())
}

/// Extract a table name from the query
fn extract_table_name(query: &str) -> Option<String> {
    // Look for "table <name>" or "<name> table"
    let re = regex::Regex::new(r"(?:table\s+|from\s+)(\w+)").ok()?;
    re.captures(&query.to_lowercase())
        .map(|c| c.get(1).unwrap().as_str().to_string())
}


