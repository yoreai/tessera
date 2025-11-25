"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { FIRE_CATEGORIES, CATEGORY_COLORS } from "../../lib/fireData";

interface YearlyTrendsChartProps {
  data: any[];
  filteredCount: number;
}

const brightTooltip = {
  contentStyle: {
    backgroundColor: "#ffffff",
    border: "2px solid #1976d2",
    borderRadius: "8px",
    color: "#000000",
    padding: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
  },
  wrapperStyle: { zIndex: 1000 },
  itemStyle: { color: "#000000", fontWeight: "600" as const },
};

export default function YearlyTrendsChart({ data, filteredCount }: YearlyTrendsChartProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-xl font-bold mb-4 text-blue-600 dark:text-blue-400">
        📊 Fire Emergency Trends (Filtered: {filteredCount.toLocaleString()} incidents)
      </h3>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <XAxis
            dataKey="year"
            stroke="#6b7280"
            tick={{ fill: "#6b7280", fontSize: 12 }}
          />
          <YAxis
            stroke="#6b7280"
            tick={{ fill: "#6b7280", fontSize: 12 }}
            tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
            width={50}
          />
          <Tooltip
            {...brightTooltip}
            formatter={(value: number, name: string) => [value.toLocaleString(), name]}
          />
          <Legend
            layout="horizontal"
            align="center"
            verticalAlign="bottom"
            wrapperStyle={{ paddingTop: "20px" }}
          />
          {FIRE_CATEGORIES.map((category) => (
            <Line
              key={category}
              type="monotone"
              dataKey={category}
              stroke={CATEGORY_COLORS[category]}
              strokeWidth={2}
              dot={{ r: 3, fill: CATEGORY_COLORS[category] }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
