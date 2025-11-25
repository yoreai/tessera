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
  },
  itemStyle: { color: "#000000", fontWeight: "600" as const },
};

export default function MunicipalHotspotsChart({ data, filteredCount }: MunicipalHotspotsChartProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4 text-purple-400">
        📍 Geographic Hotspots (Filtered: {filteredCount.toLocaleString()} incidents)
      </h3>
      <ResponsiveContainer width="100%" height={500}>
        <BarChart data={data} margin={{ top: 20, right: 180, left: 20, bottom: 80 }}>
          <XAxis
            dataKey="city"
            stroke="#a0a0a0"
            tick={{ fill: "#a0a0a0", fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            stroke="#a0a0a0"
            tick={{ fill: "#a0a0a0" }}
            tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
          />
          <Tooltip
            {...brightTooltip}
            formatter={(value: number, name: string) => [value.toLocaleString(), name]}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="top"
            wrapperStyle={{
              paddingLeft: "20px",
              backgroundColor: "rgba(26, 37, 47, 0.95)",
              border: "1px solid rgba(236, 240, 241, 0.2)",
              borderRadius: "8px",
              padding: "12px",
            }}
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

