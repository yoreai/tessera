"use client";

interface KeyStatsGridProps {
  stats: {
    total: number;
    avgPerYear: number;
    structureFires: number;
    fireAlarms: number;
    alarmPercentage: string;
    highPriorityIncidents: number;
  };
}

export default function KeyStatsGrid({ stats }: KeyStatsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Total Incidents */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 shadow-lg">
        <div className="text-3xl font-bold text-white mb-1">
          {stats.total.toLocaleString()}
        </div>
        <div className="text-sm text-blue-100 font-medium">Total Incidents</div>
      </div>

      {/* Avg Per Year */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 shadow-lg">
        <div className="text-3xl font-bold text-white mb-1">
          {stats.avgPerYear.toLocaleString()}
        </div>
        <div className="text-sm text-purple-100 font-medium">Avg Per Year</div>
      </div>

      {/* Structure Fires */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 shadow-lg">
        <div className="text-3xl font-bold text-white mb-1">
          {stats.structureFires.toLocaleString()}
        </div>
        <div className="text-sm text-orange-100 font-medium">Structure Fires</div>
      </div>

      {/* High Priority */}
      <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-5 shadow-lg">
        <div className="text-3xl font-bold text-white mb-1">
          {stats.highPriorityIncidents.toLocaleString()}
        </div>
        <div className="text-sm text-red-100 font-medium">High Priority</div>
      </div>
    </div>
  );
}
