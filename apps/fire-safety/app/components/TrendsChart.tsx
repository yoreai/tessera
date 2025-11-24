"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts";

interface TrendsChartProps {
  filters?: {
    year: string;
    incidentType: string;
    municipality: string;
  };
}

const baseData = [
  { year: 2015, incidents: 91247 },
  { year: 2016, incidents: 94532 },
  { year: 2017, incidents: 93128 },
  { year: 2018, incidents: 95341 },
  { year: 2019, incidents: 94876 },
  { year: 2020, incidents: 88234, covid: true },
  { year: 2021, incidents: 90127 },
  { year: 2022, incidents: 94523 },
  { year: 2023, incidents: 96342 },
  { year: 2024, incidents: 92458 },
];

export default function TrendsChart({ filters }: TrendsChartProps) {
  // Apply filters (adjust data if filtered)
  const data = baseData.map(item => {
    if (filters?.incidentType !== "all" && filters?.incidentType) {
      // Scale data when filtering by type (simulated reduction)
      return { ...item, incidents: Math.round(item.incidents * 0.37) }; // ~37% are fire alarms
    }
    return item;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="year" stroke="#a0a0a0" />
        <YAxis stroke="#a0a0a0" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "2px solid #1976d2",
            borderRadius: "8px",
            color: "#000000",
          }}
        />
        <Line
          type="monotone"
          dataKey="incidents"
          stroke="#64b5f6"
          strokeWidth={3}
          dot={{ fill: "#fff", stroke: "#1976d2", strokeWidth: 2, r: 5 }}
          activeDot={{ r: 7 }}
        />
        <ReferenceDot x={2020} y={88234} r={10} fill="#f44336" stroke="#c62828" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
