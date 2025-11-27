//! AWS S3 connector
//!
//! Search and list objects in S3 buckets.

use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use std::collections::HashMap;

/// S3 connector
pub struct S3Connector {
    bucket: String,
    region: String,
    client: reqwest::Client,
    access_key: String,
    secret_key: String,
}

/// S3 object information
#[derive(Debug, Clone)]
pub struct S3Object {
    pub key: String,
    pub size: u64,
    pub last_modified: DateTime<Utc>,
    pub storage_class: String,
}

impl S3Connector {
    /// Create a new S3 connector
    pub async fn new(
        bucket: &str,
        region: Option<&str>,
        access_key: Option<&str>,
        secret_key: Option<&str>,
    ) -> Result<Self> {
        let region = region.unwrap_or("us-east-1").to_string();

        // Try to get credentials from environment or AWS config
        let (access_key, secret_key) = match (access_key, secret_key) {
            (Some(ak), Some(sk)) => (ak.to_string(), sk.to_string()),
            _ => Self::get_credentials_from_env()?,
        };

        Ok(Self {
            bucket: bucket.to_string(),
            region,
            client: reqwest::Client::new(),
            access_key,
            secret_key,
        })
    }

    /// Get credentials from environment
    fn get_credentials_from_env() -> Result<(String, String)> {
        let access_key = std::env::var("AWS_ACCESS_KEY_ID")
            .context("AWS_ACCESS_KEY_ID not set")?;
        let secret_key = std::env::var("AWS_SECRET_ACCESS_KEY")
            .context("AWS_SECRET_ACCESS_KEY not set")?;
        Ok((access_key, secret_key))
    }

    /// List objects in the bucket
    pub async fn list_objects(
        &self,
        prefix: Option<&str>,
        limit: Option<usize>,
    ) -> Result<Vec<S3Object>> {
        let mut objects = Vec::new();
        let mut continuation_token: Option<String> = None;
        let limit = limit.unwrap_or(1000);

        loop {
            let response = self.list_objects_page(prefix, continuation_token.as_deref()).await?;

            objects.extend(response.objects);

            if objects.len() >= limit || response.continuation_token.is_none() {
                break;
            }

            continuation_token = response.continuation_token;
        }

        objects.truncate(limit);
        Ok(objects)
    }

    /// List a single page of objects
    async fn list_objects_page(
        &self,
        prefix: Option<&str>,
        continuation_token: Option<&str>,
    ) -> Result<ListObjectsResponse> {
        let host = format!("{}.s3.{}.amazonaws.com", self.bucket, self.region);
        let mut url = format!("https://{}/?list-type=2", host);

        if let Some(prefix) = prefix {
            url.push_str(&format!("&prefix={}", urlencoding::encode(prefix)));
        }
        if let Some(token) = continuation_token {
            url.push_str(&format!("&continuation-token={}", urlencoding::encode(token)));
        }

        // Create AWS Signature V4
        let now = Utc::now();
        let date_stamp = now.format("%Y%m%d").to_string();
        let amz_date = now.format("%Y%m%dT%H%M%SZ").to_string();

        let authorization = self.sign_request(
            "GET",
            "/",
            &format!("list-type=2{}{}",
                prefix.map(|p| format!("&prefix={}", p)).unwrap_or_default(),
                continuation_token.map(|t| format!("&continuation-token={}", t)).unwrap_or_default()
            ),
            &host,
            &amz_date,
            &date_stamp,
        )?;

        let response = self.client
            .get(&url)
            .header("Host", &host)
            .header("x-amz-date", &amz_date)
            .header("x-amz-content-sha256", "UNSIGNED-PAYLOAD")
            .header("Authorization", authorization)
            .send()
            .await?
            .text()
            .await?;

        // Parse XML response
        self.parse_list_response(&response)
    }

    /// Sign a request with AWS Signature V4
    fn sign_request(
        &self,
        method: &str,
        path: &str,
        query: &str,
        host: &str,
        amz_date: &str,
        date_stamp: &str,
    ) -> Result<String> {
        use hmac::{Hmac, Mac};
        use sha2::{Sha256, Digest};

        type HmacSha256 = Hmac<Sha256>;

        // Create canonical request
        let canonical_headers = format!(
            "host:{}\nx-amz-content-sha256:UNSIGNED-PAYLOAD\nx-amz-date:{}\n",
            host, amz_date
        );
        let signed_headers = "host;x-amz-content-sha256;x-amz-date";

        let canonical_request = format!(
            "{}\n{}\n{}\n{}\n{}\nUNSIGNED-PAYLOAD",
            method, path, query, canonical_headers, signed_headers
        );

        // Create string to sign
        let algorithm = "AWS4-HMAC-SHA256";
        let credential_scope = format!("{}/{}/s3/aws4_request", date_stamp, self.region);

        let mut hasher = Sha256::new();
        hasher.update(canonical_request.as_bytes());
        let canonical_request_hash = hex::encode(hasher.finalize());

        let string_to_sign = format!(
            "{}\n{}\n{}\n{}",
            algorithm, amz_date, credential_scope, canonical_request_hash
        );

        // Calculate signature
        let k_secret = format!("AWS4{}", self.secret_key);

        let mut mac = HmacSha256::new_from_slice(k_secret.as_bytes())?;
        mac.update(date_stamp.as_bytes());
        let k_date = mac.finalize().into_bytes();

        let mut mac = HmacSha256::new_from_slice(&k_date)?;
        mac.update(self.region.as_bytes());
        let k_region = mac.finalize().into_bytes();

        let mut mac = HmacSha256::new_from_slice(&k_region)?;
        mac.update(b"s3");
        let k_service = mac.finalize().into_bytes();

        let mut mac = HmacSha256::new_from_slice(&k_service)?;
        mac.update(b"aws4_request");
        let k_signing = mac.finalize().into_bytes();

        let mut mac = HmacSha256::new_from_slice(&k_signing)?;
        mac.update(string_to_sign.as_bytes());
        let signature = hex::encode(mac.finalize().into_bytes());

        // Create authorization header
        let authorization = format!(
            "{} Credential={}/{}, SignedHeaders={}, Signature={}",
            algorithm, self.access_key, credential_scope, signed_headers, signature
        );

        Ok(authorization)
    }

    /// Parse the list objects XML response
    fn parse_list_response(&self, xml: &str) -> Result<ListObjectsResponse> {
        // Simple XML parsing - in production, use a proper XML parser
        let mut objects = Vec::new();
        let mut continuation_token = None;

        // Extract continuation token
        if let Some(start) = xml.find("<NextContinuationToken>") {
            if let Some(end) = xml[start..].find("</NextContinuationToken>") {
                continuation_token = Some(xml[start + 23..start + end].to_string());
            }
        }

        // Extract objects
        let mut pos = 0;
        while let Some(start) = xml[pos..].find("<Contents>") {
            let start = pos + start;
            if let Some(end) = xml[start..].find("</Contents>") {
                let content = &xml[start..start + end + 11];

                let key = extract_xml_value(content, "Key").unwrap_or_default();
                let size: u64 = extract_xml_value(content, "Size")
                    .and_then(|s| s.parse().ok())
                    .unwrap_or(0);
                let last_modified = extract_xml_value(content, "LastModified")
                    .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                    .map(|dt| dt.with_timezone(&Utc))
                    .unwrap_or_else(Utc::now);
                let storage_class = extract_xml_value(content, "StorageClass")
                    .unwrap_or_else(|| "STANDARD".to_string());

                objects.push(S3Object {
                    key,
                    size,
                    last_modified,
                    storage_class,
                });

                pos = start + end + 11;
            } else {
                break;
            }
        }

        Ok(ListObjectsResponse {
            objects,
            continuation_token,
        })
    }

    /// Search for objects matching a pattern
    pub async fn search(
        &self,
        pattern: &str,
        limit: Option<usize>,
    ) -> Result<Vec<S3Object>> {
        // List all objects and filter by pattern
        let objects = self.list_objects(None, None).await?;

        let pattern = pattern.to_lowercase();
        let filtered: Vec<S3Object> = objects
            .into_iter()
            .filter(|obj| obj.key.to_lowercase().contains(&pattern))
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
            "key".to_string(),
            "size".to_string(),
            "last_modified".to_string(),
            "storage_class".to_string(),
        ];

        let rows: Vec<HashMap<String, String>> = objects
            .into_iter()
            .map(|obj| {
                let mut row = HashMap::new();
                row.insert("key".to_string(), obj.key);
                row.insert("size".to_string(), humansize::format_size(obj.size, humansize::BINARY));
                row.insert("last_modified".to_string(), obj.last_modified.format("%Y-%m-%d %H:%M:%S").to_string());
                row.insert("storage_class".to_string(), obj.storage_class);
                row
            })
            .collect();

        Ok((columns, rows))
    }
}

struct ListObjectsResponse {
    objects: Vec<S3Object>,
    continuation_token: Option<String>,
}

/// Extract a value from simple XML
fn extract_xml_value(xml: &str, tag: &str) -> Option<String> {
    let start_tag = format!("<{}>", tag);
    let end_tag = format!("</{}>", tag);

    if let Some(start) = xml.find(&start_tag) {
        let value_start = start + start_tag.len();
        if let Some(end) = xml[value_start..].find(&end_tag) {
            return Some(xml[value_start..value_start + end].to_string());
        }
    }
    None
}


