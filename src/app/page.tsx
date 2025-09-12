'use client';
import SearchBar from '@/components/SearchBar';
import Header from '@/components/Header';
import { LiveFeed } from '@/components/livefeed/live-feed';

export default function Home() {
  return (
    <div className="min-h-screen" style={{backgroundColor: 'var(--background)', color: 'var(--foreground)'}}>
      <Header />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto w-full">
          <SearchBar className="mb-8 max-w-md mx-auto" />
          <LiveFeed />
        </div>
      </main>
    </div>
  );
}
