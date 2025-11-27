//! ClickHouse connector
//!
//! Connect to ClickHouse databases via HTTP interface.

use anyhow::{Context, Result};
use serde::Deserialize;
use std::collections::HashMap;

/// ClickHouse connector using HTTP interface
pub struct ClickHouseConnector {
    base_url: String,
    client: reqwest::Client,
    database: Option<String>,
    username: Option<String>,
    password: Option<String>,
}

#[derive(Deserialize)]
struct ClickHouseResponse {
    data: Vec<HashMap<String, serde_json::Value>>,
    meta: Vec<ColumnMeta>,
    rows: usize,
    statistics: Option<Statistics>,
}

#[derive(Deserialize)]
struct ColumnMeta {
    name: String,
    #[serde(rename = "type")]
    _column_type: String,
}

#[derive(Deserialize)]
struct Statistics {
    elapsed: f64,
    rows_read: u64,
    bytes_read: u64,
}

impl ClickHouseConnector {
    /// Create a new ClickHouse connector
    pub async fn new(
        host: &str,
        port: Option<u16>,
        database: Option<&str>,
        username: Option<&str>,
        password: Option<&str>,
    ) -> Result<Self> {
        let port = port.unwrap_or(8123);
        let base_url = format!("http://{}:{}", host, port);

        let connector = Self {
            base_url,
            client: reqwest::Client::new(),
            database: database.map(String::from),
            username: username.map(String::from),
            password: password.map(String::from),
        };

        // Test connection
        connector.test_connection().await?;

        Ok(connector)
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

        // Build request
        let mut request = self.client.post(&self.base_url);

        // Add authentication if provided
        if let (Some(user), Some(pass)) = (&self.username, &self.password) {
            request = request.basic_auth(user, Some(pass));
        }

        // Add database parameter
        if let Some(db) = &self.database {
            request = request.query(&[("database", db)]);
        }

        // Request JSON format
        let query_with_format = format!("{} FORMAT JSON", query);

        let response = request
            .body(query_with_format)
            .send()
            .await
            .context("Failed to send request to ClickHouse")?;

        if !response.status().is_success() {
            let error = response.text().await.unwrap_or_default();
            anyhow::bail!("ClickHouse error: {}", error);
        }

        let result: ClickHouseResponse = response
            .json()
            .await
            .context("Failed to parse ClickHouse response")?;

        // Extract columns
        let columns: Vec<String> = result.meta.iter().map(|m| m.name.clone()).collect();

        // Convert data to string map
        let rows: Vec<HashMap<String, String>> = result
            .data
            .into_iter()
            .map(|row| {
                row.into_iter()
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
            })
            .collect();

        Ok((columns, rows))
    }

    /// Test connection
    pub async fn test_connection(&self) -> Result<()> {
        let mut request = self.client.get(format!("{}/ping", self.base_url));

        if let (Some(user), Some(pass)) = (&self.username, &self.password) {
            request = request.basic_auth(user, Some(pass));
        }

        let response = request.send().await.context("Failed to ping ClickHouse")?;

        if !response.status().is_success() {
            anyhow::bail!("ClickHouse ping failed");
        }

        Ok(())
    }

    /// List databases
    pub async fn list_databases(&self) -> Result<Vec<String>> {
        let (_, rows) = self.execute_sql("SHOW DATABASES", None).await?;
        Ok(rows
            .into_iter()
            .filter_map(|r| r.get("name").cloned())
            .collect())
    }

    /// List tables in current database
    pub async fn list_tables(&self) -> Result<Vec<String>> {
        let (_, rows) = self.execute_sql("SHOW TABLES", None).await?;
        Ok(rows
            .into_iter()
            .filter_map(|r| r.get("name").cloned())
            .collect())
    }

    /// Get table schema
    pub async fn describe_table(&self, table: &str) -> Result<Vec<HashMap<String, String>>> {
        let (_, rows) = self
            .execute_sql(&format!("DESCRIBE TABLE {}", table), None)
            .await?;
        Ok(rows)
    }

    /// Get system information
    pub async fn system_info(&self) -> Result<HashMap<String, String>> {
        let (_, rows) = self
            .execute_sql(
                "SELECT version() as version, uptime() as uptime_seconds",
                None,
            )
            .await?;
        Ok(rows.into_iter().next().unwrap_or_default())
    }
}

