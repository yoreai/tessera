"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { FIRE_CATEGORIES, CATEGORY_COLORS } from "../../lib/fireData";

interface SeasonalPatternsChartProps {
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

export default function SeasonalPatternsChart({ data, filteredCount }: SeasonalPatternsChartProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4 text-orange-400">
        🌡️ Seasonal Patterns (Filtered: {filteredCount.toLocaleString()} incidents)
      </h3>
      
      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <XAxis 
            dataKey="season" 
            stroke="#a0a0a0"
            tick={{ fill: "#a0a0a0", fontSize: 12 }}
          />
          <YAxis 
            stroke="#a0a0a0"
            tick={{ fill: "#a0a0a0", fontSize: 12 }}
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

