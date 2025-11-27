//! Configuration management for ARESA CLI
//!
//! Handles data source configurations and secure credential storage.

mod credentials;
mod sources;

use anyhow::{Context, Result};
use colored::Colorize;
use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

pub use credentials::CredentialStore;
pub use sources::{DataSource, SourceType};

/// Main configuration manager
#[derive(Debug)]
pub struct ConfigManager {
    config_path: PathBuf,
    config: Config,
    credentials: CredentialStore,
}

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct Config {
    /// LLM provider configuration
    pub llm: Option<LlmConfig>,
    /// Configured data sources
    pub sources: HashMap<String, DataSource>,
    /// Default settings
    pub defaults: Defaults,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmConfig {
    pub provider: String,
    pub model: Option<String>,
    pub base_url: Option<String>,
}

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct Defaults {
    pub output_format: Option<String>,
    pub limit: Option<usize>,
}

impl ConfigManager {
    /// Load configuration from disk
    pub fn load() -> Result<Self> {
        let config_path = Self::config_path()?;
        
        let config = if config_path.exists() {
            let content = fs::read_to_string(&config_path)
                .context("Failed to read config file")?;
            toml::from_str(&content)
                .context("Failed to parse config file")?
        } else {
            Config::default()
        };

        let credentials = CredentialStore::new()?;

        Ok(Self {
            config_path,
            config,
            credentials,
        })
    }

    /// Get the configuration file path
    fn config_path() -> Result<PathBuf> {
        let proj_dirs = ProjectDirs::from("ai", "yoreai", "aresa")
            .context("Failed to determine config directory")?;
        
        let config_dir = proj_dirs.config_dir();
        fs::create_dir_all(config_dir)
            .context("Failed to create config directory")?;
        
        Ok(config_dir.join("config.toml"))
    }

    /// Save configuration to disk
    pub fn save(&self) -> Result<()> {
        let content = toml::to_string_pretty(&self.config)
            .context("Failed to serialize config")?;
        fs::write(&self.config_path, content)
            .context("Failed to write config file")?;
        Ok(())
    }

    /// Add a new data source
    pub fn add_source(
        &self,
        name: &str,
        source_type_str: &str,
        uri: Option<&str>,
        project: Option<&str>,
        bucket: Option<&str>,
        credentials_path: Option<&str>,
    ) -> Result<()> {
        let source_type = match source_type_str.to_lowercase().as_str() {
            "postgres" => SourceType::Postgres,
            "bigquery" => SourceType::BigQuery,
            "s3" => SourceType::S3,
            "gcs" => SourceType::Gcs,
            "sqlite" => SourceType::Sqlite,
            "duckdb" => SourceType::DuckDb,
            _ => return Err(anyhow::anyhow!("Unknown source type: {}", source_type_str)),
        };

        let source = DataSource {
            source_type,
            uri: uri.map(String::from),
            project: project.map(String::from),
            bucket: bucket.map(String::from),
            credentials_path: credentials_path.map(String::from),
        };

        // Store sensitive URI in keychain if provided
        if let Some(uri) = uri {
            self.credentials.store(name, uri)?;
        }

        // Save source config (without sensitive data)
        let mut config = self.config.clone();
        config.sources.insert(name.to_string(), source);
        
        let content = toml::to_string_pretty(&config)?;
        fs::write(&self.config_path, content)?;

        Ok(())
    }

    /// Remove a data source
    pub fn remove_source(&self, name: &str) -> Result<()> {
        let mut config = self.config.clone();
        config.sources.remove(name);
        
        // Remove from keychain
        let _ = self.credentials.delete(name);
        
        let content = toml::to_string_pretty(&config)?;
        fs::write(&self.config_path, content)?;
        
        Ok(())
    }

    /// List all configured data sources
    pub fn list_sources(&self) -> Result<()> {
        if self.config.sources.is_empty() {
            println!("{}", "No data sources configured.".yellow());
            println!();
            println!("Add one with:");
            println!(
                "  {}",
                "aresa config add postgres mydb --uri postgresql://...".bright_green()
            );
            return Ok(());
        }

        println!("{}", "Configured Data Sources:".bright_yellow().bold());
        println!();

        for (name, source) in &self.config.sources {
            let type_str = format!("{:?}", source.source_type).to_lowercase();
            println!(
                "  {} {} {}",
                "●".bright_cyan(),
                name.bright_white().bold(),
                format!("({})", type_str).dimmed()
            );
            
            if let Some(project) = &source.project {
                println!("    {} {}", "project:".dimmed(), project);
            }
            if let Some(bucket) = &source.bucket {
                println!("    {} {}", "bucket:".dimmed(), bucket);
            }
            if source.uri.is_some() || self.credentials.exists(name) {
                println!("    {} {}", "uri:".dimmed(), "********".dimmed());
            }
        }
        println!();

        Ok(())
    }

    /// Test connection to a data source
    pub async fn test_connection(&self, name: &str) -> Result<()> {
        let source = self.config.sources.get(name)
            .context(format!("Data source '{}' not found", name))?;

        match source.source_type {
            SourceType::Postgres => {
                let uri = self.get_uri(name)?;
                let pool = sqlx::PgPool::connect(&uri).await
                    .context("Failed to connect to PostgreSQL")?;
                sqlx::query("SELECT 1").execute(&pool).await?;
            }
            SourceType::Sqlite | SourceType::DuckDb => {
                let uri = self.get_uri(name)?;
                let pool = sqlx::SqlitePool::connect(&uri).await
                    .context("Failed to connect to SQLite")?;
                sqlx::query("SELECT 1").execute(&pool).await?;
            }
            SourceType::BigQuery => {
                // BigQuery connection test would go here
                println!("{}", "BigQuery connection test not yet implemented".yellow());
            }
            SourceType::S3 => {
                // S3 connection test would go here
                println!("{}", "S3 connection test not yet implemented".yellow());
            }
            SourceType::Gcs => {
                // GCS connection test would go here
                println!("{}", "GCS connection test not yet implemented".yellow());
            }
        }

        Ok(())
    }

    /// Check all connections
    pub async fn check_all_connections(&self) -> Result<()> {
        if self.config.sources.is_empty() {
            println!("{}", "No data sources configured.".yellow());
            return Ok(());
        }

        println!("{}", "Connection Status:".bright_yellow().bold());
        println!();

        for name in self.config.sources.keys() {
            print!(
                "  {} {}... ",
                "●".bright_blue(),
                name.bright_white()
            );
            
            match self.test_connection(name).await {
                Ok(_) => println!("{}", "✓ connected".bright_green()),
                Err(e) => println!("{} {}", "✗".bright_red(), e.to_string().dimmed()),
            }
        }
        println!();

        Ok(())
    }

    /// Set LLM configuration
    pub fn set_llm_config(&self, provider: &str, api_key: &str) -> Result<()> {
        // Store API key in keychain
        self.credentials.store(&format!("llm_{}", provider), api_key)?;

        // Update config
        let mut config = self.config.clone();
        config.llm = Some(LlmConfig {
            provider: provider.to_string(),
            model: None,
            base_url: None,
        });

        let content = toml::to_string_pretty(&config)?;
        fs::write(&self.config_path, content)?;

        Ok(())
    }

    /// Get LLM configuration
    pub fn get_llm_config(&self) -> Option<&LlmConfig> {
        self.config.llm.as_ref()
    }

    /// Get LLM API key from keychain
    pub fn get_llm_api_key(&self) -> Result<String> {
        let provider = self.config.llm.as_ref()
            .context("No LLM provider configured")?
            .provider.clone();
        
        self.credentials.get(&format!("llm_{}", provider))
    }

    /// Get URI for a data source (from keychain)
    pub fn get_uri(&self, name: &str) -> Result<String> {
        self.credentials.get(name)
            .or_else(|_| {
                self.config.sources.get(name)
                    .and_then(|s| s.uri.clone())
                    .context(format!("No URI found for '{}'", name))
            })
    }

    /// Get a data source by name
    pub fn get_source(&self, name: &str) -> Option<&DataSource> {
        self.config.sources.get(name)
    }

    /// Get all configured sources
    pub fn sources(&self) -> &HashMap<String, DataSource> {
        &self.config.sources
    }
}

impl Clone for Config {
    fn clone(&self) -> Self {
        Self {
            llm: self.llm.clone(),
            sources: self.sources.clone(),
            defaults: Defaults {
                output_format: self.defaults.output_format.clone(),
                limit: self.defaults.limit,
            },
        }
    }
}

