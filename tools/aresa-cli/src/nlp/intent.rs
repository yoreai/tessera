//! Query intent classification

use serde::{Deserialize, Serialize};

/// The intent of a parsed query
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum QueryIntent {
    /// Search for files by name
    SearchFiles,
    /// Search file contents
    SearchContent,
    /// Find git repositories
    FindGitRepos,
    /// Execute SQL query
    SqlQuery,
    /// List tables in a database
    ListTables,
    /// Describe table schema
    DescribeTable,
    /// Search blob storage
    SearchBlobs,
    /// Analyze a local file (CSV, JSON, Parquet)
    AnalyzeFile,
    /// Unknown/unsupported intent
    Unknown,
}

/// Target type for the query
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TargetType {
    Filesystem,
    Postgres,
    MySQL,
    SQLite,
    DuckDB,
    ClickHouse,
    BigQuery,
    S3,
    GCS,
    Unknown,
}

impl std::fmt::Display for TargetType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TargetType::Filesystem => write!(f, "filesystem"),
            TargetType::Postgres => write!(f, "PostgreSQL"),
            TargetType::MySQL => write!(f, "MySQL"),
            TargetType::SQLite => write!(f, "SQLite"),
            TargetType::DuckDB => write!(f, "DuckDB"),
            TargetType::ClickHouse => write!(f, "ClickHouse"),
            TargetType::BigQuery => write!(f, "BigQuery"),
            TargetType::S3 => write!(f, "S3"),
            TargetType::GCS => write!(f, "GCS"),
            TargetType::Unknown => write!(f, "unknown"),
        }
    }
}

/// A parsed natural language query
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedQuery {
    /// Original query text
    pub original: String,
    /// Detected intent
    pub intent: QueryIntent,
    /// Target type (filesystem, database, etc.)
    pub target_type: TargetType,
    /// Target source name (from config)
    pub target_source: Option<String>,
    /// Generated SQL query (if applicable)
    pub sql: Option<String>,
    /// File search pattern (if applicable)
    pub pattern: Option<String>,
    /// Search path (if applicable)
    pub path: Option<String>,
    /// Additional context extracted from the query
    pub context: QueryContext,
}

/// Additional context extracted from the query
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct QueryContext {
    /// Table name mentioned
    pub table: Option<String>,
    /// Column names mentioned
    pub columns: Vec<String>,
    /// Conditions/filters mentioned
    pub conditions: Vec<String>,
    /// Time range mentioned
    pub time_range: Option<TimeRange>,
    /// Limit mentioned
    pub limit: Option<usize>,
}

/// Time range for queries
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeRange {
    pub start: Option<String>,
    pub end: Option<String>,
    pub relative: Option<String>,
}


