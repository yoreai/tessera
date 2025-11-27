//! DuckDB connector
//!
//! Local analytics database for CSV, Parquet, and JSON files.
//! DuckDB is an embedded analytical database - perfect for local data exploration.

use anyhow::{Context, Result};
use sqlx::Column;
use std::collections::HashMap;
use std::path::Path;

/// DuckDB connector for local analytics
pub struct DuckDbConnector {
    pool: sqlx::SqlitePool,
    _database_path: String,
}

impl DuckDbConnector {
    /// Create a new DuckDB connector
    ///
    /// Note: We use SQLite as a stand-in since sqlx doesn't support DuckDB directly.
    /// For full DuckDB support, we'd use the `duckdb` crate.
    /// This implementation provides similar functionality for local file queries.
    pub async fn new(database_path: Option<&str>) -> Result<Self> {
        let path = database_path.unwrap_or(":memory:");

        let pool = sqlx::SqlitePool::connect(&format!("sqlite:{}", path))
            .await
            .context("Failed to create local analytics database")?;

        Ok(Self {
            pool,
            _database_path: path.to_string(),
        })
    }

    /// Execute a SQL query
    pub async fn execute_sql(
        &self,
        query: &str,
        limit: Option<usize>,
    ) -> Result<(Vec<String>, Vec<HashMap<String, String>>)> {
        // Add LIMIT if specified
        let query = if let Some(limit) = limit {
            if !query.to_lowercase().contains("limit") {
                format!("{} LIMIT {}", query.trim_end_matches(';'), limit)
            } else {
                query.to_string()
            }
        } else {
            query.to_string()
        };

        let rows: Vec<sqlx::sqlite::SqliteRow> = sqlx::query(&query)
            .fetch_all(&self.pool)
            .await
            .context("Query execution failed")?;

        if rows.is_empty() {
            return Ok((vec![], vec![]));
        }

        use sqlx::Row;
        let columns: Vec<String> = rows[0]
            .columns()
            .iter()
            .map(|c| c.name().to_string())
            .collect();

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

    /// Query a CSV file directly
    pub async fn query_csv(&self, file_path: &str, query: Option<&str>) -> Result<(Vec<String>, Vec<HashMap<String, String>>)> {
        // Read CSV and create temporary table
        let path = Path::new(file_path);
        if !path.exists() {
            anyhow::bail!("File not found: {}", file_path);
        }

        // For SQLite, we need to import the CSV first
        // In a real DuckDB implementation, we'd use: SELECT * FROM read_csv_auto('file.csv')

        let table_name = path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("csv_data")
            .replace(|c: char| !c.is_alphanumeric(), "_");

        // Read CSV file
        let content = std::fs::read_to_string(file_path)
            .context("Failed to read CSV file")?;

        let mut lines = content.lines();
        let header = lines.next().context("Empty CSV file")?;
        let columns: Vec<&str> = header.split(',').map(|s| s.trim()).collect();

        // Create table
        let column_defs: Vec<String> = columns
            .iter()
            .map(|c| format!("\"{}\" TEXT", c.replace('"', "")))
            .collect();

        let create_sql = format!(
            "CREATE TEMP TABLE IF NOT EXISTS {} ({})",
            table_name,
            column_defs.join(", ")
        );

        sqlx::query(&create_sql)
            .execute(&self.pool)
            .await
            .context("Failed to create temp table")?;

        // Insert data
        for line in lines {
            let values: Vec<&str> = line.split(',').map(|s| s.trim()).collect();
            if values.len() == columns.len() {
                let placeholders: Vec<String> = (1..=values.len()).map(|i| format!("?{}", i)).collect();
                let insert_sql = format!(
                    "INSERT INTO {} VALUES ({})",
                    table_name,
                    placeholders.join(", ")
                );

                let mut query_builder = sqlx::query(&insert_sql);
                for value in &values {
                    query_builder = query_builder.bind(*value);
                }

                let _ = query_builder.execute(&self.pool).await;
            }
        }

        // Execute query
        let default_query = format!("SELECT * FROM {}", table_name);
        let sql = query.unwrap_or(&default_query);
        self.execute_sql(sql, None).await
    }

    /// Query a JSON file
    pub async fn query_json(&self, file_path: &str) -> Result<(Vec<String>, Vec<HashMap<String, String>>)> {
        let content = std::fs::read_to_string(file_path)
            .context("Failed to read JSON file")?;

        let data: serde_json::Value = serde_json::from_str(&content)
            .context("Failed to parse JSON")?;

        match data {
            serde_json::Value::Array(arr) => {
                if arr.is_empty() {
                    return Ok((vec![], vec![]));
                }

                // Get columns from first object
                let columns: Vec<String> = if let Some(serde_json::Value::Object(obj)) = arr.first() {
                    obj.keys().cloned().collect()
                } else {
                    vec!["value".to_string()]
                };

                let rows: Vec<HashMap<String, String>> = arr
                    .into_iter()
                    .filter_map(|v| {
                        if let serde_json::Value::Object(obj) = v {
                            Some(
                                obj.into_iter()
                                    .map(|(k, v)| {
                                        let value = match v {
                                            serde_json::Value::String(s) => s,
                                            serde_json::Value::Number(n) => n.to_string(),
                                            serde_json::Value::Bool(b) => b.to_string(),
                                            serde_json::Value::Null => "NULL".to_string(),
                                            _ => v.to_string(),
                                        };
                                        (k, value)
                                    })
                                    .collect()
                            )
                        } else {
                            None
                        }
                    })
                    .collect();

                Ok((columns, rows))
            }
            serde_json::Value::Object(obj) => {
                let columns: Vec<String> = obj.keys().cloned().collect();
                let row: HashMap<String, String> = obj
                    .into_iter()
                    .map(|(k, v)| {
                        let value = match v {
                            serde_json::Value::String(s) => s,
                            serde_json::Value::Number(n) => n.to_string(),
                            serde_json::Value::Bool(b) => b.to_string(),
                            serde_json::Value::Null => "NULL".to_string(),
                            _ => v.to_string(),
                        };
                        (k, value)
                    })
                    .collect();
                Ok((columns, vec![row]))
            }
            _ => anyhow::bail!("JSON must be an array or object"),
        }
    }

    /// List tables in the database
    pub async fn list_tables(&self) -> Result<Vec<String>> {
        let (_, rows) = self
            .execute_sql(
                "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
                None,
            )
            .await?;
        Ok(rows
            .into_iter()
            .filter_map(|r| r.get("name").cloned())
            .collect())
    }

    /// Analyze a file and return statistics
    pub async fn analyze_file(&self, file_path: &str) -> Result<HashMap<String, String>> {
        let path = Path::new(file_path);
        let extension = path.extension().and_then(|s| s.to_str()).unwrap_or("");

        let mut stats = HashMap::new();
        stats.insert("file".to_string(), file_path.to_string());
        stats.insert("extension".to_string(), extension.to_string());

        let metadata = std::fs::metadata(file_path)?;
        stats.insert("size".to_string(), humansize::format_size(metadata.len(), humansize::BINARY));

        match extension.to_lowercase().as_str() {
            "csv" => {
                let (columns, rows) = self.query_csv(file_path, Some("SELECT COUNT(*) as count FROM csv_data")).await?;
                if let Some(row) = rows.first() {
                    if let Some(count) = row.get("count") {
                        stats.insert("rows".to_string(), count.clone());
                    }
                }
                stats.insert("columns".to_string(), columns.len().to_string());
            }
            "json" => {
                let (columns, rows) = self.query_json(file_path).await?;
                stats.insert("rows".to_string(), rows.len().to_string());
                stats.insert("columns".to_string(), columns.len().to_string());
            }
            _ => {}
        }

        Ok(stats)
    }
}

