'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import Header from '@/components/Header';

interface User {
  object: string;
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  custody_address: string;
  profile?: {
    bio?: {
      text: string;
    };
  };
  follower_count: number;
  following_count: number;
  verifications: string[];
  verified_addresses?: {
    eth_addresses: string[];
    sol_addresses: string[];
  };
  auth_addresses?: Array<{
    address: string;
    app?: {
      object: string;
      fid: number;
    };
  }>;
  verified_accounts?: Array<{
    platform: string;
    username: string;
  }>;
  power_badge: boolean;
  score: number;
  url?: string;
}

interface Cast {
  object: string;
  hash: string;
  author: User;
  text: string;
  timestamp: string;
  reactions: {
    likes_count: number;
    recasts_count: number;
  };
  replies: {
    count: number;
  };
}

export default function UserPage({ params }: { params: Promise<{ fid: string }> }) {
  const resolvedParams = use(params);
  const [user, setUser] = useState<User | null>(null);
  const [casts, setCasts] = useState<Cast[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [castsLoading, setCastsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchUserData();
  }, [resolvedParams.fid]);

  useEffect(() => {
    // Always fetch casts in background after user data is loaded
    if (user && casts.length === 0) {
      fetchUserCasts();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'casts' && casts.length === 0) {
      fetchUserCasts();
    }
  }, [activeTab]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use our proxy API route to avoid CORS issues
      const response = await fetch(`/api/user?fid=${resolvedParams.fid}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.users && data.users.length > 0) {
        setUser(data.users[0]);
      } else {
        setUser(null);
        setError('User not found');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch user data');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCasts = async () => {
    try {
      setCastsLoading(true);
      const response = await fetch(`/api/user/casts?fid=${resolvedParams.fid}&limit=10`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.casts) {
        setCasts(data.casts);
      }
    } catch (error) {
      console.error('Error fetching casts:', error);
    } finally {
      setCastsLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'overview' },
    { id: 'addresses', label: 'addresses' },
    { id: 'signers', label: 'signers' },
    { id: 'casts', label: 'recent casts' },
    { id: 'raw', label: 'raw data' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: 'var(--background)', color: 'var(--foreground)'}}>
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: 'var(--background)', color: 'var(--foreground)'}}>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            {error ? 'Error loading user' : 'User not found'}
          </h2>
          {error && (
            <p className="text-gray-600 mb-4">
              {error.includes('CORS') ? 
                'API access blocked by browser. The OhSnap API may need CORS configuration.' : 
                error
              }
            </p>
          )}
          <button
            onClick={() => router.push('/')}
            className="text-purple-600 hover:underline"
          >
            Go back to search
          </button>
          <button
            onClick={() => window.location.reload()}
            className="ml-4 text-gray-600 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: 'var(--background)', color: 'var(--foreground)'}}>
      <Header />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <SearchBar className="mb-8 max-w-md mx-auto" />
          
          {/* User Profile Header */}
          <div className="flex items-center space-x-4 mb-8">
            <img
              src={user.pfp_url || '/default-avatar.png'}
              alt={user.display_name}
              className="w-16 h-16 rounded-full"
            />
            <div>
              <h2 className="text-2xl font-bold" style={{color: 'var(--neon-purple)'}}>{user.display_name}</h2>
              <p style={{color: 'var(--neon-purple)'}}>@{user.username}</p>
              {user.profile?.bio?.text && (
                <p className="text-sm mt-1" style={{color: 'var(--neon-purple)'}}>{user.profile.bio.text}</p>
              )}
              <div className="flex space-x-4 text-sm mt-2" style={{color: 'var(--neon-purple)'}}>
                <span>{user.follower_count} followers</span>
                <span>{user.following_count} following</span>
                <span>{user.verifications.length} verifications</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b mb-6" style={{borderColor: 'var(--border-color)'}}>
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="pb-4 px-4 py-2 border-b-2 font-medium text-sm rounded-t transition-colors"
                  style={{
                    backgroundColor: activeTab === tab.id ? 'var(--selected-tab-bg)' : 'transparent',
                    color: activeTab === tab.id ? 'var(--neon-purple)' : 'var(--text-muted)',
                    borderBottomColor: activeTab === tab.id ? 'var(--accent-purple)' : 'transparent'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="rounded-lg border p-6" style={{backgroundColor: 'transparent', borderColor: 'var(--neon-purple)'}}>
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm" style={{color: 'var(--foreground)'}}>
                  <div>
                    <strong>username:</strong> {user.username}
                  </div>
                  <div>
                    <strong>fid:</strong> {user.fid}
                  </div>
                  <div>
                    <strong>custody address:</strong> 
                    <span className="font-mono text-xs ml-2 break-all">{user.custody_address}</span>
                  </div>
                  <div>
                    <strong>follower count:</strong> {user.follower_count}
                  </div>
                  <div>
                    <strong>following count:</strong> {user.following_count}
                  </div>
                  <div>
                    <strong>primary eth address:</strong> 
                    <span className="font-mono text-xs ml-2 break-all">
                      {user.verified_addresses?.primary?.eth_address || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <strong>primary sol address:</strong> 
                    <span className="font-mono text-xs ml-2 break-all">
                      {user.verified_addresses?.primary?.sol_address || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <strong>location:</strong> 
                    {user.profile?.location ? (
                      <span className="ml-2">
                        {user.profile.location.address.city}, {user.profile.location.address.state}, {user.profile.location.address.country}
                      </span>
                    ) : (
                      <span className="ml-2">N/A</span>
                    )}
                  </div>
                  <div>
                    <strong>pro subscriber:</strong> {user.pro?.status === 'active' ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <strong>banner url:</strong> 
                    {user.profile?.banner?.url ? (
                      <a href={user.profile.banner.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs ml-2">
                        {user.profile.banner.url}
                      </a>
                    ) : (
                      <span className="ml-2">N/A</span>
                    )}
                  </div>
                  <div>
                    <strong>pfp url:</strong> 
                    <a href={user.pfp_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs ml-2">
                      {user.pfp_url}
                    </a>
                  </div>
                  <div>
                    <strong>power badge:</strong> {user.power_badge ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <strong>verified x account:</strong> 
                    {user.verified_accounts?.find(acc => acc.platform === 'x') ? (
                      <span className="ml-2">@{user.verified_accounts.find(acc => acc.platform === 'x')?.username}</span>
                    ) : (
                      <span className="ml-2">N/A</span>
                    )}
                  </div>
                  {user.url && (
                    <div>
                      <strong>url:</strong> 
                      <a href={user.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-2">
                        {user.url}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 text-sm">
                  {user.verified_addresses?.eth_addresses.map((address, index) => (
                    <div key={index} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <strong>address:</strong> 
                        <span className="font-mono text-xs ml-2 break-all">{address}</span>
                      </div>
                      <div>
                        <strong>type:</strong> verified eth
                      </div>
                    </div>
                  ))}
                  {user.verified_addresses?.sol_addresses.map((address, index) => (
                    <div key={index} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <strong>address:</strong> 
                        <span className="font-mono text-xs ml-2 break-all">{address}</span>
                      </div>
                      <div>
                        <strong>type:</strong> verified sol
                      </div>
                    </div>
                  ))}
                  {user.auth_addresses?.map((authAddress, index) => (
                    <div key={index} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <strong>address:</strong> 
                        <span className="font-mono text-xs ml-2 break-all">{authAddress.address}</span>
                      </div>
                      <div>
                        <strong>type:</strong> auth
                        {authAddress.app && (
                          <span className="ml-2">
                            <strong>app:</strong> {authAddress.app.fid}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'signers' && (
              <div className="space-y-4">
                <div className="text-center text-gray-500">No signer data available in current API response</div>
              </div>
            )}

            {activeTab === 'casts' && (
              <div className="space-y-4">
                {castsLoading ? (
                  <div className="text-center">Loading casts...</div>
                ) : casts.length > 0 ? (
                  <div className="space-y-4">
                    {casts.map((cast) => (
                      <div key={cast.hash} className="border-b pb-4">
                        <div className="flex items-start space-x-3">
                          <img
                            src={cast.author.pfp_url}
                            alt={cast.author.display_name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-semibold" style={{color: 'var(--foreground)'}}>{cast.author.display_name}</span>
                              <span className="text-sm" style={{color: 'var(--text-muted)'}}>@{cast.author.username}</span>
                              <span className="text-sm" style={{color: 'var(--text-muted)'}}>·</span>
                              <span className="text-sm" style={{color: 'var(--text-muted)'}}>
                                {new Date(cast.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="mb-2" style={{color: 'var(--foreground)'}}>{cast.text}</p>
                            <div className="flex space-x-4 text-sm" style={{color: 'var(--text-muted)'}}>
                              <span className="flex items-center space-x-1">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                                </svg>
                                <span>{cast.reactions.likes_count}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M17 1l4 4-4 4"/>
                                  <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                                  <path d="M7 23l-4-4 4-4"/>
                                  <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                                </svg>
                                <span>{cast.reactions.recasts_count}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                </svg>
                                <span>{cast.replies.count}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center" style={{color: 'var(--text-muted)'}}>No casts found</div>
                )}
              </div>
            )}

            {activeTab === 'raw' && (
              <div className="p-4 rounded max-h-96 overflow-auto raw-data-scroll" style={{backgroundColor: 'var(--card-background)'}}>
                <pre className="text-xs whitespace-pre-wrap break-words" style={{color: 'var(--foreground)'}}>
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}