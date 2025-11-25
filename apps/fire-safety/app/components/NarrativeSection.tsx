"use client";

interface NarrativeSectionProps {
  alarmPercentage: string;
}

export default function NarrativeSection({ alarmPercentage }: NarrativeSectionProps) {
  return (
    <div className="space-y-6">
      {/* Hero Story */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 p-6 rounded-xl shadow-lg">
        <p className="text-lg leading-relaxed text-white">
          <strong className="text-blue-200">📖 Our Story:</strong> Every emergency call represents a moment of crisis, a family in danger, or property at risk.
          But what if the data reveals patterns that could help us prevent these emergencies before they happen?
        </p>
        <p className="text-lg leading-relaxed text-white mt-4">
          <strong className="text-red-200">🎯 The Challenge:</strong> How can we transform reactive emergency response into proactive community safety?
        </p>
      </div>

      {/* Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border-l-4 border-purple-500 shadow-md">
          <h4 className="text-base font-bold text-purple-600 dark:text-purple-400 mb-2">💡 Key Insight: Temporal Analysis</h4>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            Fire alarms dominate our emergency response system. While real structure fires remain relatively stable,
            the volume of alarm calls creates a hidden crisis in resource allocation. Understanding these patterns
            can help us deploy prevention resources more effectively.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border-l-4 border-orange-500 shadow-md">
          <h4 className="text-base font-bold text-orange-600 dark:text-orange-400 mb-2">🔥 Critical Finding: Seasonal Patterns</h4>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            Different fire types have distinct seasonal behaviors. Structure fires peak in winter months when
            heating systems strain aging infrastructure, while outdoor fires surge during summer. This data
            enables emergency services to prepare communities for higher-risk periods.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border-l-4 border-green-500 shadow-md">
          <h4 className="text-base font-bold text-green-600 dark:text-green-400 mb-2">⚖️ Equity Concern: Geographic Analysis</h4>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            Fire incidents are not evenly distributed across our communities. Some neighborhoods bear a
            disproportionate burden, with Pittsburgh showing the highest concentration of incidents, followed
            by smaller municipalities that lack adequate prevention resources.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border-l-4 border-red-500 shadow-md">
          <h4 className="text-base font-bold text-red-600 dark:text-red-400 mb-2">💰 Economic Impact: False Alarm Crisis</h4>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            <strong className="text-red-600 dark:text-red-400">{alarmPercentage}%</strong> of all incidents are fire alarms. False alarms create a massive financial burden on emergency services and delay response to real
            emergencies. A single false alarm costs taxpayers approximately $1,000 in emergency response resources.
          </p>
        </div>
      </div>
    </div>
  );
}
