"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { FIRE_CATEGORIES, CATEGORY_COLORS } from "../../lib/fireData";

interface MunicipalHotspotsChartProps {
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

export default function MunicipalHotspotsChart({ data, filteredCount }: MunicipalHotspotsChartProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-xl font-bold mb-4 text-purple-600 dark:text-purple-400">
        📍 Geographic Hotspots (Filtered: {filteredCount.toLocaleString()} incidents)
      </h3>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
          <XAxis
            dataKey="city"
            stroke="#6b7280"
            tick={{ fill: "#6b7280", fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
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
            <Bar
              key={category}
              dataKey={category}
              stackId="a"
              fill={CATEGORY_COLORS[category]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
