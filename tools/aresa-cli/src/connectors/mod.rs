//! Data source connectors
//!
//! Supported connectors:
//! - **Filesystem**: File search, content search, git repo detection
//! - **PostgreSQL**: Full SQL support with connection pooling
//! - **MySQL**: Full SQL support with connection pooling
//! - **SQLite**: Local database queries
//! - **DuckDB**: Local analytics on CSV/JSON/Parquet files
//! - **ClickHouse**: OLAP database via HTTP interface
//! - **BigQuery**: Google BigQuery via REST API
//! - **S3**: AWS S3 object storage
//! - **GCS**: Google Cloud Storage

pub mod filesystem;
pub mod postgres;
pub mod mysql;
pub mod sqlite;
pub mod duckdb;
pub mod clickhouse;
pub mod bigquery;
pub mod s3;
pub mod gcs;

use anyhow::Result;
use async_trait::async_trait;
use std::collections::HashMap;

/// Common trait for all data source connectors
#[async_trait]
pub trait Connector: Send + Sync {
    /// Get the connector type name
    fn name(&self) -> &'static str;

    /// Test the connection
    async fn test_connection(&self) -> Result<()>;

    /// Execute a query and return results
    async fn execute(&self, query: &str, limit: Option<usize>) -> Result<Vec<HashMap<String, String>>>;

    /// Get schema information (tables, columns, etc.)
    async fn get_schema(&self) -> Result<SchemaInfo>;
}

/// Schema information for a data source
#[derive(Debug, Clone, Default)]
pub struct SchemaInfo {
    pub tables: Vec<TableInfo>,
}

/// Information about a table
#[derive(Debug, Clone)]
pub struct TableInfo {
    pub name: String,
    pub columns: Vec<ColumnInfo>,
    pub row_count: Option<i64>,
}

/// Information about a column
#[derive(Debug, Clone)]
pub struct ColumnInfo {
    pub name: String,
    pub data_type: String,
    pub nullable: bool,
}

