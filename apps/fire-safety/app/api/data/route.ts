import { NextResponse } from "next/server";

const BLOB_URL = "https://lgn0alpssagu0n2c.public.blob.vercel-storage.com/corrected_fire_alarms.csv";

// Simple in-memory cache (resets on cold start but saves repeated fetches)
let cachedData: any = null;
let cacheTime = 0;
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const incidentType = searchParams.get("incidentType");
  const municipality = searchParams.get("municipality");

  try {
    // Fetch and parse data (with caching)
    const now = Date.now();
    if (!cachedData || now - cacheTime > CACHE_DURATION) {
      const response = await fetch(BLOB_URL);
      const csvText = await response.text();
      const lines = csvText.split("\n");
      const headers = lines[0].split(",").map(h => h.trim());
      
      cachedData = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(",");
          return headers.reduce((obj: any, header, i) => {
            obj[header] = values[i]?.trim();
            return obj;
          }, {});
        });
      
      cacheTime = now;
    }

    // Filter data
    let filtered = cachedData;
    
    if (year && year !== "all") {
      filtered = filtered.filter((r: any) => r.call_year === year);
    }
    if (incidentType && incidentType !== "all") {
      filtered = filtered.filter((r: any) => r.fire_category === incidentType);
    }
    if (municipality && municipality !== "all") {
      filtered = filtered.filter((r: any) => r.city_name === municipality);
    }

    // Aggregate for charts
    const byType: { [key: string]: number } = {};
    const byYear: { [key: string]: number } = {};
    
    filtered.forEach((r: any) => {
      const type = r.fire_category || "Other";
      byType[type] = (byType[type] || 0) + 1;
      
      const year = r.call_year;
      if (year) byType[year] = (byYear[year] || 0) + 1;
    });

    return NextResponse.json({
      totalRecords: filtered.length,
      byType: Object.entries(byType).map(([name, value]) => ({ name, value })),
      byYear: Object.entries(byYear).map(([year, incidents]) => ({
        year: parseInt(year),
        incidents,
      })).sort((a, b) => a.year - b.year),
      filters: { year, incidentType, municipality },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
