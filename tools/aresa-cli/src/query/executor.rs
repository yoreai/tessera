//! Query executor

use anyhow::{Context, Result};
use serde::Serialize;
use std::collections::HashMap;

use crate::config::ConfigManager;
use crate::connectors::filesystem::FilesystemConnector;
use crate::connectors::postgres::PostgresConnector;
use crate::connectors::sqlite::SqliteConnector;
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
            crate::config::SourceType::Sqlite | crate::config::SourceType::DuckDb => {
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

            (QueryIntent::SqlQuery, TargetType::Sqlite) => {
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

            _ => Err(anyhow::anyhow!(
                "Query type {:?} on {:?} not yet supported",
                parsed.intent,
                parsed.target_type
            )),
        }
    }
}

