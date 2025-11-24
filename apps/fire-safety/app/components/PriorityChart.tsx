"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const data = [
  { type: "Structure Fires", p1: 87, p2: 10, p3: 3 },
  { type: "Vehicle Fires", p1: 76, p2: 18, p3: 6 },
  { type: "Medical Assists", p1: 45, p2: 42, p3: 13 },
  { type: "Fire Alarms", p1: 22, p2: 26, p3: 52 },
  { type: "Outdoor Fires", p1: 15, p2: 17, p3: 68 },
];

export default function PriorityChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical">
        <XAxis type="number" stroke="#a0a0a0" domain={[0, 100]} />
        <YAxis type="category" dataKey="type" stroke="#a0a0a0" width={120} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "2px solid #1976d2",
            borderRadius: "8px",
            color: "#000000",
          }}
        />
        <Legend wrapperStyle={{ color: "#f0f0f0" }} />
        <Bar dataKey="p1" stackId="a" fill="#f44336" name="Priority 1 (High)" />
        <Bar dataKey="p2" stackId="a" fill="#ffb74d" name="Priority 2 (Medium)" />
        <Bar dataKey="p3" stackId="a" fill="#66bb6a" name="Priority 3 (Low)" />
      </BarChart>
    </ResponsiveContainer>
  );
}


