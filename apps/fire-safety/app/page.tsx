"use client";

import { useState, useEffect } from "react";
import {
  getFireIncidents,
  filterIncidents,
  aggregateByType,
  aggregateByYear,
  aggregateBySeason,
  aggregateByCity,
  aggregateByPriority,
  aggregateFalseAlarms,
  calculateStats,
  getTopCities,
  FIRE_CATEGORIES,
  ALL_CATEGORIES,
  type FireIncident
} from "../lib/fireData";

// Components
import GradientHeader from "./components/GradientHeader";
import KeyStatsGrid from "./components/KeyStatsGrid";
import NarrativeSection from "./components/NarrativeSection";
import YearlyTrendsChart from "./components/YearlyTrendsChart";
import SeasonalPatternsChart from "./components/SeasonalPatternsChart";
import MunicipalHotspotsChart from "./components/MunicipalHotspotsChart";
import FalseAlarmPieChart from "./components/FalseAlarmPieChart";
import PriorityTreemapChart from "./components/PriorityTreemapChart";
import InteractiveIncidentMap from "./components/InteractiveIncidentMap";
import AdvancedHotspotMap from "./components/AdvancedHotspotMap";
import FalseAlarmChallenge from "./components/FalseAlarmChallenge";
import CallToAction from "./components/CallToAction";
import DashboardFooter from "./components/DashboardFooter";
import MultiSelectFilter from "./components/MultiSelectFilter";
import LeadGenModal from "./components/LeadGenModal";

export default function FireSafetyDashboard() {
  const [allData, setAllData] = useState<FireIncident[]>([]);
  const [filteredData, setFilteredData] = useState<FireIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [topCities, setTopCities] = useState<string[]>([]);

  const [selectedYears, setSelectedYears] = useState<(string | number)[]>([2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]);
  const [selectedTypes, setSelectedTypes] = useState<(string | number)[]>([...ALL_CATEGORIES]);
  const [selectedCities, setSelectedCities] = useState<(string | number)[]>([]);

  const [mapTab, setMapTab] = useState<"incidents" | "heatmap">("incidents");

  // Load real data on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getFireIncidents();
      setAllData(data);

      // Get top 15 cities for the filter options
      const cities = getTopCities(data, 15);
      setTopCities(cities);
      // DON'T set selectedCities - empty array means "all cities" in filterIncidents
      // setSelectedCities(cities);  // This was filtering out ~200K incidents!

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
          <p className="text-white text-xl">Loading 550,000+ fire incident records...</p>
          <p className="text-gray-400 text-sm mt-2">Processing classification and analysis...</p>
        </div>
      </div>
    );
  }

  // Calculate all aggregations
  const stats = calculateStats(filteredData);
  const byYear = aggregateByYear(filteredData);
  const bySeason = aggregateBySeason(filteredData);
  const byCity = aggregateByCity(filteredData, 12);
  const byPriority = aggregateByPriority(filteredData);
  const falseAlarmData = aggregateFalseAlarms(filteredData);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* ===== LEFT SIDEBAR - Filters ===== */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/90 backdrop-blur-xl rounded-xl p-6 sticky top-6 border border-gray-700 shadow-2xl">
              <h2 className="text-xl font-bold mb-2 text-blue-400">🎛️ Interactive Filters</h2>
              <p className="text-xs text-gray-400 mb-6 italic">
                Adjust filters to explore patterns. Charts update in real-time.
              </p>

              <MultiSelectFilter
                label="Select Years"
                emoji="📅"
                options={[2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]}
                defaultSelected={selectedYears}
                onChange={setSelectedYears}
              />

              <MultiSelectFilter
                label="Incident Types"
                emoji="🔥"
                options={[...ALL_CATEGORIES]}
                defaultSelected={selectedTypes}
                onChange={setSelectedTypes}
              />

              <MultiSelectFilter
                label="Municipalities"
                emoji="🏙️"
                options={topCities}
                defaultSelected={selectedCities}
                onChange={setSelectedCities}
              />

              {/* Filter Summary */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="text-sm font-bold text-white mb-2">Showing:</div>
                <div className="text-2xl font-bold text-blue-400">{filteredData.length.toLocaleString()}</div>
                <div className="text-xs text-gray-400">incidents</div>
              </div>

              {/* Data Quality Note */}
              <div className="mt-4 bg-gray-700/50 p-3 rounded-lg border-l-3 border-gray-500">
                <p className="text-xs text-gray-400">
                  <strong className="text-gray-300">📊 Data Note:</strong> 2020+ fire alarms reclassified as "Removed" - corrected for analysis.
                </p>
              </div>
            </div>
          </div>

          {/* ===== MAIN CONTENT ===== */}
          <div className="lg:col-span-3 space-y-8">

            {/* Header */}
            <GradientHeader />

            {/* Story Introduction */}
            <NarrativeSection />

            {/* Key Statistics */}
            <KeyStatsGrid stats={stats} />

            {/* Divider */}
            <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full"></div>

            {/* ===== TEMPORAL ANALYSIS SECTION ===== */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white inline-flex items-center gap-2">
                📈 <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Temporal Analysis</span>
              </h2>
              <p className="text-gray-400 mt-2 italic">Understanding Fire Patterns Over Time</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Yearly Trends */}
              <div>
                <div className="bg-gray-800/80 p-4 rounded-t-xl border-l-4 border-blue-500">
                  <h3 className="font-bold text-white">📊 Yearly Trends</h3>
                </div>
                <YearlyTrendsChart data={byYear} filteredCount={filteredData.length} />
              </div>

              {/* Seasonal Patterns */}
              <div>
                <div className="bg-gray-800/80 p-4 rounded-t-xl border-l-4 border-orange-500">
                  <h3 className="font-bold text-white">🌡️ Seasonal Patterns</h3>
                </div>
                <SeasonalPatternsChart data={bySeason} filteredCount={filteredData.length} />
              </div>
            </div>

            {/* Divider */}
            <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full"></div>

            {/* ===== GEOGRAPHIC & FALSE ALARM SECTION ===== */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white inline-flex items-center gap-2">
                🗺️ <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Geographic Distribution and False Alarm Analysis</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Municipal Hotspots */}
              <div>
                <div className="bg-gray-800/80 p-4 rounded-t-xl border-l-4 border-purple-500">
                  <h3 className="font-bold text-white">📍 Municipal Hotspots</h3>
                </div>
                <MunicipalHotspotsChart data={byCity} filteredCount={filteredData.length} />
                <div className="bg-gray-800 p-4 rounded-b-xl border-l-4 border-purple-500 mt-0">
                  <p className="text-gray-300 text-sm">
                    <strong>⚖️ Equity Concern:</strong> Fire incidents are not evenly distributed. Some communities bear a
                    disproportionate burden, suggesting the need for targeted prevention programs.
                  </p>
                </div>
              </div>

              {/* False Alarm Analysis */}
              <div>
                <div className="bg-gray-800/80 p-4 rounded-t-xl border-l-4 border-red-500">
                  <h3 className="font-bold text-white">🚨 False Alarm Crisis</h3>
                </div>
                <FalseAlarmPieChart data={falseAlarmData} />
                <div className="bg-gray-800 p-4 rounded-b-xl border-l-4 border-red-500 mt-0">
                  <p className="text-gray-300 text-sm">
                    <strong>💰 Economic Impact:</strong> False alarms create a massive financial burden on emergency services
                    and delay response to real emergencies, creating hidden public safety risks.
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-1 bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 rounded-full"></div>

            {/* ===== INTERACTIVE MAPS & PRIORITIES SECTION ===== */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white inline-flex items-center gap-2">
                🗺️ <span className="bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">Interactive Maps & Emergency Priorities</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Interactive Maps */}
              <div>
                <div className="bg-gray-800/80 p-4 rounded-t-xl border-l-4 border-pink-500">
                  <h3 className="font-bold text-white">🌍 Interactive Maps</h3>
                </div>

                {/* Map Tabs */}
                <div className="bg-gray-800 p-4 flex gap-2">
                  <button
                    onClick={() => setMapTab("incidents")}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                      mapTab === "incidents"
                        ? "bg-red-600 text-white"
                        : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                    }`}
                  >
                    🎯 Incident Distribution
                  </button>
                  <button
                    onClick={() => setMapTab("heatmap")}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                      mapTab === "heatmap"
                        ? "bg-orange-600 text-white"
                        : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                    }`}
                  >
                    🔥 Advanced Hotspot Map
                  </button>
                </div>

                {/* Map Content */}
                <div className="bg-gray-800 p-4 rounded-b-xl">
                  {mapTab === "incidents" ? (
                    <>
                      <div className="bg-gray-700/50 p-3 rounded-lg border-l-3 border-cyan-500 mb-4">
                        <p className="text-sm text-gray-300">
                          <strong className="text-cyan-400">🗺️ Where Fires Happen:</strong> Geographic distribution of fire incidents. Each point represents an incident, colored by type.
                        </p>
                      </div>
                      <InteractiveIncidentMap incidents={filteredData} />
                    </>
                  ) : (
                    <>
                      <div className="bg-gray-700/50 p-3 rounded-lg border-l-3 border-orange-500 mb-4">
                        <p className="text-sm text-gray-300">
                          <strong className="text-orange-400">🌡️ Fire Hotspot Analysis:</strong> Municipal density with heatmap analysis to reveal the most critical fire risk areas.
                        </p>
                      </div>
                      <AdvancedHotspotMap incidents={filteredData} />
                    </>
                  )}
                </div>
              </div>

              {/* Emergency Priorities Treemap */}
              <div>
                <div className="bg-gray-800/80 p-4 rounded-t-xl border-l-4 border-orange-500">
                  <h3 className="font-bold text-white">🎯 Emergency Priorities</h3>
                </div>
                <PriorityTreemapChart data={byPriority} />
                <div className="bg-gray-800 p-4 rounded-b-xl border-l-4 border-orange-500 mt-0">
                  <p className="text-gray-300 text-sm">
                    <strong>📋 Resource Planning:</strong> Different incident types have varying priority levels. This analysis helps
                    emergency services allocate resources and plan response strategies more effectively.
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-1 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-full"></div>

            {/* ===== FALSE ALARM CHALLENGE SECTION ===== */}
            <FalseAlarmChallenge />

            {/* ===== CALL TO ACTION SECTION ===== */}
            <CallToAction />

            {/* ===== LEAD GENERATION CTA ===== */}
            <div className="bg-gradient-to-r from-red-900/40 to-orange-900/40 rounded-xl p-8 border-2 border-red-500/40 text-center">
              <h2 className="text-3xl font-bold mb-4">Reduce False Alarms by 30-50%</h2>
              <p className="text-gray-300 mb-6 text-lg">
                Get AI-approved fire alarm systems for your commercial building
              </p>
              <LeadGenModal />
            </div>

            {/* ===== FOOTER ===== */}
            <DashboardFooter />
          </div>
        </div>
      </div>
    </main>
  );
}
