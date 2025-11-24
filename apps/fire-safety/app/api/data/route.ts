import { NextResponse } from "next/server";
import { queryFireData } from "../../../lib/duckdb";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year") || undefined;
  const incidentType = searchParams.get("incidentType") || undefined;
  const municipality = searchParams.get("municipality") || undefined;

  try {
    // Query using DuckDB-WASM (SQL on CSV - FAST!)
    const data = await queryFireData({
      year,
      incidentType,
      municipality,
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}


