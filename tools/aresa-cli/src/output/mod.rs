//! Beautiful terminal output rendering

mod table;
mod theme;

use anyhow::Result;
use colored::Colorize;

pub use table::TableRenderer;
pub use theme::Theme;

use crate::connectors::filesystem::FileMatch;
use crate::query::QueryResult;
/// Output format enum
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, clap::ValueEnum)]
pub enum OutputFormat {
    #[default]
    Table,
    Json,
    Csv,
    Tree,
}

/// Main output renderer
pub struct OutputRenderer {
    format: OutputFormat,
    theme: Theme,
}

impl OutputRenderer {
    /// Create a new output renderer
    pub fn new(format: OutputFormat) -> Self {
        Self {
            format,
            theme: Theme::default(),
        }
    }

    /// Render file search results
    pub fn render_file_results(&self, results: &[FileMatch]) -> Result<()> {
        if results.is_empty() {
            println!("{}", "No matches found.".yellow());
            return Ok(());
        }

        match self.format {
            OutputFormat::Json => {
                println!("{}", serde_json::to_string_pretty(results)?);
            }
            OutputFormat::Csv => {
                println!("path,line,content");
                for result in results {
                    if let Some(matches) = &result.matches {
                        for m in matches {
                            println!(
                                "\"{}\",{},\"{}\"",
                                result.path.display(),
                                m.line_number,
                                m.content.replace('"', "\"\"")
                            );
                        }
                    } else {
                        println!("\"{}\",0,\"\"", result.path.display());
                    }
                }
            }
            OutputFormat::Tree => {
                self.render_file_tree(results)?;
            }
            OutputFormat::Table => {
                self.render_file_table(results)?;
            }
        }

        Ok(())
    }

    /// Render query results
    pub fn render_query_results(&self, results: &QueryResult) -> Result<()> {
        match self.format {
            OutputFormat::Json => {
                println!("{}", serde_json::to_string_pretty(&results.rows)?);
            }
            OutputFormat::Csv => {
                // Header
                println!("{}", results.columns.join(","));
                // Rows
                for row in &results.rows {
                    let values: Vec<String> = results
                        .columns
                        .iter()
                        .map(|col| {
                            row.get(col)
                                .map(|v| format!("\"{}\"", v.replace('"', "\"\"")))
                                .unwrap_or_default()
                        })
                        .collect();
                    println!("{}", values.join(","));
                }
            }
            OutputFormat::Tree | OutputFormat::Table => {
                TableRenderer::render(results, &self.theme)?;
            }
        }

        // Show row count
        println!();
        println!(
            "{} {} row{}",
            "→".bright_cyan(),
            results.rows.len().to_string().bright_white().bold(),
            if results.rows.len() == 1 { "" } else { "s" }
        );

        Ok(())
    }

    /// Render file results as a tree
    fn render_file_tree(&self, results: &[FileMatch]) -> Result<()> {
        use std::collections::BTreeMap;

        // Group by directory
        let mut tree: BTreeMap<String, Vec<&FileMatch>> = BTreeMap::new();
        
        for result in results {
            let dir = result
                .path
                .parent()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_else(|| ".".to_string());
            tree.entry(dir).or_default().push(result);
        }

        for (dir, files) in &tree {
            println!("{}", dir.bright_blue().bold());
            for (i, file) in files.iter().enumerate() {
                let prefix = if i == files.len() - 1 { "└──" } else { "├──" };
                let filename = file
                    .path
                    .file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default();
                println!("  {} {}", prefix.dimmed(), filename.bright_white());
                
                if let Some(matches) = &file.matches {
                    for m in matches.iter().take(3) {
                        let line_prefix = if i == files.len() - 1 { "    " } else { "│   " };
                        println!(
                            "{}  {}:{} {}",
                            line_prefix.dimmed(),
                            m.line_number.to_string().yellow(),
                            ":".dimmed(),
                            m.content.trim().dimmed()
                        );
                    }
                    if matches.len() > 3 {
                        let line_prefix = if i == files.len() - 1 { "    " } else { "│   " };
                        println!(
                            "{}  {}",
                            line_prefix.dimmed(),
                            format!("... and {} more matches", matches.len() - 3).dimmed()
                        );
                    }
                }
            }
        }

        println!();
        println!(
            "{} Found {} file{} with matches",
            "→".bright_cyan(),
            results.len().to_string().bright_white().bold(),
            if results.len() == 1 { "" } else { "s" }
        );

        Ok(())
    }

    /// Render file results as a table
    fn render_file_table(&self, results: &[FileMatch]) -> Result<()> {
        use tabled::{settings::Style, builder::Builder};

        let has_content = results.iter().any(|r| r.matches.is_some());

        if has_content {
            // Content search results
            for result in results {
                if let Some(matches) = &result.matches {
                    println!(
                        "\n{} {}",
                        "●".bright_cyan(),
                        result.path.display().to_string().bright_white().bold()
                    );
                    
                    for m in matches {
                        println!(
                            "  {}:{} {}",
                            m.line_number.to_string().yellow(),
                            ":".dimmed(),
                            highlight_match(&m.content, &m.matched_text)
                        );
                    }
                }
            }
        } else {
            // File name search results
            let mut builder = Builder::default();
            builder.push_record(["File", "Size", "Modified"]);

            for result in results {
                let size = result
                    .size
                    .map(|s| humansize::format_size(s, humansize::BINARY))
                    .unwrap_or_default();
                let modified = result
                    .modified
                    .map(|m| m.format("%Y-%m-%d %H:%M").to_string())
                    .unwrap_or_default();

                builder.push_record([
                    result.path.display().to_string(),
                    size,
                    modified,
                ]);
            }

            let mut table = builder.build();
            table.with(Style::rounded());
            println!("{table}");
        }

        println!();
        println!(
            "{} Found {} match{}",
            "→".bright_cyan(),
            results.len().to_string().bright_white().bold(),
            if results.len() == 1 { "" } else { "es" }
        );

        Ok(())
    }
}

/// Highlight matched text in a line
fn highlight_match(line: &str, matched: &str) -> String {
    if matched.is_empty() {
        return line.to_string();
    }
    
    line.replace(matched, &matched.bright_yellow().bold().to_string())
}

