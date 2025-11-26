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
  // LIVE DASHBOARD
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

  // =========================================
  // EXISTING ARESA PUBLICATIONS
  // =========================================
  {
    slug: "spotify-popularity",
    title: "Spotify Track Popularity Prediction: Machine Learning Analysis of Audio Features",
    shortTitle: "Spotify Popularity Analysis",
    authors: ["Yevheniy Chuba"],
    date: "2024-03",
    institution: "University of Pittsburgh",
    abstract: "Machine learning analysis of Spotify audio features to predict track popularity, examining the relationship between acoustic characteristics and streaming success across diverse musical genres.",
    keywords: ["Machine Learning", "Music Analytics", "Spotify", "Audio Features", "Popularity Prediction"],
    category: "research",
    pdfUrl: "/publications/pdf/Predicting-Song-Popularity-on-Spotify.pdf",
    metrics: [
      { label: "Tracks Analyzed", value: "10K+" },
      { label: "Features", value: "13" },
      { label: "Models", value: "5" },
      { label: "Best R²", value: "0.42" },
    ],
    featured: false,
  },
  {
    slug: "manufacturing-analytics",
    title: "Manufacturing Process Analytics: Predictive Quality Control Through Sensor Integration",
    shortTitle: "Manufacturing Analytics",
    authors: ["Yevheniy Chuba"],
    date: "2024-02",
    institution: "University of Pittsburgh",
    abstract: "Development of predictive models for manufacturing quality control using multi-sensor data integration, achieving significant improvement in defect detection accuracy through ensemble methods.",
    keywords: ["Manufacturing", "Quality Control", "Sensor Data", "Predictive Analytics", "Industrial ML"],
    category: "research",
    pdfUrl: "/publications/pdf/Manufacturing-Process-Analytics.pdf",
    metrics: [
      { label: "Sensors", value: "12" },
      { label: "Accuracy", value: "94.2%" },
      { label: "Defect Types", value: "7" },
      { label: "ROI", value: "3.2x" },
    ],
    featured: false,
  },
  {
    slug: "network-centrality",
    title: "Network Centrality in Social Graphs: PageRank and Eigenvector Analysis",
    shortTitle: "Network Centrality Analysis",
    authors: ["Yevheniy Chuba"],
    date: "2024-01",
    institution: "University of Pittsburgh",
    abstract: "Comparative analysis of centrality measures in social network graphs, examining the effectiveness of PageRank, eigenvector centrality, and betweenness centrality for influence detection.",
    keywords: ["Network Analysis", "Graph Theory", "PageRank", "Social Networks", "Centrality"],
    category: "research",
    pdfUrl: "/publications/pdf/Network-Centrality-in-College-Football.pdf",
    metrics: [
      { label: "Nodes", value: "50K+" },
      { label: "Edges", value: "1.2M" },
      { label: "Methods", value: "4" },
      { label: "Correlation", value: "0.89" },
    ],
    featured: false,
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
