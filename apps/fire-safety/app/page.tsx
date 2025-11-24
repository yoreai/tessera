"use client";

import { useState, useEffect } from "react";
import { getFireIncidents, filterIncidents, aggregateByType, aggregateByYear, aggregateBySeason, type FireIncident } from "../lib/fireData";
import GradientHeader from "./components/GradientHeader";
import StorySection from "./components/StorySection";
import KeyStatsGrid from "./components/KeyStatsGrid";
import MultiSelectFilter from "./components/MultiSelectFilter";
import InteractiveIncidentMap from "./components/InteractiveIncidentMap";
import AdvancedHotspotMap from "./components/AdvancedHotspotMap";
import LeadGenModal from "./components/LeadGenModal";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceDot, Legend } from "recharts";

const CATEGORY_COLORS: { [key: string]: string } = {
  "Fire Alarms": "#f44336",
  "Structure Fires": "#ff9800",
  "Outdoor/Brush Fires": "#66bb6a",
  "Electrical Issues": "#ba68c8",
  "Vehicle Fires": "#ffb74d",
  "Gas Issues": "#4db6ac",
  "Hazmat/CO Issues": "#f06292",
  "Smoke Investigation": "#9e9e9e",
  "Uncategorized Fire": "#bcaaa4",
};

export default function FireSafetyDashboard() {
  const [allData, setAllData] = useState<FireIncident[]>([]);
  const [filteredData, setFilteredData] = useState<FireIncident[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedYears, setSelectedYears] = useState<(string | number)[]>([2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]);
  const [selectedTypes, setSelectedTypes] = useState<(string | number)[]>([
    "Fire Alarms",
    "Structure Fires",
    "Outdoor/Brush Fires",
    "Electrical Issues",
    "Vehicle Fires",
    "Gas Issues",
    "Hazmat/CO Issues",
    "Smoke Investigation",
    "Uncategorized Fire",
  ]);
  const [selectedCities, setSelectedCities] = useState<(string | number)[]>([]);

  const [activeTab, setActiveTab] = useState("temporal");
  const [mapTab, setMapTab] = useState("incidents");

  // Load real data on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getFireIncidents();
      setAllData(data);

      // Get top cities
      const cityCounts: { [key: string]: number } = {};
      data.forEach(d => {
        if (d.city_name) cityCounts[d.city_name] = (cityCounts[d.city_name] || 0) + 1;
      });
      const topCities = Object.entries(cityCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([city]) => city);
      setSelectedCities(topCities);

      setLoading(false);
    }
    loadData();
  }, []);

  // Apply filters whenever selections change
  useEffect(() => {
    if (allData.length > 0) {
      const filtered = filterIncidents(allData, selectedYears, selectedTypes, selectedCities);
      setFilteredData(filtered);
    }
  }, [allData, selectedYears, selectedTypes, selectedCities]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading 205,000+ fire incident records...</p>
        </div>
      </div>
    );
  }

  const byType = aggregateByType(filteredData);
  const byYear = aggregateByYear(filteredData);
  const bySeason = aggregateBySeason(filteredData);

  const tabs = [
    { id: "temporal", label: "Temporal Analysis", emoji: "📊" },
    { id: "geographic", label: "Geographic & False Alarms", emoji: "🗺️" },
    { id: "priorities", label: "Emergency Priorities", emoji: "🚨" },
  ];

  const brightTooltip = {
    contentStyle: {
      backgroundColor: "#ffffff",
      border: "2px solid #1976d2",
      borderRadius: "8px",
      color: "#000000",
      padding: "12px",
    },
    itemStyle: { color: "#000000", fontWeight: "600" },
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/90 backdrop-blur-xl rounded-xl p-6 sticky top-6 border border-gray-700 shadow-2xl">
              <h2 className="text-xl font-bold mb-4 text-blue-400">🎛️ Interactive Filters</h2>
              <p className="text-xs text-gray-400 mb-6 italic">
                Adjust filters to explore patterns. Charts update in real-time.
              </p>

              <MultiSelectFilter
                label="Select Years"
                emoji="📅"
                options={[2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]}
                defaultSelected={selectedYears}
                onChange={setSelectedYears}
              />

              <MultiSelectFilter
                label="Incident Types"
                emoji="🔥"
                options={Object.keys(CATEGORY_COLORS)}
                defaultSelected={selectedTypes}
                onChange={setSelectedTypes}
              />

              <MultiSelectFilter
                label="Municipalities"
                emoji="🏙️"
                options={selectedCities}
                defaultSelected={selectedCities}
                onChange={setSelectedCities}
              />

              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="text-sm font-bold text-white mb-2">Showing:</div>
                <div className="text-lg font-bold text-blue-400">{filteredData.length.toLocaleString()}</div>
                <div className="text-xs text-gray-400">incidents</div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <GradientHeader />
            <StorySection />
            <KeyStatsGrid />

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {tab.emoji} {tab.label}
                </button>
              ))}
            </div>

            {/* Temporal Tab */}
            {activeTab === "temporal" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 p-6 rounded-xl border-l-4 border-blue-400">
                  <strong className="text-blue-300">💡 Key Insight:</strong>{" "}
                  <span className="text-gray-200">
                    Fire alarms dominate our emergency response system. While real structure fires remain stable, the volume of alarm calls creates resource allocation challenges.
                  </span>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4 text-blue-400">📈 Yearly Trends</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={byYear}>
                      <XAxis dataKey="year" stroke="#a0a0a0" />
                      <YAxis stroke="#a0a0a0" />
                      <Tooltip {...brightTooltip} />
                      <Line type="monotone" dataKey="incidents" stroke="#64b5f6" strokeWidth={3} dot={{ r: 5 }} />
                      <ReferenceDot x={2020} y={byYear.find(d => d.year === 2020)?.incidents} r={10} fill="#f44336" stroke="#c62828" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4 text-blue-400">🔄 Seasonal Patterns</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={bySeason}>
                      <XAxis dataKey="season" stroke="#a0a0a0" />
                      <YAxis stroke="#a0a0a0" />
                      <Tooltip {...brightTooltip} />
                      <Legend />
                      <Bar dataKey="Structure Fires" fill="#ff9800" />
                      <Bar dataKey="Outdoor/Brush Fires" fill="#66bb6a" />
                      <Bar dataKey="Fire Alarms" fill="#f44336" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4 text-blue-400">📊 Incident Distribution</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={byType.slice(0, 8)}>
                      <XAxis dataKey="name" stroke="#a0a0a0" angle={-45} textAnchor="end" height={100} />
                      <YAxis stroke="#a0a0a0" />
                      <Tooltip {...brightTooltip} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {byType.slice(0, 8).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || "#9e9e9e"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Geographic Tab */}
            {activeTab === "geographic" && (
              <div className="space-y-6">
                {/* Map subtabs */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setMapTab("incidents")}
                    className={`px-4 py-2 rounded font-semibold text-sm ${
                      mapTab === "incidents"
                        ? "bg-red-600 text-white"
                        : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                    }`}
                  >
                    💥 Incident Distribution
                  </button>
                  <button
                    onClick={() => setMapTab("heatmap")}
                    className={`px-4 py-2 rounded font-semibold text-sm ${
                      mapTab === "heatmap"
                        ? "bg-orange-600 text-white"
                        : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                    }`}
                  >
                    🔥 Advanced Hotspot Map
                  </button>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  {mapTab === "incidents" ? (
                    <>
                      <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 p-4 rounded-xl border-l-4 border-blue-400 mb-4">
                        <strong className="text-cyan-300">🗺️ Where Fires Happen:</strong>{" "}
                        <span className="text-gray-200 text-sm">
                          Geographic distribution of fire incidents across Allegheny County. Each point represents a fire incident, colored by type.
                        </span>
                      </div>
                      <InteractiveIncidentMap incidents={filteredData} />
                    </>
                  ) : (
                    <>
                      <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 p-4 rounded-xl border-l-4 border-orange-400 mb-4">
                        <strong className="text-orange-300">🔍 Fire Hotspot Analysis:</strong>{" "}
                        <span className="text-gray-200 text-sm">
                          Municipal density with heatmap analysis to reveal the most critical fire risk areas.
                        </span>
                      </div>
                      <AdvancedHotspotMap incidents={filteredData} />
                    </>
                  )}
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
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
