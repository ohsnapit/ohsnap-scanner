import { NextRequest, NextResponse } from 'next/server';

// Minimal webhook endpoint to receive Mini App server events
// Events are JSON Farcaster Signatures with base64url header/payload/signature
// This endpoint simply accepts and responds 200 to aid development

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    console.log('[miniapp webhook] received event', body ? Object.keys(body) : 'no body');
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
