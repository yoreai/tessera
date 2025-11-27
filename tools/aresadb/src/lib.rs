//! AresaDB - Unified AI-Native Database Engine
//!
//! A high-performance database that supports Key/Value, Graph, and Relational
//! models with AI-powered natural language queries.
//!
//! # Features
//!
//! - **Unified Data Model**: Property graph that supports KV, Graph, and Relational views
//! - **Blazing Fast**: Zero-copy serialization with rkyv, B+ tree indexes
//! - **AI-Native**: Natural language queries via OpenAI/Anthropic
//! - **Hybrid Storage**: Local filesystem + S3/GCS bucket storage
//! - **Auto-Migrations**: AI-assisted schema migrations
//!
//! # Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────┐
//! │                         aresadb CLI                              │
//! │   Natural Language → SQL → Graph Query → Results                │
//! ├─────────────────────────────────────────────────────────────────┤
//! │                      Query Engine                                │
//! │   ├── NL Parser (OpenAI/Anthropic)                              │
//! │   ├── SQL Parser (sqlparser-rs)                                 │
//! │   └── Query Planner & Optimizer                                 │
//! ├─────────────────────────────────────────────────────────────────┤
//! │                   Unified Storage Engine                         │
//! │   ├── Node Store (properties, indexes)                          │
//! │   ├── Edge Store (relationships, graph traversal)              │
//! │   └── MVCC Transaction Manager                                  │
//! └─────────────────────────────────────────────────────────────────┘
//! ```
//!
//! # Example
//!
//! ```rust,no_run
//! use aresadb::storage::Database;
//! use aresadb::query::QueryEngine;
//!
//! #[tokio::main]
//! async fn main() -> anyhow::Result<()> {
//!     // Open or create database
//!     let db = Database::create("./mydata", "myapp").await?;
//!
//!     // Insert a node
//!     let props = serde_json::json!({
//!         "name": "John",
//!         "email": "john@example.com",
//!         "age": 30
//!     });
//!     let node = db.insert_node("user", props).await?;
//!
//!     // Query with SQL
//!     let engine = QueryEngine::new(db);
//!     let results = engine.execute_sql("SELECT * FROM users WHERE age > 25", None).await?;
//!
//!     Ok(())
//! }
//! ```

pub mod ai;
pub mod cli;
pub mod output;
pub mod query;
pub mod schema;
pub mod storage;

// Re-export commonly used types
pub use storage::{Database, Node, Edge, NodeId, Value};
pub use query::{QueryEngine, QueryResult};
pub use schema::{SchemaManager, Schema};
pub use ai::NlpProcessor;
pub use output::Renderer;

/// Database version
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Database file format version
pub const FORMAT_VERSION: u32 = 1;


