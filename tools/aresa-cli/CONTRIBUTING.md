# Contributing to ARESA CLI

Thank you for your interest in contributing to ARESA CLI! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- **Rust**: 1.70+ (install via [rustup](https://rustup.rs/))
- **Git**: For version control

### Building from Source

```bash
# Clone the repository
git clone https://github.com/yoreai/aresa.git
cd aresa/tools/aresa-cli

# Build in debug mode
cargo build

# Build optimized release
cargo build --release

# Run directly
cargo run -- --help
```

## Project Structure

```
src/
├── main.rs          # CLI entry point, argument parsing
├── lib.rs           # Library exports
├── error.rs         # Error types and validation
├── config/          # Configuration management
│   ├── mod.rs       # ConfigManager
│   ├── credentials.rs # Secure credential storage
│   ├── sources.rs   # Data source definitions
│   └── tests.rs     # Unit tests
├── connectors/      # Data source connectors
│   ├── mod.rs       # Connector trait
│   ├── filesystem.rs # File/git search
│   ├── postgres.rs  # PostgreSQL
│   ├── mysql.rs     # MySQL
│   ├── sqlite.rs    # SQLite
│   ├── duckdb.rs    # DuckDB (CSV/JSON/Parquet)
│   ├── clickhouse.rs # ClickHouse
│   ├── bigquery.rs  # Google BigQuery
│   ├── s3.rs        # AWS S3
│   ├── gcs.rs       # Google Cloud Storage
│   └── tests.rs     # Unit tests
├── nlp/             # Natural language processing
│   ├── mod.rs       # Query parser
│   ├── intent.rs    # Intent classification
│   ├── parser.rs    # LLM-based parsing
│   └── tests.rs     # Unit tests
├── output/          # Terminal output rendering
│   ├── mod.rs       # OutputRenderer
│   ├── table.rs     # Table formatting
│   └── theme.rs     # Color themes
└── query/           # Query execution
    ├── mod.rs       # QueryExecutor
    └── executor.rs  # Execution logic
tests/
└── integration_tests.rs # CLI integration tests
```

## Running Tests

```bash
# Run all tests
cargo test

# Run with output
cargo test -- --nocapture

# Run specific test
cargo test test_name

# Run database tests (requires credentials)
cargo test -- --ignored

# Run only unit tests
cargo test --lib

# Run only integration tests
cargo test --test integration_tests
```

## Code Style

We follow standard Rust conventions:

- **Formatting**: Run `cargo fmt` before committing
- **Linting**: Run `cargo clippy` and fix warnings
- **Documentation**: Add doc comments (`///`) to public items

### Example Doc Comment

```rust
/// Execute a SQL query against the database.
///
/// # Arguments
///
/// * `query` - The SQL query to execute
/// * `limit` - Optional result limit
///
/// # Returns
///
/// A tuple of (column_names, rows) where rows is a Vec of HashMaps.
///
/// # Errors
///
/// Returns an error if the query fails or connection is lost.
pub async fn execute_sql(
    &self,
    query: &str,
    limit: Option<usize>,
) -> Result<(Vec<String>, Vec<HashMap<String, String>>)> {
    // ...
}
```

## Adding a New Connector

1. Create `src/connectors/your_connector.rs`
2. Implement the connector struct with:
   - `new()` constructor with timeout handling
   - `execute_sql()` for queries
   - `list_*()` methods for discovery
3. Add to `src/connectors/mod.rs`
4. Add tests in `src/connectors/tests.rs`
5. Update README.md

### Connector Template

```rust
//! Your Connector description

use anyhow::{Context, Result};
use std::collections::HashMap;
use std::time::Duration;

const DEFAULT_TIMEOUT: u64 = 10;

pub struct YourConnector {
    // fields
}

impl YourConnector {
    pub async fn new(uri: &str) -> Result<Self> {
        Self::with_timeout(uri, DEFAULT_TIMEOUT).await
    }

    pub async fn with_timeout(uri: &str, timeout_secs: u64) -> Result<Self> {
        // Implementation with timeout
    }

    pub async fn execute_sql(
        &self,
        query: &str,
        limit: Option<usize>,
    ) -> Result<(Vec<String>, Vec<HashMap<String, String>>)> {
        // Implementation
    }
}
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run tests: `cargo test`
5. Run formatter: `cargo fmt`
6. Run linter: `cargo clippy`
7. Commit with clear message: `git commit -m "Add: your feature"`
8. Push and create PR

### Commit Message Format

```
Type: Brief description

Longer description if needed.

- Bullet points for multiple changes
- Another change
```

Types: `Add`, `Fix`, `Update`, `Remove`, `Refactor`, `Docs`, `Test`

## Reporting Issues

When reporting bugs, please include:

1. **OS and version** (macOS, Linux, Windows)
2. **Rust version** (`rustc --version`)
3. **Steps to reproduce**
4. **Expected vs actual behavior**
5. **Error messages** (full output)

## Questions?

- Open a GitHub issue for questions
- Check existing issues before creating new ones

Thank you for contributing! 🚀

