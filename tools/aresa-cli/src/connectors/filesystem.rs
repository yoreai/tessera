//! Filesystem search connector

use anyhow::Result;
use chrono::{DateTime, Utc};
use regex::Regex;
use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;
use walkdir::WalkDir;

/// A file match result
#[derive(Debug, Clone, Serialize)]
pub struct FileMatch {
    pub path: PathBuf,
    pub size: Option<u64>,
    pub modified: Option<DateTime<Utc>>,
    pub matches: Option<Vec<ContentMatch>>,
}

/// A content match within a file
#[derive(Debug, Clone, Serialize)]
pub struct ContentMatch {
    pub line_number: usize,
    pub content: String,
    pub matched_text: String,
}

/// Filesystem search connector
pub struct FilesystemConnector {
    /// Maximum file size to search content (default: 10MB)
    max_file_size: u64,
}

impl FilesystemConnector {
    /// Create a new filesystem connector
    pub fn new() -> Self {
        Self {
            max_file_size: 10 * 1024 * 1024, // 10MB
        }
    }

    /// Search for files by name pattern
    pub async fn search_files(
        &self,
        path: &str,
        pattern: &str,
        limit: Option<usize>,
    ) -> Result<Vec<FileMatch>> {
        let path = Path::new(path);
        let pattern = pattern.to_lowercase();
        let limit = limit.unwrap_or(100);

        let mut results = Vec::new();

        for entry in WalkDir::new(path)
            .follow_links(true)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            if results.len() >= limit {
                break;
            }

            let entry_path = entry.path();

            // Skip hidden files and directories
            if entry_path
                .file_name()
                .map(|n| n.to_string_lossy().starts_with('.'))
                .unwrap_or(false)
            {
                continue;
            }

            let file_name = entry_path
                .file_name()
                .map(|n| n.to_string_lossy().to_lowercase())
                .unwrap_or_default();

            // Simple glob-like matching
            if matches_pattern(&file_name, &pattern) {
                let metadata = fs::metadata(entry_path).ok();
                let size = metadata.as_ref().map(|m| m.len());
                let modified = metadata
                    .and_then(|m| m.modified().ok())
                    .map(system_time_to_datetime);

                results.push(FileMatch {
                    path: entry_path.to_path_buf(),
                    size,
                    modified,
                    matches: None,
                });
            }
        }

        Ok(results)
    }

    /// Search file contents for a pattern
    pub async fn search_content(
        &self,
        path: &str,
        pattern: &str,
        limit: Option<usize>,
    ) -> Result<Vec<FileMatch>> {
        let path = Path::new(path);
        let limit = limit.unwrap_or(100);

        // Try to compile as regex, fall back to literal search
        let regex = Regex::new(pattern).unwrap_or_else(|_| {
            Regex::new(&regex::escape(pattern)).expect("Escaped pattern should be valid")
        });

        let mut results = Vec::new();
        let mut total_matches = 0;

        for entry in WalkDir::new(path)
            .follow_links(true)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            if total_matches >= limit {
                break;
            }

            let entry_path = entry.path();

            // Skip directories
            if entry_path.is_dir() {
                continue;
            }

            // Skip hidden files
            if entry_path
                .file_name()
                .map(|n| n.to_string_lossy().starts_with('.'))
                .unwrap_or(false)
            {
                continue;
            }

            // Skip large files
            if let Ok(metadata) = fs::metadata(entry_path) {
                if metadata.len() > self.max_file_size {
                    continue;
                }
            }

            // Skip binary files
            if is_binary_file(entry_path) {
                continue;
            }

            // Search file contents
            if let Ok(content) = fs::read_to_string(entry_path) {
                let mut file_matches = Vec::new();

                for (line_num, line) in content.lines().enumerate() {
                    if let Some(m) = regex.find(line) {
                        file_matches.push(ContentMatch {
                            line_number: line_num + 1,
                            content: line.to_string(),
                            matched_text: m.as_str().to_string(),
                        });
                        total_matches += 1;

                        if total_matches >= limit {
                            break;
                        }
                    }
                }

                if !file_matches.is_empty() {
                    let metadata = fs::metadata(entry_path).ok();
                    let size = metadata.as_ref().map(|m| m.len());
                    let modified = metadata
                        .and_then(|m| m.modified().ok())
                        .map(system_time_to_datetime);

                    results.push(FileMatch {
                        path: entry_path.to_path_buf(),
                        size,
                        modified,
                        matches: Some(file_matches),
                    });
                }
            }
        }

        Ok(results)
    }

    /// Find git repositories
    pub async fn find_git_repos(&self, path: &str) -> Result<Vec<GitRepoInfo>> {
        let path = Path::new(path);
        let mut repos = Vec::new();

        for entry in WalkDir::new(path)
            .max_depth(5)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            let entry_path = entry.path();

            if entry_path.ends_with(".git") && entry_path.is_dir() {
                let repo_path = entry_path.parent().unwrap_or(entry_path);

                if let Ok(repo) = git2::Repository::open(repo_path) {
                    let status = get_repo_status(&repo);
                    let branch = get_current_branch(&repo);

                    repos.push(GitRepoInfo {
                        path: repo_path.to_path_buf(),
                        branch,
                        status,
                    });
                }
            }
        }

        Ok(repos)
    }
}

impl Default for FilesystemConnector {
    fn default() -> Self {
        Self::new()
    }
}

/// Git repository information
#[derive(Debug, Clone, Serialize)]
pub struct GitRepoInfo {
    pub path: PathBuf,
    pub branch: Option<String>,
    pub status: RepoStatus,
}

/// Repository status
#[derive(Debug, Clone, Default, Serialize)]
pub struct RepoStatus {
    pub modified: usize,
    pub staged: usize,
    pub untracked: usize,
    pub clean: bool,
}

/// Check if a file is likely binary
fn is_binary_file(path: &Path) -> bool {
    // Check by extension first
    let binary_extensions = [
        "png", "jpg", "jpeg", "gif", "bmp", "ico", "webp",
        "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
        "zip", "tar", "gz", "bz2", "7z", "rar",
        "exe", "dll", "so", "dylib",
        "mp3", "mp4", "avi", "mov", "mkv",
        "woff", "woff2", "ttf", "otf", "eot",
        "pyc", "class", "o", "a",
    ];

    if let Some(ext) = path.extension() {
        let ext = ext.to_string_lossy().to_lowercase();
        if binary_extensions.contains(&ext.as_str()) {
            return true;
        }
    }

    // Read first few bytes to check for binary content
    if let Ok(bytes) = fs::read(path) {
        let check_len = bytes.len().min(8192);
        let null_count = bytes[..check_len].iter().filter(|&&b| b == 0).count();
        return null_count > check_len / 10; // More than 10% null bytes
    }

    false
}

/// Simple glob-like pattern matching
fn matches_pattern(name: &str, pattern: &str) -> bool {
    if pattern.contains('*') {
        // Convert glob to regex
        let regex_pattern = pattern
            .replace('.', "\\.")
            .replace('*', ".*");
        if let Ok(re) = Regex::new(&format!("^{}$", regex_pattern)) {
            return re.is_match(name);
        }
    }

    // Simple substring match
    name.contains(pattern)
}

/// Convert SystemTime to `DateTime<Utc>`
fn system_time_to_datetime(time: SystemTime) -> DateTime<Utc> {
    DateTime::from(time)
}

/// Get the current branch name
fn get_current_branch(repo: &git2::Repository) -> Option<String> {
    repo.head()
        .ok()
        .and_then(|head| head.shorthand().map(String::from))
}

/// Get repository status
fn get_repo_status(repo: &git2::Repository) -> RepoStatus {
    let mut status = RepoStatus::default();

    if let Ok(statuses) = repo.statuses(None) {
        for entry in statuses.iter() {
            let s = entry.status();

            if s.is_wt_modified() || s.is_wt_deleted() || s.is_wt_renamed() {
                status.modified += 1;
            }
            if s.is_index_new() || s.is_index_modified() || s.is_index_deleted() {
                status.staged += 1;
            }
            if s.is_wt_new() {
                status.untracked += 1;
            }
        }
    }

    status.clean = status.modified == 0 && status.staged == 0 && status.untracked == 0;
    status
}

