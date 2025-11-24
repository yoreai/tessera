"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const data = [
  { name: "Estimated False Alarms", value: 225674, color: "#f44336" },
  { name: "Legitimate Alarms", value: 121517, color: "#66bb6a" },
];

export default function FalseAlarmChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={(entry) => `${entry.name}: ${((entry.value / 347191) * 100).toFixed(1)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} stroke="#000" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#2a2a2a",
            border: "1px solid #444",
            borderRadius: "8px",
            color: "#f0f0f0",
          }}
          formatter={(value: number) => [value.toLocaleString(), ""]}
        />
        <Legend wrapperStyle={{ color: "#f0f0f0" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

