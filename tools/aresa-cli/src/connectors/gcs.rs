//! Google Cloud Storage connector
//!
//! Search and list objects in GCS buckets.

use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use serde::Deserialize;
use std::collections::HashMap;

/// GCS connector
pub struct GcsConnector {
    bucket: String,
    client: reqwest::Client,
    access_token: String,
}

/// GCS object information
#[derive(Debug, Clone)]
pub struct GcsObject {
    pub name: String,
    pub size: u64,
    pub updated: DateTime<Utc>,
    pub storage_class: String,
    pub content_type: String,
}

#[derive(Deserialize)]
struct ListObjectsResponse {
    items: Option<Vec<ObjectMetadata>>,
    #[serde(rename = "nextPageToken")]
    next_page_token: Option<String>,
}

#[derive(Deserialize)]
struct ObjectMetadata {
    name: String,
    size: Option<String>,
    updated: Option<String>,
    #[serde(rename = "storageClass")]
    storage_class: Option<String>,
    #[serde(rename = "contentType")]
    content_type: Option<String>,
}

impl GcsConnector {
    /// Create a new GCS connector
    pub async fn new(bucket: &str, credentials_path: Option<&str>) -> Result<Self> {
        let client = reqwest::Client::new();
        let access_token = Self::get_access_token(credentials_path).await?;

        Ok(Self {
            bucket: bucket.to_string(),
            client,
            access_token,
        })
    }

    /// Get access token from credentials
    async fn get_access_token(credentials_path: Option<&str>) -> Result<String> {
        if let Some(path) = credentials_path {
            return Self::get_service_account_token(path).await;
        }
        Self::get_gcloud_token().await
    }

    /// Get token from service account JSON
    async fn get_service_account_token(path: &str) -> Result<String> {
        // For simplicity, fall back to gcloud
        // Full implementation would use JWT signing with the service account
        let _ = path;
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

    /// List objects in the bucket
    pub async fn list_objects(
        &self,
        prefix: Option<&str>,
        limit: Option<usize>,
    ) -> Result<Vec<GcsObject>> {
        let mut objects = Vec::new();
        let mut page_token: Option<String> = None;
        let limit = limit.unwrap_or(1000);

        loop {
            let response = self.list_objects_page(prefix, page_token.as_deref()).await?;

            for item in response.items.unwrap_or_default() {
                let size: u64 = item.size.and_then(|s| s.parse().ok()).unwrap_or(0);
                let updated = item
                    .updated
                    .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                    .map(|dt| dt.with_timezone(&Utc))
                    .unwrap_or_else(Utc::now);

                objects.push(GcsObject {
                    name: item.name,
                    size,
                    updated,
                    storage_class: item.storage_class.unwrap_or_else(|| "STANDARD".to_string()),
                    content_type: item.content_type.unwrap_or_else(|| "application/octet-stream".to_string()),
                });

                if objects.len() >= limit {
                    return Ok(objects);
                }
            }

            if response.next_page_token.is_none() {
                break;
            }
            page_token = response.next_page_token;
        }

        Ok(objects)
    }

    /// List a single page of objects
    async fn list_objects_page(
        &self,
        prefix: Option<&str>,
        page_token: Option<&str>,
    ) -> Result<ListObjectsResponse> {
        let mut url = format!(
            "https://storage.googleapis.com/storage/v1/b/{}/o",
            self.bucket
        );

        let mut params = vec![];
        if let Some(prefix) = prefix {
            params.push(format!("prefix={}", urlencoding::encode(prefix)));
        }
        if let Some(token) = page_token {
            params.push(format!("pageToken={}", urlencoding::encode(token)));
        }
        params.push("maxResults=1000".to_string());

        if !params.is_empty() {
            url.push('?');
            url.push_str(&params.join("&"));
        }

        let response: ListObjectsResponse = self
            .client
            .get(&url)
            .bearer_auth(&self.access_token)
            .send()
            .await?
            .json()
            .await?;

        Ok(response)
    }

    /// Search for objects matching a pattern
    pub async fn search(
        &self,
        pattern: &str,
        limit: Option<usize>,
    ) -> Result<Vec<GcsObject>> {
        let objects = self.list_objects(None, None).await?;

        let pattern = pattern.to_lowercase();
        let filtered: Vec<GcsObject> = objects
            .into_iter()
            .filter(|obj| obj.name.to_lowercase().contains(&pattern))
            .take(limit.unwrap_or(100))
            .collect();

        Ok(filtered)
    }

    /// Get objects as query results
    pub async fn list_as_results(
        &self,
        prefix: Option<&str>,
        limit: Option<usize>,
    ) -> Result<(Vec<String>, Vec<HashMap<String, String>>)> {
        let objects = self.list_objects(prefix, limit).await?;

        let columns = vec![
            "name".to_string(),
            "size".to_string(),
            "updated".to_string(),
            "storage_class".to_string(),
            "content_type".to_string(),
        ];

        let rows: Vec<HashMap<String, String>> = objects
            .into_iter()
            .map(|obj| {
                let mut row = HashMap::new();
                row.insert("name".to_string(), obj.name);
                row.insert(
                    "size".to_string(),
                    humansize::format_size(obj.size, humansize::BINARY),
                );
                row.insert(
                    "updated".to_string(),
                    obj.updated.format("%Y-%m-%d %H:%M:%S").to_string(),
                );
                row.insert("storage_class".to_string(), obj.storage_class);
                row.insert("content_type".to_string(), obj.content_type);
                row
            })
            .collect();

        Ok((columns, rows))
    }

    /// Get bucket metadata
    pub async fn bucket_info(&self) -> Result<HashMap<String, String>> {
        #[derive(Deserialize)]
        struct BucketMetadata {
            name: String,
            location: String,
            #[serde(rename = "storageClass")]
            storage_class: String,
            #[serde(rename = "timeCreated")]
            time_created: String,
        }

        let url = format!(
            "https://storage.googleapis.com/storage/v1/b/{}",
            self.bucket
        );

        let metadata: BucketMetadata = self
            .client
            .get(&url)
            .bearer_auth(&self.access_token)
            .send()
            .await?
            .json()
            .await?;

        let mut info = HashMap::new();
        info.insert("name".to_string(), metadata.name);
        info.insert("location".to_string(), metadata.location);
        info.insert("storage_class".to_string(), metadata.storage_class);
        info.insert("created".to_string(), metadata.time_created);

        Ok(info)
    }
}

