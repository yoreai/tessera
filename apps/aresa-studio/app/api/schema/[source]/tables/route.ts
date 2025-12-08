import { NextResponse } from 'next/server';
import { DEMO_SCHEMAS, DEMO_MODE } from '@/lib/demo-data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ source: string }> }
) {
  const { source } = await params;

  if (DEMO_MODE) {
    const tables = DEMO_SCHEMAS[source];
    if (tables) {
      // Small delay for realism
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
      return NextResponse.json(tables);
    }
    return NextResponse.json([], { status: 200 });
  }

  // Production: proxy to backend
  try {
    const response = await fetch(`http://localhost:3001/api/schema/${source}/tables`);
    return NextResponse.json(await response.json());
  } catch (error) {
    return NextResponse.json({ error: 'Backend not available' }, { status: 503 });
  }
}

