import Link from "next/link";

const publications = {
  spotify: {
    title: "Predicting Song Popularity on Spotify",
    subtitle: "Machine Learning Classification with Genre Interaction Modeling",
    metrics: [
      { label: "ROC AUC", value: "0.675" },
      { label: "Models", value: "6 Progressive" },
      { label: "Charts", value: "7" },
    ],
    abstract: "This study investigates the predictability of song popularity on Spotify using machine learning techniques. We developed multiple logistic regression models to predict binary popularity outcomes across six genres, achieving ROC AUC of 0.675 with robust cross-validation.",
    findings: [
      "Genre emerged as the strongest predictor (pop/rock 1.97× and 1.72× higher odds)",
      "Instrumentalness shows strong negative effect (-0.22) - vocal tracks more popular",
      "Genre×audio interactions reveal context-specific effects (danceability critical for rap +0.33)",
      "Cross-validation confirms robust generalization (training vs CV AUC < 0.004)",
    ],
    pdfFile: "Predicting-Song-Popularity-on-Spotify.pdf",
  },
  manufacturing: {
    title: "Manufacturing Process Analytics",
    subtitle: "Multi-Source Data Integration for Operational Intelligence",
    metrics: [
      { label: "Sources", value: "5 CSVs" },
      { label: "Observations", value: "45K" },
      { label: "Charts", value: "8" },
    ],
    abstract: "Demonstrates data engineering for manufacturing analytics through multi-source integration. Analyzed 45,000 observations from three machines, discovering systematic quality patterns and supplier performance differences.",
    findings: [
      "Discovered cyclical 8-batch failure pattern across all machines/suppliers",
      "PCA reduced 4 variables to 2 components retaining 73% variance",
      "K-means identified 5 distinct operational regimes (elbow method)",
      "Supplier B shows tighter clustering indicating better material consistency",
    ],
    pdfFile: "Manufacturing-Process-Analytics.pdf",
  },
  "fire-safety": {
    title: "Data-Driven Fire Safety Analytics",
    subtitle: "Leveraging 930K Emergency Records for Public Policy",
    metrics: [
      { label: "Records", value: "930,808" },
      { label: "Timespan", value: "10 Years" },
      { label: "Cost Impact", value: "$225M" },
    ],
    abstract: "Analysis of decade-long emergency dispatch data reveals critical patterns for fire safety policy. 37.3% of dispatches are fire alarms, costing $225M over 10 years, with geographic disparities and seasonal patterns informing resource allocation.",
    findings: [
      "37.3% of all dispatches are fire alarms - many false (estimated $225M cost)",
      "Geographic disparities: 3× variation in per-capita incident rates",
      "Seasonal patterns: +34% winter structure fires, +78% summer outdoor fires",
      "Three policy recommendations with projected 30-50% false alarm reduction",
    ],
    pdfFile: "Data-Driven-Fire-Safety-Analytics.pdf",
  },
  network: {
    title: "Network Centrality in College Football",
    subtitle: "Applying Graph Theory to Sports Competition",
    metrics: [
      { label: "Teams", value: "115" },
      { label: "Games", value: "613" },
      { label: "Charts", value: "3" },
    ],
    abstract: "Applies network science to analyze competitive relationships in college football. Demonstrates how degree and betweenness centrality reveal different dimensions of team importance, with methods generalizable to business and biological networks.",
    findings: [
      "Only 12 teams exceed median degree centrality vs 57 for betweenness",
      "Penn State: High degree (0.421) - breadth of connections",
      "Ohio State: High betweenness (0.152) - critical bridge position",
      "Methods apply to business partnerships, protein interactions, supply chains",
    ],
    pdfFile: "Network-Centrality-in-College-Football.pdf",
  },
};

export default function PublicationPage({ params }: { params: { slug: string } }) {
  const pub = publications[params.slug as keyof typeof publications];

  if (!pub) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Publication Not Found</h1>
          <Link href="/" className="text-blue-400 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/" className="text-blue-400 hover:underline mb-6 inline-block">
          ← Back to Publications
        </Link>

        <article className="bg-gray-800 rounded-lg p-8 mt-6">
          <header className="border-b border-gray-700 pb-6 mb-8">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              {pub.title}
            </h1>
            <p className="text-xl text-gray-400 italic">{pub.subtitle}</p>
            <div className="flex gap-4 mt-6 flex-wrap">
              {pub.metrics.map((metric, i) => (
                <div key={i} className="bg-gray-700 px-4 py-2 rounded">
                  <span className="text-gray-400 text-sm">{metric.label}: </span>
                  <span className="font-bold text-blue-400">{metric.value}</span>
                </div>
              ))}
            </div>
          </header>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-blue-400">Abstract</h2>
            <p className="text-gray-300 leading-relaxed">{pub.abstract}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-blue-400">Key Findings</h2>
            <ul className="space-y-3">
              {pub.findings.map((finding, i) => (
                <li key={i} className="flex items-start">
                  <span className="text-green-400 mr-3 mt-1">✓</span>
                  <span className="text-gray-300">{finding}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex gap-4 mt-10">
            <a
              href={`/publications/${pub.pdfFile}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-500 hover:bg-blue-600 px-8 py-3 rounded-lg font-semibold transition inline-block"
            >
              📄 View PDF
            </a>
            <a
              href={`https://github.com/yoreai/aresa/tree/main/publications/${params.slug.replace("-", "_")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-blue-500 text-blue-400 hover:bg-blue-900/20 px-8 py-3 rounded-lg font-semibold transition inline-block"
            >
              📁 Source Code
            </a>
          </div>
        </article>
      </div>
    </main>
  );
}

export async function generateStaticParams() {
  return [
    { slug: "spotify" },
    { slug: "manufacturing" },
    { slug: "fire-safety" },
    { slug: "network" },
  ];
}

