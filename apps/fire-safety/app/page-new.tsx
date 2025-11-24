"use client";

import { useState } from "react";
import GradientHeader from "./components/GradientHeader";
import StorySection from "./components/StorySection";
import KeyStatsGrid from "./components/KeyStatsGrid";
import MultiSelectFilter from "./components/MultiSelectFilter";
import IncidentChart from "./components/IncidentChart";
import TrendsChart from "./components/TrendsChart";
import SeasonalChart from "./components/SeasonalChart";
import HourlyChart from "./components/HourlyChart";
import PriorityChart from "./components/PriorityChart";
import MunicipalityChart from "./components/MunicipalityChart";
import FalseAlarmChart from "./components/FalseAlarmChart";
import TreemapPriority from "./components/TreemapPriority";
import FireMap from "./components/FireMap";
import HeatmapViz from "./components/HeatmapViz";
import LeadGenModal from "./components/LeadGenModal";

export default function FireSafetyDashboard() {
  const [selectedYears, setSelectedYears] = useState([2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]);
  const [selectedTypes, setSelectedTypes] = useState([
    "Fire Alarms",
    "Structure Fires",
    "Outdoor/Brush Fires",
    "Electrical Issues",
    "Vehicle Fires",
  ]);
  const [selectedCities, setSelectedCities] = useState([
    "Pittsburgh",
    "Penn Hills",
    "Mt. Lebanon",
    "Bethel Park",
  ]);
  const [activeTab, setActiveTab] = useState("temporal");

  const allYears = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
  const allTypes = [
    "Fire Alarms",
    "Structure Fires",
    "Outdoor/Brush Fires",
    "Electrical Issues",
    "Vehicle Fires",
    "Gas Issues",
    "Hazmat/CO Issues",
    "Smoke Investigation",
    "Uncategorized Fire",
  ];
  const allCities = [
    "Pittsburgh",
    "Penn Hills",
    "Mt. Lebanon",
    "Bethel Park",
    "Ross Township",
    "Plum",
    "Wilkinsburg",
    "McKeesport",
  ];

  const tabs = [
    { id: "temporal", label: "Temporal Analysis", emoji: "📊" },
    { id: "geographic", label: "Geographic Distribution", emoji: "🗺️" },
    { id: "priorities", label: "Emergency Priorities", emoji: "🚨" },
    { id: "false-alarms", label: "False Alarm Challenge", emoji: "💡" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Filters */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/80 backdrop-blur-xl rounded-xl p-6 sticky top-6 border border-gray-700/50 shadow-2xl">
              <h2 className="text-xl font-bold mb-6 text-blue-400 flex items-center">
                <span className="mr-2">🎛️</span> Interactive Filters
              </h2>
              <p className="text-sm text-gray-400 mb-6 italic">
                Adjust filters to explore patterns. Charts update in real-time.
              </p>

              <MultiSelectFilter
                label="Select Years"
                emoji="📅"
                options={allYears}
                defaultSelected={selectedYears}
                onChange={setSelectedYears}
              />

              <MultiSelectFilter
                label="Incident Types"
                emoji="🔥"
                options={allTypes}
                defaultSelected={selectedTypes}
                onChange={setSelectedTypes}
              />

              <MultiSelectFilter
                label="Municipalities"
                emoji="🏙️"
                options={allCities}
                defaultSelected={selectedCities}
                onChange={setSelectedCities}
              />

              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="text-sm font-bold text-gray-300 mb-2">Showing:</div>
                <div className="text-xs text-gray-400">
                  {selectedYears.length} years, {selectedTypes.length} types, {selectedCities.length} cities
                </div>
              </div>

              <div className="mt-6 bg-gray-700/50 p-4 rounded text-xs text-gray-400">
                <strong className="text-gray-300">📊 Data Note:</strong> 2020+ fire alarms reclassified as "Removed" - corrected for analysis.
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            <GradientHeader />
            <StorySection />
            <KeyStatsGrid />

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {tab.emoji} {tab.label}
                </button>
              ))}
            </div>

            {/* Temporal Analysis Tab */}
            {activeTab === "temporal" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 p-6 rounded-xl border-l-4 border-blue-400">
                  <strong className="text-blue-300">💡 Key Insight:</strong>{" "}
                  <span className="text-gray-200">
                    Fire alarms dominate our emergency response system. While real structure fires remain relatively stable,
                    the volume of alarm calls creates a hidden crisis in resource allocation.
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-4 text-blue-400">📈 Yearly Trends</h3>
                    <TrendsChart />
                  </div>
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-4 text-blue-400">🔄 Seasonal Patterns</h3>
                    <SeasonalChart />
                    <div className="mt-4 bg-gradient-to-r from-orange-900/30 to-yellow-900/30 p-4 rounded border-l-4 border-orange-400">
                      <strong className="text-orange-300">🔥 Critical Finding:</strong>{" "}
                      <span className="text-gray-200 text-sm">
                        Different fire types have distinct seasonal patterns. Understanding these can help deploy prevention
                        resources more effectively.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4 text-blue-400">⏰ Hourly Distribution</h3>
                  <HourlyChart />
                </div>
              </div>
            )}

            {/* Geographic Tab */}
            {activeTab === "geographic" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-4 text-blue-400">📍 Municipal Hotspots</h3>
                    <MunicipalityChart />
                  </div>
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-4 text-blue-400">📊 Incident Distribution</h3>
                    <IncidentChart />
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4 text-blue-400">🗺️ Geographic Hotspots Map</h3>
                  <FireMap />
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4 text-blue-400">🔥 Density Heatmap</h3>
                  <HeatmapViz />
                </div>
              </div>
            )}

            {/* Priorities Tab */}
            {activeTab === "priorities" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 p-6 rounded-xl border-l-4 border-orange-400">
                  <strong className="text-orange-300">📋 Resource Planning:</strong>{" "}
                  <span className="text-gray-200">
                    Different incident types have varying priority levels. This analysis helps emergency services allocate
                    resources and plan response strategies more effectively.
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-4 text-blue-400">📊 Priority Distribution</h3>
                    <PriorityChart />
                  </div>
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-xl font-bold mb-4 text-blue-400">🎯 Priority Treemap</h3>
                    <TreemapPriority />
                  </div>
                </div>
              </div>
            )}

            {/* False Alarms Tab */}
            {activeTab === "false-alarms" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 p-6 rounded-xl border-l-4 border-red-500">
                    <h4 className="text-lg font-bold mb-3 text-red-400">💰 The Hidden Cost</h4>
                    <p className="text-gray-200 text-sm leading-relaxed">
                      False alarms don't just waste money—they put lives at risk. When emergency responders are tied up with
                      preventable calls, response times for real emergencies increase.
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 p-6 rounded-xl border-l-4 border-blue-500">
                    <h4 className="text-lg font-bold mb-3 text-blue-400">🔧 Smart Solutions</h4>
                    <p className="text-gray-200 text-sm leading-relaxed">
                      Modern fire detection technology can reduce false alarms by 40-60% while maintaining safety. Investment
                      in smart systems could save millions.
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 p-8 rounded-2xl text-center shadow-2xl">
                  <div className="text-lg text-white/90 mb-2">💸 Cost Per False Alarm</div>
                  <div className="text-6xl font-bold text-white drop-shadow-xl mb-2">$1,000</div>
                  <div className="text-lg text-white/90 italic">in emergency response resources per incident</div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4 text-blue-400">💔 False Alarm Breakdown</h3>
                  <FalseAlarmChart />
                </div>

                <div className="bg-gray-800/80 p-8 rounded-xl border-t-4 border-blue-500">
                  <h2 className="text-3xl font-bold mb-8 text-center text-white">
                    🎯 Our Call to Action: Three Critical Changes Needed
                  </h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-6 rounded-xl text-center border-2 border-blue-500/30">
                      <div className="text-5xl mb-4">🤖</div>
                      <h3 className="text-lg font-bold mb-3 text-white">Smart Alarm Technology</h3>
                      <p className="text-gray-300 text-sm mb-4">
                        Require modern fire alarm systems with AI-powered false alarm reduction in commercial buildings.
                      </p>
                      <div className="bg-green-900/40 px-4 py-2 rounded">
                        <strong className="text-green-400">💰 Impact: 30-50% reduction</strong>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-6 rounded-xl text-center border-2 border-cyan-500/30">
                      <div className="text-5xl mb-4">🏘️</div>
                      <h3 className="text-lg font-bold mb-3 text-white">Community Prevention</h3>
                      <p className="text-gray-300 text-sm mb-4">
                        Target high-risk neighborhoods with education, smoke detector programs, and electrical safety inspections.
                      </p>
                      <div className="bg-cyan-900/40 px-4 py-2 rounded">
                        <strong className="text-cyan-400">🎯 Goal: 25% structure fire reduction</strong>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-6 rounded-xl text-center border-2 border-red-500/30">
                      <div className="text-5xl mb-4">📅</div>
                      <h3 className="text-lg font-bold mb-3 text-white">Seasonal Preparedness</h3>
                      <p className="text-gray-300 text-sm mb-4">
                        Deploy resources based on seasonal patterns - electrical safety in winter, outdoor fire prevention in summer.
                      </p>
                      <div className="bg-red-900/40 px-4 py-2 rounded">
                        <strong className="text-red-400">🔧 Better resource efficiency</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-600 p-6 rounded-xl text-center">
                  <h3 className="text-2xl font-bold mb-6 text-white">📞 Take Action Today</h3>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-gray-800 p-6 rounded-xl border-l-4 border-blue-500 text-center">
                    <strong className="text-white text-lg">🏛️ Contact Officials</strong>
                    <p className="text-gray-400 text-sm mt-2">About false alarm reduction programs</p>
                  </div>
                  <div className="bg-gray-800 p-6 rounded-xl border-l-4 border-green-500 text-center">
                    <strong className="text-white text-lg">💰 Support Funding</strong>
                    <p className="text-gray-400 text-sm mt-2">For community fire prevention initiatives</p>
                  </div>
                  <div className="bg-gray-800 p-6 rounded-xl border-l-4 border-orange-500 text-center">
                    <strong className="text-white text-lg">📢 Share This Story</strong>
                    <p className="text-gray-400 text-sm mt-2">Raise awareness about fire safety equity</p>
                  </div>
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="bg-gradient-to-r from-red-900/40 to-orange-900/40 rounded-xl p-8 border-2 border-red-500/40 text-center">
              <h2 className="text-3xl font-bold mb-4">Reduce False Alarms by 30-50%</h2>
              <p className="text-gray-300 mb-6 text-lg">
                Get AI-approved fire alarm systems for your commercial building
              </p>
              <LeadGenModal />
              <p className="text-sm text-gray-500 mt-4">
                Based on analysis of 930,000+ emergency dispatch records (2015-2024)
              </p>
            </div>

            {/* Footer */}
            <div className="bg-gray-800/50 p-6 rounded-xl border-t-2 border-gray-700 text-center">
              <p className="text-gray-400 text-sm mb-2">
                <strong className="text-gray-300">📊 Data Source:</strong> Allegheny County 911 Dispatches (2015-2024) | Western Pennsylvania Regional Data Center
              </p>
              <p className="text-gray-500 text-xs italic">
                This interactive data story emphasizes <strong className="text-gray-300">truthful, functional, beautiful, insightful, and ethically responsible</strong> data presentation.
              </p>
              <p className="text-gray-500 text-xs mt-4">
                Powered by ARESA | YoreAI
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

