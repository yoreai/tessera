//! MySQL connector
//!
//! Connect to MySQL databases and execute queries.

use anyhow::{Context, Result};
use sqlx::mysql::MySqlPoolOptions;
use sqlx::Column;
use std::collections::HashMap;
use std::time::Duration;

/// Default connection timeout in seconds
const DEFAULT_CONNECT_TIMEOUT: u64 = 10;

/// MySQL connector using native protocol
pub struct MySqlConnector {
    #[allow(dead_code)]
    connection_string: String,
    pool: Option<sqlx::MySqlPool>,
}

impl MySqlConnector {
    /// Create a new MySQL connector with default timeouts
    pub async fn new(uri: &str) -> Result<Self> {
        Self::with_timeout(uri, DEFAULT_CONNECT_TIMEOUT).await
    }

    /// Create a new MySQL connector with custom timeout
    pub async fn with_timeout(uri: &str, connect_timeout_secs: u64) -> Result<Self> {
        let pool = MySqlPoolOptions::new()
            .max_connections(5)
            .acquire_timeout(Duration::from_secs(connect_timeout_secs))
            .connect(uri)
            .await
            .context("Failed to connect to MySQL")?;

        Ok(Self {
            connection_string: uri.to_string(),
            pool: Some(pool),
        })
    }

    /// Execute a SQL query and return results
    pub async fn execute_sql(
        &self,
        query: &str,
        limit: Option<usize>,
    ) -> Result<(Vec<String>, Vec<HashMap<String, String>>)> {
        let pool = self.pool.as_ref().context("Not connected")?;

        // Add LIMIT if specified and not already present
        let query = if let Some(limit) = limit {
            if !query.to_lowercase().contains("limit") {
                format!("{} LIMIT {}", query.trim_end_matches(';'), limit)
            } else {
                query.to_string()
            }
        } else {
            query.to_string()
        };

        // Execute query and get rows
        let rows: Vec<sqlx::mysql::MySqlRow> = sqlx::query(&query)
            .fetch_all(pool)
            .await
            .context("Query execution failed")?;

        if rows.is_empty() {
            return Ok((vec![], vec![]));
        }

        // Extract column names from first row
        use sqlx::Row;
        let columns: Vec<String> = rows[0]
            .columns()
            .iter()
            .map(|c| c.name().to_string())
            .collect();

        // Extract row data
        let result_rows: Vec<HashMap<String, String>> = rows
            .iter()
            .map(|row| {
                columns
                    .iter()
                    .enumerate()
                    .map(|(i, col)| {
                        let value: String = row
                            .try_get::<String, _>(i)
                            .or_else(|_| row.try_get::<i64, _>(i).map(|v| v.to_string()))
                            .or_else(|_| row.try_get::<f64, _>(i).map(|v| v.to_string()))
                            .or_else(|_| row.try_get::<bool, _>(i).map(|v| v.to_string()))
                            .unwrap_or_else(|_| "NULL".to_string());
                        (col.clone(), value)
                    })
                    .collect()
            })
            .collect();

        Ok((columns, result_rows))
    }

    /// List all databases
    pub async fn list_databases(&self) -> Result<Vec<String>> {
        let (_, rows) = self.execute_sql("SHOW DATABASES", None).await?;
        Ok(rows
            .into_iter()
            .filter_map(|r| r.get("Database").cloned())
            .collect())
    }

    /// List tables in current database
    pub async fn list_tables(&self) -> Result<Vec<String>> {
        let (_, rows) = self.execute_sql("SHOW TABLES", None).await?;
        Ok(rows
            .into_iter()
            .filter_map(|r| r.values().next().cloned())
            .collect())
    }

    /// Get table schema
    pub async fn describe_table(&self, table: &str) -> Result<Vec<HashMap<String, String>>> {
        let (_, rows) = self
            .execute_sql(&format!("DESCRIBE {}", table), None)
            .await?;
        Ok(rows)
    }

    /// Test connection
    pub async fn test_connection(&self) -> Result<()> {
        self.execute_sql("SELECT 1", None).await?;
        Ok(())
    }

    /// Get connection info
    pub fn connection_info(&self) -> &str {
        &self.connection_string
    }
}

