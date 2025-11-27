//! Integration tests for ARESA CLI
//!
//! These tests verify end-to-end functionality of the CLI.

use assert_cmd::Command;
use predicates::prelude::*;

/// Get a command for the aresa binary
fn aresa() -> Command {
    Command::cargo_bin("aresa").unwrap()
}

#[test]
fn test_cli_version() {
    aresa()
        .arg("--version")
        .assert()
        .success()
        .stdout(predicate::str::contains("aresa"));
}

#[test]
fn test_cli_help() {
    aresa()
        .arg("--help")
        .assert()
        .success()
        .stdout(predicate::str::contains("Natural language interface"))
        .stdout(predicate::str::contains("config"))
        .stdout(predicate::str::contains("files"))
        .stdout(predicate::str::contains("query"));
}

#[test]
fn test_config_help() {
    aresa()
        .args(["config", "--help"])
        .assert()
        .success()
        .stdout(predicate::str::contains("add"))
        .stdout(predicate::str::contains("remove"))
        .stdout(predicate::str::contains("list"));
}

#[test]
fn test_files_help() {
    aresa()
        .args(["files", "--help"])
        .assert()
        .success()
        .stdout(predicate::str::contains("pattern"))
        .stdout(predicate::str::contains("path"));
}

#[test]
fn test_sources_help() {
    aresa()
        .args(["sources", "--help"])
        .assert()
        .success();
}

#[test]
fn test_status_help() {
    aresa()
        .args(["status", "--help"])
        .assert()
        .success();
}

#[test]
fn test_files_search_current_dir() {
    aresa()
        .args(["files", "*.rs", "--path", "."])
        .assert()
        .success();
}

#[test]
fn test_files_search_nonexistent_pattern() {
    aresa()
        .args(["files", "*.nonexistent_extension_xyz", "--path", "."])
        .assert()
        .success();
}

#[test]
fn test_files_content_search() {
    aresa()
        .args(["files", "fn main", "--path", ".", "--content"])
        .assert()
        .success();
}

#[test]
fn test_invalid_subcommand() {
    aresa()
        .arg("invalid_command")
        .assert()
        .failure();
}

#[test]
fn test_config_list_empty() {
    // This might fail if there's existing config, but should not crash
    aresa()
        .args(["config", "list"])
        .assert()
        .success();
}

// Note: These tests require actual database connections and are skipped by default
// To run them, set the appropriate environment variables

#[test]
#[ignore = "Requires PostgreSQL connection"]
fn test_postgres_connection() {
    // Would test actual postgres connection
}

#[test]
#[ignore = "Requires MySQL connection"]
fn test_mysql_connection() {
    // Would test actual mysql connection
}

#[test]
#[ignore = "Requires BigQuery credentials"]
fn test_bigquery_connection() {
    // Would test actual bigquery connection
}

#[test]
#[ignore = "Requires S3 credentials"]
fn test_s3_connection() {
    // Would test actual s3 connection
}

#[test]
#[ignore = "Requires GCS credentials"]
fn test_gcs_connection() {
    // Would test actual gcs connection
}

