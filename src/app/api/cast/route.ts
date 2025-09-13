import { NextRequest, NextResponse } from 'next/server';

const OHSNAP_API_BASE = process.env.OHSNAP_API_BASE || '';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hash = searchParams.get('hash');
    const fid = searchParams.get('fid');

    if (!hash || !fid) {
      return NextResponse.json({ error: 'fid and hash parameters are required' }, { status: 400 });
    }

    const url = `${OHSNAP_API_BASE}/v1/cast?fid=${encodeURIComponent(fid)}&hash=${encodeURIComponent(hash)}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      // Disable Next caching for live debugging
      cache: 'no-store',
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`upstream ${response.status}: ${text}`);
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error fetching cast:', error);
    return NextResponse.json({ error: 'Failed to fetch cast' }, { status: 500 });
  }
}
