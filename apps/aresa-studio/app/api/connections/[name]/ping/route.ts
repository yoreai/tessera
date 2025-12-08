import { NextResponse } from 'next/server';
import { DEMO_CONNECTIONS, DEMO_MODE } from '@/lib/demo-data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  if (DEMO_MODE) {
    // Check if it's a demo connection
    const connection = DEMO_CONNECTIONS.find(c => c.name === name);
    if (connection) {
      // Simulate a small delay for realism
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
      return NextResponse.json({
        status: 'connected',
        latencyMs: Math.floor(10 + Math.random() * 50),
        demo: true,
      });
    }
    return NextResponse.json({ status: 'not_found' }, { status: 404 });
  }

  // Production: proxy to backend
  try {
    const response = await fetch(`http://localhost:3001/api/connections/${name}/ping`);
    return NextResponse.json(await response.json());
  } catch (error) {
    return NextResponse.json({ status: 'error', error: 'Backend not available' }, { status: 503 });
  }
}

