'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="border-b px-4 py-4" style={{borderColor: 'var(--border-color)'}}>
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <Image src="/logo.png" alt="OhSnap Logo" width={24} height={24} className="w-6 h-6" />
          <span className="font-semibold text-lg" style={{color: 'var(--foreground)'}}>OHSNAPSCAN</span>
        </Link>
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded" style={{color: 'var(--foreground)'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--card-background)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
            </svg>
          </button>
          <button className="p-2 rounded" style={{color: 'var(--foreground)'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--card-background)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}