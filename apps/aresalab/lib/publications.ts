export interface Publication {
  slug: string;
  title: string;
  shortTitle: string;
  authors: string[];
  date: string;
  institution: string;
  abstract: string;
  keywords: string[];
  category: "research" | "book" | "dashboard";
  pdfUrl?: string;
  demoUrl?: string;
  metrics: {
    label: string;
    value: string;
  }[];
  featured: boolean;
  badge?: string;
  hasMathContent?: boolean;
}

export const publications: Publication[] = [
  // =========================================
  // FEATURED RESEARCH PAPERS (from BlazeBuilder)
  // =========================================
  {
    slug: "geoai-agentic-flow",
    title: "GeoAI Agentic Flow: Coordinate Embedding, Spatial Neural Networks, and Multi-Agent Collaboration for Fire Hazard Intelligence",
    shortTitle: "GeoAI Agentic Flow",
    authors: ["Yevheniy Chuba", "ARESA"],
    date: "2024-11",
    institution: "YoreAI / University of Pittsburgh",
    abstract: "We introduce GeoAI Agentic Flow, a novel architecture that synthesizes coordinate embedding, spatial neural networks, and multi-agent collaboration to achieve state-of-the-art performance in fire hazard risk assessment. Our contributions include the Coordinate Embedding Framework (CEF) with proven bi-Lipschitz properties, a Spatial Neural Network (SNN) with graph-based attention, and a Multi-Agent Collaboration Protocol (MACP) with convergence guarantees. Evaluation on 546,000+ California addresses demonstrates 89.7% accuracy with sub-100ms latency.",
    keywords: ["GeoAI", "Coordinate Embedding", "Multi-Agent Systems", "Spatial Intelligence", "Fire Hazard Assessment"],
    category: "research",
    pdfUrl: "/publications/pdf/GeoAI-Agentic-Flow.pdf",
    metrics: [
      { label: "Addresses Processed", value: "546K+" },
      { label: "Accuracy", value: "89.7%" },
      { label: "Latency", value: "63ms" },
      { label: "Theorems Proven", value: "8" },
    ],
    featured: true,
    badge: "FLAGSHIP",
    hasMathContent: true,
  },
  {
    slug: "coordinate-embedding",
    title: "Coordinate Embedding Framework: Theoretical Foundations for Geospatial Machine Learning",
    shortTitle: "Coordinate Embedding Framework",
    authors: ["Yevheniy Chuba", "ARESA"],
    date: "2024-11",
    institution: "YoreAI / University of Pittsburgh",
    abstract: "We present the theoretical foundations of the Coordinate Embedding Framework (CEF), proving that the mapping from geographic coordinates to semantic vectors satisfies key mathematical properties including bi-Lipschitz distance preservation, feature reconstruction bounds, and stage independence. These theoretical results provide rigorous guarantees for geospatial machine learning applications.",
    keywords: ["Coordinate Embedding", "Geospatial ML", "Bi-Lipschitz", "Distance Preservation", "Feature Encoding"],
    category: "research",
    pdfUrl: "/publications/pdf/Coordinate-Embedding-Framework.pdf",
    metrics: [
      { label: "Embedding Dim", value: "512" },
      { label: "Feature Layers", value: "4" },
      { label: "Theorems", value: "5" },
      { label: "Distortion", value: "≤33%" },
    ],
    featured: true,
    badge: "THEORY",
    hasMathContent: true,
  },
  {
    slug: "multi-agent-coordination",
    title: "Multi-Agent Geospatial Coordination: Consensus, Fault Tolerance, and Scalability",
    shortTitle: "Multi-Agent Coordination",
    authors: ["Yevheniy Chuba", "ARESA"],
    date: "2024-11",
    institution: "YoreAI / University of Pittsburgh",
    abstract: "We formalize the Multi-Agent Collaboration Protocol (MACP) for geospatial risk assessment, proving convergence guarantees, Byzantine fault tolerance bounds, and communication efficiency theorems. A 128-agent system organized into specialized pools achieves weighted consensus with provable optimality and tolerates up to 10 Byzantine failures.",
    keywords: ["Multi-Agent Systems", "Consensus", "Byzantine Fault Tolerance", "Distributed Systems", "Risk Assessment"],
    category: "research",
    pdfUrl: "/publications/pdf/Multi-Agent-Geospatial-Coordination.pdf",
    metrics: [
      { label: "Agents", value: "128" },
      { label: "Fault Tolerance", value: "10 nodes" },
      { label: "Consensus Time", value: "47ms" },
      { label: "Theorems", value: "3" },
    ],
    featured: true,
    badge: "SYSTEMS",
    hasMathContent: true,
  },

  // =========================================
  // LIVE DASHBOARDS & TOOLS
  // =========================================
  {
    slug: "fire-safety-dashboard",
    title: "US Fire Safety Analytics: Interactive Dashboard for Emergency Dispatch Intelligence",
    shortTitle: "Fire Safety Dashboard",
    authors: ["Yevheniy Chuba", "ARESA"],
    date: "2024-11",
    institution: "YoreAI",
    abstract: "An interactive dashboard analyzing 550,000+ fire department dispatch records from 2014-2025. Explore temporal patterns, geographic hotspots, false alarm trends, and priority distributions through dynamic visualizations with real-time filtering.",
    keywords: ["Fire Safety", "Emergency Response", "Dashboard", "Data Visualization", "Public Safety"],
    category: "dashboard",
    demoUrl: "https://usfiresafety.vercel.app",
    metrics: [
      { label: "Records", value: "550K+" },
      { label: "Years", value: "11" },
      { label: "Municipalities", value: "75+" },
      { label: "Interactive", value: "Yes" },
    ],
    featured: true,
    badge: "LIVE DEMO",
  },
  {
    slug: "aresadb-studio",
    title: "AresaDB: High-Performance Multi-Model Database for Healthcare ML Research",
    shortTitle: "AresaDB Studio",
    authors: ["Yevheniy Chuba", "ARESA"],
    date: "2024-12",
    institution: "YoreAI",
    abstract: "AresaDB is a unified multi-model database combining SQL, vector search, and RAG capabilities for healthcare machine learning research. Featuring sub-millisecond query latency, semantic similarity search with cosine/euclidean metrics, and retrieval-augmented generation pipelines. Pre-loaded with 287K+ healthcare records including drug reviews, medical transcriptions, and PubMed abstracts.",
    keywords: ["Multi-Model Database", "Vector Search", "RAG", "Healthcare ML", "Semantic Search", "DuckDB"],
    category: "dashboard",
    demoUrl: "https://aresadb.vercel.app",
    metrics: [
      { label: "Records", value: "287K+" },
      { label: "Query Latency", value: "<1ms" },
      { label: "Vector Dims", value: "384" },
      { label: "Datasets", value: "4" },
    ],
    featured: true,
    badge: "DATABASE",
    hasMathContent: true,
  },
  {
    slug: "aresa-studio",
    title: "ARESA Studio: Universal Database Query Interface for Multi-Source Analytics",
    shortTitle: "ARESA Studio",
    authors: ["Yevheniy Chuba", "ARESA"],
    date: "2024-12",
    institution: "YoreAI",
    abstract: "A unified command-line interface and web UI for querying 8+ database types with a single tool. Supports PostgreSQL, MySQL, SQLite, ClickHouse, BigQuery, DuckDB, Snowflake, and Databricks. Features schema exploration, query history, and connection management with hot-reloading configuration.",
    keywords: ["Database CLI", "Multi-Database", "Query Interface", "Data Engineering", "SQL", "Rust"],
    category: "dashboard",
    demoUrl: "https://aresacli-yoreai.vercel.app",
    metrics: [
      { label: "Databases", value: "8+" },
      { label: "Built With", value: "Rust" },
      { label: "CLI + Web", value: "Yes" },
      { label: "Hot Reload", value: "Yes" },
    ],
    featured: true,
    badge: "TOOL",
  },

  // =========================================
  // ADVANCED RESEARCH PUBLICATIONS
  // =========================================
  {
    slug: "clinical-documentation-intelligence",
    title: "Autonomous Clinical Documentation Intelligence: Transformer-Based Medical Transcription Analysis",
    shortTitle: "Clinical Documentation Intelligence",
    authors: ["Yevheniy Chuba", "ARESA"],
    date: "2024-12",
    institution: "YoreAI",
    abstract: "A transformer-based architecture for autonomous clinical documentation, achieving 94.2% F1-score on medical entity extraction, 89.7% accuracy on clinical relationship mapping, and 87.3% clinician acceptance rate for diagnostic suggestions. Processes 4,999 clinical notes with sub-200ms latency for real-time decision support.",
    keywords: ["Clinical NLP", "Medical Entity Extraction", "Healthcare AI", "Transformers", "BioClinicalBERT", "SNOMED-CT"],
    category: "research",
    metrics: [
      { label: "Entity F1", value: "94.2%" },
      { label: "Clinical Notes", value: "4,999" },
      { label: "Latency", value: "156ms" },
      { label: "Acceptance", value: "87.3%" },
    ],
    featured: false,
    hasMathContent: true,
  },
  {
    slug: "healthcare-knowledge-graphs",
    title: "Healthcare Knowledge Graphs: Drug Interaction Networks and Adverse Effect Prediction",
    shortTitle: "Healthcare Knowledge Graphs",
    authors: ["Yevheniy Chuba", "ARESA"],
    date: "2024-12",
    institution: "YoreAI",
    abstract: "A graph neural network architecture for healthcare knowledge graph reasoning, achieving 87.4% accuracy on drug interaction prediction and 84.2% on adverse effect forecasting. Constructs a 847K-node, 2.3M-edge knowledge graph from drug reviews, PubMed, and FDA databases, identifying 23 novel drug repurposing candidates.",
    keywords: ["Knowledge Graphs", "Graph Neural Networks", "Drug Interactions", "Adverse Effects", "Drug Repurposing", "GNN"],
    category: "research",
    metrics: [
      { label: "Nodes", value: "847K" },
      { label: "DDI Accuracy", value: "87.4%" },
      { label: "ADR F1", value: "84.2%" },
      { label: "Repurposing", value: "23 candidates" },
    ],
    featured: false,
    hasMathContent: true,
  },
];

// Books from BlazeBuilder
export interface Book {
  slug: string;
  title: string;
  author: string;
  date: string;
  description: string;
  chapters: number;
  pdfUrl?: string;
  coverGradient: string;
}

export const books: Book[] = [
  {
    slug: "mathematical-awakening",
    title: "Mathematical Awakening: Connecting the Equations of Nature and Intelligence",
    author: "Yevheniy Chuba",
    date: "2024",
    description: "A comprehensive reference guiding you through core mathematical domains (calculus, linear algebra, probability, statistics) with applications from classical physics to modern machine learning. Integrates Python programming to visualize concepts and demonstrate how mathematics powers real-world AI systems.",
    chapters: 10,
    pdfUrl: "/publications/pdf/Mathematical-Awakening.pdf",
    coverGradient: "from-purple-600 to-blue-600",
  },
  {
    slug: "practical-ml",
    title: "Advanced Machine Learning and AI Projects: From Mathematical Theory to Real-World Implementation",
    author: "Yevheniy Chuba",
    date: "2024",
    description: "50 comprehensive projects spanning healthcare, robotics, environmental science, finance, and cutting-edge AI applications. Demonstrates how to apply mathematical foundations to solve complex, real-world problems using state-of-the-art machine learning techniques.",
    chapters: 3,
    pdfUrl: "/publications/pdf/Practical-Machine-Learning.pdf",
    coverGradient: "from-emerald-600 to-cyan-600",
  },
];

export function getPublicationBySlug(slug: string): Publication | undefined {
  return publications.find((pub) => pub.slug === slug);
}

export function getFeaturedPublications(): Publication[] {
  return publications.filter((pub) => pub.featured);
}

export function getPublicationsByCategory(category: Publication["category"]): Publication[] {
  return publications.filter((pub) => pub.category === category);
}

export function getBookBySlug(slug: string): Book | undefined {
  return books.find((book) => book.slug === slug);
}
