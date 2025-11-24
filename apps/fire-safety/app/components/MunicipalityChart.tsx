"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const data = [
  { name: "Homestead", rate: 47.2, color: "#f44336" },
  { name: "Braddock", rate: 43.8, color: "#ff5722" },
  { name: "Rankin", rate: 41.5, color: "#ff9800" },
  { name: "Duquesne", rate: 39.7, color: "#ffb74d" },
  { name: "Wilkinsburg", rate: 38.2, color: "#ffc107" },
  { name: "County Avg", rate: 15.7, color: "#9e9e9e" },
];

export default function MunicipalityChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 10 }}>
        <XAxis type="number" stroke="#a0a0a0" domain={[0, 50]} />
        <YAxis type="category" dataKey="name" stroke="#a0a0a0" width={100} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "2px solid #1976d2",
            borderRadius: "8px",
            color: "#000000",
          }}
          formatter={(value: number) => [`${value} per 1,000`, "Incident Rate"]}
        />
        <Bar dataKey="rate" radius={[0, 8, 8, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} stroke="#000" strokeWidth={1} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

