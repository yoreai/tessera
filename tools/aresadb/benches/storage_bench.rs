//! Storage benchmarks

use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};
use aresadb::storage::{Database, Node, Value};
use tempfile::TempDir;
use tokio::runtime::Runtime;

fn insert_benchmark(c: &mut Criterion) {
    let rt = Runtime::new().unwrap();
    
    let mut group = c.benchmark_group("insert");
    
    for size in [1, 10, 100, 1000].iter() {
        group.bench_with_input(BenchmarkId::from_parameter(size), size, |b, &size| {
            b.iter(|| {
                rt.block_on(async {
                    let temp = TempDir::new().unwrap();
                    let db = Database::create(temp.path(), "bench").await.unwrap();
                    
                    for i in 0..size {
                        let props = serde_json::json!({
                            "name": format!("User {}", i),
                            "age": i
                        });
                        db.insert_node("user", black_box(props)).await.unwrap();
                    }
                });
            });
        });
    }
    
    group.finish();
}

fn query_benchmark(c: &mut Criterion) {
    let rt = Runtime::new().unwrap();
    
    // Setup: Create database with 1000 nodes
    let temp = TempDir::new().unwrap();
    rt.block_on(async {
        let db = Database::create(temp.path(), "bench").await.unwrap();
        for i in 0..1000 {
            let props = serde_json::json!({
                "name": format!("User {}", i),
                "age": i % 100
            });
            db.insert_node("user", props).await.unwrap();
        }
    });
    
    let mut group = c.benchmark_group("query");
    
    group.bench_function("get_all", |b| {
        b.iter(|| {
            rt.block_on(async {
                let db = Database::open(temp.path()).await.unwrap();
                let nodes = db.get_all_by_type("user", None).await.unwrap();
                black_box(nodes);
            });
        });
    });
    
    group.bench_function("get_with_limit", |b| {
        b.iter(|| {
            rt.block_on(async {
                let db = Database::open(temp.path()).await.unwrap();
                let nodes = db.get_all_by_type("user", Some(10)).await.unwrap();
                black_box(nodes);
            });
        });
    });
    
    group.finish();
}

criterion_group!(benches, insert_benchmark, query_benchmark);
criterion_main!(benches);

