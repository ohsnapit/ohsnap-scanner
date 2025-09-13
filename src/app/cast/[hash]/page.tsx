'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';

type CastData = {
  hash?: string;
  text?: string;
  timestamp?: string | number;
  author?: {
    username?: string;
    display_name?: string;
    pfp_url?: string;
    fid?: number;
  };
  parent?: { hash?: string } | null;
  parent_hash?: string | null;
  thread_hash?: string | null;
  parent_url?: string | null;
  root_parent_url?: string | null;
  parent_author?: { fid?: number | null } | null;
  app?: { username?: string; display_name?: string; fid?: number; pfp_url?: string } | null;
  replies?: { count?: number } | null;
  reactions?: { likes_count?: number; recasts_count?: number } | null;
};

type CastResponse = { cast?: CastData } | CastData;

export default function CastPage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = use(params);
  const search = useSearchParams();
  const fid = search.get('fid') || '';
  const [data, setData] = useState<CastResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        if (!fid) throw new Error('fid is required');
        const res = await fetch(`/api/cast?fid=${encodeURIComponent(fid)}&hash=${encodeURIComponent(hash)}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`http ${res.status}`);
        const json = await res.json();
        setData(json as CastResponse);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [hash, fid]);

  const cast: CastData | undefined = useMemo(() => {
    const d = data as CastResponse | null;
    if (d && typeof d === 'object' && 'cast' in d) {
      return (d as { cast?: CastData }).cast;
    }
    return (d as CastData) || undefined;
  }, [data]);

  const author = (cast?.author as CastData['author']) ?? {};
  const username = author?.username || '';
  const displayName = author?.display_name || username || 'unknown';
  const pfpUrl = author?.pfp_url || '/logo.png';
  const app = cast?.app ?? undefined;
  const parentHash = (cast?.parent_hash as string | undefined) || ((cast?.parent as { hash?: string } | null)?.hash ?? undefined);
  const threadHash = cast?.thread_hash as string | undefined;

  const farcasterUrl = useMemo(() => {
    if (!username || !cast?.hash) return undefined;
    return `https://farcaster.xyz/${username}/${cast.hash}`;
  }, [username, cast?.hash]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <SearchBar className="mb-8 max-w-md mx-auto" />

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--foreground)' }}>cast details</h2>
            <div className="p-4 rounded" style={{ border: '1px solid var(--border-color)' }}>
              {loading ? (
                <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
              ) : error ? (
                <div style={{ color: 'var(--text-muted)' }}>Error: {error}</div>
              ) : cast ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-2">
                    <div className="flex items-center gap-3 mb-3">
                      <img src={pfpUrl} alt={displayName} width={40} height={40} className="rounded-full" />
                      <div className="flex flex-col">
                        <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{displayName}</span>
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>@{username}</span>
                      </div>
                    </div>
                    <div className="text-lg" style={{ color: 'var(--foreground)' }}>{cast?.text || ''}</div>
                    <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                      <div style={{ color: 'var(--text-muted)' }}>cast hash</div>
                      <div style={{ color: 'var(--foreground)' }}>{cast?.hash}</div>
                      <div style={{ color: 'var(--text-muted)' }}>parent cast hash</div>
                      <div style={{ color: 'var(--foreground)' }}>{parentHash || '—'}</div>
                      {threadHash && (
                        <>
                          <div style={{ color: 'var(--text-muted)' }}>thread hash</div>
                          <div style={{ color: 'var(--foreground)' }}>{threadHash}</div>
                        </>
                      )}
                      <div style={{ color: 'var(--text-muted)' }}>username</div>
                      <div style={{ color: 'var(--foreground)' }}>{username || '—'}</div>
                      <div style={{ color: 'var(--text-muted)' }}>fid</div>
                      <div style={{ color: 'var(--foreground)' }}>{author?.fid ?? '—'}</div>
                      <div style={{ color: 'var(--text-muted)' }}>app name</div>
                      <div style={{ color: 'var(--foreground)' }}>{app?.username || '—'}</div>
                      <div style={{ color: 'var(--text-muted)' }}>app fid</div>
                      <div style={{ color: 'var(--foreground)' }}>{app?.fid ?? '—'}</div>
                      <div style={{ color: 'var(--text-muted)' }}>timestamp</div>
                      <div style={{ color: 'var(--foreground)' }}>
                        {(() => {
                          const ts = cast?.timestamp as string | number | undefined;
                          if (!ts) return '—';
                          const date = typeof ts === 'number' ? new Date(ts) : new Date(ts);
                          return isNaN(date.getTime()) ? '—' : date.toLocaleString();
                        })()}
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>metrics</div>
                      <div style={{ color: 'var(--foreground)' }}>
                        {(cast?.replies?.count ?? 0)} replies, {(cast?.reactions?.likes_count ?? 0)} likes, {(cast?.reactions?.recasts_count ?? 0)} recasts
                      </div>
                    </div>
                  </div>
                  <div className="sm:col-span-1 flex sm:justify-end items-start">
                    {farcasterUrl && (
                      <a
                        href={farcasterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded text-sm"
                        style={{ backgroundColor: 'var(--card-background)', color: 'var(--foreground)', border: '1px solid var(--border-color)' }}
                      >
                        view
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)' }}>No data</div>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>response data</h3>
            <div className="p-4 rounded overflow-auto text-sm" style={{ border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
