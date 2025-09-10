/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 800, // 3:2 aspect ratio
};

export const contentType = 'image/png';

export default function Image() {
  const title = 'OhSnap Scanner';
  const subtitle = 'Farcaster user scanner by OhSnap';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0b0b0f',
          color: '#d7c9ff',
          fontSize: 48,
          fontWeight: 600,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(1200px 800px at 50% 50%, rgba(138, 76, 255, 0.20), rgba(11,11,15,0) 60%)',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: 28,
              background: '#1a1329',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 40px rgba(138,76,255,0.35)'
            }}
          >
            <img src={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/logo.png`} alt="logo" width={96} height={96} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 72, lineHeight: 1.1 }}>{title}</div>
            <div style={{ fontSize: 28, opacity: 0.9 }}>{subtitle}</div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

