//! Query executor

use anyhow::{Context, Result};
use serde::Serialize;
use std::collections::HashMap;

use crate::config::ConfigManager;
use crate::connectors::filesystem::FilesystemConnector;
use crate::connectors::postgres::PostgresConnector;
use crate::connectors::mysql::MySqlConnector;
use crate::connectors::sqlite::SqliteConnector;
use crate::connectors::duckdb::DuckDbConnector;
use crate::connectors::clickhouse::ClickHouseConnector;
use crate::connectors::bigquery::BigQueryConnector;
use crate::connectors::s3::S3Connector;
use crate::connectors::gcs::GcsConnector;
use crate::nlp::{ParsedQuery, QueryIntent, TargetType};

/// Query execution result
#[derive(Debug, Clone, Serialize)]
pub struct QueryResult {
    /// Column names
    pub columns: Vec<String>,
    /// Row data
    pub rows: Vec<HashMap<String, String>>,
    /// Execution time in milliseconds
    pub execution_time_ms: u64,
}

/// Query executor
pub struct QueryExecutor<'a> {
    config: &'a ConfigManager,
}

impl<'a> QueryExecutor<'a> {
    /// Create a new query executor
    pub fn new(config: &'a ConfigManager) -> Self {
        Self { config }
    }

    /// Execute a query on a named source
    pub async fn execute(
        &self,
        source: &str,
        query: &str,
        limit: Option<usize>,
    ) -> Result<QueryResult> {
        let source_config = self.config.get_source(source)
            .context(format!("Data source '{}' not found", source))?;

        let start = std::time::Instant::now();

        let (columns, rows) = match source_config.source_type {
            crate::config::SourceType::Postgres => {
                let uri = self.config.get_uri(source)?;
                let connector = PostgresConnector::new(&uri).await?;
                connector.execute_sql(query, limit).await?
            }
            crate::config::SourceType::SQLite | crate::config::SourceType::DuckDB => {
                let uri = self.config.get_uri(source)?;
                let connector = SqliteConnector::new(&uri).await?;
                connector.execute_sql(query, limit).await?
            }
            _ => {
                return Err(anyhow::anyhow!(
                    "Query execution not yet supported for {:?}",
                    source_config.source_type
                ))
            }
        };

        Ok(QueryResult {
            columns,
            rows,
            execution_time_ms: start.elapsed().as_millis() as u64,
        })
    }

    /// Execute a parsed natural language query
    pub async fn execute_parsed(
        &self,
        parsed: &ParsedQuery,
        limit: Option<usize>,
    ) -> Result<QueryResult> {
        let start = std::time::Instant::now();

        match (&parsed.intent, &parsed.target_type) {
            // Filesystem operations
            (QueryIntent::SearchFiles, TargetType::Filesystem) => {
                let connector = FilesystemConnector::new();
                let pattern = parsed.pattern.as_deref().unwrap_or("*");
                let path = parsed.path.as_deref().unwrap_or(".");

                let results = connector.search_files(path, pattern, limit).await?;

                Ok(QueryResult {
                    columns: vec!["path".to_string(), "size".to_string(), "modified".to_string()],
                    rows: results
                        .into_iter()
                        .map(|r| {
                            let mut row = HashMap::new();
                            row.insert("path".to_string(), r.path.display().to_string());
                            row.insert(
                                "size".to_string(),
                                r.size
                                    .map(|s| humansize::format_size(s, humansize::BINARY))
                                    .unwrap_or_default(),
                            );
                            row.insert(
                                "modified".to_string(),
                                r.modified
                                    .map(|m| m.format("%Y-%m-%d %H:%M").to_string())
                                    .unwrap_or_default(),
                            );
                            row
                        })
                        .collect(),
                    execution_time_ms: start.elapsed().as_millis() as u64,
                })
            }

            (QueryIntent::SearchContent, TargetType::Filesystem) => {
                let connector = FilesystemConnector::new();
                let pattern = parsed.pattern.as_deref().unwrap_or("");
                let path = parsed.path.as_deref().unwrap_or(".");

                let results = connector.search_content(path, pattern, limit).await?;

                Ok(QueryResult {
                    columns: vec!["path".to_string(), "line".to_string(), "content".to_string()],
                    rows: results
                        .into_iter()
                        .flat_map(|r| {
                            r.matches.unwrap_or_default().into_iter().map(move |m| {
                                let mut row = HashMap::new();
                                row.insert("path".to_string(), r.path.display().to_string());
                                row.insert("line".to_string(), m.line_number.to_string());
                                row.insert("content".to_string(), m.content);
                                row
                            })
                        })
                        .collect(),
                    execution_time_ms: start.elapsed().as_millis() as u64,
                })
            }

            (QueryIntent::FindGitRepos, TargetType::Filesystem) => {
                let connector = FilesystemConnector::new();
                let path = parsed.path.as_deref().unwrap_or(".");

                let results = connector.find_git_repos(path).await?;

                Ok(QueryResult {
                    columns: vec![
                        "path".to_string(),
                        "branch".to_string(),
                        "status".to_string(),
                    ],
                    rows: results
                        .into_iter()
                        .map(|r| {
                            let mut row = HashMap::new();
                            row.insert("path".to_string(), r.path.display().to_string());
                            row.insert(
                                "branch".to_string(),
                                r.branch.unwrap_or_else(|| "HEAD".to_string()),
                            );
                            let status = if r.status.clean {
                                "clean".to_string()
                            } else {
                                format!(
                                    "{}M {}S {}U",
                                    r.status.modified,
                                    r.status.staged,
                                    r.status.untracked
                                )
                            };
                            row.insert("status".to_string(), status);
                            row
                        })
                        .collect(),
                    execution_time_ms: start.elapsed().as_millis() as u64,
                })
            }

            // Database operations
            (QueryIntent::SqlQuery, TargetType::Postgres) => {
                let source_name = parsed.target_source.as_ref()
                    .context("No PostgreSQL source specified")?;
                let uri = self.config.get_uri(source_name)?;
                let connector = PostgresConnector::new(&uri).await?;

                let sql = parsed.sql.as_ref()
                    .context("No SQL query generated")?;

                let (columns, rows) = connector.execute_sql(sql, limit).await?;

                Ok(QueryResult {
                    columns,
                    rows,
                    execution_time_ms: start.elapsed().as_millis() as u64,
                })
            }

            (QueryIntent::ListTables, TargetType::Postgres) => {
                let source_name = parsed.target_source.as_ref()
                    .context("No PostgreSQL source specified")?;
                let uri = self.config.get_uri(source_name)?;
                let connector = PostgresConnector::new(&uri).await?;

                let tables = connector.list_tables().await?;

                Ok(QueryResult {
                    columns: vec!["table_name".to_string()],
                    rows: tables
                        .into_iter()
                        .map(|t| {
                            let mut row = HashMap::new();
                            row.insert("table_name".to_string(), t);
                            row
                        })
                        .collect(),
                    execution_time_ms: start.elapsed().as_millis() as u64,
                })
            }

            (QueryIntent::SqlQuery, TargetType::SQLite) => {
                let source_name = parsed.target_source.as_ref()
                    .context("No SQLite source specified")?;
                let uri = self.config.get_uri(source_name)?;
                let connector = SqliteConnector::new(&uri).await?;

                let sql = parsed.sql.as_ref()
                    .context("No SQL query generated")?;

                let (columns, rows) = connector.execute_sql(sql, limit).await?;

                Ok(QueryResult {
                    columns,
                    rows,
                    execution_time_ms: start.elapsed().as_millis() as u64,
                })
            }

            // MySQL operations
            (QueryIntent::SqlQuery, TargetType::MySQL) => {
                let source_name = parsed.target_source.as_ref()
                    .context("No MySQL source specified")?;
                let source = self.config.get_source(source_name)
                    .context("Source not found")?;
                let uri = source.uri.as_ref()
                    .context("MySQL URI not configured")?;
                
                let connector = MySqlConnector::new(uri).await?;
                
                let sql = parsed.sql.as_ref()
                    .context("No SQL query generated")?;
                
                let (columns, rows) = connector.execute_sql(sql, limit).await?;
                
                Ok(QueryResult {
                    columns,
                    rows,
                    execution_time_ms: start.elapsed().as_millis() as u64,
                })
            }

            // ClickHouse operations
            (QueryIntent::SqlQuery, TargetType::ClickHouse) => {
                let source_name = parsed.target_source.as_ref()
                    .context("No ClickHouse source specified")?;
                let source = self.config.get_source(source_name)
                    .context("Source not found")?;
                let host = source.host.as_ref()
                    .context("ClickHouse host not configured")?;
                
                let connector = ClickHouseConnector::new(
                    host,
                    source.port,
                    source.database.as_deref(),
                    source.username.as_deref(),
                    source.password.as_deref(),
                ).await?;
                
                let sql = parsed.sql.as_ref()
                    .context("No SQL query generated")?;
                
                let (columns, rows) = connector.execute_sql(sql, limit).await?;
                
                Ok(QueryResult {
                    columns,
                    rows,
                    execution_time_ms: start.elapsed().as_millis() as u64,
                })
            }

            // DuckDB / Local file analytics
            (QueryIntent::SqlQuery, TargetType::DuckDB) | (QueryIntent::AnalyzeFile, _) => {
                let connector = DuckDbConnector::new(None).await?;
                
                // Check if we're analyzing a file
                if let Some(path) = &parsed.path {
                    let extension = std::path::Path::new(path)
                        .extension()
                        .and_then(|s| s.to_str())
                        .unwrap_or("");
                    
                    let (columns, rows) = match extension.to_lowercase().as_str() {
                        "csv" => connector.query_csv(path, parsed.sql.as_deref()).await?,
                        "json" => connector.query_json(path).await?,
                        _ => anyhow::bail!("Unsupported file type: {}", extension),
                    };
                    
                    Ok(QueryResult {
                        columns,
                        rows,
                        execution_time_ms: start.elapsed().as_millis() as u64,
                    })
                } else {
                    let sql = parsed.sql.as_ref()
                        .context("No SQL query generated")?;
                    
                    let (columns, rows) = connector.execute_sql(sql, limit).await?;
                    
                    Ok(QueryResult {
                        columns,
                        rows,
                        execution_time_ms: start.elapsed().as_millis() as u64,
                    })
                }
            }

            // BigQuery operations
            (QueryIntent::SqlQuery, TargetType::BigQuery) => {
                let source_name = parsed.target_source.as_ref()
                    .context("No BigQuery source specified")?;
                let source = self.config.get_source(source_name)
                    .context("Source not found")?;
                let project = source.project.as_ref()
                    .context("BigQuery project not configured")?;
                let credentials = source.credentials_path.as_deref();

                let connector = BigQueryConnector::new(project, credentials).await?;

                let sql = parsed.sql.as_ref()
                    .context("No SQL query generated")?;

                let (columns, rows) = connector.execute_sql(sql, limit).await?;

                Ok(QueryResult {
                    columns,
                    rows,
                    execution_time_ms: start.elapsed().as_millis() as u64,
                })
            }

            // S3 operations
            (QueryIntent::SearchBlobs, TargetType::S3) => {
                let source_name = parsed.target_source.as_ref()
                    .context("No S3 source specified")?;
                let source = self.config.get_source(source_name)
                    .context("Source not found")?;
                let bucket = source.bucket.as_ref()
                    .context("S3 bucket not configured")?;

                let connector = S3Connector::new(bucket, None, None, None).await?;
                let pattern = parsed.pattern.as_deref().unwrap_or("");

                let (columns, rows) = if pattern.is_empty() {
                    connector.list_as_results(None, limit).await?
                } else {
                    let objects = connector.search(pattern, limit).await?;
                    let columns = vec![
                        "key".to_string(),
                        "size".to_string(),
                        "last_modified".to_string(),
                        "storage_class".to_string(),
                    ];
                    let rows: Vec<std::collections::HashMap<String, String>> = objects
                        .into_iter()
                        .map(|obj| {
                            let mut row = std::collections::HashMap::new();
                            row.insert("key".to_string(), obj.key);
                            row.insert("size".to_string(), humansize::format_size(obj.size, humansize::BINARY));
                            row.insert("last_modified".to_string(), obj.last_modified.format("%Y-%m-%d %H:%M:%S").to_string());
                            row.insert("storage_class".to_string(), obj.storage_class);
                            row
                        })
                        .collect();
                    (columns, rows)
                };

                Ok(QueryResult {
                    columns,
                    rows,
                    execution_time_ms: start.elapsed().as_millis() as u64,
                })
            }

            // GCS operations
            (QueryIntent::SearchBlobs, TargetType::GCS) => {
                let source_name = parsed.target_source.as_ref()
                    .context("No GCS source specified")?;
                let source = self.config.get_source(source_name)
                    .context("Source not found")?;
                let bucket = source.bucket.as_ref()
                    .context("GCS bucket not configured")?;
                
                let connector = GcsConnector::new(bucket, source.credentials_path.as_deref()).await?;
                let pattern = parsed.pattern.as_deref().unwrap_or("");
                
                let (columns, rows) = if pattern.is_empty() {
                    connector.list_as_results(None, limit).await?
                } else {
                    let objects = connector.search(pattern, limit).await?;
                    let columns = vec![
                        "name".to_string(),
                        "size".to_string(),
                        "updated".to_string(),
                        "storage_class".to_string(),
                        "content_type".to_string(),
                    ];
                    let rows: Vec<std::collections::HashMap<String, String>> = objects
                        .into_iter()
                        .map(|obj| {
                            let mut row = std::collections::HashMap::new();
                            row.insert("name".to_string(), obj.name);
                            row.insert("size".to_string(), humansize::format_size(obj.size, humansize::BINARY));
                            row.insert("updated".to_string(), obj.updated.format("%Y-%m-%d %H:%M:%S").to_string());
                            row.insert("storage_class".to_string(), obj.storage_class);
                            row.insert("content_type".to_string(), obj.content_type);
                            row
                        })
                        .collect();
                    (columns, rows)
                };
                
                Ok(QueryResult {
                    columns,
                    rows,
                    execution_time_ms: start.elapsed().as_millis() as u64,
                })
            }

            _ => Err(anyhow::anyhow!(
                "Query type {:?} on {:?} not yet supported",
                parsed.intent,
                parsed.target_type
            )),
        }
    }
}

