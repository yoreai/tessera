//! Local filesystem storage backend using redb
//!
//! Provides ACID-compliant persistent storage with B+ tree indexes.

use anyhow::{Result, Context};
use parking_lot::RwLock;
use redb::{Database as RedbDatabase, TableDefinition, ReadableTable, ReadableMultimapTable, MultimapTableDefinition};
use std::path::{Path, PathBuf};
use std::sync::Arc;

use super::node::{Node, Edge, NodeId, EdgeId, Value, Timestamp};

// Table definitions for redb
const NODES_TABLE: TableDefinition<&[u8], &[u8]> = TableDefinition::new("nodes");
const EDGES_TABLE: TableDefinition<&[u8], &[u8]> = TableDefinition::new("edges");
const NODE_TYPE_INDEX: MultimapTableDefinition<&str, &[u8]> = MultimapTableDefinition::new("node_type_index");
const EDGE_FROM_INDEX: MultimapTableDefinition<&[u8], &[u8]> = MultimapTableDefinition::new("edge_from_index");
const EDGE_TO_INDEX: MultimapTableDefinition<&[u8], &[u8]> = MultimapTableDefinition::new("edge_to_index");
const EDGE_TYPE_INDEX: MultimapTableDefinition<&str, &[u8]> = MultimapTableDefinition::new("edge_type_index");
const METADATA_TABLE: TableDefinition<&str, &[u8]> = TableDefinition::new("metadata");

/// Storage statistics
#[derive(Debug, Clone, Default)]
pub struct StorageStats {
    pub node_count: u64,
    pub edge_count: u64,
    pub schema_count: u64,
    pub size_bytes: u64,
}

/// Local storage backend using redb
pub struct LocalStorage {
    /// Path to the database directory
    path: PathBuf,
    /// redb database handle
    db: Arc<RwLock<RedbDatabase>>,
}

impl LocalStorage {
    /// Create a new local storage at the given path
    pub async fn create(path: impl AsRef<Path>) -> Result<Self> {
        let path = path.as_ref().to_path_buf();
        let db_path = path.join(".aresadb/data.redb");

        // Ensure parent directory exists
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)?;
        }

        let db = RedbDatabase::create(&db_path)
            .context("Failed to create redb database")?;

        // Initialize tables
        {
            let write_txn = db.begin_write()?;
            {
                let _ = write_txn.open_table(NODES_TABLE)?;
                let _ = write_txn.open_table(EDGES_TABLE)?;
                let _ = write_txn.open_multimap_table(NODE_TYPE_INDEX)?;
                let _ = write_txn.open_multimap_table(EDGE_FROM_INDEX)?;
                let _ = write_txn.open_multimap_table(EDGE_TO_INDEX)?;
                let _ = write_txn.open_multimap_table(EDGE_TYPE_INDEX)?;
                let _ = write_txn.open_table(METADATA_TABLE)?;
            }
            write_txn.commit()?;
        }

        // Initialize metadata
        {
            let write_txn = db.begin_write()?;
            {
                let mut meta_table = write_txn.open_table(METADATA_TABLE)?;
                let now = Timestamp::now();
                let created_bytes = serde_json::to_vec(&now)?;
                meta_table.insert("created_at", created_bytes.as_slice())?;

                let version_bytes = serde_json::to_vec(&crate::FORMAT_VERSION)?;
                meta_table.insert("version", version_bytes.as_slice())?;
            }
            write_txn.commit()?;
        }

        Ok(Self {
            path,
            db: Arc::new(RwLock::new(db)),
        })
    }

    /// Open an existing local storage
    pub async fn open(path: impl AsRef<Path>) -> Result<Self> {
        let path = path.as_ref().to_path_buf();
        let db_path = path.join(".aresadb/data.redb");

        let db = RedbDatabase::open(&db_path)
            .context("Failed to open redb database")?;

        Ok(Self {
            path,
            db: Arc::new(RwLock::new(db)),
        })
    }

    /// Get storage statistics
    pub async fn stats(&self) -> Result<StorageStats> {
        let db = self.db.read();
        let read_txn = db.begin_read()?;

        let nodes_table = read_txn.open_table(NODES_TABLE)?;
        let edges_table = read_txn.open_table(EDGES_TABLE)?;

        // Count nodes and edges
        let node_count = nodes_table.len()?;
        let edge_count = edges_table.len()?;

        // Get file size
        let db_path = self.path.join(".aresadb/data.redb");
        let size_bytes = std::fs::metadata(&db_path)
            .map(|m| m.len())
            .unwrap_or(0);

        Ok(StorageStats {
            node_count,
            edge_count,
            schema_count: 0, // Will be implemented with schema registry
            size_bytes,
        })
    }

    // ========== Node Operations ==========

    /// Insert a new node
    pub async fn insert_node(&self, node: &Node) -> Result<()> {
        let db = self.db.write();
        let write_txn = db.begin_write()?;

        {
            // Serialize node
            let node_bytes = serde_json::to_vec(node)?;
            let id_bytes = node.id.uuid;

            // Insert into nodes table
            let mut nodes_table = write_txn.open_table(NODES_TABLE)?;
            nodes_table.insert(id_bytes.as_slice(), node_bytes.as_slice())?;

            // Update type index
            let mut type_index = write_txn.open_multimap_table(NODE_TYPE_INDEX)?;
            type_index.insert(node.node_type.as_str(), id_bytes.as_slice())?;
        }

        write_txn.commit()?;
        Ok(())
    }

    /// Get a node by ID
    pub async fn get_node(&self, id: &NodeId) -> Result<Option<Node>> {
        let db = self.db.read();
        let read_txn = db.begin_read()?;

        let nodes_table = read_txn.open_table(NODES_TABLE)?;

        if let Some(data) = nodes_table.get(id.uuid.as_slice())? {
            let node: Node = serde_json::from_slice(data.value())?;
            Ok(Some(node))
        } else {
            Ok(None)
        }
    }

    /// Update a node's properties
    pub async fn update_node(&self, id: &NodeId, properties: Value) -> Result<Node> {
        let db = self.db.write();
        let write_txn = db.begin_write()?;

        let node = {
            let mut nodes_table = write_txn.open_table(NODES_TABLE)?;

            // Get existing node
            let data = nodes_table.get(id.uuid.as_slice())?
                .ok_or_else(|| anyhow::anyhow!("Node not found: {}", id))?;

            let mut node: Node = serde_json::from_slice(data.value())?;

            // Update properties
            if let Value::Object(new_props) = properties {
                for (k, v) in new_props {
                    node.properties.insert(k, v);
                }
            }
            node.updated_at = Timestamp::now();

            // Save updated node
            let node_bytes = serde_json::to_vec(&node)?;
            nodes_table.insert(id.uuid.as_slice(), node_bytes.as_slice())?;

            node
        };

        write_txn.commit()?;
        Ok(node)
    }

    /// Delete a node and its edges
    pub async fn delete_node(&self, id: &NodeId) -> Result<()> {
        let db = self.db.write();
        let write_txn = db.begin_write()?;

        {
            // Get node to find its type
            let nodes_table = write_txn.open_table(NODES_TABLE)?;
            if let Some(data) = nodes_table.get(id.uuid.as_slice())? {
                let node: Node = serde_json::from_slice(data.value())?;

                // Remove from type index
                let mut type_index = write_txn.open_multimap_table(NODE_TYPE_INDEX)?;
                type_index.remove(node.node_type.as_str(), id.uuid.as_slice())?;
            }
            drop(nodes_table);

            // Remove node
            let mut nodes_table = write_txn.open_table(NODES_TABLE)?;
            nodes_table.remove(id.uuid.as_slice())?;

            // Remove edges from this node
            let edge_from_index = write_txn.open_multimap_table(EDGE_FROM_INDEX)?;
            let edge_ids: Vec<Vec<u8>> = edge_from_index
                .get(id.uuid.as_slice())?
                .map(|r| r.map(|v| v.value().to_vec()))
                .collect::<std::result::Result<Vec<_>, _>>()?;
            drop(edge_from_index);

            let mut edges_table = write_txn.open_table(EDGES_TABLE)?;
            let mut edge_from = write_txn.open_multimap_table(EDGE_FROM_INDEX)?;
            let mut edge_to = write_txn.open_multimap_table(EDGE_TO_INDEX)?;

            for edge_id in edge_ids {
                edges_table.remove(edge_id.as_slice())?;
                edge_from.remove(id.uuid.as_slice(), edge_id.as_slice())?;
            }

            // Remove edges to this node
            drop(edges_table);
            drop(edge_from);
            drop(edge_to);

            let edge_to_index = write_txn.open_multimap_table(EDGE_TO_INDEX)?;
            let edge_ids: Vec<Vec<u8>> = edge_to_index
                .get(id.uuid.as_slice())?
                .map(|r| r.map(|v| v.value().to_vec()))
                .collect::<std::result::Result<Vec<_>, _>>()?;
            drop(edge_to_index);

            let mut edges_table = write_txn.open_table(EDGES_TABLE)?;
            let mut edge_to = write_txn.open_multimap_table(EDGE_TO_INDEX)?;

            for edge_id in edge_ids {
                edges_table.remove(edge_id.as_slice())?;
                edge_to.remove(id.uuid.as_slice(), edge_id.as_slice())?;
            }
        }

        write_txn.commit()?;
        Ok(())
    }

    /// Get all nodes of a specific type
    pub async fn get_nodes_by_type(&self, node_type: &str, limit: Option<usize>) -> Result<Vec<Node>> {
        let db = self.db.read();
        let read_txn = db.begin_read()?;

        let type_index = read_txn.open_multimap_table(NODE_TYPE_INDEX)?;
        let nodes_table = read_txn.open_table(NODES_TABLE)?;

        let mut nodes = Vec::new();
        let max_count = limit.unwrap_or(usize::MAX);

        for result in type_index.get(node_type)? {
            if nodes.len() >= max_count {
                break;
            }

            let id_bytes = result?.value();
            if let Some(data) = nodes_table.get(id_bytes)? {
                let node: Node = serde_json::from_slice(data.value())?;
                nodes.push(node);
            }
        }

        Ok(nodes)
    }

    /// Get all nodes (with optional limit)
    pub async fn get_all_nodes(&self, limit: Option<usize>) -> Result<Vec<Node>> {
        let db = self.db.read();
        let read_txn = db.begin_read()?;

        let nodes_table = read_txn.open_table(NODES_TABLE)?;

        let mut nodes = Vec::new();
        let max_count = limit.unwrap_or(usize::MAX);

        for result in nodes_table.iter()? {
            if nodes.len() >= max_count {
                break;
            }

            let (_, data) = result?;
            let node: Node = serde_json::from_slice(data.value())?;
            nodes.push(node);
        }

        Ok(nodes)
    }

    // ========== Edge Operations ==========

    /// Insert a new edge
    pub async fn insert_edge(&self, edge: &Edge) -> Result<()> {
        let db = self.db.write();
        let write_txn = db.begin_write()?;

        {
            // Serialize edge
            let edge_bytes = serde_json::to_vec(edge)?;
            let id_bytes = edge.id.uuid;

            // Insert into edges table
            let mut edges_table = write_txn.open_table(EDGES_TABLE)?;
            edges_table.insert(id_bytes.as_slice(), edge_bytes.as_slice())?;

            // Update from index
            let mut from_index = write_txn.open_multimap_table(EDGE_FROM_INDEX)?;
            from_index.insert(edge.from.uuid.as_slice(), id_bytes.as_slice())?;

            // Update to index
            let mut to_index = write_txn.open_multimap_table(EDGE_TO_INDEX)?;
            to_index.insert(edge.to.uuid.as_slice(), id_bytes.as_slice())?;

            // Update type index
            let mut type_index = write_txn.open_multimap_table(EDGE_TYPE_INDEX)?;
            type_index.insert(edge.edge_type.as_str(), id_bytes.as_slice())?;
        }

        write_txn.commit()?;
        Ok(())
    }

    /// Get an edge by ID
    pub async fn get_edge(&self, id: &EdgeId) -> Result<Option<Edge>> {
        let db = self.db.read();
        let read_txn = db.begin_read()?;

        let edges_table = read_txn.open_table(EDGES_TABLE)?;

        if let Some(data) = edges_table.get(id.uuid.as_slice())? {
            let edge: Edge = serde_json::from_slice(data.value())?;
            Ok(Some(edge))
        } else {
            Ok(None)
        }
    }

    /// Get edges from a node
    pub async fn get_edges_from(&self, node_id: &NodeId, edge_type: Option<&str>) -> Result<Vec<Edge>> {
        let db = self.db.read();
        let read_txn = db.begin_read()?;

        let from_index = read_txn.open_multimap_table(EDGE_FROM_INDEX)?;
        let edges_table = read_txn.open_table(EDGES_TABLE)?;

        let mut edges = Vec::new();

        for result in from_index.get(node_id.uuid.as_slice())? {
            let edge_id = result?.value();
            if let Some(data) = edges_table.get(edge_id)? {
                let edge: Edge = serde_json::from_slice(data.value())?;

                // Filter by edge type if specified
                if let Some(et) = edge_type {
                    if edge.edge_type != et {
                        continue;
                    }
                }

                edges.push(edge);
            }
        }

        Ok(edges)
    }

    /// Get edges to a node
    pub async fn get_edges_to(&self, node_id: &NodeId, edge_type: Option<&str>) -> Result<Vec<Edge>> {
        let db = self.db.read();
        let read_txn = db.begin_read()?;

        let to_index = read_txn.open_multimap_table(EDGE_TO_INDEX)?;
        let edges_table = read_txn.open_table(EDGES_TABLE)?;

        let mut edges = Vec::new();

        for result in to_index.get(node_id.uuid.as_slice())? {
            let edge_id = result?.value();
            if let Some(data) = edges_table.get(edge_id)? {
                let edge: Edge = serde_json::from_slice(data.value())?;

                // Filter by edge type if specified
                if let Some(et) = edge_type {
                    if edge.edge_type != et {
                        continue;
                    }
                }

                edges.push(edge);
            }
        }

        Ok(edges)
    }

    /// Delete an edge
    pub async fn delete_edge(&self, id: &EdgeId) -> Result<()> {
        let db = self.db.write();
        let write_txn = db.begin_write()?;

        {
            // Get edge to find its from/to nodes
            let edges_table = write_txn.open_table(EDGES_TABLE)?;
            if let Some(data) = edges_table.get(id.uuid.as_slice())? {
                let edge: Edge = serde_json::from_slice(data.value())?;

                // Remove from indexes
                let mut from_index = write_txn.open_multimap_table(EDGE_FROM_INDEX)?;
                from_index.remove(edge.from.uuid.as_slice(), id.uuid.as_slice())?;

                let mut to_index = write_txn.open_multimap_table(EDGE_TO_INDEX)?;
                to_index.remove(edge.to.uuid.as_slice(), id.uuid.as_slice())?;

                let mut type_index = write_txn.open_multimap_table(EDGE_TYPE_INDEX)?;
                type_index.remove(edge.edge_type.as_str(), id.uuid.as_slice())?;
            }
            drop(edges_table);

            // Remove edge
            let mut edges_table = write_txn.open_table(EDGES_TABLE)?;
            edges_table.remove(id.uuid.as_slice())?;
        }

        write_txn.commit()?;
        Ok(())
    }

    /// Get all edges of a specific type
    pub async fn get_edges_by_type(&self, edge_type: &str, limit: Option<usize>) -> Result<Vec<Edge>> {
        let db = self.db.read();
        let read_txn = db.begin_read()?;

        let type_index = read_txn.open_multimap_table(EDGE_TYPE_INDEX)?;
        let edges_table = read_txn.open_table(EDGES_TABLE)?;

        let mut edges = Vec::new();
        let max_count = limit.unwrap_or(usize::MAX);

        for result in type_index.get(edge_type)? {
            if edges.len() >= max_count {
                break;
            }

            let id_bytes = result?.value();
            if let Some(data) = edges_table.get(id_bytes)? {
                let edge: Edge = serde_json::from_slice(data.value())?;
                edges.push(edge);
            }
        }

        Ok(edges)
    }

    // ========== Transaction Support ==========

    /// Begin a transaction
    pub fn begin_transaction(&self) -> Result<Transaction> {
        Transaction::new(self.db.clone())
    }

    /// Get database path
    pub fn path(&self) -> &Path {
        &self.path
    }
}

/// A database transaction for atomic operations
pub struct Transaction {
    db: Arc<RwLock<RedbDatabase>>,
    operations: Vec<TransactionOp>,
}

#[derive(Debug)]
enum TransactionOp {
    InsertNode(Node),
    UpdateNode(NodeId, Value),
    DeleteNode(NodeId),
    InsertEdge(Edge),
    DeleteEdge(EdgeId),
}

impl Transaction {
    fn new(db: Arc<RwLock<RedbDatabase>>) -> Result<Self> {
        Ok(Self {
            db,
            operations: Vec::new(),
        })
    }

    /// Insert a node in this transaction
    pub fn insert_node(&mut self, node: Node) {
        self.operations.push(TransactionOp::InsertNode(node));
    }

    /// Update a node in this transaction
    pub fn update_node(&mut self, id: NodeId, properties: Value) {
        self.operations.push(TransactionOp::UpdateNode(id, properties));
    }

    /// Delete a node in this transaction
    pub fn delete_node(&mut self, id: NodeId) {
        self.operations.push(TransactionOp::DeleteNode(id));
    }

    /// Insert an edge in this transaction
    pub fn insert_edge(&mut self, edge: Edge) {
        self.operations.push(TransactionOp::InsertEdge(edge));
    }

    /// Delete an edge in this transaction
    pub fn delete_edge(&mut self, id: EdgeId) {
        self.operations.push(TransactionOp::DeleteEdge(id));
    }

    /// Commit the transaction
    pub fn commit(self) -> Result<()> {
        let db = self.db.write();
        let write_txn = db.begin_write()?;

        for op in self.operations {
            match op {
                TransactionOp::InsertNode(node) => {
                    let node_bytes = serde_json::to_vec(&node)?;
                    let mut nodes_table = write_txn.open_table(NODES_TABLE)?;
                    nodes_table.insert(node.id.uuid.as_slice(), node_bytes.as_slice())?;

                    let mut type_index = write_txn.open_multimap_table(NODE_TYPE_INDEX)?;
                    type_index.insert(node.node_type.as_str(), node.id.uuid.as_slice())?;
                }
                TransactionOp::UpdateNode(id, properties) => {
                    let mut nodes_table = write_txn.open_table(NODES_TABLE)?;
                    if let Some(data) = nodes_table.get(id.uuid.as_slice())? {
                        let mut node: Node = serde_json::from_slice(data.value())?;
                        if let Value::Object(new_props) = properties {
                            for (k, v) in new_props {
                                node.properties.insert(k, v);
                            }
                        }
                        node.updated_at = Timestamp::now();
                        let node_bytes = serde_json::to_vec(&node)?;
                        nodes_table.insert(id.uuid.as_slice(), node_bytes.as_slice())?;
                    }
                }
                TransactionOp::DeleteNode(id) => {
                    let mut nodes_table = write_txn.open_table(NODES_TABLE)?;
                    nodes_table.remove(id.uuid.as_slice())?;
                }
                TransactionOp::InsertEdge(edge) => {
                    let edge_bytes = serde_json::to_vec(&edge)?;
                    let mut edges_table = write_txn.open_table(EDGES_TABLE)?;
                    edges_table.insert(edge.id.uuid.as_slice(), edge_bytes.as_slice())?;

                    let mut from_index = write_txn.open_multimap_table(EDGE_FROM_INDEX)?;
                    from_index.insert(edge.from.uuid.as_slice(), edge.id.uuid.as_slice())?;

                    let mut to_index = write_txn.open_multimap_table(EDGE_TO_INDEX)?;
                    to_index.insert(edge.to.uuid.as_slice(), edge.id.uuid.as_slice())?;
                }
                TransactionOp::DeleteEdge(id) => {
                    let mut edges_table = write_txn.open_table(EDGES_TABLE)?;
                    edges_table.remove(id.uuid.as_slice())?;
                }
            }
        }

        write_txn.commit()?;
        Ok(())
    }

    /// Rollback the transaction (simply drop it)
    pub fn rollback(self) {
        // Operations are discarded when transaction is dropped
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_create_and_open() {
        let temp = TempDir::new().unwrap();

        // Create database
        let storage = LocalStorage::create(temp.path()).await.unwrap();
        drop(storage);

        // Reopen database
        let storage = LocalStorage::open(temp.path()).await.unwrap();
        let stats = storage.stats().await.unwrap();
        assert_eq!(stats.node_count, 0);
    }

    #[tokio::test]
    async fn test_node_crud() {
        let temp = TempDir::new().unwrap();
        let storage = LocalStorage::create(temp.path()).await.unwrap();

        // Insert
        let props = Value::from_json(serde_json::json!({"name": "Alice", "age": 25})).unwrap();
        let node = Node::new("user", props);
        let node_id = node.id.clone();
        storage.insert_node(&node).await.unwrap();

        // Read
        let retrieved = storage.get_node(&node_id).await.unwrap().unwrap();
        assert_eq!(retrieved.node_type, "user");
        assert_eq!(retrieved.get("name").unwrap().as_str(), Some("Alice"));

        // Update
        let new_props = Value::from_json(serde_json::json!({"age": 26})).unwrap();
        let updated = storage.update_node(&node_id, new_props).await.unwrap();
        assert_eq!(updated.get("age").unwrap().as_int(), Some(26));

        // Delete
        storage.delete_node(&node_id).await.unwrap();
        let deleted = storage.get_node(&node_id).await.unwrap();
        assert!(deleted.is_none());
    }

    #[tokio::test]
    async fn test_edge_crud() {
        let temp = TempDir::new().unwrap();
        let storage = LocalStorage::create(temp.path()).await.unwrap();

        // Create nodes
        let node1 = Node::new("user", Value::from_json(serde_json::json!({"name": "Alice"})).unwrap());
        let node2 = Node::new("user", Value::from_json(serde_json::json!({"name": "Bob"})).unwrap());
        storage.insert_node(&node1).await.unwrap();
        storage.insert_node(&node2).await.unwrap();

        // Create edge
        let edge = Edge::new(node1.id.clone(), node2.id.clone(), "follows", Value::Null);
        let edge_id = edge.id.clone();
        storage.insert_edge(&edge).await.unwrap();

        // Get edges from node1
        let edges = storage.get_edges_from(&node1.id, None).await.unwrap();
        assert_eq!(edges.len(), 1);
        assert_eq!(edges[0].edge_type, "follows");

        // Get edges to node2
        let edges = storage.get_edges_to(&node2.id, None).await.unwrap();
        assert_eq!(edges.len(), 1);

        // Delete edge
        storage.delete_edge(&edge_id).await.unwrap();
        let edges = storage.get_edges_from(&node1.id, None).await.unwrap();
        assert_eq!(edges.len(), 0);
    }

    #[tokio::test]
    async fn test_transaction() {
        let temp = TempDir::new().unwrap();
        let storage = LocalStorage::create(temp.path()).await.unwrap();

        // Create multiple nodes in a transaction
        let mut txn = storage.begin_transaction().unwrap();

        let node1 = Node::new("user", Value::from_json(serde_json::json!({"name": "Alice"})).unwrap());
        let node2 = Node::new("user", Value::from_json(serde_json::json!({"name": "Bob"})).unwrap());

        txn.insert_node(node1.clone());
        txn.insert_node(node2.clone());

        txn.commit().unwrap();

        // Verify nodes were created
        let nodes = storage.get_nodes_by_type("user", None).await.unwrap();
        assert_eq!(nodes.len(), 2);
    }
}


