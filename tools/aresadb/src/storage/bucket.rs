//! Cloud bucket storage backend (S3/GCS)
//!
//! Provides remote storage capabilities with intelligent chunking and caching.

use anyhow::{Result, Context, bail};
use bytes::Bytes;
use futures::StreamExt;
use object_store::{ObjectStore, path::Path as ObjectPath};
use object_store::aws::AmazonS3Builder;
use object_store::gcp::GoogleCloudStorageBuilder;
use std::path::Path;
use std::sync::Arc;

use super::{DatabaseConfig, SyncStats};

/// Bucket storage backend for S3/GCS
pub struct BucketStorage {
    store: Arc<dyn ObjectStore>,
    url: String,
    readonly: bool,
}

impl BucketStorage {
    /// Connect to a bucket storage URL
    pub async fn connect(url: &str) -> Result<Self> {
        let store: Arc<dyn ObjectStore> = if url.starts_with("s3://") {
            // Parse S3 URL: s3://bucket/path
            let path = url.strip_prefix("s3://").unwrap();
            let parts: Vec<&str> = path.splitn(2, '/').collect();
            let bucket = parts[0];

            let s3 = AmazonS3Builder::from_env()
                .with_bucket_name(bucket)
                .build()
                .context("Failed to build S3 client")?;

            Arc::new(s3)
        } else if url.starts_with("gs://") {
            // Parse GCS URL: gs://bucket/path
            let path = url.strip_prefix("gs://").unwrap();
            let parts: Vec<&str> = path.splitn(2, '/').collect();
            let bucket = parts[0];

            let gcs = GoogleCloudStorageBuilder::from_env()
                .with_bucket_name(bucket)
                .build()
                .context("Failed to build GCS client")?;

            Arc::new(gcs)
        } else {
            bail!("Unsupported storage URL. Use s3://bucket/path or gs://bucket/path");
        };

        Ok(Self {
            store,
            url: url.to_string(),
            readonly: false,
        })
    }

    /// Set readonly mode
    pub fn set_readonly(&mut self, readonly: bool) {
        self.readonly = readonly;
    }

    /// Get the base path from URL
    fn base_path(&self) -> String {
        if self.url.starts_with("s3://") {
            let path = self.url.strip_prefix("s3://").unwrap();
            let parts: Vec<&str> = path.splitn(2, '/').collect();
            parts.get(1).unwrap_or(&"").to_string()
        } else if self.url.starts_with("gs://") {
            let path = self.url.strip_prefix("gs://").unwrap();
            let parts: Vec<&str> = path.splitn(2, '/').collect();
            parts.get(1).unwrap_or(&"").to_string()
        } else {
            String::new()
        }
    }

    /// Load database config from bucket
    pub async fn load_config(&self) -> Result<DatabaseConfig> {
        let base = self.base_path();
        let config_path = if base.is_empty() {
            ObjectPath::from(".aresadb/config.toml")
        } else {
            ObjectPath::from(format!("{}/.aresadb/config.toml", base))
        };

        let data = self.store.get(&config_path).await?;
        let bytes = data.bytes().await?;
        let config: DatabaseConfig = toml::from_str(std::str::from_utf8(&bytes)?)?;

        Ok(config)
    }

    /// Save database config to bucket
    pub async fn save_config(&self, config: &DatabaseConfig) -> Result<()> {
        if self.readonly {
            bail!("Cannot write to readonly bucket");
        }

        let base = self.base_path();
        let config_path = if base.is_empty() {
            ObjectPath::from(".aresadb/config.toml")
        } else {
            ObjectPath::from(format!("{}/.aresadb/config.toml", base))
        };

        let config_str = toml::to_string_pretty(config)?;
        self.store.put(&config_path, Bytes::from(config_str)).await?;

        Ok(())
    }

    /// Upload local database to bucket
    pub async fn upload_from_local(&self, local_path: &Path) -> Result<()> {
        if self.readonly {
            bail!("Cannot write to readonly bucket");
        }

        let base = self.base_path();

        // Upload all files in .aresadb directory
        let aresadb_dir = local_path.join(".aresadb");
        for entry in walkdir::WalkDir::new(&aresadb_dir) {
            let entry = entry?;
            if entry.file_type().is_file() {
                let relative = entry.path().strip_prefix(local_path)?;
                let object_path = if base.is_empty() {
                    ObjectPath::from(relative.to_string_lossy().to_string())
                } else {
                    ObjectPath::from(format!("{}/{}", base, relative.to_string_lossy()))
                };

                let data = tokio::fs::read(entry.path()).await?;
                self.store.put(&object_path, Bytes::from(data)).await?;
            }
        }

        Ok(())
    }

    /// Download bucket contents to local path
    pub async fn download_to_local(&self, local_path: &Path) -> Result<()> {
        let base = self.base_path();
        let prefix = if base.is_empty() {
            None
        } else {
            Some(ObjectPath::from(base.clone()))
        };

        // List all objects
        let mut stream = self.store.list(prefix.as_ref());

        while let Some(result) = stream.next().await {
            let meta = result?;
            let object_path = meta.location;

            // Calculate local path
            let relative = if base.is_empty() {
                object_path.to_string()
            } else {
                object_path.to_string().strip_prefix(&format!("{}/", base))
                    .unwrap_or(&object_path.to_string())
                    .to_string()
            };

            let local_file = local_path.join(&relative);

            // Create parent directories
            if let Some(parent) = local_file.parent() {
                tokio::fs::create_dir_all(parent).await?;
            }

            // Download file
            let data = self.store.get(&object_path).await?;
            let bytes = data.bytes().await?;
            tokio::fs::write(&local_file, bytes).await?;
        }

        Ok(())
    }

    /// Bidirectional sync with local path
    pub async fn sync_with_local(&self, local_path: &Path) -> Result<SyncStats> {
        let mut stats = SyncStats::default();
        let base = self.base_path();

        // Get list of remote files with their modification times
        let prefix = if base.is_empty() {
            None
        } else {
            Some(ObjectPath::from(base.clone()))
        };

        let mut remote_files = std::collections::HashMap::new();
        let mut stream = self.store.list(prefix.as_ref());

        while let Some(result) = stream.next().await {
            let meta = result?;
            let path = meta.location.to_string();
            let relative = if base.is_empty() {
                path.clone()
            } else {
                path.strip_prefix(&format!("{}/", base))
                    .unwrap_or(&path)
                    .to_string()
            };
            remote_files.insert(relative, meta.last_modified);
        }

        // Get list of local files
        let aresadb_dir = local_path.join(".aresadb");
        let mut local_files = std::collections::HashMap::new();

        if aresadb_dir.exists() {
            for entry in walkdir::WalkDir::new(&aresadb_dir) {
                let entry = entry?;
                if entry.file_type().is_file() {
                    let relative = entry.path().strip_prefix(local_path)?;
                    let modified = entry.metadata()?.modified()?;
                    local_files.insert(relative.to_string_lossy().to_string(), modified);
                }
            }
        }

        // Upload newer local files
        if !self.readonly {
            for (path, local_time) in &local_files {
                let should_upload = if let Some(remote_time) = remote_files.get(path) {
                    let local_datetime = chrono::DateTime::<chrono::Utc>::from(*local_time);
                    local_datetime > *remote_time
                } else {
                    true
                };

                if should_upload {
                    let local_file = local_path.join(path);
                    let data = tokio::fs::read(&local_file).await?;

                    let object_path = if base.is_empty() {
                        ObjectPath::from(path.clone())
                    } else {
                        ObjectPath::from(format!("{}/{}", base, path))
                    };

                    self.store.put(&object_path, Bytes::from(data)).await?;
                    stats.uploaded += 1;
                }
            }
        }

        // Download newer remote files
        for (path, remote_time) in &remote_files {
            let should_download = if let Some(local_time) = local_files.get(path) {
                let local_datetime = chrono::DateTime::<chrono::Utc>::from(*local_time);
                *remote_time > local_datetime
            } else {
                true
            };

            if should_download {
                let object_path = if base.is_empty() {
                    ObjectPath::from(path.clone())
                } else {
                    ObjectPath::from(format!("{}/{}", base, path))
                };

                let local_file = local_path.join(path);

                // Create parent directories
                if let Some(parent) = local_file.parent() {
                    tokio::fs::create_dir_all(parent).await?;
                }

                let data = self.store.get(&object_path).await?;
                let bytes = data.bytes().await?;
                tokio::fs::write(&local_file, bytes).await?;
                stats.downloaded += 1;
            }
        }

        Ok(stats)
    }

    /// Get a single object from bucket
    pub async fn get(&self, path: &str) -> Result<Bytes> {
        let base = self.base_path();
        let object_path = if base.is_empty() {
            ObjectPath::from(path.to_string())
        } else {
            ObjectPath::from(format!("{}/{}", base, path))
        };

        let data = self.store.get(&object_path).await?;
        let bytes = data.bytes().await?;
        Ok(bytes)
    }

    /// Put a single object to bucket
    pub async fn put(&self, path: &str, data: Bytes) -> Result<()> {
        if self.readonly {
            bail!("Cannot write to readonly bucket");
        }

        let base = self.base_path();
        let object_path = if base.is_empty() {
            ObjectPath::from(path.to_string())
        } else {
            ObjectPath::from(format!("{}/{}", base, path))
        };

        self.store.put(&object_path, data).await?;
        Ok(())
    }

    /// Delete a single object from bucket
    pub async fn delete(&self, path: &str) -> Result<()> {
        if self.readonly {
            bail!("Cannot write to readonly bucket");
        }

        let base = self.base_path();
        let object_path = if base.is_empty() {
            ObjectPath::from(path.to_string())
        } else {
            ObjectPath::from(format!("{}/{}", base, path))
        };

        self.store.delete(&object_path).await?;
        Ok(())
    }

    /// Check if bucket is accessible
    pub async fn check_connection(&self) -> Result<()> {
        let base = self.base_path();
        let prefix = if base.is_empty() {
            None
        } else {
            Some(ObjectPath::from(base))
        };

        // Try to list objects (just get first one to verify access)
        let mut stream = self.store.list(prefix.as_ref());
        let _ = stream.next().await;

        Ok(())
    }
}

// Add walkdir for directory traversal
use walkdir;


