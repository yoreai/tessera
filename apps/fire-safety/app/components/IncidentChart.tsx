"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface IncidentChartProps {
  filters?: {
    year: string;
    incidentType: string;
    municipality: string;
  };
}

const baseData = [
  { name: "Fire Alarms", value: 347191, color: "#f44336" },
  { name: "Medical", value: 186524, color: "#64b5f6" },
  { name: "Structure", value: 89342, color: "#ff9800" },
  { name: "Vehicle", value: 52187, color: "#ffb74d" },
  { name: "Outdoor", value: 48923, color: "#66bb6a" },
  { name: "CO Alarms", value: 42156, color: "#ba68c8" },
  { name: "Gas", value: 38742, color: "#4db6ac" },
  { name: "Other", value: 125743, color: "#9e9e9e" },
];

export default function IncidentChart({ filters }: IncidentChartProps) {
  // Apply filters (for demo, scale data based on year filter)
  const data = baseData.map(item => {
    if (filters?.year !== "all" && filters?.year) {
      // Simulate year filtering by adjusting values
      const yearFactor = parseInt(filters.year) / 2020;
      return { ...item, value: Math.round(item.value * yearFactor) };
    }
    return item;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="name" stroke="#a0a0a0" angle={-45} textAnchor="end" height={80} />
        <YAxis stroke="#a0a0a0" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "2px solid #1976d2",
            borderRadius: "8px",
            color: "#000000",
          }}
        />
        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} stroke="#000" strokeWidth={1} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
