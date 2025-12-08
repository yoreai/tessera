import { NextResponse } from 'next/server';
import { generateQueryResult, DEMO_MODE } from '@/lib/demo-data';

export async function POST(request: Request) {
  const body = await request.json();
  const { source, query, limit } = body;

  if (DEMO_MODE) {
    // Simulate query execution delay based on "database type"
    const delays: Record<string, number> = {
      'demo-bigquery': 1500 + Math.random() * 1000,
      'demo-snowflake': 800 + Math.random() * 500,
      'demo-clickhouse': 100 + Math.random() * 200,
      'demo-databricks': 1000 + Math.random() * 500,
      'demo-postgres': 10 + Math.random() * 30,
      'demo-mysql': 10 + Math.random() * 30,
      'demo-sqlite': 2 + Math.random() * 10,
      'demo-duckdb': 15 + Math.random() * 20,
    };

    const delay = delays[source] || 50;
    await new Promise(resolve => setTimeout(resolve, delay));

    const result = generateQueryResult(source, query);

    return NextResponse.json({
      ...result,
      demo: true,
      source,
      query,
    });
  }

  // Production: proxy to backend
  try {
    const response = await fetch('http://localhost:3001/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, query, limit }),
    });
    return NextResponse.json(await response.json());
  } catch (error) {
    return NextResponse.json(
      { error: 'Backend not available. Enable demo mode to test.' },
      { status: 503 }
    );
  }
}

