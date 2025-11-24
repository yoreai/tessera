"use client";

import Filters from "./Filters";

interface SidebarProps {
  onFilterChange?: (filters: any) => void;
}

export default function Sidebar({ onFilterChange }: SidebarProps) {
  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4 text-blue-400">Key Statistics</h3>
        <div className="space-y-4">
          <div className="border-b border-gray-700 pb-3">
            <div className="text-3xl font-bold text-red-400">37.3%</div>
            <div className="text-sm text-gray-400">Fire Alarm Incidents</div>
          </div>
          <div className="border-b border-gray-700 pb-3">
            <div className="text-3xl font-bold text-orange-400">$225M</div>
            <div className="text-sm text-gray-400">False Alarm Cost (10yr)</div>
          </div>
          <div className="border-b border-gray-700 pb-3">
            <div className="text-3xl font-bold text-blue-400">930,808</div>
            <div className="text-sm text-gray-400">Total Records</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-400">10 Years</div>
            <div className="text-sm text-gray-400">Data Span (2015-2024)</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4 text-blue-400">Filters</h3>
        <Filters onFilterChange={onFilterChange} />
      </div>

      {/* Quick Insights */}
      <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-lg p-6 border border-blue-500/30">
        <h3 className="text-lg font-bold mb-4 text-blue-400">Quick Insights</h3>
        <ul className="space-y-3 text-sm text-gray-300">
          <li className="flex items-start">
            <span className="text-green-400 mr-2">▸</span>
            <span>Winter months see 34% increase in structure fires</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-400 mr-2">▸</span>
            <span>Summer outdoor fires surge by 78%</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-400 mr-2">▸</span>
            <span>Morning peak: 8-11 AM (building occupancy)</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-400 mr-2">▸</span>
            <span>Evening peak: 5-8 PM (cooking-related)</span>
          </li>
        </ul>
      </div>

      {/* Data Source */}
      <div className="bg-gray-800/50 rounded-lg p-4 text-xs text-gray-500">
        <p className="font-semibold mb-1">Data Source:</p>
        <p>Western PA Regional Data Center (WPRDC)</p>
        <p className="mt-2">Allegheny County 911 Fire Dispatches</p>
        <p>Updated: November 2024</p>
      </div>
    </div>
  );
}

