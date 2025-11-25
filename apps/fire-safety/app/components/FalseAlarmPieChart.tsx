"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface FalseAlarmPieChartProps {
  data: { name: string; value: number }[];
}

const COLORS = ["#dc2626", "#ec4899", "#8b5cf6"];

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

export default function FalseAlarmPieChart({ data }: FalseAlarmPieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400">
        🚨 Fire Alarm Distribution - A Major Resource Drain? (Corrected Data)
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={120}
            paddingAngle={2}
            dataKey="value"
            label={({ percent }) => `${((percent || 0) * 100).toFixed(1)}%`}
            labelLine={{ stroke: "#6b7280", strokeWidth: 1 }}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke="#ffffff"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            {...brightTooltip}
            formatter={(value: number, name: string) => [
              `${value.toLocaleString()} (${((value / total) * 100).toFixed(1)}%)`,
              name
            ]}
          />
          <Legend
            layout="horizontal"
            align="center"
            verticalAlign="bottom"
            wrapperStyle={{ paddingTop: "20px" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
        *Post-2019 breakdown estimated based on historical patterns due to classification system change
      </p>
    </div>
  );
}
