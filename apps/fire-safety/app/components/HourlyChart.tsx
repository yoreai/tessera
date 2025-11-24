"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const data = [
  { hour: "12AM", incidents: 120 }, { hour: "1AM", incidents: 95 }, { hour: "2AM", incidents: 80 },
  { hour: "3AM", incidents: 70 }, { hour: "4AM", incidents: 65 }, { hour: "5AM", incidents: 75 },
  { hour: "6AM", incidents: 120 }, { hour: "7AM", incidents: 180 }, { hour: "8AM", incidents: 280 },
  { hour: "9AM", incidents: 320 }, { hour: "10AM", incidents: 310 }, { hour: "11AM", incidents: 260 },
  { hour: "12PM", incidents: 240 }, { hour: "1PM", incidents: 220 }, { hour: "2PM", incidents: 210 },
  { hour: "3PM", incidents: 195 }, { hour: "4PM", incidents: 185 }, { hour: "5PM", incidents: 280 },
  { hour: "6PM", incidents: 320 }, { hour: "7PM", incidents: 310 }, { hour: "8PM", incidents: 260 },
  { hour: "9PM", incidents: 200 }, { hour: "10PM", incidents: 160 }, { hour: "11PM", incidents: 140 },
];

export default function HourlyChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis
          dataKey="hour"
          stroke="#a0a0a0"
          angle={-45}
          textAnchor="end"
          height={80}
          interval={1}
          tick={{ fontSize: 11 }}
        />
        <YAxis stroke="#a0a0a0" label={{ value: "Avg Incidents", angle: -90, position: "insideLeft" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "2px solid #1976d2",
            borderRadius: "8px",
            color: "#000000",
          }}
        />
        <ReferenceLine y={200} stroke="#666" strokeDasharray="3 3" label={{ value: "Average", fill: "#999" }} />
        <Bar dataKey="incidents" fill="#64b5f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}


