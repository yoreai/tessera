export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            ARESA
          </h1>
          <p className="text-2xl text-gray-400 mb-6">
            Autonomous Research & Engineering Synthesis Agent
          </p>
          <div className="flex justify-center gap-8 mt-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400">4</div>
              <div className="text-sm text-gray-500 uppercase tracking-wide">Publications</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400">23</div>
              <div className="text-sm text-gray-500 uppercase tracking-wide">Visualizations</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400">930K+</div>
              <div className="text-sm text-gray-500 uppercase tracking-wide">Records Analyzed</div>
            </div>
          </div>
        </header>

        <section className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* Spotify Publication Card */}
          <div className="bg-gray-800 rounded-lg p-6 border-t-4 border-green-500 hover:shadow-xl transition">
            <h2 className="text-2xl font-bold mb-2">Predicting Song Popularity</h2>
            <p className="text-gray-400 mb-4">ML Classification & Genre Interactions</p>
            <div className="flex gap-4 mb-4">
              <span className="bg-blue-900/30 px-3 py-1 rounded text-sm border border-blue-500">
                ROC AUC: <span className="font-bold">0.675</span>
              </span>
              <span className="bg-blue-900/30 px-3 py-1 rounded text-sm border border-blue-500">
                7 Charts
              </span>
            </div>
            <a
              href="/publications/spotify"
              className="inline-block bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded font-semibold transition"
            >
              View Research →
            </a>
          </div>

          {/* Manufacturing Card */}
          <div className="bg-gray-800 rounded-lg p-6 border-t-4 border-orange-500 hover:shadow-xl transition">
            <h2 className="text-2xl font-bold mb-2">Manufacturing Analytics</h2>
            <p className="text-gray-400 mb-4">Multi-Source Integration & Quality</p>
            <div className="flex gap-4 mb-4">
              <span className="bg-blue-900/30 px-3 py-1 rounded text-sm border border-blue-500">
                45K Observations
              </span>
              <span className="bg-blue-900/30 px-3 py-1 rounded text-sm border border-blue-500">
                8 Charts
              </span>
            </div>
            <a
              href="/publications/manufacturing"
              className="inline-block bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded font-semibold transition"
            >
              View Research →
            </a>
          </div>

          {/* Fire Safety Card */}
          <div className="bg-gray-800 rounded-lg p-6 border-t-4 border-red-500 hover:shadow-xl transition">
            <h2 className="text-2xl font-bold mb-2">Fire Safety Analytics</h2>
            <p className="text-gray-400 mb-4">930K Emergency Records, Policy Impact</p>
            <div className="flex gap-4 mb-4">
              <span className="bg-blue-900/30 px-3 py-1 rounded text-sm border border-blue-500">
                $225M Impact
              </span>
              <span className="bg-blue-900/30 px-3 py-1 rounded text-sm border border-blue-500">
                5 Charts
              </span>
            </div>
            <a
              href="/publications/fire-safety"
              className="inline-block bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded font-semibold transition"
            >
              View Research →
            </a>
          </div>

          {/* Network Card */}
          <div className="bg-gray-800 rounded-lg p-6 border-t-4 border-purple-500 hover:shadow-xl transition">
            <h2 className="text-2xl font-bold mb-2">Network Centrality</h2>
            <p className="text-gray-400 mb-4">Graph Theory in Sports Competition</p>
            <div className="flex gap-4 mb-4">
              <span className="bg-blue-900/30 px-3 py-1 rounded text-sm border border-blue-500">
                115 Teams
              </span>
              <span className="bg-blue-900/30 px-3 py-1 rounded text-sm border border-blue-500">
                3 Charts
              </span>
            </div>
            <a
              href="/publications/network"
              className="inline-block bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded font-semibold transition"
            >
              View Research →
            </a>
          </div>
        </section>

        <footer className="text-center mt-16 text-gray-500">
          <p>ARESA - Engineering the future of autonomous discovery</p>
          <p className="mt-2 text-sm">YoreAI | University of Pittsburgh</p>
        </footer>
      </div>
    </main>
  );
}
