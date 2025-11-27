//! Migration Suggestions
//!
//! AI-powered migration suggestions based on schema changes.

use anyhow::Result;

use crate::schema::{Schema, Migration, MigrationAction, MigrationGenerator};
use crate::cli::config::Config;

/// AI-powered migration suggester
pub struct MigrationSuggester {
    config: Config,
    client: Option<reqwest::Client>,
}

impl MigrationSuggester {
    /// Create a new migration suggester
    pub fn new() -> Result<Self> {
        let config = Config::load()?;
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(60))
            .build()
            .ok();

        Ok(Self { config, client })
    }

    /// Suggest migrations based on old and new schemas
    pub async fn suggest(&self, old: &Schema, new: &Schema) -> Result<MigrationSuggestion> {
        // Generate basic migrations using rule-based approach
        let actions = MigrationGenerator::generate(old, new);

        // If LLM is configured, get AI suggestions
        let ai_notes = if self.config.llm.api_key.is_some() {
            self.get_ai_suggestions(old, new, &actions).await?
        } else {
            Vec::new()
        };

        Ok(MigrationSuggestion {
            actions,
            ai_notes,
            estimated_risk: self.estimate_risk(&actions),
            needs_review: self.needs_manual_review(&actions),
        })
    }

    /// Detect schema changes by comparing with stored version
    pub fn detect_changes(&self, old: &Schema, new: &Schema) -> Vec<SchemaChange> {
        let mut changes = Vec::new();

        // Check for schema rename
        if old.name != new.name {
            changes.push(SchemaChange::Renamed {
                old_name: old.name.clone(),
                new_name: new.name.clone(),
            });
        }

        // Check for added fields
        for field in &new.fields {
            if old.get_field(&field.name).is_none() {
                changes.push(SchemaChange::FieldAdded {
                    field_name: field.name.clone(),
                    field_type: format!("{:?}", field.field_type),
                });
            }
        }

        // Check for removed fields
        for field in &old.fields {
            if new.get_field(&field.name).is_none() {
                changes.push(SchemaChange::FieldRemoved {
                    field_name: field.name.clone(),
                });
            }
        }

        // Check for modified fields
        for new_field in &new.fields {
            if let Some(old_field) = old.get_field(&new_field.name) {
                if old_field.field_type != new_field.field_type {
                    changes.push(SchemaChange::FieldTypeChanged {
                        field_name: new_field.name.clone(),
                        old_type: format!("{:?}", old_field.field_type),
                        new_type: format!("{:?}", new_field.field_type),
                    });
                }

                if old_field.nullable != new_field.nullable {
                    changes.push(SchemaChange::NullabilityChanged {
                        field_name: new_field.name.clone(),
                        now_nullable: new_field.nullable,
                    });
                }
            }
        }

        changes
    }

    /// Get AI suggestions for migrations
    async fn get_ai_suggestions(
        &self,
        old: &Schema,
        new: &Schema,
        actions: &[MigrationAction],
    ) -> Result<Vec<String>> {
        let client = match &self.client {
            Some(c) => c,
            None => return Ok(Vec::new()),
        };

        let api_key = match &self.config.llm.api_key {
            Some(k) => k,
            None => return Ok(Vec::new()),
        };

        let prompt = format!(
            r#"Analyze the following database schema migration and provide suggestions:

Old Schema: {}
- Fields: {:?}

New Schema: {}
- Fields: {:?}

Planned Actions:
{}

Please provide:
1. Any potential data loss risks
2. Suggestions for safer migration approaches
3. Performance considerations
4. Rollback strategy recommendations

Be concise, respond with a JSON array of strings."#,
            old.name,
            old.fields.iter().map(|f| &f.name).collect::<Vec<_>>(),
            new.name,
            new.fields.iter().map(|f| &f.name).collect::<Vec<_>>(),
            actions.iter().map(|a| format!("- {:?}", a)).collect::<Vec<_>>().join("\n")
        );

        let response = self.call_llm(client, api_key, &prompt).await?;

        // Parse response as JSON array
        if let Ok(notes) = serde_json::from_str::<Vec<String>>(&response) {
            Ok(notes)
        } else {
            // Fallback: split by newlines
            Ok(response.lines()
                .filter(|l| !l.is_empty())
                .map(|l| l.trim_start_matches("- ").to_string())
                .collect())
        }
    }

    async fn call_llm(&self, client: &reqwest::Client, api_key: &str, prompt: &str) -> Result<String> {
        let provider = &self.config.llm.provider;

        match provider.as_str() {
            "openai" => {
                let base_url = self.config.llm.base_url.as_deref()
                    .unwrap_or("https://api.openai.com/v1");
                let model = self.config.llm.model.as_deref()
                    .unwrap_or("gpt-4o-mini");

                let body = serde_json::json!({
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                    "max_tokens": 500
                });

                let response = client
                    .post(format!("{}/chat/completions", base_url))
                    .header("Authorization", format!("Bearer {}", api_key))
                    .json(&body)
                    .send()
                    .await?;

                let data: serde_json::Value = response.json().await?;
                Ok(data["choices"][0]["message"]["content"]
                    .as_str()
                    .unwrap_or("")
                    .to_string())
            }
            "anthropic" => {
                let base_url = self.config.llm.base_url.as_deref()
                    .unwrap_or("https://api.anthropic.com/v1");
                let model = self.config.llm.model.as_deref()
                    .unwrap_or("claude-3-haiku-20240307");

                let body = serde_json::json!({
                    "model": model,
                    "max_tokens": 500,
                    "messages": [{"role": "user", "content": prompt}]
                });

                let response = client
                    .post(format!("{}/messages", base_url))
                    .header("x-api-key", api_key)
                    .header("anthropic-version", "2023-06-01")
                    .json(&body)
                    .send()
                    .await?;

                let data: serde_json::Value = response.json().await?;
                Ok(data["content"][0]["text"]
                    .as_str()
                    .unwrap_or("")
                    .to_string())
            }
            _ => Ok(String::new()),
        }
    }

    /// Estimate migration risk level
    fn estimate_risk(&self, actions: &[MigrationAction]) -> RiskLevel {
        let mut risk = RiskLevel::Low;

        for action in actions {
            let action_risk = match action {
                MigrationAction::CreateSchema(_) => RiskLevel::Low,
                MigrationAction::DropSchema(_) => RiskLevel::High,
                MigrationAction::AddField { field, .. } => {
                    if !field.nullable && field.default.is_none() {
                        RiskLevel::High
                    } else {
                        RiskLevel::Low
                    }
                }
                MigrationAction::RemoveField { .. } => RiskLevel::High,
                MigrationAction::ModifyField { .. } => RiskLevel::Medium,
                MigrationAction::RenameField { .. } => RiskLevel::Medium,
                MigrationAction::RenameSchema { .. } => RiskLevel::Medium,
                MigrationAction::AddIndex { .. } => RiskLevel::Low,
                MigrationAction::RemoveIndex { .. } => RiskLevel::Low,
                MigrationAction::RawSql(_) => RiskLevel::High,
            };

            if action_risk > risk {
                risk = action_risk;
            }
        }

        risk
    }

    /// Determine if migration needs manual review
    fn needs_manual_review(&self, actions: &[MigrationAction]) -> bool {
        actions.iter().any(|action| {
            matches!(
                action,
                MigrationAction::DropSchema(_) |
                MigrationAction::RemoveField { .. } |
                MigrationAction::RawSql(_)
            )
        })
    }
}

impl Default for MigrationSuggester {
    fn default() -> Self {
        Self::new().unwrap_or_else(|_| Self {
            config: Config::default(),
            client: None,
        })
    }
}

/// Migration suggestion result
#[derive(Debug)]
pub struct MigrationSuggestion {
    /// Generated migration actions
    pub actions: Vec<MigrationAction>,
    /// AI-generated notes and suggestions
    pub ai_notes: Vec<String>,
    /// Estimated risk level
    pub estimated_risk: RiskLevel,
    /// Whether manual review is recommended
    pub needs_review: bool,
}

impl MigrationSuggestion {
    /// Convert to Migration
    pub fn to_migration(&self, description: &str) -> Migration {
        Migration::new(description, self.actions.clone())
    }
}

/// Risk level for migrations
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum RiskLevel {
    Low,
    Medium,
    High,
}

impl std::fmt::Display for RiskLevel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RiskLevel::Low => write!(f, "Low"),
            RiskLevel::Medium => write!(f, "Medium"),
            RiskLevel::High => write!(f, "High"),
        }
    }
}

/// Schema change types
#[derive(Debug, Clone)]
pub enum SchemaChange {
    Renamed { old_name: String, new_name: String },
    FieldAdded { field_name: String, field_type: String },
    FieldRemoved { field_name: String },
    FieldTypeChanged { field_name: String, old_type: String, new_type: String },
    NullabilityChanged { field_name: String, now_nullable: bool },
}

impl std::fmt::Display for SchemaChange {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SchemaChange::Renamed { old_name, new_name } => {
                write!(f, "Schema renamed: {} -> {}", old_name, new_name)
            }
            SchemaChange::FieldAdded { field_name, field_type } => {
                write!(f, "Field added: {} ({})", field_name, field_type)
            }
            SchemaChange::FieldRemoved { field_name } => {
                write!(f, "Field removed: {}", field_name)
            }
            SchemaChange::FieldTypeChanged { field_name, old_type, new_type } => {
                write!(f, "Field type changed: {} ({} -> {})", field_name, old_type, new_type)
            }
            SchemaChange::NullabilityChanged { field_name, now_nullable } => {
                if *now_nullable {
                    write!(f, "Field now nullable: {}", field_name)
                } else {
                    write!(f, "Field now required: {}", field_name)
                }
            }
        }
    }
}


