import { NextResponse } from 'next/server';
import { DEMO_MODE } from '@/lib/demo-data';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  if (DEMO_MODE) {
    return NextResponse.json({
      success: true,
      message: `Demo mode: Connection "${name}" would be removed`,
      demo: true,
    });
  }

  // Production: proxy to backend
  try {
    const response = await fetch(`http://localhost:3001/api/connections/${name}`, {
      method: 'DELETE',
    });
    return NextResponse.json(await response.json());
  } catch (error) {
    return NextResponse.json({ error: 'Backend not available' }, { status: 503 });
  }
}

