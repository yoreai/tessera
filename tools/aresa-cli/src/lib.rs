//! ARESA CLI - Natural Language Data Search
//!
//! A high-performance CLI tool for searching filesystems, databases,
//! and cloud storage using natural language queries.
//!
//! # Features
//!
//! - **Natural Language Interface**: Ask questions in plain English
//! - **Universal Search**: Files, PostgreSQL, BigQuery, S3, GCS, SQLite
//! - **Beautiful Output**: Rich terminal formatting with tables and colors
//! - **Secure**: Credentials stored in OS keychain
//! - **Fast**: Built in Rust with async I/O
//!
//! # Example
//!
//! ```bash
//! # Search files
//! aresa "find python files with TODO comments in ~/dev"
//!
//! # Query database
//! aresa "show me users who signed up last week"
//!
//! # Configure sources
//! aresa config add postgres prod --uri postgresql://...
//! ```

pub mod config;
pub mod connectors;
pub mod error;
pub mod nlp;
pub mod output;
pub mod query;

pub use config::ConfigManager;
pub use nlp::QueryParser;
pub use output::OutputRenderer;
pub use query::QueryExecutor;


