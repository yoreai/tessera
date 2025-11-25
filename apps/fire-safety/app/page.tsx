"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getFireIncidents,
  filterIncidents,
  aggregateByYear,
  aggregateBySeason,
  aggregateByCity,
  aggregateByPriority,
  aggregateFalseAlarms,
  calculateStats,
  getTopCities,
  ALL_CATEGORIES,
  type FireIncident
} from "../lib/fireData";

// Components
import { ThemeToggle } from "./components/ThemeToggle";
import CollapsibleSidebar from "./components/CollapsibleSidebar";
import SectionNav from "./components/SectionNav";
import GradientHeader from "./components/GradientHeader";
import KeyStatsGrid from "./components/KeyStatsGrid";
import NarrativeSection from "./components/NarrativeSection";
import YearlyTrendsChart from "./components/YearlyTrendsChart";
import SeasonalPatternsChart from "./components/SeasonalPatternsChart";
import MunicipalHotspotsChart from "./components/MunicipalHotspotsChart";
import FalseAlarmPieChart from "./components/FalseAlarmPieChart";
import PriorityTreemapChart from "./components/PriorityTreemapChart";
import FalseAlarmChallenge from "./components/FalseAlarmChallenge";
import CallToAction from "./components/CallToAction";
import DashboardFooter from "./components/DashboardFooter";
import dynamic from "next/dynamic";
import { Flame, Loader2 } from "lucide-react";

// Dynamic imports for map components
const InteractiveIncidentMap = dynamic(() => import("./components/InteractiveIncidentMap"), { ssr: false });
const AdvancedHotspotMap = dynamic(() => import("./components/AdvancedHotspotMap"), { ssr: false });

const YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

export default function FireSafetyDashboard() {
  const [allData, setAllData] = useState<FireIncident[]>([]);
  const [filteredData, setFilteredData] = useState<FireIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [topCities, setTopCities] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState("overview");

  const [selectedYears, setSelectedYears] = useState<(string | number)[]>(YEARS);
  const [selectedTypes, setSelectedTypes] = useState<(string | number)[]>([...ALL_CATEGORIES]);
  const [selectedCities, setSelectedCities] = useState<(string | number)[]>([]);

  const [mapTab, setMapTab] = useState<"incidents" | "heatmap">("incidents");

  // Load real data on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getFireIncidents();
      setAllData(data);

      const cities = getTopCities(data, 50);
      setTopCities(cities);

      setFilteredData(data);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <Flame className="w-16 h-16 text-orange-500 animate-pulse" />
            <Loader2 className="absolute inset-0 w-16 h-16 text-blue-500 animate-spin opacity-50" />
          </div>
          <p className="text-xl font-medium text-gray-900 dark:text-white">Loading fire safety data...</p>
          <p className="text-gray-600 dark:text-gray-400">Analyzing 550,000+ incidents</p>
        </motion.div>
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

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white">
      <div className="flex">
        {/* Collapsible Sidebar */}
        <CollapsibleSidebar
          years={YEARS}
          selectedYears={selectedYears}
          setSelectedYears={setSelectedYears}
          selectedTypes={selectedTypes}
          setSelectedTypes={setSelectedTypes}
          cities={topCities}
          selectedCities={selectedCities}
          setSelectedCities={setSelectedCities}
          totalCount={allData.length}
          filteredCount={filteredData.length}
        />

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          {/* Header Bar */}
          <div className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700/50 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Flame className="w-8 h-8 text-orange-500" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Fire Safety Analytics</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Allegheny County, PA • 2015-2025</p>
              </div>
            </div>
            <ThemeToggle />
          </div>

          {/* Section Navigation */}
          <SectionNav activeSection={activeSection} onSectionChange={setActiveSection} />

          {/* Content Sections */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeSection === "overview" && (
                <motion.div
                  key="overview"
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  {/* Hero Section */}
                  <GradientHeader />

                  {/* Quick Stats Row */}
                  <KeyStatsGrid stats={stats} />

                  {/* The Alarm Problem - Featured */}
                  <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-6 shadow-xl">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="text-center md:text-left">
                        <h3 className="text-2xl font-bold text-white mb-2">🚨 The Hidden Crisis</h3>
                        <p className="text-red-100 text-lg">
                          Fire alarms drain emergency resources and delay response to real emergencies
                        </p>
                      </div>
                      <div className="bg-white/20 backdrop-blur rounded-xl px-8 py-4 text-center">
                        <div className="text-5xl font-extrabold text-white">{stats.alarmPercentage}%</div>
                        <div className="text-red-100 font-medium">of incidents are alarms</div>
                      </div>
                    </div>
                  </div>

                  {/* Story & Insights */}
                  <NarrativeSection alarmPercentage={stats.alarmPercentage} />

                  {/* Quick Preview of Data */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      📊 Quick Data Preview
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <button
                        onClick={() => setActiveSection("temporal")}
                        className="bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 p-4 rounded-lg transition-colors"
                      >
                        <div className="text-2xl mb-2">📈</div>
                        <div className="font-bold text-purple-700 dark:text-purple-300">10+ Years of Data</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Explore temporal trends →</div>
                      </button>
                      <button
                        onClick={() => setActiveSection("geographic")}
                        className="bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 p-4 rounded-lg transition-colors"
                      >
                        <div className="text-2xl mb-2">🗺️</div>
                        <div className="font-bold text-green-700 dark:text-green-300">130+ Municipalities</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">View geographic maps →</div>
                      </button>
                      <button
                        onClick={() => setActiveSection("analysis")}
                        className="bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 p-4 rounded-lg transition-colors"
                      >
                        <div className="text-2xl mb-2">🔍</div>
                        <div className="font-bold text-orange-700 dark:text-orange-300">Deep Analysis</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Understand the crisis →</div>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSection === "temporal" && (
                <motion.div
                  key="temporal"
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-8"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                      📈 Temporal Analysis
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Understanding Fire Patterns Over Time</p>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <YearlyTrendsChart data={byYear} filteredCount={filteredData.length} />
                    <SeasonalPatternsChart data={bySeason} filteredCount={filteredData.length} />
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-sm">
                      <h3 className="text-lg font-bold text-purple-600 dark:text-purple-400 mb-3">💡 Key Insight</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Fire alarms dominate our emergency response system. While real structure fires remain
                        relatively stable, the volume of alarm calls creates a hidden crisis in resource allocation.
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-200 dark:border-gray-700/50 shadow-sm">
                      <h3 className="text-lg font-bold text-orange-600 dark:text-orange-400 mb-3">🔍 Critical Finding</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Different fire types have distinct seasonal patterns. Understanding these can help deploy
                        prevention resources more effectively and prepare communities for higher-risk periods.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSection === "geographic" && (
                <motion.div
                  key="geographic"
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-8"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                      🗺️ Geographic Distribution
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Mapping Fire Incidents Across Allegheny County</p>
                  </div>

                  <MunicipalHotspotsChart data={byCity} filteredCount={filteredData.length} />

                  {/* Map Tabs */}
                  <div className="bg-white dark:bg-gray-800/50 backdrop-blur rounded-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden shadow-sm">
                    <div className="flex border-b border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => setMapTab("incidents")}
                        className={`flex-1 px-6 py-4 font-medium transition-all ${
                          mapTab === "incidents"
                            ? "bg-blue-600 text-white"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        }`}
                      >
                        📍 Incident Distribution
                      </button>
                      <button
                        onClick={() => setMapTab("heatmap")}
                        className={`flex-1 px-6 py-4 font-medium transition-all ${
                          mapTab === "heatmap"
                            ? "bg-orange-600 text-white"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        }`}
                      >
                        🔥 Hotspot Heatmap
                      </button>
                    </div>

                    <div className="p-6">
                      {mapTab === "incidents" ? (
                        <InteractiveIncidentMap incidents={filteredData} />
                      ) : (
                        <AdvancedHotspotMap incidents={filteredData} />
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSection === "analysis" && (
                <motion.div
                  key="analysis"
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-8"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent">
                      📊 Deep Analysis
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Understanding the False Alarm Crisis</p>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <FalseAlarmPieChart data={falseAlarmData} />
                    <PriorityTreemapChart data={byPriority} />
                  </div>

                  <FalseAlarmChallenge />
                </motion.div>
              )}

              {activeSection === "action" && (
                <motion.div
                  key="action"
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-8"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 dark:from-red-400 dark:to-rose-400 bg-clip-text text-transparent">
                      🚀 Take Action
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Solutions for a Safer Community</p>
                  </div>

                  <CallToAction />
                  <DashboardFooter />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
