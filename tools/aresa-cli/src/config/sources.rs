//! Data source definitions

use serde::{Deserialize, Serialize};

/// Type of data source
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SourceType {
    Postgres,
    BigQuery,
    S3,
    Gcs,
    Sqlite,
    DuckDb,
}

/// A configured data source
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataSource {
    /// Type of the data source
    pub source_type: SourceType,
    /// Connection URI (stored in keychain for security)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub uri: Option<String>,
    /// Project ID (for BigQuery/GCS)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub project: Option<String>,
    /// Bucket name (for S3/GCS)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bucket: Option<String>,
    /// Path to credentials file (for cloud services)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub credentials_path: Option<String>,
}

impl SourceType {
    /// Get a human-readable description
    pub fn description(&self) -> &'static str {
        match self {
            SourceType::Postgres => "PostgreSQL database",
            SourceType::BigQuery => "Google BigQuery",
            SourceType::S3 => "AWS S3 bucket",
            SourceType::Gcs => "Google Cloud Storage bucket",
            SourceType::Sqlite => "SQLite database",
            SourceType::DuckDb => "DuckDB database",
        }
    }

    /// Check if this source type supports SQL queries
    pub fn supports_sql(&self) -> bool {
        matches!(
            self,
            SourceType::Postgres | SourceType::BigQuery | SourceType::Sqlite | SourceType::DuckDb
        )
    }
}

