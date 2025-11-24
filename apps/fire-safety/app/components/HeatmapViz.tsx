"use client";

import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

// Generate realistic heatmap data for Pittsburgh area
const generateHeatmapData = () => {
  const data: Array<{ x: number; y: number; z: number; color: string }> = [];

  // Pittsburgh hotspots with realistic density
  const hotspots = [
    { name: "Downtown", x: 50, y: 50, intensity: 100 },
    { name: "Oakland", x: 65, y: 45, intensity: 85 },
    { name: "Shadyside", x: 75, y: 55, intensity: 70 },
    { name: "Squirrel Hill", x: 80, y: 40, intensity: 65 },
    { name: "Bloomfield", x: 60, y: 60, intensity: 60 },
    { name: "Lawrenceville", x: 55, y: 70, intensity: 55 },
    { name: "South Side", x: 45, y: 35, intensity: 50 },
    { name: "North Side", x: 40, y: 60, intensity: 45 },
  ];

  hotspots.forEach(spot => {
    // Create density cloud around each hotspot
    for (let i = 0; i < 20; i++) {
      const offsetX = (Math.random() - 0.5) * 15;
      const offsetY = (Math.random() - 0.5) * 15;
      const intensity = spot.intensity * (0.6 + Math.random() * 0.4);

      // Brighter colors for visibility on dark background
      const color = intensity > 80 ? "#ff1744" :  // Bright red
                   intensity > 60 ? "#ff5252" :  // Lighter red
                   intensity > 40 ? "#ff6e40" :  // Coral
                   "#ff9e80";                     // Light coral

      data.push({
        x: spot.x + offsetX,
        y: spot.y + offsetY,
        z: intensity,
        color,
      });
    }
  });

  return data;
};

export default function HeatmapViz() {
  const data = generateHeatmapData();

  return (
    <div className="bg-gray-900/50 rounded p-4">
      <ResponsiveContainer width="100%" height={350}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 100]}
            hide
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[0, 100]}
            hide
          />
          <ZAxis type="number" dataKey="z" range={[50, 800]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            contentStyle={{
              backgroundColor: "#2a2a2a",
              border: "1px solid #444",
              borderRadius: "8px",
              color: "#f0f0f0",
            }}
            formatter={(value: number) => [Math.round(value as number), "Incident Density"]}
          />
          <Scatter data={data} fill="#f44336">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.9} stroke="#fff" strokeWidth={0.5} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <p className="text-center text-xs text-gray-500 mt-2">
        Incident density across Allegheny County - darker/larger circles = higher incident rates
      </p>
    </div>
  );
}
