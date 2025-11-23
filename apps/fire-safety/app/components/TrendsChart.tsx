"use client";

import dynamic from "next/dynamic";
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default function TrendsChart() {
  const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
  const counts = [91247, 94532, 93128, 95341, 94876, 88234, 90127, 94523, 96342, 92458];

  const data = [
    {
      x: years,
      y: counts,
      type: "scatter" as const,
      mode: "lines+markers" as const,
      marker: { size: 10, color: "#64b5f6", line: { color: "#1976d2", width: 2 } },
      line: { color: "#64b5f6", width: 3 },
    },
  ];

  const layout: any = {
    title: {
      text: "Annual Emergency Incidents (2015-2024)",
      font: { color: "#f0f0f0", size: 16 },
    },
    xaxis: { title: "Year", color: "#a0a0a0" },
    yaxis: { title: "Total Incidents", color: "#a0a0a0" },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(42,42,42,0.5)",
    font: { color: "#f0f0f0" },
    annotations: [
      {
        x: 2020,
        y: 88234,
        text: "COVID-19<br>Impact",
        showarrow: true,
        arrowhead: 2,
        ax: 30,
        ay: -40,
        font: { color: "#f44336", size: 12 },
      },
    ],
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

