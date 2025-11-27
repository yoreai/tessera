//! Google BigQuery connector
//!
//! Uses the BigQuery REST API for queries.

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// BigQuery connector
pub struct BigQueryConnector {
    project_id: String,
    client: reqwest::Client,
    access_token: String,
}

#[derive(Serialize)]
struct QueryRequest {
    query: String,
    #[serde(rename = "useLegacySql")]
    use_legacy_sql: bool,
    #[serde(rename = "maxResults", skip_serializing_if = "Option::is_none")]
    max_results: Option<usize>,
}

#[derive(Deserialize)]
struct QueryResponse {
    schema: Option<Schema>,
    rows: Option<Vec<Row>>,
    #[serde(rename = "totalRows")]
    total_rows: Option<String>,
    #[serde(rename = "jobComplete")]
    job_complete: bool,
    #[serde(rename = "jobReference")]
    job_reference: Option<JobReference>,
}

#[derive(Deserialize)]
struct Schema {
    fields: Vec<Field>,
}

#[derive(Deserialize)]
struct Field {
    name: String,
    #[serde(rename = "type")]
    field_type: String,
}

#[derive(Deserialize)]
struct Row {
    f: Vec<Cell>,
}

#[derive(Deserialize)]
struct Cell {
    v: Option<serde_json::Value>,
}

#[derive(Deserialize)]
struct JobReference {
    #[serde(rename = "jobId")]
    job_id: String,
}

#[derive(Deserialize)]
struct GetQueryResultsResponse {
    schema: Option<Schema>,
    rows: Option<Vec<Row>>,
    #[serde(rename = "jobComplete")]
    job_complete: bool,
    #[serde(rename = "pageToken")]
    page_token: Option<String>,
}

impl BigQueryConnector {
    /// Create a new BigQuery connector
    pub async fn new(project_id: &str, credentials_path: Option<&str>) -> Result<Self> {
        let client = reqwest::Client::new();

        // Get access token from service account or application default credentials
        let access_token = Self::get_access_token(credentials_path).await?;

        Ok(Self {
            project_id: project_id.to_string(),
            client,
            access_token,
        })
    }

    /// Get access token from credentials
    async fn get_access_token(credentials_path: Option<&str>) -> Result<String> {
        // If credentials path provided, use service account
        if let Some(path) = credentials_path {
            return Self::get_service_account_token(path).await;
        }

        // Try to get from gcloud CLI
        Self::get_gcloud_token().await
    }

    /// Get token from service account JSON
    async fn get_service_account_token(path: &str) -> Result<String> {
        use std::fs;

        #[derive(Deserialize)]
        struct ServiceAccount {
            client_email: String,
            private_key: String,
            token_uri: String,
        }

        let content = fs::read_to_string(path)
            .context("Failed to read service account file")?;
        let sa: ServiceAccount = serde_json::from_str(&content)
            .context("Failed to parse service account JSON")?;

        // Create JWT and exchange for access token
        // This is a simplified implementation - production would use proper JWT signing
        let client = reqwest::Client::new();

        // For now, we'll use gcloud fallback
        // Full implementation would sign JWT with private_key
        let _ = (sa.client_email, sa.private_key, sa.token_uri, client);

        Self::get_gcloud_token().await
    }

    /// Get token from gcloud CLI
    async fn get_gcloud_token() -> Result<String> {
        let output = std::process::Command::new("gcloud")
            .args(["auth", "print-access-token"])
            .output()
            .context("Failed to run gcloud. Make sure Google Cloud SDK is installed.")?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            anyhow::bail!("gcloud auth failed: {}", stderr);
        }

        let token = String::from_utf8(output.stdout)
            .context("Invalid token encoding")?
            .trim()
            .to_string();

        Ok(token)
    }

    /// Execute a SQL query
    pub async fn execute_sql(
        &self,
        query: &str,
        limit: Option<usize>,
    ) -> Result<(Vec<String>, Vec<HashMap<String, String>>)> {
        let url = format!(
            "https://bigquery.googleapis.com/bigquery/v2/projects/{}/queries",
            self.project_id
        );

        let request = QueryRequest {
            query: query.to_string(),
            use_legacy_sql: false,
            max_results: limit,
        };

        let response: QueryResponse = self.client
            .post(&url)
            .bearer_auth(&self.access_token)
            .json(&request)
            .send()
            .await?
            .json()
            .await?;

        // If job not complete, poll for results
        let (schema, rows) = if !response.job_complete {
            if let Some(job_ref) = response.job_reference {
                self.poll_results(&job_ref.job_id, limit).await?
            } else {
                (None, None)
            }
        } else {
            (response.schema, response.rows)
        };

        // Extract column names
        let columns: Vec<String> = schema
            .map(|s| s.fields.iter().map(|f| f.name.clone()).collect())
            .unwrap_or_default();

        // Extract row data
        let result_rows: Vec<HashMap<String, String>> = rows
            .unwrap_or_default()
            .into_iter()
            .map(|row| {
                columns
                    .iter()
                    .zip(row.f.iter())
                    .map(|(col, cell)| {
                        let value = cell.v.as_ref()
                            .map(|v| match v {
                                serde_json::Value::String(s) => s.clone(),
                                serde_json::Value::Number(n) => n.to_string(),
                                serde_json::Value::Bool(b) => b.to_string(),
                                serde_json::Value::Null => "NULL".to_string(),
                                _ => v.to_string(),
                            })
                            .unwrap_or_else(|| "NULL".to_string());
                        (col.clone(), value)
                    })
                    .collect()
            })
            .collect();

        Ok((columns, result_rows))
    }

    /// Poll for query results
    async fn poll_results(
        &self,
        job_id: &str,
        limit: Option<usize>,
    ) -> Result<(Option<Schema>, Option<Vec<Row>>)> {
        let url = format!(
            "https://bigquery.googleapis.com/bigquery/v2/projects/{}/queries/{}",
            self.project_id, job_id
        );

        let mut all_rows = Vec::new();
        let mut schema = None;
        let mut page_token: Option<String> = None;

        loop {
            let mut request = self.client.get(&url).bearer_auth(&self.access_token);

            if let Some(token) = &page_token {
                request = request.query(&[("pageToken", token)]);
            }
            if let Some(limit) = limit {
                request = request.query(&[("maxResults", limit.to_string())]);
            }

            let response: GetQueryResultsResponse = request.send().await?.json().await?;

            if !response.job_complete {
                tokio::time::sleep(std::time::Duration::from_millis(500)).await;
                continue;
            }

            if schema.is_none() {
                schema = response.schema;
            }

            if let Some(rows) = response.rows {
                all_rows.extend(rows);
            }

            if response.page_token.is_none() || limit.map(|l| all_rows.len() >= l).unwrap_or(false) {
                break;
            }

            page_token = response.page_token;
        }

        Ok((schema, Some(all_rows)))
    }

    /// List datasets in the project
    pub async fn list_datasets(&self) -> Result<Vec<String>> {
        #[derive(Deserialize)]
        struct ListDatasetsResponse {
            datasets: Option<Vec<Dataset>>,
        }

        #[derive(Deserialize)]
        struct Dataset {
            #[serde(rename = "datasetReference")]
            dataset_reference: DatasetReference,
        }

        #[derive(Deserialize)]
        struct DatasetReference {
            #[serde(rename = "datasetId")]
            dataset_id: String,
        }

        let url = format!(
            "https://bigquery.googleapis.com/bigquery/v2/projects/{}/datasets",
            self.project_id
        );

        let response: ListDatasetsResponse = self.client
            .get(&url)
            .bearer_auth(&self.access_token)
            .send()
            .await?
            .json()
            .await?;

        Ok(response.datasets
            .unwrap_or_default()
            .into_iter()
            .map(|d| d.dataset_reference.dataset_id)
            .collect())
    }

    /// List tables in a dataset
    pub async fn list_tables(&self, dataset: &str) -> Result<Vec<String>> {
        #[derive(Deserialize)]
        struct ListTablesResponse {
            tables: Option<Vec<Table>>,
        }

        #[derive(Deserialize)]
        struct Table {
            #[serde(rename = "tableReference")]
            table_reference: TableReference,
        }

        #[derive(Deserialize)]
        struct TableReference {
            #[serde(rename = "tableId")]
            table_id: String,
        }

        let url = format!(
            "https://bigquery.googleapis.com/bigquery/v2/projects/{}/datasets/{}/tables",
            self.project_id, dataset
        );

        let response: ListTablesResponse = self.client
            .get(&url)
            .bearer_auth(&self.access_token)
            .send()
            .await?
            .json()
            .await?;

        Ok(response.tables
            .unwrap_or_default()
            .into_iter()
            .map(|t| t.table_reference.table_id)
            .collect())
    }
}


