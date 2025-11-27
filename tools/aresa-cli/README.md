# ARESA CLI

**Natural Language Data Search** — Search filesystems, databases, and cloud storage using plain English.

Part of the **Autonomous Research Engineering & Synthesis Architecture** (ARESA).

## Features

- 🔍 **Natural Language Interface** — Ask questions in plain English
- ⚡ **Blazing Fast** — Built in Rust with async I/O
- 🎨 **Beautiful Output** — Rich terminal formatting with tables and colors
- 🔒 **Secure** — Credentials stored in OS keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service)
- 🌐 **Universal Search** — Files, PostgreSQL, MySQL, ClickHouse, BigQuery, SQLite/DuckDB, S3, GCS

## Installation

### From Source (Rust)

```bash
cargo install --path .
```

### Homebrew (macOS/Linux)

```bash
brew install yoreai/tap/aresa-cli
```

### Pre-built Binaries

Download from [GitHub Releases](https://github.com/yoreai/aresa/releases).

## Quick Start

### 1. Configure LLM Provider

```bash
# OpenAI
aresa config set-llm openai --api-key sk-...

# Or Anthropic
aresa config set-llm anthropic --api-key sk-ant-...
```

### 2. Add Data Sources

```bash
# PostgreSQL
aresa config add postgres production --uri "postgresql://user:pass@host:5432/db"

# SQLite
aresa config add sqlite local --uri "./data/app.db"

# BigQuery
aresa config add bigquery analytics --project my-project --credentials ~/key.json

# S3
aresa config add s3 data-lake --bucket my-bucket
```

### 3. Start Searching!

```bash
# Natural language queries
aresa "find all users who signed up last week"
aresa "show me the 10 largest tables in production"
aresa "search for TODO comments in python files"

# Direct commands
aresa files "*.py" --path ~/dev --content
aresa query production "SELECT * FROM users LIMIT 10"
```

## Usage Examples

### File Search

```bash
# Find files by name
aresa "find python files in ~/dev"
aresa files "*.rs" --path ./src

# Search file contents
aresa "search for 'TODO' in all source files"
aresa files "error" --path ./logs --content

# Find git repositories
aresa "show me git repos with uncommitted changes"
```

### Database Queries

```bash
# Natural language to SQL
aresa "show me users who signed up in the last 7 days"
aresa "count orders by status"
aresa "find products with price over 100"

# Direct SQL
aresa query mydb "SELECT * FROM users WHERE created_at > NOW() - INTERVAL '7 days'"
```

### Cloud Storage

```bash
# S3/GCS search
aresa "find large files in my S3 bucket"
aresa "list objects modified today in GCS"
```

## Commands

| Command | Description |
|---------|-------------|
| `aresa <query>` | Natural language query |
| `aresa files <pattern>` | Search files |
| `aresa query <source> <sql>` | Execute SQL query |
| `aresa config add` | Add data source |
| `aresa config list` | List data sources |
| `aresa config test <name>` | Test connection |
| `aresa sources` | List all sources |
| `aresa status` | Check all connections |

## Output Formats

```bash
# Table (default)
aresa "show users" --format table

# JSON
aresa "show users" --format json

# CSV
aresa "show users" --format csv

# Tree (for files)
aresa files "*.py" --format tree
```

## Configuration

Configuration is stored in:
- **macOS/Linux**: `~/.config/aresa/config.toml`
- **Windows**: `%APPDATA%\yoreai\aresa\config.toml`

Sensitive credentials (database URIs, API keys) are stored securely in the OS keychain.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      aresa-cli                              │
├─────────────────────────────────────────────────────────────┤
│  Natural Language Parser (OpenAI/Anthropic)                 │
│  "find users with X" → structured query                     │
├─────────────────────────────────────────────────────────────┤
│  Query Planner / Router                                     │
│  Detects: filesystem, postgres, bigquery, s3, gcs, etc.    │
├─────────────────────────────────────────────────────────────┤
│  Connectors (async, parallel)                               │
│  ├── Filesystem (ripgrep-style)                            │
│  ├── PostgreSQL / MySQL                                    │
│  ├── ClickHouse (HTTP)                                     │
│  ├── BigQuery                                              │
│  ├── SQLite/DuckDB                                         │
│  └── S3/GCS                                                │
├─────────────────────────────────────────────────────────────┤
│  Beautiful Output (tables, trees, JSON, streaming)         │
└─────────────────────────────────────────────────────────────┘
```

## Development

```bash
# Build
cargo build --release

# Run tests
cargo test

# Run with debug logging
RUST_LOG=aresa=debug cargo run -- "your query"
```

## License

MIT License — see [LICENSE](../../LICENSE) for details.

## Author

**Yevheniy Chuba** — [YoreAI](https://yoreai.com)


