//! Configuration Management
//!
//! Handles global and database-specific configuration.

use anyhow::Result;
use colored::Colorize;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::path::PathBuf;

/// Configuration structure
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Config {
    /// LLM configuration
    #[serde(default)]
    pub llm: LlmConfig,

    /// Default output format
    #[serde(default)]
    pub default_format: String,

    /// Additional key-value settings
    #[serde(default)]
    pub settings: BTreeMap<String, String>,

    /// Path to config file
    #[serde(skip)]
    path: Option<PathBuf>,
}

/// LLM configuration
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct LlmConfig {
    /// Provider (openai, anthropic)
    pub provider: String,
    /// API key (stored in keyring if possible)
    #[serde(skip_serializing)]
    pub api_key: Option<String>,
    /// Model name
    pub model: Option<String>,
    /// API base URL (for custom endpoints)
    pub base_url: Option<String>,
}

impl Config {
    /// Load configuration from default location
    pub fn load() -> Result<Self> {
        let config_path = Self::config_path()?;

        if config_path.exists() {
            let content = std::fs::read_to_string(&config_path)?;
            let mut config: Config = toml::from_str(&content)?;
            config.path = Some(config_path);

            // Try to load API key from keyring
            if config.llm.api_key.is_none() && !config.llm.provider.is_empty() {
                config.llm.api_key = Self::get_api_key_from_keyring(&config.llm.provider);
            }

            Ok(config)
        } else {
            let mut config = Config::default();
            config.path = Some(config_path);
            Ok(config)
        }
    }

    /// Save configuration
    pub fn save(&self) -> Result<()> {
        if let Some(ref path) = self.path {
            if let Some(parent) = path.parent() {
                std::fs::create_dir_all(parent)?;
            }

            let content = toml::to_string_pretty(self)?;
            std::fs::write(path, content)?;
        }
        Ok(())
    }

    /// Get config file path
    fn config_path() -> Result<PathBuf> {
        let config_dir = if cfg!(target_os = "macos") {
            std::env::var("HOME")
                .map(|h| PathBuf::from(h).join(".config/aresadb"))?
        } else if cfg!(target_os = "linux") {
            std::env::var("XDG_CONFIG_HOME")
                .map(PathBuf::from)
                .or_else(|_| {
                    std::env::var("HOME")
                        .map(|h| PathBuf::from(h).join(".config/aresadb"))
                })?
        } else if cfg!(target_os = "windows") {
            std::env::var("APPDATA")
                .map(|p| PathBuf::from(p).join("aresadb"))?
        } else {
            PathBuf::from(".")
        };

        Ok(config_dir.join("config.toml"))
    }

    /// Set a configuration value
    pub fn set(&self, key: &str, value: &str) -> Result<()> {
        let mut config = self.clone();

        match key {
            "llm.provider" => config.llm.provider = value.to_string(),
            "llm.api_key" => {
                // Store API key in keyring if possible
                if Self::set_api_key_in_keyring(&config.llm.provider, value) {
                    config.llm.api_key = None; // Don't store in file
                } else {
                    config.llm.api_key = Some(value.to_string());
                }
            }
            "llm.model" => config.llm.model = Some(value.to_string()),
            "llm.base_url" => config.llm.base_url = Some(value.to_string()),
            "default_format" => config.default_format = value.to_string(),
            _ => {
                config.settings.insert(key.to_string(), value.to_string());
            }
        }

        config.save()
    }

    /// Get a configuration value
    pub fn get(&self, key: &str) -> Option<String> {
        match key {
            "llm.provider" => Some(self.llm.provider.clone()),
            "llm.api_key" => self.llm.api_key.clone(),
            "llm.model" => self.llm.model.clone(),
            "llm.base_url" => self.llm.base_url.clone(),
            "default_format" => Some(self.default_format.clone()),
            _ => self.settings.get(key).cloned(),
        }
    }

    /// Print all configuration
    pub fn print_all(&self) -> Result<()> {
        println!("{}", "Configuration:".bright_yellow().bold());
        println!();

        println!("{}", "LLM:".bright_cyan());
        println!("  provider: {}", self.llm.provider);
        println!("  api_key: {}", if self.llm.api_key.is_some() { "****" } else { "(not set)" });
        println!("  model: {}", self.llm.model.as_deref().unwrap_or("(default)"));
        println!("  base_url: {}", self.llm.base_url.as_deref().unwrap_or("(default)"));

        println!();
        println!("{}", "General:".bright_cyan());
        println!("  default_format: {}", if self.default_format.is_empty() { "table" } else { &self.default_format });

        if !self.settings.is_empty() {
            println!();
            println!("{}", "Custom:".bright_cyan());
            for (key, value) in &self.settings {
                println!("  {}: {}", key, value);
            }
        }

        Ok(())
    }

    /// Try to get API key from system keyring
    fn get_api_key_from_keyring(provider: &str) -> Option<String> {
        #[cfg(feature = "keyring")]
        {
            let service = format!("aresadb-{}", provider);
            keyring::Entry::new(&service, "api_key")
                .ok()
                .and_then(|entry| entry.get_password().ok())
        }

        #[cfg(not(feature = "keyring"))]
        {
            let _ = provider;
            None
        }
    }

    /// Try to set API key in system keyring
    fn set_api_key_in_keyring(provider: &str, api_key: &str) -> bool {
        #[cfg(feature = "keyring")]
        {
            let service = format!("aresadb-{}", provider);
            keyring::Entry::new(&service, "api_key")
                .ok()
                .and_then(|entry| entry.set_password(api_key).ok())
                .is_some()
        }

        #[cfg(not(feature = "keyring"))]
        {
            let _ = (provider, api_key);
            false
        }
    }
}


