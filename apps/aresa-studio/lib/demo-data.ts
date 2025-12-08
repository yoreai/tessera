/**
 * ARESA Studio - Demo Mode Data
 *
 * Comprehensive sample data showcasing all supported database types.
 * Each database type demonstrates its typical use case with realistic data.
 */

export const DEMO_MODE = true;

// ============================================================================
// DEMO CONNECTIONS - All 8 supported database types
// ============================================================================

export interface DemoConnection {
  name: string;
  type: string;
  details: string;
  status: "connected" | "disconnected";
  description: string;
  icon: string;
  useCase: string;
}

export const DEMO_CONNECTIONS: DemoConnection[] = [
  {
    name: "demo-postgres",
    type: "PostgreSQL",
    details: "postgresql://demo@localhost:5432/ecommerce",
    status: "connected",
    description: "E-commerce platform database",
    icon: "🐘",
    useCase: "Transactional data, user management, orders"
  },
  {
    name: "demo-mysql",
    type: "MySQL",
    details: "mysql://demo@localhost:3306/blog",
    status: "connected",
    description: "Blog and CMS database",
    icon: "🐬",
    useCase: "Content management, posts, comments"
  },
  {
    name: "demo-sqlite",
    type: "SQLite",
    details: "sqlite:///app/data/local.db",
    status: "connected",
    description: "Local application database",
    icon: "📦",
    useCase: "Embedded storage, configuration, local cache"
  },
  {
    name: "demo-bigquery",
    type: "BigQuery",
    details: "project: aresa-demo, dataset: analytics",
    status: "connected",
    description: "Google Cloud analytics warehouse",
    icon: "📊",
    useCase: "Large-scale analytics, petabyte queries"
  },
  {
    name: "demo-clickhouse",
    type: "ClickHouse",
    details: "clickhouse://demo@localhost:8123/logs",
    status: "connected",
    description: "Real-time log analytics",
    icon: "⚡",
    useCase: "Time-series data, log analysis, metrics"
  },
  {
    name: "demo-duckdb",
    type: "DuckDB",
    details: "duckdb:///analytics/sales.duckdb",
    status: "connected",
    description: "Local OLAP analytics",
    icon: "🦆",
    useCase: "Parquet files, local analytics, data science"
  },
  {
    name: "demo-snowflake",
    type: "Snowflake",
    details: "account: aresa-demo.us-east-1",
    status: "connected",
    description: "Enterprise data warehouse",
    icon: "❄️",
    useCase: "Data warehouse, cross-cloud analytics"
  },
  {
    name: "demo-databricks",
    type: "Databricks",
    details: "workspace: aresa-demo.cloud.databricks.com",
    status: "connected",
    description: "Lakehouse & ML platform",
    icon: "🧱",
    useCase: "Data lakehouse, ML features, Delta Lake"
  }
];

// ============================================================================
// DEMO SCHEMAS - Tables per database
// ============================================================================

export interface DemoTable {
  schema: string;
  name: string;
  type: "table" | "view";
  rowCount?: number;
  description?: string;
}

export const DEMO_SCHEMAS: Record<string, DemoTable[]> = {
  "demo-postgres": [
    { schema: "public", name: "users", type: "table", rowCount: 15420, description: "Customer accounts" },
    { schema: "public", name: "orders", type: "table", rowCount: 89234, description: "Purchase orders" },
    { schema: "public", name: "products", type: "table", rowCount: 2341, description: "Product catalog" },
    { schema: "public", name: "order_items", type: "table", rowCount: 234567, description: "Line items per order" },
    { schema: "public", name: "categories", type: "table", rowCount: 45, description: "Product categories" },
    { schema: "public", name: "reviews", type: "table", rowCount: 12890, description: "Product reviews" },
    { schema: "public", name: "active_orders", type: "view", description: "Orders in progress" },
    { schema: "public", name: "top_sellers", type: "view", description: "Best selling products" },
  ],
  "demo-mysql": [
    { schema: "blog", name: "posts", type: "table", rowCount: 1543, description: "Blog articles" },
    { schema: "blog", name: "comments", type: "table", rowCount: 8920, description: "Post comments" },
    { schema: "blog", name: "authors", type: "table", rowCount: 42, description: "Content authors" },
    { schema: "blog", name: "tags", type: "table", rowCount: 156, description: "Content tags" },
    { schema: "blog", name: "post_tags", type: "table", rowCount: 4231, description: "Post-tag mapping" },
    { schema: "blog", name: "media", type: "table", rowCount: 3421, description: "Uploaded media files" },
  ],
  "demo-sqlite": [
    { schema: "main", name: "settings", type: "table", rowCount: 24, description: "App configuration" },
    { schema: "main", name: "cache", type: "table", rowCount: 1892, description: "Response cache" },
    { schema: "main", name: "sessions", type: "table", rowCount: 156, description: "User sessions" },
    { schema: "main", name: "logs", type: "table", rowCount: 45230, description: "Application logs" },
  ],
  "demo-bigquery": [
    { schema: "analytics", name: "events", type: "table", rowCount: 892340000, description: "User events (892M rows)" },
    { schema: "analytics", name: "sessions", type: "table", rowCount: 45670000, description: "User sessions (45M rows)" },
    { schema: "analytics", name: "conversions", type: "table", rowCount: 1234000, description: "Conversion events" },
    { schema: "analytics", name: "daily_metrics", type: "view", description: "Aggregated daily stats" },
    { schema: "ml_features", name: "user_features", type: "table", rowCount: 15000000, description: "ML feature store" },
    { schema: "ml_features", name: "product_embeddings", type: "table", rowCount: 500000, description: "Product vectors" },
  ],
  "demo-clickhouse": [
    { schema: "logs", name: "application_logs", type: "table", rowCount: 1250000000, description: "App logs (1.25B rows)" },
    { schema: "logs", name: "access_logs", type: "table", rowCount: 3400000000, description: "HTTP access (3.4B rows)" },
    { schema: "logs", name: "error_logs", type: "table", rowCount: 45000000, description: "Error events" },
    { schema: "metrics", name: "system_metrics", type: "table", rowCount: 890000000, description: "System metrics" },
    { schema: "metrics", name: "custom_metrics", type: "table", rowCount: 234000000, description: "Business metrics" },
  ],
  "demo-duckdb": [
    { schema: "main", name: "sales_2024", type: "table", rowCount: 2340000, description: "2024 sales data" },
    { schema: "main", name: "customers", type: "table", rowCount: 89000, description: "Customer master" },
    { schema: "main", name: "inventory", type: "table", rowCount: 12340, description: "Inventory levels" },
    { schema: "external", name: "parquet_sales", type: "view", description: "Parquet file reference" },
  ],
  "demo-snowflake": [
    { schema: "RAW", name: "TRANSACTIONS", type: "table", rowCount: 450000000, description: "Raw transactions" },
    { schema: "RAW", name: "CUSTOMER_DATA", type: "table", rowCount: 12000000, description: "Customer records" },
    { schema: "TRANSFORMED", name: "FACT_SALES", type: "table", rowCount: 890000000, description: "Sales fact table" },
    { schema: "TRANSFORMED", name: "DIM_PRODUCT", type: "table", rowCount: 45000, description: "Product dimension" },
    { schema: "TRANSFORMED", name: "DIM_DATE", type: "table", rowCount: 3650, description: "Date dimension" },
    { schema: "ANALYTICS", name: "REVENUE_SUMMARY", type: "view", description: "Revenue analytics" },
  ],
  "demo-databricks": [
    { schema: "bronze", name: "raw_events", type: "table", rowCount: 2300000000, description: "Raw event stream" },
    { schema: "silver", name: "cleaned_events", type: "table", rowCount: 1800000000, description: "Cleaned events" },
    { schema: "gold", name: "user_metrics", type: "table", rowCount: 15000000, description: "User-level metrics" },
    { schema: "gold", name: "product_metrics", type: "table", rowCount: 500000, description: "Product analytics" },
    { schema: "ml", name: "feature_store", type: "table", rowCount: 45000000, description: "ML feature store" },
    { schema: "ml", name: "model_predictions", type: "table", rowCount: 89000000, description: "Model outputs" },
  ],
};

// ============================================================================
// DEMO TABLE COLUMNS
// ============================================================================

export interface DemoColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
  description?: string;
}

export const DEMO_COLUMNS: Record<string, Record<string, DemoColumn[]>> = {
  "demo-postgres": {
    "users": [
      { column_name: "id", data_type: "uuid", is_nullable: "NO", description: "Primary key" },
      { column_name: "email", data_type: "varchar(255)", is_nullable: "NO", description: "User email" },
      { column_name: "name", data_type: "varchar(100)", is_nullable: "YES", description: "Display name" },
      { column_name: "created_at", data_type: "timestamptz", is_nullable: "NO", description: "Account creation" },
      { column_name: "updated_at", data_type: "timestamptz", is_nullable: "YES", description: "Last update" },
      { column_name: "status", data_type: "varchar(20)", is_nullable: "NO", description: "Account status" },
    ],
    "orders": [
      { column_name: "id", data_type: "uuid", is_nullable: "NO", description: "Order ID" },
      { column_name: "user_id", data_type: "uuid", is_nullable: "NO", description: "Customer FK" },
      { column_name: "total", data_type: "decimal(10,2)", is_nullable: "NO", description: "Order total" },
      { column_name: "status", data_type: "varchar(20)", is_nullable: "NO", description: "Order status" },
      { column_name: "created_at", data_type: "timestamptz", is_nullable: "NO", description: "Order date" },
      { column_name: "shipped_at", data_type: "timestamptz", is_nullable: "YES", description: "Ship date" },
    ],
    "products": [
      { column_name: "id", data_type: "uuid", is_nullable: "NO", description: "Product ID" },
      { column_name: "name", data_type: "varchar(200)", is_nullable: "NO", description: "Product name" },
      { column_name: "price", data_type: "decimal(10,2)", is_nullable: "NO", description: "Unit price" },
      { column_name: "category_id", data_type: "integer", is_nullable: "YES", description: "Category FK" },
      { column_name: "stock", data_type: "integer", is_nullable: "NO", description: "Stock quantity" },
      { column_name: "description", data_type: "text", is_nullable: "YES", description: "Product description" },
    ],
  },
  "demo-mysql": {
    "posts": [
      { column_name: "id", data_type: "int", is_nullable: "NO", description: "Post ID" },
      { column_name: "title", data_type: "varchar(255)", is_nullable: "NO", description: "Post title" },
      { column_name: "slug", data_type: "varchar(255)", is_nullable: "NO", description: "URL slug" },
      { column_name: "content", data_type: "longtext", is_nullable: "YES", description: "Post body" },
      { column_name: "author_id", data_type: "int", is_nullable: "NO", description: "Author FK" },
      { column_name: "published_at", data_type: "datetime", is_nullable: "YES", description: "Publish date" },
      { column_name: "status", data_type: "enum('draft','published','archived')", is_nullable: "NO" },
    ],
  },
  "demo-bigquery": {
    "events": [
      { column_name: "event_id", data_type: "STRING", is_nullable: "NO", description: "Event UUID" },
      { column_name: "user_id", data_type: "STRING", is_nullable: "YES", description: "User identifier" },
      { column_name: "event_type", data_type: "STRING", is_nullable: "NO", description: "Event category" },
      { column_name: "event_name", data_type: "STRING", is_nullable: "NO", description: "Event name" },
      { column_name: "properties", data_type: "JSON", is_nullable: "YES", description: "Event properties" },
      { column_name: "timestamp", data_type: "TIMESTAMP", is_nullable: "NO", description: "Event time" },
      { column_name: "partition_date", data_type: "DATE", is_nullable: "NO", description: "Partition key" },
    ],
  },
  "demo-clickhouse": {
    "application_logs": [
      { column_name: "timestamp", data_type: "DateTime64(3)", is_nullable: "NO", description: "Log time" },
      { column_name: "level", data_type: "LowCardinality(String)", is_nullable: "NO", description: "Log level" },
      { column_name: "service", data_type: "LowCardinality(String)", is_nullable: "NO", description: "Service name" },
      { column_name: "message", data_type: "String", is_nullable: "NO", description: "Log message" },
      { column_name: "trace_id", data_type: "String", is_nullable: "YES", description: "Trace ID" },
      { column_name: "metadata", data_type: "Map(String, String)", is_nullable: "YES", description: "Extra data" },
    ],
  },
  "demo-snowflake": {
    "FACT_SALES": [
      { column_name: "SALE_ID", data_type: "NUMBER(38,0)", is_nullable: "NO", description: "Sale ID" },
      { column_name: "PRODUCT_KEY", data_type: "NUMBER(38,0)", is_nullable: "NO", description: "Product FK" },
      { column_name: "CUSTOMER_KEY", data_type: "NUMBER(38,0)", is_nullable: "NO", description: "Customer FK" },
      { column_name: "DATE_KEY", data_type: "NUMBER(38,0)", is_nullable: "NO", description: "Date FK" },
      { column_name: "QUANTITY", data_type: "NUMBER(10,0)", is_nullable: "NO", description: "Units sold" },
      { column_name: "AMOUNT", data_type: "NUMBER(18,2)", is_nullable: "NO", description: "Sale amount" },
      { column_name: "DISCOUNT", data_type: "NUMBER(5,2)", is_nullable: "YES", description: "Discount %" },
    ],
  },
  "demo-databricks": {
    "feature_store": [
      { column_name: "user_id", data_type: "string", is_nullable: "NO", description: "User identifier" },
      { column_name: "feature_timestamp", data_type: "timestamp", is_nullable: "NO", description: "Feature time" },
      { column_name: "purchase_count_30d", data_type: "int", is_nullable: "YES", description: "30-day purchases" },
      { column_name: "avg_order_value", data_type: "double", is_nullable: "YES", description: "AOV" },
      { column_name: "days_since_last_purchase", data_type: "int", is_nullable: "YES", description: "Recency" },
      { column_name: "user_segment", data_type: "string", is_nullable: "YES", description: "ML segment" },
    ],
  },
};

// ============================================================================
// DEMO QUERY RESULTS
// ============================================================================

export interface DemoQueryResult {
  columns: string[];
  rows: Record<string, string>[];
  rowCount: number;
  executionTimeMs: number;
}

// Sample queries that showcase each database's strengths
export const DEMO_SAMPLE_QUERIES: Record<string, { query: string; description: string }[]> = {
  "demo-postgres": [
    { query: "SELECT * FROM users ORDER BY created_at DESC LIMIT 10", description: "Recent users" },
    { query: "SELECT status, COUNT(*) FROM orders GROUP BY status", description: "Orders by status" },
    { query: "SELECT p.name, SUM(oi.quantity) as sold FROM products p JOIN order_items oi ON p.id = oi.product_id GROUP BY p.name ORDER BY sold DESC LIMIT 5", description: "Top products" },
  ],
  "demo-bigquery": [
    { query: "SELECT event_type, COUNT(*) as events FROM analytics.events WHERE partition_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) GROUP BY event_type ORDER BY events DESC", description: "Weekly events" },
    { query: "SELECT APPROX_COUNT_DISTINCT(user_id) as unique_users FROM analytics.events WHERE partition_date = CURRENT_DATE()", description: "Today's users" },
  ],
  "demo-clickhouse": [
    { query: "SELECT level, count() as cnt FROM logs.application_logs WHERE timestamp >= now() - INTERVAL 1 HOUR GROUP BY level ORDER BY cnt DESC", description: "Hourly log levels" },
    { query: "SELECT service, quantile(0.99)(response_time) as p99 FROM metrics.system_metrics GROUP BY service", description: "P99 latency" },
  ],
  "demo-snowflake": [
    { query: "SELECT DATE_TRUNC('month', d.DATE_VALUE) as month, SUM(f.AMOUNT) as revenue FROM TRANSFORMED.FACT_SALES f JOIN TRANSFORMED.DIM_DATE d ON f.DATE_KEY = d.DATE_KEY GROUP BY 1 ORDER BY 1", description: "Monthly revenue" },
  ],
};

// Generate realistic query results based on connection and query
export function generateQueryResult(source: string, query: string): DemoQueryResult {
  const lowerQuery = query.toLowerCase();

  // PostgreSQL - E-commerce data
  if (source === "demo-postgres") {
    if (lowerQuery.includes("users")) {
      return {
        columns: ["id", "email", "name", "created_at", "status"],
        rows: [
          { id: "a1b2c3d4", email: "sarah@example.com", name: "Sarah Chen", created_at: "2024-12-07 14:32:00", status: "active" },
          { id: "e5f6g7h8", email: "marcus@demo.co", name: "Marcus Johnson", created_at: "2024-12-06 09:15:00", status: "active" },
          { id: "i9j0k1l2", email: "priya@test.io", name: "Priya Patel", created_at: "2024-12-05 18:45:00", status: "active" },
          { id: "m3n4o5p6", email: "alex@sample.net", name: "Alex Rivera", created_at: "2024-12-04 11:20:00", status: "pending" },
          { id: "q7r8s9t0", email: "emma@example.org", name: "Emma Watson", created_at: "2024-12-03 16:50:00", status: "active" },
        ],
        rowCount: 5,
        executionTimeMs: 12,
      };
    }
    if (lowerQuery.includes("orders") && lowerQuery.includes("group by")) {
      return {
        columns: ["status", "count"],
        rows: [
          { status: "completed", count: "45231" },
          { status: "processing", count: "1234" },
          { status: "shipped", count: "8921" },
          { status: "pending", count: "567" },
          { status: "cancelled", count: "234" },
        ],
        rowCount: 5,
        executionTimeMs: 45,
      };
    }
    if (lowerQuery.includes("products")) {
      return {
        columns: ["name", "price", "stock", "category"],
        rows: [
          { name: "Wireless Headphones Pro", price: "199.99", stock: "234", category: "Electronics" },
          { name: "Organic Coffee Beans 1kg", price: "24.99", stock: "1892", category: "Food" },
          { name: "Ergonomic Office Chair", price: "449.00", stock: "67", category: "Furniture" },
          { name: "Smart Watch Series X", price: "349.99", stock: "445", category: "Electronics" },
          { name: "Yoga Mat Premium", price: "59.99", stock: "892", category: "Sports" },
        ],
        rowCount: 5,
        executionTimeMs: 8,
      };
    }
  }

  // BigQuery - Analytics at scale
  if (source === "demo-bigquery") {
    if (lowerQuery.includes("event_type") || lowerQuery.includes("events")) {
      return {
        columns: ["event_type", "events", "unique_users"],
        rows: [
          { event_type: "page_view", events: "45,230,000", unique_users: "2,340,000" },
          { event_type: "click", events: "12,450,000", unique_users: "1,890,000" },
          { event_type: "purchase", events: "234,000", unique_users: "189,000" },
          { event_type: "signup", events: "45,600", unique_users: "45,600" },
          { event_type: "search", events: "8,920,000", unique_users: "1,234,000" },
        ],
        rowCount: 5,
        executionTimeMs: 2340,
      };
    }
  }

  // ClickHouse - Time-series & logs
  if (source === "demo-clickhouse") {
    if (lowerQuery.includes("logs") || lowerQuery.includes("level")) {
      return {
        columns: ["timestamp", "level", "service", "message", "count"],
        rows: [
          { timestamp: "2024-12-08 06:00:00", level: "INFO", service: "api-gateway", message: "Request processed", count: "1,234,567" },
          { timestamp: "2024-12-08 06:00:00", level: "WARN", service: "auth-service", message: "Rate limit approaching", count: "45,231" },
          { timestamp: "2024-12-08 06:00:00", level: "ERROR", service: "payment-service", message: "Connection timeout", count: "234" },
          { timestamp: "2024-12-08 06:00:00", level: "DEBUG", service: "user-service", message: "Cache miss", count: "89,234" },
        ],
        rowCount: 4,
        executionTimeMs: 156,
      };
    }
  }

  // Snowflake - Enterprise data warehouse
  if (source === "demo-snowflake") {
    if (lowerQuery.includes("revenue") || lowerQuery.includes("sales")) {
      return {
        columns: ["month", "revenue", "orders", "avg_order_value"],
        rows: [
          { month: "2024-01", revenue: "$12,345,678", orders: "89,234", avg_order_value: "$138.35" },
          { month: "2024-02", revenue: "$11,234,567", orders: "82,456", avg_order_value: "$136.25" },
          { month: "2024-03", revenue: "$14,567,890", orders: "98,765", avg_order_value: "$147.50" },
          { month: "2024-04", revenue: "$13,456,789", orders: "91,234", avg_order_value: "$147.50" },
        ],
        rowCount: 4,
        executionTimeMs: 890,
      };
    }
  }

  // Databricks - ML & Lakehouse
  if (source === "demo-databricks") {
    if (lowerQuery.includes("feature") || lowerQuery.includes("ml")) {
      return {
        columns: ["user_id", "purchase_count_30d", "avg_order_value", "user_segment", "churn_probability"],
        rows: [
          { user_id: "u_12345", purchase_count_30d: "8", avg_order_value: "$156.78", user_segment: "high_value", churn_probability: "0.12" },
          { user_id: "u_23456", purchase_count_30d: "2", avg_order_value: "$45.23", user_segment: "at_risk", churn_probability: "0.67" },
          { user_id: "u_34567", purchase_count_30d: "15", avg_order_value: "$234.50", user_segment: "champion", churn_probability: "0.05" },
          { user_id: "u_45678", purchase_count_30d: "0", avg_order_value: "$0.00", user_segment: "churned", churn_probability: "0.95" },
        ],
        rowCount: 4,
        executionTimeMs: 1234,
      };
    }
  }

  // DuckDB - Local analytics
  if (source === "demo-duckdb") {
    return {
      columns: ["date", "product_category", "total_sales", "units_sold"],
      rows: [
        { date: "2024-12-07", product_category: "Electronics", total_sales: "$234,567", units_sold: "1,234" },
        { date: "2024-12-07", product_category: "Clothing", total_sales: "$89,234", units_sold: "2,456" },
        { date: "2024-12-07", product_category: "Home", total_sales: "$67,890", units_sold: "892" },
        { date: "2024-12-07", product_category: "Sports", total_sales: "$45,678", units_sold: "567" },
      ],
      rowCount: 4,
      executionTimeMs: 23,
    };
  }

  // MySQL - Blog/CMS
  if (source === "demo-mysql") {
    return {
      columns: ["id", "title", "author", "published_at", "views"],
      rows: [
        { id: "1", title: "Getting Started with ARESA", author: "Sarah Chen", published_at: "2024-12-07", views: "12,345" },
        { id: "2", title: "Advanced SQL Techniques", author: "Marcus Johnson", published_at: "2024-12-05", views: "8,923" },
        { id: "3", title: "Database Performance Tips", author: "Priya Patel", published_at: "2024-12-03", views: "6,789" },
      ],
      rowCount: 3,
      executionTimeMs: 15,
    };
  }

  // SQLite - Local app data
  if (source === "demo-sqlite") {
    return {
      columns: ["key", "value", "updated_at"],
      rows: [
        { key: "theme", value: "dark", updated_at: "2024-12-08 06:00:00" },
        { key: "language", value: "en-US", updated_at: "2024-12-07 14:30:00" },
        { key: "cache_ttl", value: "3600", updated_at: "2024-12-06 09:00:00" },
      ],
      rowCount: 3,
      executionTimeMs: 2,
    };
  }

  // Default fallback
  return {
    columns: ["message"],
    rows: [{ message: "Query executed successfully in demo mode" }],
    rowCount: 1,
    executionTimeMs: 10,
  };
}

// ============================================================================
// DEMO QUERY HISTORY
// ============================================================================

export const DEMO_HISTORY = [
  {
    id: "h1",
    source: "demo-postgres",
    query: "SELECT * FROM users ORDER BY created_at DESC LIMIT 10",
    executedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    duration: 12,
    rowCount: 10,
    status: "success" as const,
  },
  {
    id: "h2",
    source: "demo-bigquery",
    query: "SELECT event_type, COUNT(*) FROM analytics.events GROUP BY event_type",
    executedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    duration: 2340,
    rowCount: 5,
    status: "success" as const,
  },
  {
    id: "h3",
    source: "demo-clickhouse",
    query: "SELECT level, count() FROM logs.application_logs WHERE timestamp >= now() - INTERVAL 1 HOUR GROUP BY level",
    executedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    duration: 156,
    rowCount: 4,
    status: "success" as const,
  },
  {
    id: "h4",
    source: "demo-snowflake",
    query: "SELECT DATE_TRUNC('month', DATE_VALUE) as month, SUM(AMOUNT) as revenue FROM TRANSFORMED.FACT_SALES GROUP BY 1",
    executedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    duration: 890,
    rowCount: 12,
    status: "success" as const,
  },
  {
    id: "h5",
    source: "demo-databricks",
    query: "SELECT user_segment, COUNT(*) as users FROM ml.feature_store GROUP BY user_segment",
    executedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    duration: 1234,
    rowCount: 4,
    status: "success" as const,
  },
];

