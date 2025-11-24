"use client";

import { useState } from "react";
import IncidentChart from "./components/IncidentChart";
import TrendsChart from "./components/TrendsChart";
import SeasonalChart from "./components/SeasonalChart";
import HourlyChart from "./components/HourlyChart";
import PriorityChart from "./components/PriorityChart";
import MunicipalityChart from "./components/MunicipalityChart";
import FalseAlarmChart from "./components/FalseAlarmChart";
import LeadGenModal from "./components/LeadGenModal";
import Sidebar from "./components/Sidebar";
import FireMap from "./components/FireMap";

export default function FireSafetyDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState({
    year: "all",
    incidentType: "all",
    municipality: "all",
  });

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "geographic", label: "Geographic", icon: "🗺️" },
    { id: "temporal", label: "Temporal", icon: "📅" },
    { id: "analysis", label: "Analysis", icon: "🔍" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-5xl font-bold mb-4">
            🔥 US Fire Safety Analytics
          </h1>
          <p className="text-xl text-gray-400">
            Data-driven insights from 930,000+ emergency dispatch records (2015-2024)
          </p>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Main Layout: Sidebar + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar onFilterChange={setFilters} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Active Filter Display */}
            {(filters.year !== "all" || filters.incidentType !== "all" || filters.municipality !== "all") && (
              <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-500/30">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-300">
                    <span className="font-semibold text-blue-400">Active Filters:</span>{" "}
                    {filters.year !== "all" && <span className="ml-2 bg-blue-500/30 px-2 py-1 rounded">{filters.year}</span>}
                    {filters.incidentType !== "all" && <span className="ml-2 bg-blue-500/30 px-2 py-1 rounded">{filters.incidentType}</span>}
                    {filters.municipality !== "all" && <span className="ml-2 bg-blue-500/30 px-2 py-1 rounded">{filters.municipality}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <>
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-4 text-blue-400">
                    Incident Distribution
                    {filters.year !== "all" && <span className="text-sm text-gray-400 ml-2">({filters.year})</span>}
                  </h2>
                  <IncidentChart filters={filters} />
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-4 text-blue-400">
                    Annual Trends
                  </h2>
                  <TrendsChart />
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-4 text-blue-400">
                    Priority Distribution by Incident Type
                  </h2>
                  <PriorityChart />
                </div>
              </>
            )}

            {/* Geographic Tab */}
            {activeTab === "geographic" && (
              <>
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-4 text-blue-400">
                    Geographic Incident Hotspots
                  </h2>
                  <FireMap />
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-4 text-blue-400">
                    High Per-Capita Municipalities
                  </h2>
                  <MunicipalityChart />
                  <p className="text-sm text-gray-400 mt-4">
                    * Incidents per 1,000 residents. County average: 15.7
                  </p>
                </div>
              </>
            )}

            {/* Temporal Tab */}
            {activeTab === "temporal" && (
              <>
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-4 text-blue-400">
                    Seasonal Patterns
                  </h2>
                  <SeasonalChart />
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-4 text-blue-400">
                    Hourly Distribution (24-Hour Pattern)
                  </h2>
                  <HourlyChart />
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-blue-900/30 p-3 rounded">
                      <div className="font-bold text-blue-400">Morning Peak</div>
                      <div className="text-gray-400">8-11 AM (28% of fire alarms)</div>
                    </div>
                    <div className="bg-orange-900/30 p-3 rounded">
                      <div className="font-bold text-orange-400">Evening Peak</div>
                      <div className="text-gray-400">5-8 PM (22% of structure fires)</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-4 text-blue-400">
                    Year-Over-Year Trends
                  </h2>
                  <TrendsChart />
                </div>
              </>
            )}

            {/* Analysis Tab */}
            {activeTab === "analysis" && (
              <>
                {/* The Hidden Cost Section */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 rounded-lg p-6 border-l-4 border-red-500">
                    <h3 className="text-xl font-bold mb-3 text-red-400">💰 The Hidden Cost</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      False alarms don't just waste money—they put lives at risk. When emergency responders
                      are tied up with preventable calls, response times for real emergencies increase.
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-lg p-6 border-l-4 border-blue-500">
                    <h3 className="text-xl font-bold mb-3 text-blue-400">🔧 Smart Solutions</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Modern fire detection technology can reduce false alarms by 40-60% while maintaining safety.
                      Investment in smart systems could save millions.
                    </p>
                  </div>
                </div>

                {/* False Alarm Analysis */}
                <div className="bg-gray-800 rounded-lg p-6 mb-6">
                  <h2 className="text-2xl font-bold mb-4 text-blue-400">
                    False Alarm Breakdown
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <FalseAlarmChart />
                    </div>
                    <div className="flex flex-col justify-center space-y-4">
                      <div className="bg-gradient-to-r from-red-600 to-orange-500 p-6 rounded-lg text-center">
                        <div className="text-sm text-white/80 mb-2">Cost Per False Alarm</div>
                        <div className="text-5xl font-bold text-white">$1,000</div>
                        <div className="text-sm text-white/80 mt-2">in emergency response resources</div>
                      </div>
                      <div className="bg-gray-700/50 p-4 rounded text-sm text-gray-300 space-y-2">
                        <div className="flex justify-between">
                          <span>Estimated False Alarms:</span>
                          <span className="font-bold text-red-400">225,674</span>
                        </div>
                        <div className="flex justify-between">
                          <span>10-Year Total Cost:</span>
                          <span className="font-bold text-orange-400">$225.7M</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Annual Average:</span>
                          <span className="font-bold">$22.6M</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Policy Recommendations */}
                <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-8 border border-blue-500/30">
                  <h2 className="text-2xl font-bold mb-6 text-blue-400">
                    Policy Recommendations
                  </h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h3 className="font-bold text-lg mb-2">🔔 Smart Alarm Technology</h3>
                      <p className="text-gray-400 text-sm mb-2">
                        Deploy multi-criteria detection systems in high-frequency locations
                      </p>
                      <div className="text-green-400 font-bold">Target: 30-50% reduction</div>
                      <div className="text-sm text-gray-500">Est. savings: $67-112M / 10yr</div>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2">🏘️ Community Prevention</h3>
                      <p className="text-gray-400 text-sm mb-2">
                        Target top 5 per-capita municipalities with prevention programs
                      </p>
                      <div className="text-green-400 font-bold">Target: 20% reduction</div>
                      <div className="text-sm text-gray-500">Impact: 3,000+ fewer fires / 10yr</div>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2">📅 Seasonal Staffing</h3>
                      <p className="text-gray-400 text-sm mb-2">
                        Align resources with winter structure fire and summer outdoor peaks
                      </p>
                      <div className="text-green-400 font-bold">Target: 15% capacity increase</div>
                      <div className="text-sm text-gray-500">Benefit: Reduced response times</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-4 text-blue-400">
                    Cost Impact Analysis
                  </h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-700/50 rounded">
                      <span>Total False Alarms (estimated)</span>
                      <span className="font-bold text-red-400">225,674</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-700/50 rounded">
                      <span>Cost Per False Alarm</span>
                      <span className="font-bold text-orange-400">$1,000</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-700/50 rounded">
                      <span>Total 10-Year Cost</span>
                      <span className="font-bold text-red-400">$225.7 Million</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-700/50 rounded">
                      <span>Annual Average Cost</span>
                      <span className="font-bold text-orange-400">$22.6 Million</span>
                    </div>
                  </div>
                </div>

                {/* Take Action Today */}
                <div className="bg-blue-600 rounded-lg p-6 text-center mb-6">
                  <h3 className="text-2xl font-bold mb-4 text-white">📞 Take Action Today</h3>
                </div>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-blue-500 text-center">
                    <div className="text-3xl mb-3">🏛️</div>
                    <div className="font-bold text-lg mb-2">Contact Officials</div>
                    <div className="text-sm text-gray-400">About false alarm reduction programs</div>
                  </div>
                  <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-green-500 text-center">
                    <div className="text-3xl mb-3">💰</div>
                    <div className="font-bold text-lg mb-2">Support Funding</div>
                    <div className="text-sm text-gray-400">For community fire prevention initiatives</div>
                  </div>
                  <div className="bg-gray-800 p-6 rounded-lg border-l-4 border-orange-500 text-center">
                    <div className="text-3xl mb-3">📢</div>
                    <div className="font-bold text-lg mb-2">Share This Story</div>
                    <div className="text-sm text-gray-400">Raise awareness about fire safety equity</div>
                  </div>
                </div>
              </>
            )}

            {/* CTA - Shows on all tabs */}
            <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 rounded-lg p-8 border border-red-500/30 text-center">
              <h2 className="text-3xl font-bold mb-4">Reduce False Alarms by 30-50%</h2>
              <p className="text-gray-300 mb-6 text-lg">
                Get AI-approved fire alarm systems for your commercial building
              </p>
              <LeadGenModal />
              <p className="text-sm text-gray-500 mt-4">
                Based on data analysis of 930,808 emergency dispatch records
              </p>
            </div>
          </div>
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
