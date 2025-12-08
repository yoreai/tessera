import { NextResponse } from 'next/server';
import { DEMO_CONNECTIONS, DEMO_MODE } from '@/lib/demo-data';

export async function GET() {
  if (DEMO_MODE) {
    // Return demo connections
    const connections = DEMO_CONNECTIONS.map(conn => ({
      name: conn.name,
      type: conn.type,
      details: conn.details,
      status: conn.status,
    }));
    return NextResponse.json(connections);
  }

  // In production, proxy to aresa-cli backend
  try {
    const response = await fetch('http://localhost:3001/api/connections');
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Backend not available. Running in demo mode.' },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  if (DEMO_MODE) {
    // In demo mode, pretend to add the connection
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: `Demo mode: Connection "${body.name}" would be added`,
      demo: true,
    });
  }

  // In production, proxy to backend
  try {
    const body = await request.json();
    const response = await fetch('http://localhost:3001/api/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return NextResponse.json(await response.json());
  } catch (error) {
    return NextResponse.json({ error: 'Backend not available' }, { status: 503 });
  }
}

