"use client";

export default function FireSafetyDashboard() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12">
          <h1 className="text-5xl font-bold mb-4">
            🔥 US Fire Safety Analytics
          </h1>
          <p className="text-xl text-gray-400">
            Data-driven insights from 930,000+ emergency dispatch records
          </p>
        </header>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gray-800 rounded-lg p-6 text-center border-t-4 border-red-500">
            <div className="text-4xl font-bold text-red-400">37.3%</div>
            <div className="text-sm text-gray-400 mt-2">Fire Alarms</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 text-center border-t-4 border-orange-500">
            <div className="text-4xl font-bold text-orange-400">$225M</div>
            <div className="text-sm text-gray-400 mt-2">False Alarm Cost</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 text-center border-t-4 border-blue-500">
            <div className="text-4xl font-bold text-blue-400">930K+</div>
            <div className="text-sm text-gray-400 mt-2">Records</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 text-center border-t-4 border-purple-500">
            <div className="text-4xl font-bold text-purple-400">10 Years</div>
            <div className="text-sm text-gray-400 mt-2">2015-2024</div>
          </div>
        </div>

        {/* Dashboard Sections */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Incident Distribution */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-blue-400">
              Incident Distribution
            </h2>
            <div className="h-64 flex items-center justify-center bg-gray-700/50 rounded">
              <p className="text-gray-400">Chart: Incident types breakdown</p>
            </div>
          </div>

          {/* Temporal Trends */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-blue-400">
              Annual Trends
            </h2>
            <div className="h-64 flex items-center justify-center bg-gray-700/50 rounded">
              <p className="text-gray-400">Chart: 10-year trends</p>
            </div>
          </div>

          {/* Seasonal Patterns */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-blue-400">
              Seasonal Patterns
            </h2>
            <div className="h-64 flex items-center justify-center bg-gray-700/50 rounded">
              <p className="text-gray-400">Chart: Winter/summer variations</p>
            </div>
          </div>

          {/* Geographic Analysis */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-blue-400">
              Geographic Hotspots
            </h2>
            <div className="h-64 flex items-center justify-center bg-gray-700/50 rounded">
              <p className="text-gray-400">Chart: Municipality comparison</p>
            </div>
          </div>
        </div>

        {/* Policy Recommendations */}
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-8 mt-8 border border-blue-500/30">
          <h2 className="text-2xl font-bold mb-6 text-blue-400">
            Policy Recommendations
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-bold text-lg mb-2">🔔 Smart Alarm Technology</h3>
              <p className="text-gray-400 text-sm">
                30-50% false alarm reduction through multi-criteria detection systems
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">🏘️ Community Prevention</h3>
              <p className="text-gray-400 text-sm">
                Target high-risk municipalities with door-to-door programs
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">📅 Seasonal Staffing</h3>
              <p className="text-gray-400 text-sm">
                Align resources with winter structure fire and summer outdoor fire peaks
              </p>
            </div>
          </div>
        </div>

        {/* CTA for Commercial */}
        <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 rounded-lg p-8 mt-8 border border-red-500/30 text-center">
          <h2 className="text-3xl font-bold mb-4">Reduce False Alarms by 30-50%</h2>
          <p className="text-gray-300 mb-6 text-lg">
            Get AI-approved fire alarm systems for your commercial building
          </p>
          <button className="bg-red-500 hover:bg-red-600 px-8 py-4 rounded-lg font-bold text-lg transition">
            Request Assessment →
          </button>
        </div>

        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>Powered by ARESA | YoreAI</p>
          <p className="mt-2">
            Research: <a href="https://yoreai.github.io/aresa" className="text-blue-400 hover:underline">View Full Publication</a>
          </p>
        </footer>
      </div>
    </main>
  );
}

