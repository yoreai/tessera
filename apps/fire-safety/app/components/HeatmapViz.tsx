"use client";

import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer } from "recharts";

// Simulated geographic density data (lat/lng style)
const generateHeatmapData = () => {
  const data: Array<{ x: number; y: number; z: number }> = [];
  const hotspots = [
    { lat: 40.44, lng: -80.0, baseIntensity: 200 },  // Downtown
    { lat: 40.44, lng: -79.95, baseIntensity: 180 }, // Oakland
    { lat: 40.45, lng: -79.93, baseIntensity: 150 }, // Shadyside
    { lat: 40.43, lng: -79.92, baseIntensity: 140 }, // Squirrel Hill
    { lat: 40.47, lng: -79.95, baseIntensity: 130 }, // Bloomfield
  ];

  hotspots.forEach(spot => {
    // Create density clusters around each hotspot
    for (let i = 0; i < 30; i++) {
      const offsetLat = (Math.random() - 0.5) * 0.02;
      const offsetLng = (Math.random() - 0.5) * 0.02;
      const intensity = spot.baseIntensity * (0.5 + Math.random() * 0.5);

      data.push({
        x: (spot.lng + offsetLng + 80) * 1000, // Normalize for chart
        y: (spot.lat - 40) * 1000,
        z: intensity,
      });
    }
  });

  return data;
};

export default function HeatmapViz() {
  const data = generateHeatmapData();

  return (
    <div className="bg-gray-900 rounded p-4">
      <ResponsiveContainer width="100%" height={350}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis type="number" dataKey="x" name="Longitude" hide />
          <YAxis type="number" dataKey="y" name="Latitude" hide />
          <ZAxis type="number" dataKey="z" range={[20, 400]} name="Incidents" />
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
          <Scatter
            data={data}
            fill="#f44336"
            fillOpacity={0.6}
            stroke="#c62828"
            strokeWidth={1}
          />
        </ScatterChart>
      </ResponsiveContainer>
      <p className="text-center text-xs text-gray-500 mt-2">
        Geographic density visualization - Allegheny County hotspots
      </p>
    </div>
  );
}

