"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ALL_CATEGORIES } from "../lib/fireData";
import { useHybridData } from "../lib/useHybridData";

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
import { Flame, Zap, Database } from "lucide-react";

// Dynamic import for map wrapper
const MapWrapper = dynamic(() => import("./components/MapWrapper"), { ssr: false });

const YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

export default function FireSafetyDashboard() {
  // Hybrid data loading (pre-aggregated first, raw data in background)
  const {
    initialLoading,
    filterLoading,
    dataSource,
    byYear,
    bySeason,
    byCity,
    byPriority,
    falseAlarms,
    stats,
    cities: topCities,
    filteredCount,
    filteredIncidents,
    applyFilters,
  } = useHybridData();

  const [activeSection, setActiveSection] = useState("overview");
  const [selectedYears, setSelectedYears] = useState<(string | number)[]>(YEARS);
  const [selectedTypes, setSelectedTypes] = useState<(string | number)[]>([...ALL_CATEGORIES]);
  const [selectedCities, setSelectedCities] = useState<(string | number)[]>([]);
  const [mapTab, setMapTab] = useState<"incidents" | "heatmap">("incidents");

  // Apply filters whenever selections change
  useEffect(() => {
    applyFilters(
      selectedYears.map(Number),
      selectedTypes.map(String),
      selectedCities.map(String)
    );
  }, [selectedYears, selectedTypes, selectedCities, applyFilters]);

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6"
        >
          {/* Animated Flame */}
          <div className="relative">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Flame className="w-20 h-20 text-orange-500" />
            </motion.div>
            {/* Glow effect */}
            <div className="absolute inset-0 w-20 h-20 bg-orange-500/20 rounded-full blur-xl animate-pulse" />
          </div>

          <div className="text-center">
            <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Loading fire safety data...
            </p>
            <p className="text-gray-500 dark:text-slate-400 text-sm">
              Analyzing 550,000+ incidents
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-orange-500 rounded-full"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Data is now provided by useHybridData hook
  // Show data source indicator for debugging (can be removed in production)
  const DataSourceBadge = () => (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-900/80 text-white backdrop-blur">
      {dataSource === "precomputed" && (
        <>
          <Zap className="w-3 h-3 text-yellow-400" />
          <span>Pre-computed</span>
        </>
      )}
      {dataSource === "duckdb" && (
        <>
          <Database className="w-3 h-3 text-green-400" />
          <span>DuckDB</span>
        </>
      )}
      {dataSource === "fallback" && (
        <>
          <Database className="w-3 h-3 text-orange-400" />
          <span>Live Filter</span>
        </>
      )}
      {filterLoading && <span className="animate-pulse ml-1">⏳</span>}
    </div>
  );

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
          totalCount={stats.total}
          filteredCount={filteredCount}
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
                  <div className="bg-gradient-to-r from-rose-800/90 to-amber-800/90 dark:from-rose-900/90 dark:to-amber-900/90 rounded-xl p-6 shadow-lg border border-rose-700/30">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="text-center md:text-left">
                        <h3 className="text-2xl font-bold text-white mb-2">🚨 The Hidden Crisis</h3>
                        <p className="text-rose-100/90 text-lg">
                          Fire alarms drain emergency resources and delay response to real emergencies
                        </p>
                      </div>
                      <div className="bg-white/10 backdrop-blur rounded-xl px-8 py-4 text-center border border-white/10">
                        <div className="text-5xl font-extrabold text-white">{stats.alarmPercentage}%</div>
                        <div className="text-rose-100/80 font-medium">of incidents are alarms</div>
                      </div>
                    </div>
                  </div>

                  {/* Story & Insights */}
                  <NarrativeSection alarmPercentage={stats.alarmPercentage} />

                  {/* Quick Preview of Data */}
                  <div className="bg-white dark:bg-slate-800/60 rounded-xl p-6 shadow-md border border-gray-200 dark:border-slate-700/50">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      📊 Explore the Data
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <button
                        onClick={() => setActiveSection("temporal")}
                        className="bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700/80 p-4 rounded-lg transition-colors border border-slate-200 dark:border-slate-600/50"
                      >
                        <div className="text-2xl mb-2">📈</div>
                        <div className="font-bold text-slate-700 dark:text-slate-200">10+ Years of Data</div>
                        <div className="text-sm text-gray-500 dark:text-slate-400">Explore temporal trends →</div>
                      </button>
                      <button
                        onClick={() => setActiveSection("geographic")}
                        className="bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700/80 p-4 rounded-lg transition-colors border border-slate-200 dark:border-slate-600/50"
                      >
                        <div className="text-2xl mb-2">🗺️</div>
                        <div className="font-bold text-slate-700 dark:text-slate-200">130+ Municipalities</div>
                        <div className="text-sm text-gray-500 dark:text-slate-400">View geographic maps →</div>
                      </button>
                      <button
                        onClick={() => setActiveSection("analysis")}
                        className="bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700/80 p-4 rounded-lg transition-colors border border-slate-200 dark:border-slate-600/50"
                      >
                        <div className="text-2xl mb-2">🔍</div>
                        <div className="font-bold text-slate-700 dark:text-slate-200">Deep Analysis</div>
                        <div className="text-sm text-gray-500 dark:text-slate-400">Understand the crisis →</div>
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
                    <YearlyTrendsChart data={byYear} filteredCount={filteredCount} />
                    <SeasonalPatternsChart data={bySeason} filteredCount={filteredCount} />
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

                  <MunicipalHotspotsChart data={byCity} filteredCount={filteredCount} />

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
                      <MapWrapper
                        key={`map-wrapper-${mapTab}`}
                        incidents={filteredIncidents}
                        mapType={mapTab === "incidents" ? "incidents" : "hotspots"}
                      />
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
                    <FalseAlarmPieChart data={falseAlarms} />
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
      <DataSourceBadge />
    </div>
  );
}
