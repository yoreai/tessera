"use client";

import { Treemap, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#f44336", "#ff9800", "#ffb74d", "#66bb6a", "#4db6ac", "#ba68c8", "#64b5f6", "#9e9e9e"];

const data = [
  {
    name: "High Priority",
    children: [
      { name: "Structure Fires", size: 77683, fill: "#f44336" },
      { name: "Vehicle Fires", size: 39662, fill: "#ff5722" },
      { name: "Medical Assists", size: 83935, fill: "#ff9800" },
    ],
  },
  {
    name: "Medium Priority",
    children: [
      { name: "Fire Alarms", size: 90268, fill: "#ffb74d" },
      { name: "Outdoor Fires", size: 8317, fill: "#66bb6a" },
      { name: "Gas Issues", size: 16231, fill: "#4db6ac" },
    ],
  },
  {
    name: "Low Priority",
    children: [
      { name: "Fire Alarms (Low)", size: 180479, fill: "#9e9e9e" },
      { name: "Outdoor Fires", size: 33250, fill: "#66bb6a" },
      { name: "Other", size: 37127, fill: "#757575" },
    ],
  },
];

const CustomContent = (props: any) => {
  const { x, y, width, height, name, size, fill } = props;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill,
          stroke: "#000",
          strokeWidth: 2,
          strokeOpacity: 1,
        }}
      />
      {width > 50 && height > 30 && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 10}
            textAnchor="middle"
            fill="#fff"
            fontSize={12}
            fontWeight="bold"
          >
            {name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 10}
            textAnchor="middle"
            fill="#fff"
            fontSize={10}
          >
            {size?.toLocaleString()}
          </text>
        </>
      )}
    </g>
  );
};

export default function TreemapPriority() {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <Treemap
        data={data}
        dataKey="size"
        aspectRatio={4 / 3}
        stroke="#000"
        fill="#8884d8"
        content={<CustomContent />}
      >
        <Tooltip
          contentStyle={{
            backgroundColor: "#2a2a2a",
            border: "1px solid #444",
            borderRadius: "8px",
            color: "#f0f0f0",
          }}
          formatter={(value: number) => [value.toLocaleString(), "Incidents"]}
        />
      </Treemap>
    </ResponsiveContainer>
  );
}

