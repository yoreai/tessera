//! Output Module
//!
//! Rendering and visualization for query results.

mod table;
mod graph_viz;
mod json;

pub use table::TableRenderer;
pub use graph_viz::GraphRenderer;
pub use json::JsonRenderer;

use anyhow::Result;
use colored::Colorize;

use crate::cli::commands::OutputFormat;
use crate::query::{QueryResult, TraversalResult};
use crate::schema::Schema;
use crate::storage::{Node, GraphView, KvView};

/// Main renderer that dispatches to appropriate sub-renderers
pub struct Renderer {
    format: OutputFormat,
}

impl Renderer {
    /// Create a new renderer
    pub fn new(format: OutputFormat) -> Self {
        Self { format }
    }

    /// Render query results
    pub fn render_results(&self, results: &QueryResult) -> Result<()> {
        if results.is_empty() {
            println!("{}", "(no results)".bright_black());
            return Ok(());
        }

        match self.format {
            OutputFormat::Table => {
                let renderer = TableRenderer::new();
                renderer.render(results)
            }
            OutputFormat::Json => {
                let renderer = JsonRenderer::new();
                renderer.render(results)
            }
            OutputFormat::Csv => {
                self.render_csv(results)
            }
        }
    }

    /// Render traversal results
    pub fn render_traversal(&self, results: &TraversalResult) -> Result<()> {
        match self.format {
            OutputFormat::Table => {
                let renderer = TableRenderer::new();
                renderer.render(&results.to_query_result())
            }
            OutputFormat::Json => {
                let json = serde_json::to_string_pretty(results)?;
                println!("{}", json);
                Ok(())
            }
            OutputFormat::Csv => {
                self.render_csv(&results.to_query_result())
            }
        }
    }

    /// Render a single node
    pub fn render_node(&self, node: &Node) -> Result<()> {
        match self.format {
            OutputFormat::Table => {
                println!();
                println!("{}: {}", "ID".bright_cyan(), node.id);
                println!("{}: {}", "Type".bright_cyan(), node.node_type);
                println!("{}", "Properties:".bright_cyan());
                for (key, value) in &node.properties {
                    println!("  {}: {}", key.bright_green(), value);
                }
                println!("{}: {}", "Created".bright_cyan(), node.created_at);
                println!("{}: {}", "Updated".bright_cyan(), node.updated_at);
                println!();
                Ok(())
            }
            OutputFormat::Json => {
                let json = serde_json::to_string_pretty(&node.to_json())?;
                println!("{}", json);
                Ok(())
            }
            OutputFormat::Csv => {
                // Single node as CSV row
                let result = QueryResult::from_nodes(vec![node.clone()]);
                self.render_csv(&result)
            }
        }
    }

    /// Render as table view
    pub fn render_as_table(&self, nodes: &[Node]) -> Result<()> {
        let result = QueryResult::from_nodes(nodes.to_vec());
        self.render_results(&result)
    }

    /// Render as graph view
    pub fn render_as_graph(&self, graph: &GraphView) -> Result<()> {
        match self.format {
            OutputFormat::Table | OutputFormat::Csv => {
                let renderer = GraphRenderer::new();
                renderer.render_ascii(graph)
            }
            OutputFormat::Json => {
                let json = serde_json::json!({
                    "nodes": graph.nodes.iter().map(|n| n.to_json()).collect::<Vec<_>>(),
                    "edges": graph.edges.iter().map(|e| e.to_json()).collect::<Vec<_>>(),
                });
                println!("{}", serde_json::to_string_pretty(&json)?);
                Ok(())
            }
        }
    }

    /// Render as key-value view
    pub fn render_as_kv(&self, kv: &KvView) -> Result<()> {
        match self.format {
            OutputFormat::Table => {
                println!();
                for (key, value) in &kv.entries {
                    println!("{}: {}", key.bright_cyan(), value);
                }
                println!();
                Ok(())
            }
            OutputFormat::Json => {
                let mut map = serde_json::Map::new();
                for (key, value) in &kv.entries {
                    map.insert(key.clone(), value.to_json());
                }
                println!("{}", serde_json::to_string_pretty(&serde_json::Value::Object(map))?);
                Ok(())
            }
            OutputFormat::Csv => {
                println!("key,value");
                for (key, value) in &kv.entries {
                    println!("{},{}", key, value);
                }
                Ok(())
            }
        }
    }

    /// Render schemas list
    pub fn render_schemas(&self, schemas: &[Schema]) -> Result<()> {
        match self.format {
            OutputFormat::Table => {
                println!();
                println!("{}", "Schemas:".bright_yellow().bold());
                println!("{}", "─".repeat(60));

                for schema in schemas {
                    println!(
                        "  {} ({} fields, v{})",
                        schema.name.bright_cyan(),
                        schema.fields.len(),
                        schema.version
                    );
                }

                println!();
                Ok(())
            }
            OutputFormat::Json => {
                let json = serde_json::to_string_pretty(schemas)?;
                println!("{}", json);
                Ok(())
            }
            OutputFormat::Csv => {
                println!("name,field_count,version");
                for schema in schemas {
                    println!("{},{},{}", schema.name, schema.fields.len(), schema.version);
                }
                Ok(())
            }
        }
    }

    /// Render schema details
    pub fn render_schema_details(&self, schema: &Schema) -> Result<()> {
        match self.format {
            OutputFormat::Table => {
                println!();
                println!("{}: {}", "Schema".bright_yellow().bold(), schema.name.bright_cyan());
                println!("{}: {}", "Version".bright_cyan(), schema.version);
                println!();
                println!("{}", "Fields:".bright_yellow());
                println!("{}", "─".repeat(60));

                for field in &schema.fields {
                    let mut attrs = Vec::new();
                    if !field.nullable {
                        attrs.push("NOT NULL".to_string());
                    }
                    if field.unique {
                        attrs.push("UNIQUE".to_string());
                    }
                    if field.indexed {
                        attrs.push("INDEXED".to_string());
                    }
                    if let Some(ref default) = field.default {
                        attrs.push(format!("DEFAULT {}", default));
                    }

                    let attrs_str = if attrs.is_empty() {
                        String::new()
                    } else {
                        format!(" [{}]", attrs.join(", "))
                    };

                    println!(
                        "  {} {:?}{}",
                        field.name.bright_green(),
                        field.field_type,
                        attrs_str.bright_black()
                    );
                }

                println!();
                println!("{}", "SQL:".bright_yellow());
                println!("{}", schema.to_sql().bright_black());
                println!();
                Ok(())
            }
            OutputFormat::Json => {
                let json = serde_json::to_string_pretty(schema)?;
                println!("{}", json);
                Ok(())
            }
            OutputFormat::Csv => {
                println!("field_name,field_type,nullable,unique,indexed,default");
                for field in &schema.fields {
                    println!(
                        "{},{:?},{},{},{},{}",
                        field.name,
                        field.field_type,
                        field.nullable,
                        field.unique,
                        field.indexed,
                        field.default.as_deref().unwrap_or("")
                    );
                }
                Ok(())
            }
        }
    }

    /// Render as CSV
    fn render_csv(&self, results: &QueryResult) -> Result<()> {
        // Header
        println!("{}", results.columns.join(","));

        // Rows
        for row in &results.rows {
            let row_str: Vec<String> = row.iter()
                .map(|v| {
                    let s = format!("{}", v);
                    if s.contains(',') || s.contains('"') || s.contains('\n') {
                        format!("\"{}\"", s.replace('"', "\"\""))
                    } else {
                        s
                    }
                })
                .collect();
            println!("{}", row_str.join(","));
        }

        Ok(())
    }
}


