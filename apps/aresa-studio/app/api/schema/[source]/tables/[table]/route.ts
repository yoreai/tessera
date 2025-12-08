import { NextResponse } from 'next/server';
import { DEMO_COLUMNS, DEMO_MODE } from '@/lib/demo-data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ source: string; table: string }> }
) {
  const { source, table } = await params;

  if (DEMO_MODE) {
    const sourceColumns = DEMO_COLUMNS[source];
    if (sourceColumns && sourceColumns[table]) {
      await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 50));
      return NextResponse.json(sourceColumns[table]);
    }

    // Return generic columns for tables without specific definitions
    return NextResponse.json([
      { column_name: "id", data_type: "integer", is_nullable: "NO", description: "Primary key" },
      { column_name: "created_at", data_type: "timestamp", is_nullable: "NO", description: "Creation time" },
      { column_name: "updated_at", data_type: "timestamp", is_nullable: "YES", description: "Last update" },
    ]);
  }

  // Production: proxy to backend
  try {
    const response = await fetch(`http://localhost:3001/api/schema/${source}/tables/${table}`);
    return NextResponse.json(await response.json());
  } catch (error) {
    return NextResponse.json({ error: 'Backend not available' }, { status: 503 });
  }
}

