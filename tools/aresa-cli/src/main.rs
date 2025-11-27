use anyhow::Result;
use clap::{Parser, Subcommand};
use colored::Colorize;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod connectors;
mod nlp;
mod output;
mod query;

use config::ConfigManager;
use nlp::QueryParser;
use output::OutputRenderer;
use query::QueryExecutor;

/// ARESA CLI - Natural Language Data Search
/// 
/// Search filesystems, databases, and cloud storage using natural language.
/// Part of the Autonomous Research Engineering & Synthesis Architecture.
#[derive(Parser)]
#[command(name = "aresa")]
#[command(author = "Yevheniy Chuba <yevheniyc@gmail.com>")]
#[command(version)]
#[command(about = "Natural language interface for searching data everywhere", long_about = None)]
#[command(propagate_version = true)]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,

    /// Natural language query (if no subcommand provided)
    #[arg(trailing_var_arg = true)]
    query: Vec<String>,

    /// Output format
    #[arg(short, long, default_value = "table")]
    format: OutputFormat,

    /// Enable verbose output
    #[arg(short, long)]
    verbose: bool,

    /// Limit number of results
    #[arg(short, long)]
    limit: Option<usize>,
}

#[derive(Subcommand)]
enum Commands {
    /// Manage data source configurations
    Config {
        #[command(subcommand)]
        action: ConfigAction,
    },
    /// Search filesystem for files and content
    Files {
        /// Search query or pattern
        query: String,
        /// Directory to search in
        #[arg(short, long, default_value = ".")]
        path: String,
        /// Search file contents (not just names)
        #[arg(short, long)]
        content: bool,
    },
    /// Query a database
    Query {
        /// Data source name (from config)
        source: String,
        /// SQL query or natural language
        query: String,
    },
    /// List configured data sources
    Sources,
    /// Show connection status for all sources
    Status,
}

#[derive(Subcommand)]
enum ConfigAction {
    /// Add a new data source
    Add {
        /// Type of data source (postgres, bigquery, s3, gcs, sqlite)
        #[arg(value_enum)]
        source_type: SourceType,
        /// Name for this connection
        name: String,
        /// Connection URI or path
        #[arg(long)]
        uri: Option<String>,
        /// Project ID (for BigQuery/GCS)
        #[arg(long)]
        project: Option<String>,
        /// Bucket name (for S3/GCS)
        #[arg(long)]
        bucket: Option<String>,
        /// Path to credentials file
        #[arg(long)]
        credentials: Option<String>,
    },
    /// Remove a data source
    Remove {
        /// Name of the connection to remove
        name: String,
    },
    /// List all configured data sources
    List,
    /// Test connection to a data source
    Test {
        /// Name of the connection to test
        name: String,
    },
    /// Set default LLM provider
    SetLlm {
        /// LLM provider (openai, anthropic)
        provider: String,
        /// API key
        #[arg(long)]
        api_key: String,
    },
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, clap::ValueEnum)]
enum SourceType {
    Postgres,
    Bigquery,
    S3,
    Gcs,
    Sqlite,
    Duckdb,
}

pub use output::OutputFormat;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "aresa=info".into()),
        ))
        .with(tracing_subscriber::fmt::layer().without_time())
        .init();

    let cli = Cli::parse();
    let config = ConfigManager::load()?;
    let renderer = OutputRenderer::new(cli.format);

    match cli.command {
        Some(Commands::Config { action }) => handle_config(action, &config).await?,
        Some(Commands::Files { query, path, content }) => {
            handle_file_search(&query, &path, content, &renderer, cli.limit).await?
        }
        Some(Commands::Query { source, query }) => {
            handle_query(&source, &query, &config, &renderer, cli.limit).await?
        }
        Some(Commands::Sources) => handle_list_sources(&config, &renderer)?,
        Some(Commands::Status) => handle_status(&config, &renderer).await?,
        None => {
            // Natural language query mode
            if cli.query.is_empty() {
                print_welcome();
            } else {
                let query_text = cli.query.join(" ");
                handle_natural_language_query(&query_text, &config, &renderer, cli.limit).await?;
            }
        }
    }

    Ok(())
}

fn print_welcome() {
    println!();
    println!(
        "{}",
        "╭─────────────────────────────────────────────────────────────╮"
            .bright_cyan()
    );
    println!(
        "{}",
        "│                                                             │"
            .bright_cyan()
    );
    println!(
        "│  {}  │",
        "  █████╗ ██████╗ ███████╗███████╗ █████╗               "
            .bright_cyan()
            .bold()
    );
    println!(
        "│  {}  │",
        " ██╔══██╗██╔══██╗██╔════╝██╔════╝██╔══██╗              "
            .bright_cyan()
            .bold()
    );
    println!(
        "│  {}  │",
        " ███████║██████╔╝█████╗  ███████╗███████║              "
            .bright_cyan()
            .bold()
    );
    println!(
        "│  {}  │",
        " ██╔══██║██╔══██╗██╔══╝  ╚════██║██╔══██║              "
            .bright_cyan()
            .bold()
    );
    println!(
        "│  {}  │",
        " ██║  ██║██║  ██║███████╗███████║██║  ██║              "
            .bright_cyan()
            .bold()
    );
    println!(
        "│  {}  │",
        " ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝              "
            .bright_cyan()
            .bold()
    );
    println!(
        "{}",
        "│                                                             │"
            .bright_cyan()
    );
    println!(
        "│  {}  │",
        "Autonomous Research Engineering & Synthesis Architecture"
            .white()
    );
    println!(
        "{}",
        "│                                                             │"
            .bright_cyan()
    );
    println!(
        "{}",
        "╰─────────────────────────────────────────────────────────────╯"
            .bright_cyan()
    );
    println!();
    println!("{}", "Usage:".bright_yellow().bold());
    println!(
        "  {} {}",
        "aresa".bright_green(),
        "\"find all users who signed up last week\"".white()
    );
    println!(
        "  {} {}",
        "aresa files".bright_green(),
        "\"TODO\" --path ~/dev --content".white()
    );
    println!(
        "  {} {}",
        "aresa config add postgres".bright_green(),
        "mydb --uri postgresql://...".white()
    );
    println!();
    println!("{}", "Quick Start:".bright_yellow().bold());
    println!(
        "  1. Configure your LLM: {}",
        "aresa config set-llm openai --api-key <key>".bright_green()
    );
    println!(
        "  2. Add a data source:  {}",
        "aresa config add postgres prod --uri <uri>".bright_green()
    );
    println!(
        "  3. Start searching:    {}",
        "aresa \"show me the largest tables\"".bright_green()
    );
    println!();
    println!(
        "Run {} for more options.",
        "aresa --help".bright_green()
    );
    println!();
}

async fn handle_config(action: ConfigAction, config: &ConfigManager) -> Result<()> {
    match action {
        ConfigAction::Add {
            source_type,
            name,
            uri,
            project,
            bucket,
            credentials,
        } => {
            let source_type_str = format!("{:?}", source_type).to_lowercase();
            config.add_source(
                &name,
                &source_type_str,
                uri.as_deref(),
                project.as_deref(),
                bucket.as_deref(),
                credentials.as_deref(),
            )?;
            println!(
                "{} Added {} connection '{}'",
                "✓".bright_green().bold(),
                source_type_str.bright_cyan(),
                name.bright_yellow()
            );
        }
        ConfigAction::Remove { name } => {
            config.remove_source(&name)?;
            println!(
                "{} Removed connection '{}'",
                "✓".bright_green().bold(),
                name.bright_yellow()
            );
        }
        ConfigAction::List => {
            config.list_sources()?;
        }
        ConfigAction::Test { name } => {
            print!(
                "{} Testing connection '{}'... ",
                "●".bright_blue(),
                name.bright_yellow()
            );
            match config.test_connection(&name).await {
                Ok(_) => println!("{}", "connected!".bright_green().bold()),
                Err(e) => println!("{} {}", "failed:".bright_red().bold(), e),
            }
        }
        ConfigAction::SetLlm { provider, api_key } => {
            config.set_llm_config(&provider, &api_key)?;
            println!(
                "{} Configured {} as LLM provider",
                "✓".bright_green().bold(),
                provider.bright_cyan()
            );
        }
    }
    Ok(())
}

async fn handle_file_search(
    query: &str,
    path: &str,
    content: bool,
    renderer: &OutputRenderer,
    limit: Option<usize>,
) -> Result<()> {
    use connectors::filesystem::FilesystemConnector;
    
    let connector = FilesystemConnector::new();
    let results = if content {
        connector.search_content(path, query, limit).await?
    } else {
        connector.search_files(path, query, limit).await?
    };
    
    renderer.render_file_results(&results)?;
    Ok(())
}

async fn handle_query(
    source: &str,
    query: &str,
    config: &ConfigManager,
    renderer: &OutputRenderer,
    limit: Option<usize>,
) -> Result<()> {
    let executor = QueryExecutor::new(config);
    let results = executor.execute(source, query, limit).await?;
    renderer.render_query_results(&results)?;
    Ok(())
}

fn handle_list_sources(config: &ConfigManager, _renderer: &OutputRenderer) -> Result<()> {
    config.list_sources()
}

async fn handle_status(config: &ConfigManager, _renderer: &OutputRenderer) -> Result<()> {
    config.check_all_connections().await
}

async fn handle_natural_language_query(
    query: &str,
    config: &ConfigManager,
    renderer: &OutputRenderer,
    limit: Option<usize>,
) -> Result<()> {
    use indicatif::{ProgressBar, ProgressStyle};
    
    let spinner = ProgressBar::new_spinner();
    spinner.set_style(
        ProgressStyle::default_spinner()
            .tick_chars("⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏")
            .template("{spinner:.cyan} {msg}")?,
    );
    spinner.set_message("Understanding your query...");
    spinner.enable_steady_tick(std::time::Duration::from_millis(80));

    // Parse natural language query
    let parser = QueryParser::new(config)?;
    let parsed = parser.parse(query).await?;
    
    spinner.set_message(format!("Executing {} query...", parsed.target_type));
    
    // Execute the query
    let executor = QueryExecutor::new(config);
    let results = executor.execute_parsed(&parsed, limit).await?;
    
    spinner.finish_and_clear();
    
    // Render results
    renderer.render_query_results(&results)?;
    
    Ok(())
}

