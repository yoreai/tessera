//! PostgreSQL database connector

use anyhow::{Context, Result};
use async_trait::async_trait;
use sqlx::{postgres::PgPoolOptions, postgres::PgPool, Column, Row, TypeInfo};
use std::collections::HashMap;
use std::time::Duration;

use super::{ColumnInfo, Connector, SchemaInfo, TableInfo};

/// Default connection timeout in seconds
const DEFAULT_CONNECT_TIMEOUT: u64 = 10;

/// Default query timeout in seconds
const DEFAULT_QUERY_TIMEOUT: u64 = 60;

/// PostgreSQL connector
pub struct PostgresConnector {
    pool: PgPool,
}

impl PostgresConnector {
    /// Create a new PostgreSQL connector with default timeouts
    pub async fn new(uri: &str) -> Result<Self> {
        Self::with_timeout(uri, DEFAULT_CONNECT_TIMEOUT).await
    }

    /// Create a new PostgreSQL connector with custom timeout
    pub async fn with_timeout(uri: &str, connect_timeout_secs: u64) -> Result<Self> {
        let pool = PgPoolOptions::new()
            .max_connections(5)
            .acquire_timeout(Duration::from_secs(connect_timeout_secs))
            .connect(uri)
            .await
            .context("Failed to connect to PostgreSQL")?;

        Ok(Self { pool })
    }

    /// Execute a raw SQL query
    pub async fn execute_sql(
        &self,
        query: &str,
        limit: Option<usize>,
    ) -> Result<(Vec<String>, Vec<HashMap<String, String>>)> {
        // Add LIMIT if not present and limit is specified
        let query = if let Some(limit) = limit {
            if !query.to_lowercase().contains("limit") {
                format!("{} LIMIT {}", query.trim_end_matches(';'), limit)
            } else {
                query.to_string()
            }
        } else {
            query.to_string()
        };

        let rows = sqlx::query(&query)
            .fetch_all(&self.pool)
            .await
            .context("Failed to execute query")?;

        if rows.is_empty() {
            return Ok((vec![], vec![]));
        }

        // Extract column names from first row
        let columns: Vec<String> = rows[0]
            .columns()
            .iter()
            .map(|c| c.name().to_string())
            .collect();

        // Extract row data
        let mut results = Vec::new();
        for row in rows {
            let mut row_data = HashMap::new();
            for (i, col) in row.columns().iter().enumerate() {
                let value = extract_value(&row, i, col.type_info().name());
                row_data.insert(col.name().to_string(), value);
            }
            results.push(row_data);
        }

        Ok((columns, results))
    }

    /// Get list of tables
    pub async fn list_tables(&self) -> Result<Vec<String>> {
        let rows = sqlx::query(
            r#"
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
            "#,
        )
        .fetch_all(&self.pool)
        .await?;

        let tables: Vec<String> = rows
            .iter()
            .map(|row| row.get::<String, _>("table_name"))
            .collect();

        Ok(tables)
    }

    /// Get table row counts
    pub async fn get_table_sizes(&self) -> Result<Vec<(String, i64, String)>> {
        let rows = sqlx::query(
            r#"
            SELECT
                relname as table_name,
                reltuples::bigint as row_count,
                pg_size_pretty(pg_total_relation_size(relid)) as size
            FROM pg_catalog.pg_statio_user_tables
            ORDER BY pg_total_relation_size(relid) DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await?;

        let results: Vec<(String, i64, String)> = rows
            .iter()
            .map(|row| {
                (
                    row.get::<String, _>("table_name"),
                    row.get::<i64, _>("row_count"),
                    row.get::<String, _>("size"),
                )
            })
            .collect();

        Ok(results)
    }

    /// Get columns for a table
    pub async fn get_columns(&self, table: &str) -> Result<Vec<ColumnInfo>> {
        let rows = sqlx::query(
            r#"
            SELECT
                column_name,
                data_type,
                is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = $1
            ORDER BY ordinal_position
            "#,
        )
        .bind(table)
        .fetch_all(&self.pool)
        .await?;

        let columns: Vec<ColumnInfo> = rows
            .iter()
            .map(|row| ColumnInfo {
                name: row.get::<String, _>("column_name"),
                data_type: row.get::<String, _>("data_type"),
                nullable: row.get::<String, _>("is_nullable") == "YES",
            })
            .collect();

        Ok(columns)
    }
}

#[async_trait]
impl Connector for PostgresConnector {
    fn name(&self) -> &'static str {
        "PostgreSQL"
    }

    async fn test_connection(&self) -> Result<()> {
        sqlx::query("SELECT 1")
            .execute(&self.pool)
            .await
            .context("Connection test failed")?;
        Ok(())
    }

    async fn execute(&self, query: &str, limit: Option<usize>) -> Result<Vec<HashMap<String, String>>> {
        let (_, rows) = self.execute_sql(query, limit).await?;
        Ok(rows)
    }

    async fn get_schema(&self) -> Result<SchemaInfo> {
        let tables = self.list_tables().await?;
        let mut table_infos = Vec::new();

        for table_name in tables {
            let columns = self.get_columns(&table_name).await?;
            table_infos.push(TableInfo {
                name: table_name,
                columns,
                row_count: None,
            });
        }

        Ok(SchemaInfo { tables: table_infos })
    }
}

/// Extract a value from a row as a string
fn extract_value(row: &sqlx::postgres::PgRow, index: usize, type_name: &str) -> String {
    match type_name {
        "INT4" | "INT8" | "INT2" => row
            .try_get::<i64, _>(index)
            .map(|v| v.to_string())
            .unwrap_or_else(|_| "NULL".to_string()),
        "FLOAT4" | "FLOAT8" | "NUMERIC" => row
            .try_get::<f64, _>(index)
            .map(|v| v.to_string())
            .unwrap_or_else(|_| "NULL".to_string()),
        "BOOL" => row
            .try_get::<bool, _>(index)
            .map(|v| v.to_string())
            .unwrap_or_else(|_| "NULL".to_string()),
        "TIMESTAMPTZ" | "TIMESTAMP" => row
            .try_get::<chrono::DateTime<chrono::Utc>, _>(index)
            .map(|v| v.to_rfc3339())
            .unwrap_or_else(|_| "NULL".to_string()),
        "DATE" => row
            .try_get::<chrono::NaiveDate, _>(index)
            .map(|v| v.to_string())
            .unwrap_or_else(|_| "NULL".to_string()),
        "UUID" => row
            .try_get::<uuid::Uuid, _>(index)
            .map(|v| v.to_string())
            .unwrap_or_else(|_| "NULL".to_string()),
        _ => row
            .try_get::<String, _>(index)
            .unwrap_or_else(|_| "NULL".to_string()),
    }
}


