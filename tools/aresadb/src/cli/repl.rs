//! Interactive REPL
//!
//! Read-Eval-Print Loop with syntax highlighting and auto-completion.

use anyhow::Result;
use colored::Colorize;
use rustyline::config::Configurer;
use rustyline::error::ReadlineError;
use rustyline::highlight::Highlighter;
use rustyline::hint::{Hint, Hinter};
use rustyline::history::DefaultHistory;
use rustyline::validate::{ValidationContext, ValidationResult, Validator};
use rustyline::{Completer, Editor, Helper};
use std::borrow::Cow;

use crate::storage::Database;
use crate::query::QueryEngine;
use crate::ai::NlpProcessor;
use crate::output::Renderer;
use super::commands::OutputFormat;

/// REPL helper for syntax highlighting and completion
#[derive(Completer, Helper)]
struct ReplHelper {
    keywords: Vec<String>,
}

impl Default for ReplHelper {
    fn default() -> Self {
        Self {
            keywords: vec![
                // SQL keywords
                "SELECT".to_string(),
                "FROM".to_string(),
                "WHERE".to_string(),
                "INSERT".to_string(),
                "INTO".to_string(),
                "VALUES".to_string(),
                "UPDATE".to_string(),
                "SET".to_string(),
                "DELETE".to_string(),
                "ORDER".to_string(),
                "BY".to_string(),
                "LIMIT".to_string(),
                "OFFSET".to_string(),
                "AND".to_string(),
                "OR".to_string(),
                "NOT".to_string(),
                "NULL".to_string(),
                "TRUE".to_string(),
                "FALSE".to_string(),
                // AresaDB specific
                ".help".to_string(),
                ".exit".to_string(),
                ".quit".to_string(),
                ".schema".to_string(),
                ".tables".to_string(),
                ".status".to_string(),
                ".format".to_string(),
                ".clear".to_string(),
            ],
        }
    }
}

impl Highlighter for ReplHelper {
    fn highlight<'l>(&self, line: &'l str, _pos: usize) -> Cow<'l, str> {
        let mut result = line.to_string();

        // Highlight SQL keywords
        let sql_keywords = [
            "SELECT", "FROM", "WHERE", "INSERT", "INTO", "VALUES", "UPDATE",
            "SET", "DELETE", "ORDER", "BY", "LIMIT", "OFFSET", "AND", "OR",
            "NOT", "NULL", "TRUE", "FALSE", "AS", "JOIN", "ON", "LEFT", "RIGHT",
            "INNER", "OUTER", "GROUP", "HAVING", "DISTINCT", "COUNT", "SUM",
            "AVG", "MIN", "MAX", "LIKE", "IN", "BETWEEN", "IS", "CREATE",
            "DROP", "ALTER", "TABLE", "INDEX",
        ];

        for keyword in &sql_keywords {
            let pattern = format!(r"\b{}\b", keyword);
            if let Ok(re) = regex::Regex::new(&pattern) {
                result = re.replace_all(&result, |caps: &regex::Captures| {
                    format!("\x1b[34;1m{}\x1b[0m", &caps[0])
                }).to_string();
            }

            // Also match lowercase
            let pattern_lower = format!(r"\b{}\b", keyword.to_lowercase());
            if let Ok(re) = regex::Regex::new(&pattern_lower) {
                result = re.replace_all(&result, |caps: &regex::Captures| {
                    format!("\x1b[34;1m{}\x1b[0m", &caps[0])
                }).to_string();
            }
        }

        // Highlight strings
        if let Ok(re) = regex::Regex::new(r#"'[^']*'|"[^"]*""#) {
            result = re.replace_all(&result, |caps: &regex::Captures| {
                format!("\x1b[32m{}\x1b[0m", &caps[0])
            }).to_string();
        }

        // Highlight numbers
        if let Ok(re) = regex::Regex::new(r"\b\d+(\.\d+)?\b") {
            result = re.replace_all(&result, |caps: &regex::Captures| {
                format!("\x1b[33m{}\x1b[0m", &caps[0])
            }).to_string();
        }

        // Highlight commands (starting with .)
        if let Ok(re) = regex::Regex::new(r"^\.[a-z]+") {
            result = re.replace_all(&result, |caps: &regex::Captures| {
                format!("\x1b[35;1m{}\x1b[0m", &caps[0])
            }).to_string();
        }

        Cow::Owned(result)
    }

    fn highlight_prompt<'b, 's: 'b, 'p: 'b>(&'s self, prompt: &'p str, _default: bool) -> Cow<'b, str> {
        Cow::Borrowed(prompt)
    }

    fn highlight_hint<'h>(&self, hint: &'h str) -> Cow<'h, str> {
        Cow::Owned(format!("\x1b[90m{}\x1b[0m", hint))
    }

    fn highlight_char(&self, _line: &str, _pos: usize, _forced: bool) -> bool {
        true
    }
}

/// Command hint
struct CommandHint {
    display: String,
    complete_up_to: usize,
}

impl Hint for CommandHint {
    fn display(&self) -> &str {
        &self.display
    }

    fn completion(&self) -> Option<&str> {
        if self.complete_up_to > 0 {
            Some(&self.display[..self.complete_up_to])
        } else {
            None
        }
    }
}

impl Hinter for ReplHelper {
    type Hint = CommandHint;

    fn hint(&self, line: &str, pos: usize, _ctx: &rustyline::Context<'_>) -> Option<Self::Hint> {
        if line.is_empty() || pos < line.len() {
            return None;
        }

        let line_lower = line.to_lowercase();

        // Find matching keywords
        for keyword in &self.keywords {
            let keyword_lower = keyword.to_lowercase();
            if keyword_lower.starts_with(&line_lower) && keyword_lower != line_lower {
                let hint = &keyword[line.len()..];
                return Some(CommandHint {
                    display: hint.to_string(),
                    complete_up_to: hint.len(),
                });
            }
        }

        None
    }
}

impl Validator for ReplHelper {
    fn validate(&self, ctx: &mut ValidationContext) -> rustyline::Result<ValidationResult> {
        let input = ctx.input();

        // Check for unclosed quotes
        let single_quotes = input.matches('\'').count();
        let double_quotes = input.matches('"').count();

        if single_quotes % 2 != 0 || double_quotes % 2 != 0 {
            return Ok(ValidationResult::Incomplete);
        }

        // Check for unclosed parentheses
        let open_parens = input.matches('(').count();
        let close_parens = input.matches(')').count();

        if open_parens > close_parens {
            return Ok(ValidationResult::Incomplete);
        }

        Ok(ValidationResult::Valid(None))
    }
}

/// Interactive REPL
pub struct Repl {
    editor: Editor<ReplHelper, DefaultHistory>,
    db: Database,
    nlp: NlpProcessor,
    format: OutputFormat,
    history_path: Option<std::path::PathBuf>,
}

impl Repl {
    /// Create a new REPL instance
    pub async fn new(db_path: &str) -> Result<Self> {
        let db = Database::open(db_path).await?;
        let nlp = NlpProcessor::new()?;

        let mut editor = Editor::new()?;
        editor.set_helper(Some(ReplHelper::default()));
        editor.set_auto_add_history(true);

        // Load history
        let history_path = dirs::config_dir()
            .map(|p| p.join("aresadb/history.txt"));

        if let Some(ref path) = history_path {
            if let Some(parent) = path.parent() {
                let _ = std::fs::create_dir_all(parent);
            }
            let _ = editor.load_history(path);
        }

        Ok(Self {
            editor,
            db,
            nlp,
            format: OutputFormat::Table,
            history_path,
        })
    }

    /// Run the REPL
    pub async fn run(&mut self) -> Result<()> {
        self.print_welcome();

        loop {
            let prompt = format!("{} ", "aresadb>".bright_cyan().bold());

            match self.editor.readline(&prompt) {
                Ok(line) => {
                    let line = line.trim();

                    if line.is_empty() {
                        continue;
                    }

                    // Handle commands
                    if line.starts_with('.') {
                        if self.handle_command(line).await? {
                            break;
                        }
                        continue;
                    }

                    // Execute query
                    self.execute_input(line).await;
                }
                Err(ReadlineError::Interrupted) => {
                    println!("Use .exit or .quit to exit");
                }
                Err(ReadlineError::Eof) => {
                    println!("Goodbye!");
                    break;
                }
                Err(err) => {
                    eprintln!("Error: {:?}", err);
                    break;
                }
            }
        }

        // Save history
        if let Some(ref path) = self.history_path {
            let _ = self.editor.save_history(path);
        }

        Ok(())
    }

    fn print_welcome(&self) {
        println!();
        println!(
            "{}",
            "Welcome to AresaDB Interactive Shell".bright_cyan().bold()
        );
        println!(
            "Database: {} | Format: {:?}",
            self.db.name().bright_yellow(),
            self.format
        );
        println!("Type {} for help, {} to exit", ".help".bright_green(), ".exit".bright_green());
        println!();
    }

    async fn handle_command(&mut self, cmd: &str) -> Result<bool> {
        let parts: Vec<&str> = cmd.split_whitespace().collect();
        let command = parts.first().unwrap_or(&"");

        match *command {
            ".help" | ".h" => {
                self.print_help();
            }
            ".exit" | ".quit" | ".q" => {
                println!("Goodbye!");
                return Ok(true);
            }
            ".clear" => {
                print!("\x1B[2J\x1B[1;1H");
            }
            ".status" => {
                self.show_status().await?;
            }
            ".tables" | ".schemas" => {
                self.show_tables().await?;
            }
            ".schema" => {
                if let Some(name) = parts.get(1) {
                    self.show_schema(name).await?;
                } else {
                    println!("Usage: .schema <table_name>");
                }
            }
            ".format" => {
                if let Some(fmt) = parts.get(1) {
                    match fmt.to_lowercase().as_str() {
                        "table" => self.format = OutputFormat::Table,
                        "json" => self.format = OutputFormat::Json,
                        "csv" => self.format = OutputFormat::Csv,
                        _ => println!("Unknown format. Use: table, json, csv"),
                    }
                    println!("Output format: {:?}", self.format);
                } else {
                    println!("Current format: {:?}", self.format);
                    println!("Usage: .format <table|json|csv>");
                }
            }
            _ => {
                println!("Unknown command: {}", command);
                println!("Type .help for available commands");
            }
        }

        Ok(false)
    }

    fn print_help(&self) {
        println!("{}", "AresaDB Commands:".bright_yellow().bold());
        println!();
        println!("  {}   Show this help message", ".help".bright_green());
        println!("  {}   Exit the REPL", ".exit".bright_green());
        println!("  {}  Clear the screen", ".clear".bright_green());
        println!("  {} Show database status", ".status".bright_green());
        println!("  {} List all tables/schemas", ".tables".bright_green());
        println!("  {} Show schema for a table", ".schema <name>".bright_green());
        println!("  {} Set output format", ".format <fmt>".bright_green());
        println!();
        println!("{}", "Query Examples:".bright_yellow().bold());
        println!();
        println!("  {} {}", "SQL:".bright_cyan(), "SELECT * FROM users WHERE age > 25");
        println!("  {} {}", "Natural:".bright_cyan(), "find all users with age over 25");
        println!("  {} {}", "Insert:".bright_cyan(), "INSERT INTO users (name, age) VALUES ('John', 30)");
        println!();
    }

    async fn show_status(&self) -> Result<()> {
        let status = self.db.status().await?;

        println!();
        println!("{}", "Database Status".bright_yellow().bold());
        println!("─────────────────────────────────────");
        println!("  {} {}", "Name:".bright_cyan(), status.name);
        println!("  {} {}", "Path:".bright_cyan(), status.path);
        println!("  {} {}", "Nodes:".bright_cyan(), status.node_count);
        println!("  {} {}", "Edges:".bright_cyan(), status.edge_count);
        println!("  {} {}", "Schemas:".bright_cyan(), status.schema_count);
        println!(
            "  {} {}",
            "Size:".bright_cyan(),
            humansize::format_size(status.size_bytes, humansize::BINARY)
        );
        println!();

        Ok(())
    }

    async fn show_tables(&self) -> Result<()> {
        use crate::schema::SchemaManager;

        let manager = SchemaManager::new(
            Database::open(self.db.path()).await?
        );
        let schemas = manager.list_schemas().await?;

        if schemas.is_empty() {
            println!("No schemas defined. Use 'aresadb schema create' to create one.");
        } else {
            println!();
            println!("{}", "Schemas:".bright_yellow().bold());
            for schema in schemas {
                println!("  {} ({} fields)", schema.name.bright_cyan(), schema.fields.len());
            }
            println!();
        }

        Ok(())
    }

    async fn show_schema(&self, name: &str) -> Result<()> {
        use crate::schema::SchemaManager;

        let manager = SchemaManager::new(
            Database::open(self.db.path()).await?
        );

        match manager.get_schema(name).await {
            Ok(schema) => {
                println!();
                println!("{}: {}", "Schema".bright_yellow().bold(), schema.name.bright_cyan());
                println!("─────────────────────────────────────");
                for field in &schema.fields {
                    let mut attrs = Vec::new();
                    if !field.nullable {
                        attrs.push("NOT NULL");
                    }
                    if field.unique {
                        attrs.push("UNIQUE");
                    }
                    if field.indexed {
                        attrs.push("INDEXED");
                    }

                    let attrs_str = if attrs.is_empty() {
                        String::new()
                    } else {
                        format!(" ({})", attrs.join(", "))
                    };

                    println!(
                        "  {} {:?}{}",
                        field.name.bright_green(),
                        field.field_type,
                        attrs_str.bright_black()
                    );
                }
                println!();
            }
            Err(_) => {
                println!("Schema not found: {}", name);
            }
        }

        Ok(())
    }

    async fn execute_input(&self, input: &str) {
        use std::time::Instant;

        let start = Instant::now();

        // Try to parse as SQL first
        let result = if input.to_uppercase().starts_with("SELECT")
            || input.to_uppercase().starts_with("INSERT")
            || input.to_uppercase().starts_with("UPDATE")
            || input.to_uppercase().starts_with("DELETE")
        {
            // SQL query
            let engine = QueryEngine::new(
                Database::open(self.db.path()).await.unwrap()
            );
            engine.execute_sql(input, None).await
        } else {
            // Natural language query
            match self.nlp.parse(input, &self.db).await {
                Ok(parsed) => {
                    let engine = QueryEngine::new(
                        Database::open(self.db.path()).await.unwrap()
                    );
                    engine.execute_parsed(&parsed, None).await
                }
                Err(e) => Err(e),
            }
        };

        let elapsed = start.elapsed();

        match result {
            Ok(mut query_result) => {
                query_result.execution_time_ms = elapsed.as_millis() as u64;

                let renderer = Renderer::new(self.format);
                if let Err(e) = renderer.render_results(&query_result) {
                    eprintln!("{} {}", "Error rendering:".bright_red(), e);
                }

                println!(
                    "{} {} rows in {:.2}ms",
                    "→".bright_black(),
                    query_result.row_count(),
                    elapsed.as_secs_f64() * 1000.0
                );
            }
            Err(e) => {
                eprintln!("{} {}", "Error:".bright_red().bold(), e);
            }
        }

        println!();
    }
}

// Use dirs crate for platform-specific config paths
mod dirs {
    use std::path::PathBuf;

    pub fn config_dir() -> Option<PathBuf> {
        #[cfg(target_os = "macos")]
        {
            std::env::var("HOME")
                .ok()
                .map(|h| PathBuf::from(h).join(".config"))
        }

        #[cfg(target_os = "linux")]
        {
            std::env::var("XDG_CONFIG_HOME")
                .ok()
                .map(PathBuf::from)
                .or_else(|| {
                    std::env::var("HOME")
                        .ok()
                        .map(|h| PathBuf::from(h).join(".config"))
                })
        }

        #[cfg(target_os = "windows")]
        {
            std::env::var("APPDATA")
                .ok()
                .map(PathBuf::from)
        }

        #[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "windows")))]
        {
            None
        }
    }
}


