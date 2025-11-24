import { NextResponse } from "next/server";
import { list } from "@vercel/blob";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const incidentType = searchParams.get("incidentType");
  const municipality = searchParams.get("municipality");

  try {
    // For now, return sample data structure
    // When Vercel Blob is set up, this will fetch from blob storage

    // TODO: Replace with actual Vercel Blob fetch
    // const { blobs } = await list();
    // const dataBlob = blobs.find(b => b.pathname === 'corrected_fire_alarms.csv');
    // const response = await fetch(dataBlob.url);
    // const csvText = await response.text();
    // Parse CSV and filter based on params

    const sampleData = {
      totalIncidents: year === "all" ? 930808 : Math.floor(930808 / 10),
      fireAlarms: year === "all" ? 347191 : Math.floor(347191 / 10),
      structureFires: year === "all" ? 89342 : Math.floor(89342 / 10),
      incidents: generateSampleIncidents(year, incidentType, municipality),
    };

    return NextResponse.json(sampleData);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

function generateSampleIncidents(year: string | null, type: string | null, muni: string | null) {
  // Sample data generator - replace with real Blob data
  const base = {
    byType: [
      { name: "Fire Alarms", value: 347191 },
      { name: "Medical", value: 186524 },
      { name: "Structure", value: 89342 },
      { name: "Vehicle", value: 52187 },
      { name: "Outdoor", value: 48923 },
      { name: "CO Alarms", value: 42156 },
      { name: "Gas", value: 38742 },
      { name: "Other", value: 125743 },
    ],
    byYear: [
      { year: 2015, incidents: 91247 },
      { year: 2016, incidents: 94532 },
      { year: 2017, incidents: 93128 },
      { year: 2018, incidents: 95341 },
      { year: 2019, incidents: 94876 },
      { year: 2020, incidents: 88234 },
      { year: 2021, incidents: 90127 },
      { year: 2022, incidents: 94523 },
      { year: 2023, incidents: 96342 },
      { year: 2024, incidents: 92458 },
    ],
  };

  // Apply filters
  if (year && year !== "all") {
    const yearData = base.byYear.find(y => y.year.toString() === year);
    const scaleFactor = yearData ? yearData.incidents / 93081 : 1;
    base.byType = base.byType.map(item => ({
      ...item,
      value: Math.round(item.value * scaleFactor),
    }));
  }

  return base;
}

