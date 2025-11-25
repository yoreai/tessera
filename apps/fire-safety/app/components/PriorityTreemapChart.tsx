"use client";

import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { CATEGORY_COLORS } from "../../lib/fireData";

interface PriorityTreemapChartProps {
  data: { priority: string; category: string; count: number }[];
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

// Custom content renderer for treemap cells
const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, name, count, depth, category } = props;

  if (width < 30 || height < 30) return null;

  const color = depth === 1
    ? "#475569"
    : CATEGORY_COLORS[category] || "#6B7B7B";

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        stroke="#ffffff"
        strokeWidth={2}
      />
      {width > 60 && height > 40 && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 8}
            textAnchor="middle"
            fill="#ffffff"
            fontSize={depth === 1 ? 12 : 11}
            fontWeight="bold"
            style={{
              textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
              paintOrder: "stroke fill",
              stroke: "#000000",
              strokeWidth: 2,
            }}
          >
            {name?.length > 20 ? name.substring(0, 18) + "..." : name}
          </text>
          {count && (
            <text
              x={x + width / 2}
              y={y + height / 2 + 12}
              textAnchor="middle"
              fill="#ffffff"
              fontSize={10}
              style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
            >
              {count.toLocaleString()}
            </text>
          )}
        </>
      )}
    </g>
  );
};

export default function PriorityTreemapChart({ data }: PriorityTreemapChartProps) {
  // Group data by priority, then by category
  const priorityGroups: { [key: string]: { name: string; children: any[] } } = {};

  data.forEach(item => {
    if (!priorityGroups[item.priority]) {
      priorityGroups[item.priority] = {
        name: item.priority,
        children: [],
      };
    }
    priorityGroups[item.priority].children.push({
      name: item.category,
      category: item.category,
      count: item.count,
      size: item.count,
    });
  });

  const treemapData = Object.values(priorityGroups);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-xl font-bold mb-4 text-orange-600 dark:text-orange-400">
        🎯 Fire Emergency Priorities - Understanding Response Urgency
      </h3>
      <ResponsiveContainer width="100%" height={500}>
        <Treemap
          data={treemapData}
          dataKey="size"
          aspectRatio={4 / 3}
          stroke="#e5e7eb"
          content={<CustomTreemapContent />}
        >
          <Tooltip
            {...brightTooltip}
            formatter={(value: number) => [value.toLocaleString(), "Incidents"]}
          />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}
