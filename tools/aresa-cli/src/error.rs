//! Error types for ARESA CLI
//!
//! Provides structured error handling with helpful error messages.

use thiserror::Error;

/// Main error type for ARESA CLI
#[derive(Error, Debug)]
pub enum AresaError {
    /// Configuration errors
    #[error("Configuration error: {0}")]
    Config(String),

    /// Connection errors
    #[error("Connection failed: {0}")]
    Connection(#[from] ConnectionError),

    /// Query errors
    #[error("Query error: {0}")]
    Query(String),

    /// Authentication errors
    #[error("Authentication failed: {0}")]
    Auth(String),

    /// Timeout errors
    #[error("Operation timed out after {0}s")]
    Timeout(u64),

    /// File system errors
    #[error("Filesystem error: {0}")]
    Filesystem(String),

    /// LLM/NLP errors
    #[error("NLP error: {0}")]
    Nlp(String),

    /// Validation errors
    #[error("Validation error: {0}")]
    Validation(String),

    /// Generic errors
    #[error("{0}")]
    Other(#[from] anyhow::Error),
}

/// Connection-specific errors
#[derive(Error, Debug)]
pub enum ConnectionError {
    #[error("PostgreSQL connection failed: {0}")]
    Postgres(String),

    #[error("MySQL connection failed: {0}")]
    MySQL(String),

    #[error("SQLite connection failed: {0}")]
    SQLite(String),

    #[error("ClickHouse connection failed: {0}")]
    ClickHouse(String),

    #[error("BigQuery connection failed: {0}")]
    BigQuery(String),

    #[error("S3 connection failed: {0}")]
    S3(String),

    #[error("GCS connection failed: {0}")]
    GCS(String),

    #[error("Connection refused: {0}")]
    Refused(String),

    #[error("DNS resolution failed: {0}")]
    DnsResolution(String),

    #[error("TLS/SSL error: {0}")]
    Tls(String),
}

/// Result type alias for ARESA operations
pub type Result<T> = std::result::Result<T, AresaError>;

/// Helper trait for adding context to errors
pub trait ResultExt<T> {
    /// Add context to an error
    fn with_context<F, S>(self, f: F) -> Result<T>
    where
        F: FnOnce() -> S,
        S: Into<String>;
}

impl<T, E: std::error::Error + Send + Sync + 'static> ResultExt<T> for std::result::Result<T, E> {
    fn with_context<F, S>(self, f: F) -> Result<T>
    where
        F: FnOnce() -> S,
        S: Into<String>,
    {
        self.map_err(|e| AresaError::Other(anyhow::anyhow!("{}: {}", f().into(), e)))
    }
}

/// Validate a connection string
pub fn validate_connection_string(conn_str: &str, source_type: &str) -> std::result::Result<(), String> {
    if conn_str.is_empty() {
        return Err("Connection string cannot be empty".to_string());
    }

    match source_type.to_lowercase().as_str() {
        "postgres" => {
            if !conn_str.starts_with("postgres://") && !conn_str.starts_with("postgresql://") {
                return Err("PostgreSQL connection string must start with 'postgres://' or 'postgresql://'".to_string());
            }
        }
        "mysql" => {
            if !conn_str.starts_with("mysql://") {
                return Err("MySQL connection string must start with 'mysql://'".to_string());
            }
        }
        "sqlite" => {
            // SQLite can be a file path or :memory:
            if conn_str != ":memory:" && !conn_str.ends_with(".db") && !conn_str.ends_with(".sqlite") {
                // Just a warning, not an error
            }
        }
        _ => {}
    }

    Ok(())
}

/// Validate a bucket name
pub fn validate_bucket_name(bucket: &str) -> std::result::Result<(), String> {
    if bucket.is_empty() {
        return Err("Bucket name cannot be empty".to_string());
    }

    if bucket.len() < 3 || bucket.len() > 63 {
        return Err("Bucket name must be between 3 and 63 characters".to_string());
    }

    if !bucket.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-' || c == '.') {
        return Err("Bucket name can only contain lowercase letters, numbers, hyphens, and periods".to_string());
    }

    Ok(())
}

/// Sanitize SQL input (basic protection)
pub fn sanitize_identifier(identifier: &str) -> String {
    // Remove or escape potentially dangerous characters
    identifier
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '_')
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_postgres_connection() {
        assert!(validate_connection_string("postgres://localhost/db", "postgres").is_ok());
        assert!(validate_connection_string("postgresql://localhost/db", "postgres").is_ok());
        assert!(validate_connection_string("mysql://localhost/db", "postgres").is_err());
    }

    #[test]
    fn test_validate_mysql_connection() {
        assert!(validate_connection_string("mysql://localhost/db", "mysql").is_ok());
        assert!(validate_connection_string("postgres://localhost/db", "mysql").is_err());
    }

    #[test]
    fn test_validate_bucket_name() {
        assert!(validate_bucket_name("my-bucket").is_ok());
        assert!(validate_bucket_name("my.bucket.name").is_ok());
        assert!(validate_bucket_name("").is_err());
        assert!(validate_bucket_name("ab").is_err()); // Too short
    }

    #[test]
    fn test_sanitize_identifier() {
        assert_eq!(sanitize_identifier("users"), "users");
        assert_eq!(sanitize_identifier("user_table"), "user_table");
        assert_eq!(sanitize_identifier("users; DROP TABLE--"), "usersDROPTABLE");
    }
}

