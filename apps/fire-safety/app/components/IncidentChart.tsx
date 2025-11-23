"use client";

import dynamic from "next/dynamic";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function IncidentChart() {
  const data = [
    {
      x: ["Fire Alarms", "Medical", "Structure", "Vehicle", "Outdoor", "CO", "Gas", "Other"],
      y: [347191, 186524, 89342, 52187, 48923, 42156, 38742, 125743],
      type: "bar" as const,
      marker: {
        color: ["#f44336", "#64b5f6", "#ff9800", "#ffb74d", "#66bb6a", "#ba68c8", "#4db6ac", "#9e9e9e"],
        line: { color: "#000", width: 1.2 },
      },
    },
  ];

  const layout: any = {
    title: {
      text: "Emergency Dispatch Volume by Type (2015-2024)",
      font: { color: "#f0f0f0", size: 16 },
    },
    xaxis: { title: "Incident Type", color: "#a0a0a0" },
    yaxis: { title: "Number of Incidents", color: "#a0a0a0" },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(42,42,42,0.5)",
    font: { color: "#f0f0f0" },
    margin: { t: 50, b: 80, l: 80, r: 20 },
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

