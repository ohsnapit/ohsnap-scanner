import { NextRequest } from 'next/server'
import { processSignersData, MessageStats, AppWithSigners, decodeSignerMetadata } from '@/utils/signer-helpers'

const OHSNAP_API_BASE = process.env.OHSNAP_API_BASE || '';


export async function GET(request: NextRequest) {
  try {
    const fid = request.nextUrl.searchParams.get('fid')
    
    if (!fid) {
      return Response.json({ error: 'FID parameter required' }, { status: 400 })
    }

    //console.log('Fetching signers for FID:', fid);

    // Get on-chain signers data and all user activity data
    const [signersResponse, castsResponse, likesResponse, recastsResponse, linksResponse, verificationsResponse] = await Promise.all([
      fetch(`${OHSNAP_API_BASE}/v1/onChainSignersByFid?fid=${fid}`),
      fetch(`${request.url.split('/api/user/signers')[0]}/api/user/casts?fid=${fid}&limit=10`),
      fetch(`${OHSNAP_API_BASE}/v1/reactionsByFid?fid=${fid}&reaction_type=Like&pageSize=100`),
      fetch(`${OHSNAP_API_BASE}/v1/reactionsByFid?fid=${fid}&reaction_type=Recast&pageSize=100`),
      fetch(`${OHSNAP_API_BASE}/v1/linksByFid?fid=${fid}&pageSize=10`),
      fetch(`${OHSNAP_API_BASE}/v1/verificationsByFid?fid=${fid}&pageSize=10`)
    ])
    
    //console.log('Signers response status:', signersResponse.status);
    //console.log('Casts response status:', castsResponse.status);
    
    if (!signersResponse.ok) {
      console.error('Failed to fetch signers, status:', signersResponse.status);
      const errorText = await signersResponse.text();
      console.error('Error response:', errorText);
      return Response.json({ error: 'Failed to fetch signers data' }, { status: 500 })
    }

    const signersData = await signersResponse.json()
    //console.log('Raw signers data:', JSON.stringify(signersData, null, 2));

    // Get all activity data for message stats
    let castsData = { casts: [] }
    let likesData: { messages: unknown[] } = { messages: [] }
    let recastsData: { messages: unknown[] } = { messages: [] }
    let linksData: { messages: unknown[] } = { messages: [] }
    let verificationsData: { messages: unknown[] } = { messages: [] }

    if (castsResponse.ok) {
      castsData = await castsResponse.json()
      //console.log('Casts data for stats:', castsData);
    } else {
      console.error('Failed to fetch casts for signers stats');
    }

    if (likesResponse.ok) {
      likesData = await likesResponse.json()
      //console.log('Likes data for stats:', likesData);
    } else {
      console.error('Failed to fetch likes for signers stats');
    }

    if (recastsResponse.ok) {
      recastsData = await recastsResponse.json()
      //console.log('Recasts data for stats:', recastsData);
    } else {
      console.error('Failed to fetch recasts for signers stats');
    }

    if (linksResponse.ok) {
      linksData = await linksResponse.json()
      //console.log('Links data for stats:', linksData);
    } else {
      console.error('Failed to fetch links for signers stats');
    }

    if (verificationsResponse.ok) {
      verificationsData = await verificationsResponse.json()
      //console.log('Verifications data for stats:', verificationsData);
    } else {
      console.error('Failed to fetch verifications for signers stats');
    }

    // First, let's process the signers data to get the mapping of signer keys to app FIDs
    const signerToAppMap: Record<string, string> = {}
    if (signersData.events) {
      for (const signer of signersData.events) {
        if (signer.signerEventBody?.eventType === 'SIGNER_EVENT_TYPE_ADD') {
          try {
            const metadata = decodeSignerMetadata(signer.signerEventBody.metadata);
            if (metadata.requestFid > 0) {
              signerToAppMap[signer.signerEventBody.key] = metadata.requestFid.toString();
            }
          } catch (error) {
            console.warn('Failed to decode signer metadata:', error);
          }
        }
      }
    }
    
    //console.log('Signer to app mapping:', signerToAppMap);

    // Group all activity by signer
    const messagesBySigner: Record<string, MessageStats> = {}
    
    // Process casts (these have app.fid directly)
    if (castsData.casts && Array.isArray(castsData.casts)) {
      //console.log('Processing casts, sample cast:', JSON.stringify(castsData.casts[0], null, 2));
      for (const cast of castsData.casts) {
        const castData = cast as Record<string, unknown>;
        const appFid = (castData.app as Record<string, unknown>)?.fid?.toString()
        if (!appFid) continue

        if (!messagesBySigner[appFid]) {
          messagesBySigner[appFid] = {
            casts: 0,
            reactions: 0,
            links: 0,
            verifications: 0,
            total: 0,
            lastUsed: null
          }
        }

        messagesBySigner[appFid].casts++
        messagesBySigner[appFid].total++

        const timestamp = castData.timestamp as string
        if (timestamp) {
          const messageDate = new Date(timestamp)
          if (!messagesBySigner[appFid].lastUsed || messageDate > new Date(messagesBySigner[appFid].lastUsed)) {
            messagesBySigner[appFid].lastUsed = messageDate.toISOString()
          }
        }
      }
    }
    
    // Process likes (these have signer field and need mapping)
    if (likesData.messages && Array.isArray(likesData.messages)) {
      //console.log('Processing likes, sample like:', JSON.stringify(likesData.messages[0], null, 2));
      for (const like of likesData.messages) {
        const likeData = like as Record<string, unknown>;
        const signerKey = likeData.signer as string
        if (!signerKey) continue
        
        const appFid = signerToAppMap[signerKey]
        if (!appFid) continue

        if (!messagesBySigner[appFid]) {
          messagesBySigner[appFid] = {
            casts: 0,
            reactions: 0,
            links: 0,
            verifications: 0,
            total: 0,
            lastUsed: null
          }
        }

        messagesBySigner[appFid].reactions++
        messagesBySigner[appFid].total++

        const timestamp = (likeData.data as Record<string, unknown>)?.timestamp as string
        if (timestamp) {
          const messageDate = new Date(timestamp)
          if (!messagesBySigner[appFid].lastUsed || messageDate > new Date(messagesBySigner[appFid].lastUsed)) {
            messagesBySigner[appFid].lastUsed = messageDate.toISOString()
          }
        }
      }
    }

    // Process recasts (these have signer field and need mapping)
    if (recastsData.messages && Array.isArray(recastsData.messages)) {
      //console.log('Processing recasts, sample recast:', JSON.stringify(recastsData.messages[0], null, 2));
      for (const recast of recastsData.messages) {
        const recastData = recast as Record<string, unknown>;
        const signerKey = recastData.signer as string
        if (!signerKey) continue
        
        const appFid = signerToAppMap[signerKey]
        if (!appFid) continue

        if (!messagesBySigner[appFid]) {
          messagesBySigner[appFid] = {
            casts: 0,
            reactions: 0,
            links: 0,
            verifications: 0,
            total: 0,
            lastUsed: null
          }
        }

        messagesBySigner[appFid].reactions++
        messagesBySigner[appFid].total++

        const timestamp = (recastData.data as Record<string, unknown>)?.timestamp as string
        if (timestamp) {
          const messageDate = new Date(timestamp)
          if (!messagesBySigner[appFid].lastUsed || messageDate > new Date(messagesBySigner[appFid].lastUsed)) {
            messagesBySigner[appFid].lastUsed = messageDate.toISOString()
          }
        }
      }
    }

    // Process links
    if (linksData.messages && Array.isArray(linksData.messages)) {
      //console.log('Processing links, sample link:', JSON.stringify(linksData.messages[0], null, 2));
      for (const link of linksData.messages) {
        const linkData = link as Record<string, unknown>;
        const signerKey = linkData.signer as string
        if (!signerKey) continue
        
        const appFid = signerToAppMap[signerKey]
        if (!appFid) continue

        if (!messagesBySigner[appFid]) {
          messagesBySigner[appFid] = {
            casts: 0,
            reactions: 0,
            links: 0,
            verifications: 0,
            total: 0,
            lastUsed: null
          }
        }

        messagesBySigner[appFid].links++
        messagesBySigner[appFid].total++

        const timestamp = (linkData.data as Record<string, unknown>)?.timestamp as string
        if (timestamp) {
          const messageDate = new Date(timestamp)
          if (!messagesBySigner[appFid].lastUsed || messageDate > new Date(messagesBySigner[appFid].lastUsed)) {
            messagesBySigner[appFid].lastUsed = messageDate.toISOString()
          }
        }
      }
    }

    // Process verifications
    if (verificationsData.messages && Array.isArray(verificationsData.messages)) {
      //console.log('Processing verifications, sample verification:', JSON.stringify(verificationsData.messages[0], null, 2));
      for (const verification of verificationsData.messages) {
        const verificationData = verification as Record<string, unknown>;
        const signerKey = verificationData.signer as string
        if (!signerKey) continue
        
        const appFid = signerToAppMap[signerKey]
        if (!appFid) continue

        if (!messagesBySigner[appFid]) {
          messagesBySigner[appFid] = {
            casts: 0,
            reactions: 0,
            links: 0,
            verifications: 0,
            total: 0,
            lastUsed: null
          }
        }

        messagesBySigner[appFid].verifications++
        messagesBySigner[appFid].total++

        const timestamp = (verificationData.data as Record<string, unknown>)?.timestamp as string
        if (timestamp) {
          const messageDate = new Date(timestamp)
          if (!messagesBySigner[appFid].lastUsed || messageDate > new Date(messagesBySigner[appFid].lastUsed)) {
            messagesBySigner[appFid].lastUsed = messageDate.toISOString()
          }
        }
      }
    }

    //console.log('Messages by signer:', messagesBySigner);

    // Process signers data
    const appsMap = processSignersData(signersData, messagesBySigner);
    //console.log('Apps map after processing:', appsMap);

    // Fetch user profiles for each app
    const appsWithProfiles = await Promise.all(
      Object.values(appsMap).map(async (app: AppWithSigners) => {
        try {
          //console.log('Fetching profile for FID:', app.fid);
          const userResponse = await fetch(`${OHSNAP_API_BASE}/v1/user?fid=${app.fid}`)
          if (userResponse.ok) {
            const userData = await userResponse.json()
            //console.log('User data for FID', app.fid, ':', userData);
            if (userData.users && userData.users.length > 0) {
              const user = userData.users[0]
              app.profile = {
                username: user.username,
                display_name: user.display_name,
                pfp_url: user.pfp_url,
                bio: user.profile?.bio?.text || ''
              }
            }
          } else {
            console.warn('Failed to fetch user profile, status:', userResponse.status);
          }
        } catch (error) {
          console.warn(`Failed to fetch profile for FID ${app.fid}:`, error)
        }
        return app
      })
    )

    // Don't filter out apps - show all for debugging
    const sortedApps = appsWithProfiles.sort((a, b) => {
      const aLastUsed = a.lastUsed ? new Date(a.lastUsed).getTime() : 0
      const bLastUsed = b.lastUsed ? new Date(b.lastUsed).getTime() : 0
      return bLastUsed - aLastUsed
    })

    //console.log('Final sorted apps:', JSON.stringify(sortedApps, null, 2));

    return Response.json(sortedApps, {
      headers: {
        'Cache-Control': 'max-age=300'
      }
    })
  } catch (error) {
    console.error('Error fetching signers:', error)
    return Response.json({ error: 'Failed to fetch signers' }, { status: 500 })
  }
}