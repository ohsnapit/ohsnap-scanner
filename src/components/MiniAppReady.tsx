'use client';

import { useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export default function MiniAppReady() {
  useEffect(() => {
    // Hide splash once the app is ready in host
    sdk.actions
      .ready()
      .catch(() => {
        // Ignore if not in a Farcaster host
      });
  }, []);

  return null;
}
