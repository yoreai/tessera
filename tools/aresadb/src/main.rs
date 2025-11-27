//! AresaDB CLI Entry Point
//!
//! Unified AI-native database engine with natural language queries.

use anyhow::Result;
use clap::{Parser, Subcommand};
use colored::Colorize;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod ai;
mod cli;
mod output;
mod query;
mod schema;
mod storage;

use cli::commands::{handle_command, OutputFormat};
use cli::repl::Repl;

/// AresaDB - Unified AI-Native Database Engine
///
/// A blazing-fast database that supports Key/Value, Graph, and Relational
/// models with AI-powered natural language queries.
#[derive(Parser)]
#[command(name = "aresadb")]
#[command(author = "Yevheniy Chuba <yevheniyc@gmail.com>")]
#[command(version)]
#[command(about = "Unified AI-native database - KV, Graph, and Relational in one", long_about = None)]
#[command(propagate_version = true)]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,

    /// Natural language query (if no subcommand provided)
    #[arg(trailing_var_arg = true)]
    query: Vec<String>,

    /// Database path (defaults to current directory)
    #[arg(short, long, global = true)]
    database: Option<String>,

    /// Output format
    #[arg(short, long, default_value = "table", global = true)]
    format: OutputFormat,

    /// Enable verbose output
    #[arg(short, long, global = true)]
    verbose: bool,

    /// Limit number of results
    #[arg(short, long, global = true)]
    limit: Option<usize>,
}

#[derive(Subcommand)]
enum Commands {
    /// Initialize a new database
    Init {
        /// Path to create the database
        path: String,
        /// Database name
        #[arg(short, long)]
        name: Option<String>,
    },

    /// Start interactive REPL mode
    Repl,

    /// Execute a SQL query
    Query {
        /// SQL query string
        sql: String,
    },

    /// Schema management commands
    Schema {
        #[command(subcommand)]
        action: SchemaAction,
    },

    /// View data in different modes
    View {
        /// Table/schema name to view
        name: String,
        /// View mode: table, graph, or kv
        #[arg(long, default_value = "table")]
        r#as: ViewMode,
        /// Number of rows to show
        #[arg(short, long)]
        limit: Option<usize>,
    },

    /// Graph traversal from a node
    Traverse {
        /// Starting node (e.g., "users/1")
        node: String,
        /// Maximum traversal depth
        #[arg(short, long, default_value = "2")]
        depth: u32,
        /// Edge types to follow (comma-separated)
        #[arg(short, long)]
        edges: Option<String>,
    },

    /// Push database to cloud storage
    Push {
        /// Cloud storage URL (s3://... or gs://...)
        url: String,
    },

    /// Connect to a remote database
    Connect {
        /// Cloud storage URL
        url: String,
        /// Open in read-only mode
        #[arg(long)]
        readonly: bool,
    },

    /// Sync local database with remote
    Sync {
        /// Cloud storage URL
        url: String,
    },

    /// Configuration commands
    Config {
        #[command(subcommand)]
        action: ConfigAction,
    },

    /// Show database status
    Status,

    /// Insert a node
    Insert {
        /// Node type (table name)
        node_type: String,
        /// Properties as JSON
        #[arg(short, long)]
        props: String,
    },

    /// Get a node by ID
    Get {
        /// Node ID
        id: String,
    },

    /// Delete a node
    Delete {
        /// Node ID
        id: String,
    },
}

#[derive(Subcommand)]
enum SchemaAction {
    /// Create a new schema/table
    Create {
        /// Schema name
        name: String,
        /// Field definitions (e.g., "name:string, age:int")
        #[arg(short, long)]
        fields: String,
    },
    /// Create a relationship between schemas
    Link {
        /// Source schema
        from: String,
        /// Target schema
        to: String,
        /// Relation type: has_one, has_many, belongs_to
        #[arg(short, long)]
        relation: String,
        /// Alias for the relationship
        #[arg(long)]
        r#as: Option<String>,
    },
    /// List all schemas
    List,
    /// Show schema details
    Show {
        /// Schema name
        name: String,
    },
    /// Drop a schema
    Drop {
        /// Schema name
        name: String,
        /// Force drop even if data exists
        #[arg(long)]
        force: bool,
    },
    /// Run pending migrations
    Migrate,
}

#[derive(Subcommand)]
enum ConfigAction {
    /// Set a configuration value
    Set {
        /// Configuration key
        key: String,
        /// Configuration value
        value: String,
    },
    /// Get a configuration value
    Get {
        /// Configuration key
        key: String,
    },
    /// List all configuration
    List,
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, clap::ValueEnum)]
enum ViewMode {
    #[default]
    Table,
    Graph,
    Kv,
}

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "aresadb=info".into()),
        ))
        .with(tracing_subscriber::fmt::layer().without_time())
        .init();

    let cli = Cli::parse();

    match cli.command {
        Some(Commands::Init { path, name }) => {
            handle_init(&path, name.as_deref()).await?;
        }
        Some(Commands::Repl) => {
            let db_path = cli.database.as_deref().unwrap_or(".");
            let mut repl = Repl::new(db_path).await?;
            repl.run().await?;
        }
        Some(Commands::Query { sql }) => {
            let db_path = cli.database.as_deref().unwrap_or(".");
            handle_query(db_path, &sql, cli.format, cli.limit).await?;
        }
        Some(Commands::Schema { action }) => {
            let db_path = cli.database.as_deref().unwrap_or(".");
            handle_schema(db_path, action).await?;
        }
        Some(Commands::View { name, r#as, limit }) => {
            let db_path = cli.database.as_deref().unwrap_or(".");
            handle_view(db_path, &name, r#as, limit.or(cli.limit), cli.format).await?;
        }
        Some(Commands::Traverse { node, depth, edges }) => {
            let db_path = cli.database.as_deref().unwrap_or(".");
            handle_traverse(db_path, &node, depth, edges.as_deref(), cli.format).await?;
        }
        Some(Commands::Push { url }) => {
            let db_path = cli.database.as_deref().unwrap_or(".");
            handle_push(db_path, &url).await?;
        }
        Some(Commands::Connect { url, readonly }) => {
            handle_connect(&url, readonly).await?;
        }
        Some(Commands::Sync { url }) => {
            let db_path = cli.database.as_deref().unwrap_or(".");
            handle_sync(db_path, &url).await?;
        }
        Some(Commands::Config { action }) => {
            handle_config(action).await?;
        }
        Some(Commands::Status) => {
            let db_path = cli.database.as_deref().unwrap_or(".");
            handle_status(db_path).await?;
        }
        Some(Commands::Insert { node_type, props }) => {
            let db_path = cli.database.as_deref().unwrap_or(".");
            handle_insert(db_path, &node_type, &props, cli.format).await?;
        }
        Some(Commands::Get { id }) => {
            let db_path = cli.database.as_deref().unwrap_or(".");
            handle_get(db_path, &id, cli.format).await?;
        }
        Some(Commands::Delete { id }) => {
            let db_path = cli.database.as_deref().unwrap_or(".");
            handle_delete(db_path, &id).await?;
        }
        None => {
            if cli.query.is_empty() {
                print_welcome();
            } else {
                let query_text = cli.query.join(" ");
                let db_path = cli.database.as_deref().unwrap_or(".");
                handle_natural_language(db_path, &query_text, cli.format, cli.limit).await?;
            }
        }
    }

    Ok(())
}

fn print_welcome() {
    println!();
    println!(
        "{}",
        "╭───────────────────────────────────────────────────────────────╮"
            .bright_cyan()
    );
    println!(
        "{}",
        "│                                                               │"
            .bright_cyan()
    );
    println!(
        "│  {}  │",
        " █████╗ ██████╗ ███████╗███████╗ █████╗ ██████╗ ██████╗  "
            .bright_cyan()
            .bold()
    );
    println!(
        "│  {}  │",
        "██╔══██╗██╔══██╗██╔════╝██╔════╝██╔══██╗██╔══██╗██╔══██╗ "
            .bright_cyan()
            .bold()
    );
    println!(
        "│  {}  │",
        "███████║██████╔╝█████╗  ███████╗███████║██║  ██║██████╔╝ "
            .bright_cyan()
            .bold()
    );
    println!(
        "│  {}  │",
        "██╔══██║██╔══██╗██╔══╝  ╚════██║██╔══██║██║  ██║██╔══██╗ "
            .bright_cyan()
            .bold()
    );
    println!(
        "│  {}  │",
        "██║  ██║██║  ██║███████╗███████║██║  ██║██████╔╝██████╔╝ "
            .bright_cyan()
            .bold()
    );
    println!(
        "│  {}  │",
        "╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝╚═════╝ ╚═════╝  "
            .bright_cyan()
            .bold()
    );
    println!(
        "{}",
        "│                                                               │"
            .bright_cyan()
    );
    println!(
        "│       {}        │",
        "Unified AI-Native Database Engine".white().bold()
    );
    println!(
        "│         {}          │",
        "KV • Graph • Relational".bright_yellow()
    );
    println!(
        "{}",
        "│                                                               │"
            .bright_cyan()
    );
    println!(
        "{}",
        "╰───────────────────────────────────────────────────────────────╯"
            .bright_cyan()
    );
    println!();
    println!("{}", "Usage:".bright_yellow().bold());
    println!(
        "  {} {}",
        "aresadb init ./mydata".bright_green(),
        "                    # Create new database".white()
    );
    println!(
        "  {} {}",
        "aresadb".bright_green(),
        "\"find all users with age > 30\"    # Natural language query".white()
    );
    println!(
        "  {} {}",
        "aresadb query".bright_green(),
        "\"SELECT * FROM users\"     # SQL query".white()
    );
    println!(
        "  {} {}",
        "aresadb repl".bright_green(),
        "                            # Interactive mode".white()
    );
    println!();
    println!("{}", "Quick Start:".bright_yellow().bold());
    println!(
        "  1. Initialize:    {}",
        "aresadb init ./mydb --name myapp".bright_green()
    );
    println!(
        "  2. Create schema: {}",
        "aresadb schema create users --fields \"name:string, age:int\"".bright_green()
    );
    println!(
        "  3. Insert data:   {}",
        "aresadb \"add user John age 30\"".bright_green()
    );
    println!(
        "  4. Query data:    {}",
        "aresadb \"show all users\"".bright_green()
    );
    println!();
    println!(
        "Run {} for more options.",
        "aresadb --help".bright_green()
    );
    println!();
}

async fn handle_init(path: &str, name: Option<&str>) -> Result<()> {
    use storage::Database;

    let db_name = name.unwrap_or_else(|| {
        std::path::Path::new(path)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("aresadb")
    });

    println!(
        "{} Initializing database '{}' at {}...",
        "●".bright_blue(),
        db_name.bright_yellow(),
        path.bright_cyan()
    );

    Database::create(path, db_name).await?;

    println!(
        "{} Database initialized successfully!",
        "✓".bright_green().bold()
    );
    println!();
    println!("{}", "Next steps:".bright_yellow().bold());
    println!(
        "  {}",
        format!("cd {} && aresadb schema create users --fields \"name:string, email:string\"", path)
            .bright_green()
    );

    Ok(())
}

async fn handle_query(db_path: &str, sql: &str, format: OutputFormat, limit: Option<usize>) -> Result<()> {
    use storage::Database;
    use query::QueryEngine;
    use output::Renderer;

    let db = Database::open(db_path).await?;
    let engine = QueryEngine::new(db);
    let results = engine.execute_sql(sql, limit).await?;

    let renderer = Renderer::new(format);
    renderer.render_results(&results)?;

    Ok(())
}

async fn handle_schema(db_path: &str, action: SchemaAction) -> Result<()> {
    use storage::Database;
    use schema::SchemaManager;
    use output::Renderer;

    let db = Database::open(db_path).await?;
    let manager = SchemaManager::new(db);

    match action {
        SchemaAction::Create { name, fields } => {
            manager.create_schema(&name, &fields).await?;
            println!(
                "{} Created schema '{}'",
                "✓".bright_green().bold(),
                name.bright_yellow()
            );
        }
        SchemaAction::Link { from, to, relation, r#as } => {
            manager.create_relationship(&from, &to, &relation, r#as.as_deref()).await?;
            println!(
                "{} Created relationship {} -> {}",
                "✓".bright_green().bold(),
                from.bright_cyan(),
                to.bright_cyan()
            );
        }
        SchemaAction::List => {
            let schemas = manager.list_schemas().await?;
            let renderer = Renderer::new(OutputFormat::Table);
            renderer.render_schemas(&schemas)?;
        }
        SchemaAction::Show { name } => {
            let schema = manager.get_schema(&name).await?;
            let renderer = Renderer::new(OutputFormat::Table);
            renderer.render_schema_details(&schema)?;
        }
        SchemaAction::Drop { name, force } => {
            manager.drop_schema(&name, force).await?;
            println!(
                "{} Dropped schema '{}'",
                "✓".bright_green().bold(),
                name.bright_yellow()
            );
        }
        SchemaAction::Migrate => {
            let migrations = manager.run_migrations().await?;
            println!(
                "{} Applied {} migrations",
                "✓".bright_green().bold(),
                migrations.len()
            );
        }
    }

    Ok(())
}

async fn handle_view(
    db_path: &str,
    name: &str,
    mode: ViewMode,
    limit: Option<usize>,
    format: OutputFormat,
) -> Result<()> {
    use storage::Database;
    use output::Renderer;

    let db = Database::open(db_path).await?;
    let renderer = Renderer::new(format);

    match mode {
        ViewMode::Table => {
            let rows = db.get_all_by_type(name, limit).await?;
            renderer.render_as_table(&rows)?;
        }
        ViewMode::Graph => {
            let graph = db.get_as_graph(name, limit).await?;
            renderer.render_as_graph(&graph)?;
        }
        ViewMode::Kv => {
            let kvs = db.get_as_kv(name, limit).await?;
            renderer.render_as_kv(&kvs)?;
        }
    }

    Ok(())
}

async fn handle_traverse(
    db_path: &str,
    node_id: &str,
    depth: u32,
    edges: Option<&str>,
    format: OutputFormat,
) -> Result<()> {
    use storage::Database;
    use query::QueryEngine;
    use output::Renderer;

    let db = Database::open(db_path).await?;
    let engine = QueryEngine::new(db);

    let edge_types: Option<Vec<&str>> = edges.map(|e| e.split(',').collect());
    let results = engine.traverse(node_id, depth, edge_types).await?;

    let renderer = Renderer::new(format);
    renderer.render_traversal(&results)?;

    Ok(())
}

async fn handle_push(db_path: &str, url: &str) -> Result<()> {
    use storage::Database;

    println!(
        "{} Pushing database to {}...",
        "●".bright_blue(),
        url.bright_cyan()
    );

    let db = Database::open(db_path).await?;
    db.push_to_bucket(url).await?;

    println!(
        "{} Database pushed successfully!",
        "✓".bright_green().bold()
    );

    Ok(())
}

async fn handle_connect(url: &str, readonly: bool) -> Result<()> {
    use storage::Database;

    println!(
        "{} Connecting to {}...",
        "●".bright_blue(),
        url.bright_cyan()
    );

    let _db = Database::connect_bucket(url, readonly).await?;

    println!(
        "{} Connected! Use {} to start querying.",
        "✓".bright_green().bold(),
        "aresadb repl".bright_green()
    );

    Ok(())
}

async fn handle_sync(db_path: &str, url: &str) -> Result<()> {
    use storage::Database;

    println!(
        "{} Syncing with {}...",
        "●".bright_blue(),
        url.bright_cyan()
    );

    let db = Database::open(db_path).await?;
    let stats = db.sync_with_bucket(url).await?;

    println!(
        "{} Synced: {} uploaded, {} downloaded",
        "✓".bright_green().bold(),
        stats.uploaded,
        stats.downloaded
    );

    Ok(())
}

async fn handle_config(action: ConfigAction) -> Result<()> {
    use cli::config::Config;

    let config = Config::load()?;

    match action {
        ConfigAction::Set { key, value } => {
            config.set(&key, &value)?;
            println!(
                "{} Set {} = {}",
                "✓".bright_green().bold(),
                key.bright_cyan(),
                value.bright_yellow()
            );
        }
        ConfigAction::Get { key } => {
            if let Some(value) = config.get(&key) {
                println!("{}: {}", key.bright_cyan(), value.bright_yellow());
            } else {
                println!("{} Key not found: {}", "!".bright_red(), key);
            }
        }
        ConfigAction::List => {
            config.print_all()?;
        }
    }

    Ok(())
}

async fn handle_status(db_path: &str) -> Result<()> {
    use storage::Database;

    let db = Database::open(db_path).await?;
    let status = db.status().await?;

    println!("{}", "Database Status".bright_yellow().bold());
    println!("─────────────────────────────────────");
    println!("  {} {}", "Name:".bright_cyan(), status.name);
    println!("  {} {}", "Path:".bright_cyan(), status.path);
    println!("  {} {}", "Nodes:".bright_cyan(), status.node_count);
    println!("  {} {}", "Edges:".bright_cyan(), status.edge_count);
    println!("  {} {}", "Schemas:".bright_cyan(), status.schema_count);
    println!("  {} {}", "Size:".bright_cyan(), humansize::format_size(status.size_bytes, humansize::BINARY));

    Ok(())
}

async fn handle_insert(db_path: &str, node_type: &str, props_json: &str, format: OutputFormat) -> Result<()> {
    use storage::Database;
    use output::Renderer;

    let db = Database::open(db_path).await?;
    let props: serde_json::Value = serde_json::from_str(props_json)?;

    let node = db.insert_node(node_type, props).await?;

    let renderer = Renderer::new(format);
    renderer.render_node(&node)?;

    println!(
        "{} Inserted node {}",
        "✓".bright_green().bold(),
        node.id.to_string().bright_yellow()
    );

    Ok(())
}

async fn handle_get(db_path: &str, id: &str, format: OutputFormat) -> Result<()> {
    use storage::Database;
    use output::Renderer;

    let db = Database::open(db_path).await?;

    if let Some(node) = db.get_node(id).await? {
        let renderer = Renderer::new(format);
        renderer.render_node(&node)?;
    } else {
        println!("{} Node not found: {}", "!".bright_red(), id);
    }

    Ok(())
}

async fn handle_delete(db_path: &str, id: &str) -> Result<()> {
    use storage::Database;

    let db = Database::open(db_path).await?;
    db.delete_node(id).await?;

    println!(
        "{} Deleted node {}",
        "✓".bright_green().bold(),
        id.bright_yellow()
    );

    Ok(())
}

async fn handle_natural_language(
    db_path: &str,
    query: &str,
    format: OutputFormat,
    limit: Option<usize>,
) -> Result<()> {
    use indicatif::{ProgressBar, ProgressStyle};
    use storage::Database;
    use query::QueryEngine;
    use ai::NlpProcessor;
    use output::Renderer;

    let spinner = ProgressBar::new_spinner();
    spinner.set_style(
        ProgressStyle::default_spinner()
            .tick_chars("⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏")
            .template("{spinner:.cyan} {msg}")?,
    );
    spinner.set_message("Understanding your query...");
    spinner.enable_steady_tick(std::time::Duration::from_millis(80));

    let db = Database::open(db_path).await?;
    let nlp = NlpProcessor::new()?;

    // Parse natural language to SQL or operations
    let parsed = nlp.parse(query, &db).await?;

    spinner.set_message("Executing query...");

    let engine = QueryEngine::new(db);
    let results = engine.execute_parsed(&parsed, limit).await?;

    spinner.finish_and_clear();

    let renderer = Renderer::new(format);
    renderer.render_results(&results)?;

    Ok(())
}


