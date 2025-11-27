//! Table rendering for query results

use anyhow::Result;
use colored::Colorize;
use tabled::{settings::Style, builder::Builder};

use crate::query::QueryResult;
use super::Theme;

/// Renders query results as beautiful tables
pub struct TableRenderer;

impl TableRenderer {
    /// Render query results as a table
    pub fn render(results: &QueryResult, _theme: &Theme) -> Result<()> {
        if results.rows.is_empty() {
            println!("{}", "No results found.".yellow());
            return Ok(());
        }

        let mut builder = Builder::default();

        // Header
        builder.push_record(&results.columns);

        // Rows
        for row in &results.rows {
            let cells: Vec<String> = results
                .columns
                .iter()
                .map(|col| {
                    row.get(col)
                        .cloned()
                        .unwrap_or_else(|| "NULL".to_string())
                })
                .collect();
            builder.push_record(cells);
        }

        let mut table = builder.build();
        table.with(Style::rounded());
        println!("{table}");

        Ok(())
    }

    /// Render a simple key-value table
    pub fn render_key_value(items: &[(String, String)], _theme: &Theme) -> Result<()> {
        let mut builder = Builder::default();

        for (key, value) in items {
            builder.push_record([key, value]);
        }

        let mut table = builder.build();
        table.with(Style::rounded());
        println!("{table}");

        Ok(())
    }
}

