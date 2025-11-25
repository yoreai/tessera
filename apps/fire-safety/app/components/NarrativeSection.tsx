"use client";

export default function NarrativeSection() {
  return (
    <div className="space-y-6">
      {/* Main Story Introduction */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-8 rounded-xl border-l-8 border-blue-500 shadow-xl">
        <p className="text-xl leading-relaxed mb-6 text-white">
          <strong className="text-blue-400">📖 Our Story:</strong> Every emergency call represents a moment of crisis, a family in danger, or property at risk.
          But what if the data reveals patterns that could help us prevent these emergencies before they happen?
        </p>
        <p className="text-xl leading-relaxed text-white">
          <strong className="text-red-400">🎯 The Challenge:</strong> How can we transform reactive emergency response into proactive community safety?
        </p>
      </div>

      {/* Narrative Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-xl border-l-4 border-blue-500">
          <h4 className="text-lg font-bold text-blue-400 mb-3">💡 Key Insight: Temporal Analysis</h4>
          <p className="text-gray-200 leading-relaxed">
            Fire alarms dominate our emergency response system. While real structure fires remain relatively stable,
            the volume of alarm calls creates a hidden crisis in resource allocation. Understanding these patterns
            can help us deploy prevention resources more effectively.
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border-l-4 border-orange-500">
          <h4 className="text-lg font-bold text-orange-400 mb-3">🔥 Critical Finding: Seasonal Patterns</h4>
          <p className="text-gray-200 leading-relaxed">
            Different fire types have distinct seasonal behaviors. Structure fires peak in winter months when
            heating systems strain aging infrastructure, while outdoor fires surge during summer. This data
            enables emergency services to prepare communities for higher-risk periods.
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border-l-4 border-purple-500">
          <h4 className="text-lg font-bold text-purple-400 mb-3">⚖️ Equity Concern: Geographic Analysis</h4>
          <p className="text-gray-200 leading-relaxed">
            Fire incidents are not evenly distributed across our communities. Some neighborhoods bear a
            disproportionate burden, with Pittsburgh showing the highest concentration of incidents, followed
            by smaller municipalities that lack adequate prevention resources.
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border-l-4 border-red-500">
          <h4 className="text-lg font-bold text-red-400 mb-3">💰 Economic Impact: False Alarm Crisis</h4>
          <p className="text-gray-200 leading-relaxed">
            False alarms create a massive financial burden on emergency services and delay response to real
            emergencies, creating hidden public safety risks. A single false alarm costs taxpayers approximately
            $1,000 in emergency response resources.
          </p>
        </div>
      </div>
    </div>
  );
}

