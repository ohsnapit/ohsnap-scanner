'use client';

import { useRouter } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import Header from '@/components/Header';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen" style={{backgroundColor: 'var(--background)', color: 'var(--foreground)'}}>
      <Header />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <SearchBar className="mb-8 max-w-md mx-auto" />

          {/* Quick Links */}
          <div className="text-center" style={{color: 'var(--text-muted)'}}>
            <p className="mb-4">Try searching for FIDs:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['2', '3', '387','317138', '860783', ''].map((fid) => (
                <button
                  key={fid}
                  onClick={() => router.push(`/user/${fid}`)}
                  className="px-4 py-2 rounded-lg text-sm transition-colors"
                  style={{backgroundColor: 'var(--card-background)', color: 'var(--foreground)'}}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--border-color)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--card-background)'}
                >
                  {fid}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
