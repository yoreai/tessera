//! Data source definitions

use serde::{Deserialize, Serialize};

/// Type of data source
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SourceType {
    Postgres,
    MySQL,
    SQLite,
    DuckDB,
    ClickHouse,
    BigQuery,
    S3,
    GCS,
}

/// A configured data source
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataSource {
    /// Type of the data source
    pub source_type: SourceType,
    /// Connection URI (for SQL databases)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub uri: Option<String>,
    /// Host (for ClickHouse)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub host: Option<String>,
    /// Port (for ClickHouse)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub port: Option<u16>,
    /// Database name
    #[serde(skip_serializing_if = "Option::is_none")]
    pub database: Option<String>,
    /// Username
    #[serde(skip_serializing_if = "Option::is_none")]
    pub username: Option<String>,
    /// Password (stored in keychain for security)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub password: Option<String>,
    /// Project ID (for BigQuery/GCS)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub project: Option<String>,
    /// Bucket name (for S3/GCS)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bucket: Option<String>,
    /// Region (for S3)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub region: Option<String>,
    /// Path to credentials file (for cloud services)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub credentials_path: Option<String>,
}

impl SourceType {
    /// Get a human-readable description
    pub fn description(&self) -> &'static str {
        match self {
            SourceType::Postgres => "PostgreSQL database",
            SourceType::MySQL => "MySQL database",
            SourceType::SQLite => "SQLite database",
            SourceType::DuckDB => "DuckDB database",
            SourceType::ClickHouse => "ClickHouse OLAP database",
            SourceType::BigQuery => "Google BigQuery",
            SourceType::S3 => "AWS S3 bucket",
            SourceType::GCS => "Google Cloud Storage bucket",
        }
    }

    /// Check if this source type supports SQL queries
    pub fn supports_sql(&self) -> bool {
        matches!(
            self,
            SourceType::Postgres
                | SourceType::MySQL
                | SourceType::SQLite
                | SourceType::DuckDB
                | SourceType::ClickHouse
                | SourceType::BigQuery
        )
    }
}


