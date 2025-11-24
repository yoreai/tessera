import { NextResponse } from "next/server";

const BLOB_URL = "https://lgn0alpssagu0n2c.public.blob.vercel-storage.com/corrected_fire_alarms.csv";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const incidentType = searchParams.get("incidentType");
  const municipality = searchParams.get("municipality");

  try {
    // Fetch real data from Vercel Blob
    const response = await fetch(BLOB_URL);
    const csvText = await response.text();
    
    // Parse CSV (simple parser for fire safety data)
    const lines = csvText.split("\n");
    const headers = lines[0].split(",");
    const records = lines.slice(1).map(line => {
      const values = line.split(",");
      return headers.reduce((obj: any, header, index) => {
        obj[header.trim()] = values[index]?.trim();
        return obj;
      }, {});
    }).filter(record => record.call_year); // Filter empty lines
    
    // Apply filters
    let filteredRecords = records;
    
    if (year && year !== "all") {
      filteredRecords = filteredRecords.filter((r: any) => r.call_year === year);
    }
    
    if (incidentType && incidentType !== "all") {
      filteredRecords = filteredRecords.filter((r: any) => r.fire_category === incidentType);
    }
    
    if (municipality && municipality !== "all") {
      filteredRecords = filteredRecords.filter((r: any) => r.city_name === municipality);
    }

    // Aggregate data for charts
    const data = {
      totalRecords: filteredRecords.length,
      byType: aggregateByType(filteredRecords),
      byYear: aggregateByYear(filteredRecords),
      bySeason: aggregateBySeason(filteredRecords),
      filters: { year, incidentType, municipality },
    };

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

// Aggregation helpers
function aggregateByType(records: any[]) {
  const counts: { [key: string]: number } = {};
  records.forEach((r: any) => {
    const type = r.fire_category || "Other";
    counts[type] = (counts[type] || 0) + 1;
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

function aggregateByYear(records: any[]) {
  const counts: { [key: string]: number } = {};
  records.forEach((r: any) => {
    const year = r.call_year;
    if (year) counts[year] = (counts[year] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([year, incidents]) => ({ year: parseInt(year), incidents }))
    .sort((a, b) => a.year - b.year);
}

function aggregateBySeason(records: any[]) {
  const counts: { [key: string]: number } = {};
  records.forEach((r: any) => {
    const quarter = r.call_quarter;
    const season = quarter === "Q1" ? "Winter" : quarter === "Q2" ? "Spring" : quarter === "Q3" ? "Summer" : "Fall";
    counts[season] = (counts[season] || 0) + 1;
  });
  return Object.entries(counts).map(([season, count]) => ({ season, count }));
}

