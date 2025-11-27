//! Storage Engine
//!
//! Unified storage layer supporting local filesystem and cloud bucket backends.

mod node;
mod local;
mod bucket;
mod cache;

pub use node::{Node, Edge, NodeId, EdgeId, Value, Timestamp};
pub use local::LocalStorage;
pub use bucket::BucketStorage;
pub use cache::CacheLayer;

use anyhow::{Result, Context};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use parking_lot::RwLock;
use serde::{Deserialize, Serialize};

/// Database configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseConfig {
    pub name: String,
    pub version: u32,
    pub created_at: Timestamp,
    pub bucket_url: Option<String>,
}

/// Database status information
#[derive(Debug, Clone)]
pub struct DatabaseStatus {
    pub name: String,
    pub path: String,
    pub node_count: u64,
    pub edge_count: u64,
    pub schema_count: u64,
    pub size_bytes: u64,
}

/// Sync statistics
#[derive(Debug, Clone, Default)]
pub struct SyncStats {
    pub uploaded: u64,
    pub downloaded: u64,
}

/// Graph representation for visualization
#[derive(Debug, Clone)]
pub struct GraphView {
    pub nodes: Vec<Node>,
    pub edges: Vec<Edge>,
}

/// Key-value representation for visualization
#[derive(Debug, Clone)]
pub struct KvView {
    pub entries: Vec<(String, Value)>,
}

/// Main database handle
pub struct Database {
    /// Path to the database
    path: PathBuf,
    /// Database configuration
    config: Arc<RwLock<DatabaseConfig>>,
    /// Local storage backend
    local: LocalStorage,
    /// Optional bucket storage backend
    bucket: Option<BucketStorage>,
    /// Cache layer for remote storage
    cache: CacheLayer,
}

impl Database {
    /// Create a new database at the given path
    pub async fn create(path: impl AsRef<Path>, name: &str) -> Result<Self> {
        let path = path.as_ref().to_path_buf();

        // Create directory structure
        std::fs::create_dir_all(&path)
            .context("Failed to create database directory")?;
        std::fs::create_dir_all(path.join(".aresadb"))
            .context("Failed to create .aresadb directory")?;

        let config = DatabaseConfig {
            name: name.to_string(),
            version: crate::FORMAT_VERSION,
            created_at: Timestamp::now(),
            bucket_url: None,
        };

        // Write config file
        let config_path = path.join(".aresadb/config.toml");
        let config_str = toml::to_string_pretty(&config)?;
        std::fs::write(&config_path, config_str)?;

        // Initialize local storage
        let local = LocalStorage::create(&path).await?;
        let cache = CacheLayer::new(1024 * 1024 * 100); // 100MB cache

        Ok(Self {
            path,
            config: Arc::new(RwLock::new(config)),
            local,
            bucket: None,
            cache,
        })
    }

    /// Open an existing database
    pub async fn open(path: impl AsRef<Path>) -> Result<Self> {
        let path = path.as_ref().to_path_buf();

        // Load config
        let config_path = path.join(".aresadb/config.toml");
        let config_str = std::fs::read_to_string(&config_path)
            .context("Failed to read database config. Is this an aresadb database?")?;
        let config: DatabaseConfig = toml::from_str(&config_str)?;

        // Open local storage
        let local = LocalStorage::open(&path).await?;
        let cache = CacheLayer::new(1024 * 1024 * 100);

        // Connect to bucket if configured
        let bucket = if let Some(ref url) = config.bucket_url {
            Some(BucketStorage::connect(url).await?)
        } else {
            None
        };

        Ok(Self {
            path,
            config: Arc::new(RwLock::new(config)),
            local,
            bucket,
            cache,
        })
    }

    /// Connect to a remote bucket database
    pub async fn connect_bucket(url: &str, readonly: bool) -> Result<Self> {
        let bucket = BucketStorage::connect(url).await?;
        let config = bucket.load_config().await?;

        // Create temporary local cache
        let temp_path = std::env::temp_dir().join(format!("aresadb-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&temp_path)?;

        let local = LocalStorage::create(&temp_path).await?;
        let cache = CacheLayer::new(1024 * 1024 * 500); // 500MB cache for remote

        Ok(Self {
            path: temp_path,
            config: Arc::new(RwLock::new(config)),
            local,
            bucket: Some(bucket),
            cache,
        })
    }

    /// Get database status
    pub async fn status(&self) -> Result<DatabaseStatus> {
        let config = self.config.read();
        let stats = self.local.stats().await?;

        Ok(DatabaseStatus {
            name: config.name.clone(),
            path: self.path.display().to_string(),
            node_count: stats.node_count,
            edge_count: stats.edge_count,
            schema_count: stats.schema_count,
            size_bytes: stats.size_bytes,
        })
    }

    // ========== Node Operations ==========

    /// Insert a new node
    pub async fn insert_node(&self, node_type: &str, properties: serde_json::Value) -> Result<Node> {
        let props = Value::from_json(properties)?;
        let node = Node::new(node_type, props);
        self.local.insert_node(&node).await?;
        Ok(node)
    }

    /// Get a node by ID
    pub async fn get_node(&self, id: &str) -> Result<Option<Node>> {
        let node_id = NodeId::parse(id)?;
        self.local.get_node(&node_id).await
    }

    /// Update a node's properties
    pub async fn update_node(&self, id: &str, properties: serde_json::Value) -> Result<Node> {
        let node_id = NodeId::parse(id)?;
        let props = Value::from_json(properties)?;
        self.local.update_node(&node_id, props).await
    }

    /// Delete a node and its edges
    pub async fn delete_node(&self, id: &str) -> Result<()> {
        let node_id = NodeId::parse(id)?;
        self.local.delete_node(&node_id).await
    }

    /// Get all nodes of a specific type
    pub async fn get_all_by_type(&self, node_type: &str, limit: Option<usize>) -> Result<Vec<Node>> {
        self.local.get_nodes_by_type(node_type, limit).await
    }

    // ========== Edge Operations ==========

    /// Create an edge between two nodes
    pub async fn create_edge(
        &self,
        from_id: &str,
        to_id: &str,
        edge_type: &str,
        properties: Option<serde_json::Value>,
    ) -> Result<Edge> {
        let from = NodeId::parse(from_id)?;
        let to = NodeId::parse(to_id)?;
        let props = properties
            .map(Value::from_json)
            .transpose()?
            .unwrap_or(Value::Object(Default::default()));

        let edge = Edge::new(from, to, edge_type, props);
        self.local.insert_edge(&edge).await?;
        Ok(edge)
    }

    /// Get edges from a node
    pub async fn get_edges_from(&self, node_id: &str, edge_type: Option<&str>) -> Result<Vec<Edge>> {
        let id = NodeId::parse(node_id)?;
        self.local.get_edges_from(&id, edge_type).await
    }

    /// Get edges to a node
    pub async fn get_edges_to(&self, node_id: &str, edge_type: Option<&str>) -> Result<Vec<Edge>> {
        let id = NodeId::parse(node_id)?;
        self.local.get_edges_to(&id, edge_type).await
    }

    /// Delete an edge
    pub async fn delete_edge(&self, edge_id: &str) -> Result<()> {
        let id = EdgeId::parse(edge_id)?;
        self.local.delete_edge(&id).await
    }

    // ========== View Operations ==========

    /// Get data as a graph view
    pub async fn get_as_graph(&self, node_type: &str, limit: Option<usize>) -> Result<GraphView> {
        let nodes = self.get_all_by_type(node_type, limit).await?;
        let mut edges = Vec::new();

        for node in &nodes {
            let node_edges = self.local.get_edges_from(&node.id, None).await?;
            edges.extend(node_edges);
        }

        Ok(GraphView { nodes, edges })
    }

    /// Get data as key-value pairs
    pub async fn get_as_kv(&self, node_type: &str, limit: Option<usize>) -> Result<KvView> {
        let nodes = self.get_all_by_type(node_type, limit).await?;
        let entries: Vec<(String, Value)> = nodes
            .into_iter()
            .map(|n| (n.id.to_string(), Value::Object(n.properties)))
            .collect();

        Ok(KvView { entries })
    }

    // ========== Cloud Operations ==========

    /// Push database to a cloud bucket
    pub async fn push_to_bucket(&self, url: &str) -> Result<()> {
        let bucket = BucketStorage::connect(url).await?;

        // Save config
        let config = self.config.read().clone();
        bucket.save_config(&config).await?;

        // Upload data files
        bucket.upload_from_local(&self.path).await?;

        // Update local config with bucket URL
        drop(config);
        self.config.write().bucket_url = Some(url.to_string());
        self.save_config()?;

        Ok(())
    }

    /// Sync local database with remote bucket
    pub async fn sync_with_bucket(&self, url: &str) -> Result<SyncStats> {
        let bucket = BucketStorage::connect(url).await?;

        // Bidirectional sync
        let stats = bucket.sync_with_local(&self.path).await?;

        Ok(stats)
    }

    /// Save config to disk
    fn save_config(&self) -> Result<()> {
        let config = self.config.read();
        let config_str = toml::to_string_pretty(&*config)?;
        std::fs::write(self.path.join(".aresadb/config.toml"), config_str)?;
        Ok(())
    }

    /// Get the local storage handle
    pub fn local(&self) -> &LocalStorage {
        &self.local
    }

    /// Get database path
    pub fn path(&self) -> &Path {
        &self.path
    }

    /// Get database name
    pub fn name(&self) -> String {
        self.config.read().name.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_create_database() {
        let temp = TempDir::new().unwrap();
        let db = Database::create(temp.path(), "testdb").await.unwrap();
        assert_eq!(db.name(), "testdb");
    }

    #[tokio::test]
    async fn test_insert_and_get_node() {
        let temp = TempDir::new().unwrap();
        let db = Database::create(temp.path(), "testdb").await.unwrap();

        let props = serde_json::json!({
            "name": "John",
            "age": 30
        });
        let node = db.insert_node("user", props).await.unwrap();

        let retrieved = db.get_node(&node.id.to_string()).await.unwrap();
        assert!(retrieved.is_some());
        let retrieved = retrieved.unwrap();
        assert_eq!(retrieved.node_type, "user");
    }
}


