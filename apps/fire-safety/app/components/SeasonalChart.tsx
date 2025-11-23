"use client";

import dynamic from "next/dynamic";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function SeasonalChart() {
  const seasons = ["Winter", "Spring", "Summer", "Fall"];

  const data = [
    {
      x: seasons,
      y: [134, 95, 75, 90],
      name: "Structure Fires",
      type: "bar" as const,
      marker: { color: "#ff9800" },
    },
    {
      x: seasons,
      y: [25, 60, 178, 50],
      name: "Outdoor Fires",
      type: "bar" as const,
      marker: { color: "#66bb6a" },
    },
    {
      x: seasons,
      y: [95, 93, 98, 96],
      name: "Fire Alarms",
      type: "bar" as const,
      marker: { color: "#f44336" },
    },
  ];

  const layout: any = {
    title: {
      text: "Seasonal Incident Patterns (Relative to Annual Average)",
      font: { color: "#f0f0f0", size: 16 },
    },
    xaxis: { title: "Season", color: "#a0a0a0" },
    yaxis: { title: "Incidents (% of Average)", color: "#a0a0a0" },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(42,42,42,0.5)",
    font: { color: "#f0f0f0" },
    barmode: "group",
    showlegend: true,
    legend: { font: { color: "#f0f0f0" } },
  };

  return (
    <Plot
      data={data}
      layout={layout}
      config={{ responsive: true, displayModeBar: false }}
      className="w-full"
    />
  );
}

