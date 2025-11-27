//! SQLite/DuckDB database connector

use anyhow::{Context, Result};
use async_trait::async_trait;
use sqlx::{sqlite::SqlitePool, Column, Row, TypeInfo};
use std::collections::HashMap;

use super::{ColumnInfo, Connector, SchemaInfo, TableInfo};

/// SQLite connector (also works for DuckDB)
pub struct SqliteConnector {
    pool: SqlitePool,
}

impl SqliteConnector {
    /// Create a new SQLite connector
    pub async fn new(path: &str) -> Result<Self> {
        let uri = if path.starts_with("sqlite:") {
            path.to_string()
        } else {
            format!("sqlite:{}", path)
        };

        let pool = SqlitePool::connect(&uri)
            .await
            .context("Failed to connect to SQLite database")?;
        
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
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
        )
        .fetch_all(&self.pool)
        .await?;

        let tables: Vec<String> = rows
            .iter()
            .map(|row| row.get::<String, _>("name"))
            .collect();

        Ok(tables)
    }

    /// Get columns for a table
    pub async fn get_columns(&self, table: &str) -> Result<Vec<ColumnInfo>> {
        let rows = sqlx::query(&format!("PRAGMA table_info({})", table))
            .fetch_all(&self.pool)
            .await?;

        let columns: Vec<ColumnInfo> = rows
            .iter()
            .map(|row| ColumnInfo {
                name: row.get::<String, _>("name"),
                data_type: row.get::<String, _>("type"),
                nullable: row.get::<i32, _>("notnull") == 0,
            })
            .collect();

        Ok(columns)
    }
}

#[async_trait]
impl Connector for SqliteConnector {
    fn name(&self) -> &'static str {
        "SQLite"
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
fn extract_value(row: &sqlx::sqlite::SqliteRow, index: usize, _type_name: &str) -> String {
    // SQLite is dynamically typed, try different types
    if let Ok(v) = row.try_get::<i64, _>(index) {
        return v.to_string();
    }
    if let Ok(v) = row.try_get::<f64, _>(index) {
        return v.to_string();
    }
    if let Ok(v) = row.try_get::<String, _>(index) {
        return v;
    }
    if let Ok(v) = row.try_get::<bool, _>(index) {
        return v.to_string();
    }
    
    "NULL".to_string()
}

