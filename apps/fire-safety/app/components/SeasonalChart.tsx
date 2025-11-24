"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface SeasonalChartProps {
  filters?: {
    year: string;
    incidentType: string;
    municipality: string;
  };
}

const baseData = [
  { season: "Winter", structure: 134, outdoor: 25, alarms: 95 },
  { season: "Spring", structure: 95, outdoor: 60, alarms: 93 },
  { season: "Summer", structure: 75, outdoor: 178, alarms: 98 },
  { season: "Fall", structure: 90, outdoor: 50, alarms: 96 },
];

export default function SeasonalChart({ filters }: SeasonalChartProps) {
  // Apply year filter
  const data = baseData.map(item => {
    if (filters?.year && filters.year !== "all") {
      const yearNum = parseInt(filters.year);
      const scaleFactor = yearNum / 2020; // Scale based on year
      return {
        season: item.season,
        structure: Math.round(item.structure * scaleFactor),
        outdoor: Math.round(item.outdoor * scaleFactor),
        alarms: Math.round(item.alarms * scaleFactor),
      };
    }
    return item;
  });

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis dataKey="season" stroke="#a0a0a0" />
        <YAxis stroke="#a0a0a0" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "2px solid #1976d2",
            borderRadius: "8px",
            color: "#000000",
          }}
        />
        <Legend wrapperStyle={{ color: "#f0f0f0" }} />
        <Bar dataKey="structure" fill="#ff9800" name="Structure Fires" radius={[8, 8, 0, 0]} />
        <Bar dataKey="outdoor" fill="#66bb6a" name="Outdoor Fires" radius={[8, 8, 0, 0]} />
        <Bar dataKey="alarms" fill="#f44336" name="Fire Alarms" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
