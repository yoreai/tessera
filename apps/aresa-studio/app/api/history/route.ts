import { NextResponse } from 'next/server';
import { DEMO_HISTORY, DEMO_MODE } from '@/lib/demo-data';

export async function GET() {
  if (DEMO_MODE) {
    return NextResponse.json(DEMO_HISTORY);
  }

  // Production: proxy to backend
  try {
    const response = await fetch('http://localhost:3001/api/history');
    return NextResponse.json(await response.json());
  } catch (error) {
    return NextResponse.json({ error: 'Backend not available' }, { status: 503 });
  }
}

export async function DELETE() {
  if (DEMO_MODE) {
    return NextResponse.json({ success: true, message: 'Demo mode: History cleared', demo: true });
  }

  try {
    const response = await fetch('http://localhost:3001/api/history', { method: 'DELETE' });
    return NextResponse.json(await response.json());
  } catch (error) {
    return NextResponse.json({ error: 'Backend not available' }, { status: 503 });
  }
}

