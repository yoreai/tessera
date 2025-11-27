# AresaDB

**Unified AI-Native Database Engine** — Key/Value, Graph, and Relational models in one ultra-fast database.

Part of the **Autonomous Research Engineering & Synthesis Architecture** (ARESA).

## Features

- ⚡ **Blazing Fast** — Built in Rust with zero-copy serialization and B+ tree indexes
- 🔮 **Unified Data Model** — Property graph that supports KV, Graph, and Relational views
- 🤖 **AI-Native** — Natural language queries powered by OpenAI/Anthropic
- 🌐 **Hybrid Storage** — Local filesystem + S3/GCS bucket storage
- 🔄 **Auto-Migrations** — AI-assisted schema migrations
- 🎨 **Multiple Views** — View your data as tables, graphs, or key-value pairs

## Installation

### From Source (Rust)

```bash
cd tools/aresadb
cargo install --path .
```

### Pre-built Binaries

Download from [GitHub Releases](https://github.com/yoreai/aresa/releases).

## Quick Start

### 1. Initialize a Database

```bash
# Create a new local database
aresadb init ./mydata --name myapp
```

### 2. Define Schema

```bash
# Create table-like schemas
aresadb schema create users --fields "name:string, email:string:unique, age:int"
aresadb schema create orders --fields "total:float, status:enum(pending,shipped,delivered)"

# Create relationships
aresadb schema link users orders --relation "has_many" --as "orders"
```

### 3. Insert Data

```bash
# Natural language
aresadb "add user John with email john@example.com age 30"

# Or SQL
aresadb query "INSERT INTO users (name, email, age) VALUES ('John', 'john@example.com', 30)"
```

### 4. Query Data

```bash
# Natural language queries
aresadb "find all users with orders over $100"
aresadb "show me the relationship between user 1 and their orders"

# SQL queries
aresadb query "SELECT * FROM users WHERE age > 25"

# Graph queries
aresadb traverse "users/1" --depth 2 --edges "orders,products"
```

### 5. View Data in Different Modes

```bash
# As a relational table
aresadb view users --as table

# As a graph
aresadb view users --as graph

# As key-value pairs
aresadb view users --as kv
```

### 6. Cloud Storage

```bash
# Push to S3
aresadb push s3://mybucket/mydata

# Connect to remote database
aresadb connect s3://mybucket/mydata --readonly

# Sync local and remote
aresadb sync s3://mybucket/mydata
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         aresadb CLI                              │
│   Natural Language → SQL → Graph Query → Results                │
├─────────────────────────────────────────────────────────────────┤
│                      Query Engine                                │
│   ├── NL Parser (OpenAI/Anthropic)                              │
│   ├── SQL Parser (sqlparser-rs)                                 │
│   └── Query Planner & Optimizer                                 │
├─────────────────────────────────────────────────────────────────┤
│                    Schema Manager                                │
│   ├── Schema Registry (types, tables, relationships)           │
│   └── Auto-Migration Engine (AI-assisted)                       │
├─────────────────────────────────────────────────────────────────┤
│                   Unified Storage Engine                         │
│   ├── Node Store (properties, indexes)                          │
│   ├── Edge Store (relationships, graph traversal)              │
│   └── MVCC Transaction Manager                                  │
├─────────────────────────────────────────────────────────────────┤
│                    Storage Backends                              │
│   ├── Local: Memory-mapped files + B+ tree indexes             │
│   └── Bucket: S3/GCS with intelligent chunking & caching       │
└─────────────────────────────────────────────────────────────────┘
```

## Core Data Model

AresaDB uses a **property graph model** as its unified foundation:

```rust
// Everything is a Node with properties
Node {
    id: "user:1",
    type: "user",
    properties: {
        "name": "John",
        "email": "john@example.com",
        "age": 30
    }
}

// Relationships are Edges
Edge {
    from: "user:1",
    to: "order:42",
    type: "purchased",
    properties: {
        "date": "2024-01-15"
    }
}
```

This unified model naturally supports:
- **Key/Value**: `get("user:1")` → Node with properties
- **Graph**: Traverse edges between nodes
- **Relational**: Schema defines table views over nodes

## Commands

| Command | Description |
|---------|-------------|
| `aresadb init <path>` | Initialize a new database |
| `aresadb <query>` | Natural language query |
| `aresadb query <sql>` | Execute SQL query |
| `aresadb schema create` | Create a new schema |
| `aresadb schema link` | Create relationship |
| `aresadb view <table>` | View data in different modes |
| `aresadb traverse <node>` | Graph traversal |
| `aresadb push <url>` | Push to cloud storage |
| `aresadb connect <url>` | Connect to remote database |
| `aresadb repl` | Interactive REPL mode |
| `aresadb status` | Show database status |

## Configuration

Configuration is stored in:
- **Database config**: `<db_path>/.aresadb/config.toml`
- **Global config**: `~/.config/aresadb/config.toml`

### LLM Configuration

```bash
# Set OpenAI API key
aresadb config set llm.provider openai
aresadb config set llm.api_key sk-...

# Or Anthropic
aresadb config set llm.provider anthropic
aresadb config set llm.api_key sk-ant-...
```

## Performance

AresaDB is designed for maximum performance:

- **Zero-copy deserialization** with `rkyv`
- **B+ tree indexes** for O(log n) lookups
- **Lock-free concurrent reads** with MVCC
- **Memory-mapped I/O** for large datasets
- **Intelligent caching** for cloud storage

## Development

```bash
# Build
cargo build --release

# Run tests
cargo test

# Run benchmarks
cargo bench

# Run with debug logging
RUST_LOG=aresadb=debug cargo run -- "your query"
```

## License

MIT License — see [LICENSE](../../LICENSE) for details.

## Author

**Yevheniy Chuba** — [YoreAI](https://yoreai.com)


