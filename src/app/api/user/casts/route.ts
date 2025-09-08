import { NextRequest, NextResponse } from 'next/server';

const OHSNAP_API_BASE = process.env.OHSNAP_API_BASE || '';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');
    const limit = searchParams.get('limit') || '10';

    if (!fid) {
      return NextResponse.json({ error: 'FID parameter is required' }, { status: 400 });
    }

    const response = await fetch(`${OHSNAP_API_BASE}/v1/user/casts?fid=${fid}&limit=${limit}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error fetching user casts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user casts' },
      { status: 500 }
    );
  }
}