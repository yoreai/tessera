//! Tests for NLP module

#[cfg(test)]
mod tests {
    use crate::nlp::intent::*;

    #[test]
    fn test_query_intent_debug() {
        let intent = QueryIntent::SearchFiles;
        assert_eq!(format!("{:?}", intent), "SearchFiles");
    }

    #[test]
    fn test_target_type_display() {
        assert_eq!(format!("{}", TargetType::Filesystem), "filesystem");
        assert_eq!(format!("{}", TargetType::Postgres), "PostgreSQL");
        assert_eq!(format!("{}", TargetType::MySQL), "MySQL");
        assert_eq!(format!("{}", TargetType::SQLite), "SQLite");
        assert_eq!(format!("{}", TargetType::DuckDB), "DuckDB");
        assert_eq!(format!("{}", TargetType::ClickHouse), "ClickHouse");
        assert_eq!(format!("{}", TargetType::BigQuery), "BigQuery");
        assert_eq!(format!("{}", TargetType::S3), "S3");
        assert_eq!(format!("{}", TargetType::GCS), "GCS");
        assert_eq!(format!("{}", TargetType::Unknown), "unknown");
    }

    #[test]
    fn test_parsed_query_structure() {
        let query = ParsedQuery {
            original: "find python files".to_string(),
            intent: QueryIntent::SearchFiles,
            target_type: TargetType::Filesystem,
            target_source: None,
            sql: None,
            pattern: Some("*.py".to_string()),
            path: Some("/home/user".to_string()),
            context: QueryContext::default(),
        };

        assert_eq!(query.original, "find python files");
        assert!(matches!(query.intent, QueryIntent::SearchFiles));
        assert!(matches!(query.target_type, TargetType::Filesystem));
        assert_eq!(query.pattern, Some("*.py".to_string()));
    }

    #[test]
    fn test_query_context_default() {
        let context = QueryContext::default();
        assert!(context.table.is_none());
        assert!(context.columns.is_empty());
        assert!(context.conditions.is_empty());
        assert!(context.time_range.is_none());
        assert!(context.limit.is_none());
    }

    #[test]
    fn test_time_range() {
        let range = TimeRange {
            start: Some("2024-01-01".to_string()),
            end: Some("2024-12-31".to_string()),
            relative: None,
        };

        assert_eq!(range.start, Some("2024-01-01".to_string()));
        assert_eq!(range.end, Some("2024-12-31".to_string()));
    }

    #[test]
    fn test_query_intent_serialization() {
        let intent = QueryIntent::SqlQuery;
        let serialized = serde_json::to_string(&intent).unwrap();
        assert_eq!(serialized, "\"SqlQuery\"");

        let deserialized: QueryIntent = serde_json::from_str(&serialized).unwrap();
        assert!(matches!(deserialized, QueryIntent::SqlQuery));
    }

    #[test]
    fn test_target_type_serialization() {
        let target = TargetType::BigQuery;
        let serialized = serde_json::to_string(&target).unwrap();
        assert_eq!(serialized, "\"BigQuery\"");

        let deserialized: TargetType = serde_json::from_str(&serialized).unwrap();
        assert!(matches!(deserialized, TargetType::BigQuery));
    }

    #[test]
    fn test_all_intents_serializable() {
        let intents = vec![
            QueryIntent::SearchFiles,
            QueryIntent::SearchContent,
            QueryIntent::FindGitRepos,
            QueryIntent::SqlQuery,
            QueryIntent::ListTables,
            QueryIntent::DescribeTable,
            QueryIntent::SearchBlobs,
            QueryIntent::AnalyzeFile,
            QueryIntent::Unknown,
        ];

        for intent in intents {
            let serialized = serde_json::to_string(&intent).unwrap();
            let deserialized: QueryIntent = serde_json::from_str(&serialized).unwrap();
            assert_eq!(format!("{:?}", intent), format!("{:?}", deserialized));
        }
    }

    #[test]
    fn test_all_target_types_serializable() {
        let targets = vec![
            TargetType::Filesystem,
            TargetType::Postgres,
            TargetType::MySQL,
            TargetType::SQLite,
            TargetType::DuckDB,
            TargetType::ClickHouse,
            TargetType::BigQuery,
            TargetType::S3,
            TargetType::GCS,
            TargetType::Unknown,
        ];

        for target in targets {
            let serialized = serde_json::to_string(&target).unwrap();
            let deserialized: TargetType = serde_json::from_str(&serialized).unwrap();
            assert_eq!(format!("{:?}", target), format!("{:?}", deserialized));
        }
    }
}
