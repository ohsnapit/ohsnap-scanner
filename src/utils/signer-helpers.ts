import { decodeAbiParameters } from 'viem'

export interface SignerEvent {
  type: string;
  chainId: number;
  blockNumber: number;
  blockHash: string;
  blockTimestamp: number;
  transactionHash: string;
  logIndex: number;
  fid: number;
  signerEventBody: {
    key: string;
    keyType: number;
    eventType: string;
    metadata: string;
    metadataType: number;
  };
  txIndex: number;
}

export interface SignerMetadata {
  requestFid: number;
  requestSigner: string;
  signature: string;
  deadline: number;
}

export interface MessageStats {
  casts: number;
  reactions: number;
  links: number;
  verifications: number;
  total: number;
  lastUsed: string | null;
}

export interface ProcessedSigner {
  key: string;
  keyType: number;
  eventType: string;
  blockNumber: number;
  transactionHash: string;
  blockTimestamp: number;
  metadata?: SignerMetadata;
  messageStats?: MessageStats;
}

export interface AppWithSigners {
  fid: number;
  profile?: {
    username: string;
    display_name: string;
    pfp_url: string;
    bio?: string;
  };
  signers: ProcessedSigner[];
  totalMessages: number;
  lastUsed?: string;
  appStats: {
    casts: number;
    reactions: number;
    links: number;
    verifications: number;
  };
}

const signedKeyRequestAbi = [
  {
    components: [
      { name: "requestFid", type: "uint256" },
      { name: "requestSigner", type: "address" },
      { name: "signature", type: "bytes" },
      { name: "deadline", type: "uint256" },
    ],
    name: "SignedKeyRequest",
    type: "tuple",
  },
] as const;

export function decodeSignerMetadata(metadata: string): SignerMetadata {
  try {
    console.log('Decoding metadata:', metadata);
    
    const metadataBytes = Buffer.from(metadata, 'base64');
    const metadataHex = `0x${metadataBytes.toString('hex')}` as `0x${string}`;
    
    console.log('Metadata hex:', metadataHex);
    
    const decoded = decodeAbiParameters(signedKeyRequestAbi, metadataHex)[0];
    
    const result = {
      requestFid: Number(decoded.requestFid),
      requestSigner: decoded.requestSigner,
      signature: decoded.signature,
      deadline: Number(decoded.deadline),
    };
    
    console.log('Decoded result:', result);
    return result;
  } catch (error) {
    console.warn('Failed to decode signer metadata:', error);
    console.log('Original metadata:', metadata);
    return {
      requestFid: 0,
      requestSigner: '0x0000000000000000000000000000000000000000',
      signature: '0x',
      deadline: 0,
    };
  }
}

export function processSignersData(
  signersData: { events: SignerEvent[] },
  messageStats: Record<string, MessageStats>
): Record<string, AppWithSigners> {
  console.log('Processing signers data:', signersData);
  console.log('Message stats:', messageStats);
  
  const appMap: Record<string, AppWithSigners> = {};

  const addSigners = signersData.events.filter(
    (s) => s.signerEventBody?.eventType === 'SIGNER_EVENT_TYPE_ADD'
  );
  
  console.log('Add signers found:', addSigners.length);

  for (const signer of addSigners) {
    try {
      console.log('Processing signer:', signer);
      
      const metadata = decodeSignerMetadata(signer.signerEventBody.metadata);
      
      console.log('Decoded metadata for signer:', metadata);
      
      if (metadata.requestFid === 0) {
        console.log('Skipping signer with requestFid 0');
        continue;
      }
      
      const appFid = metadata.requestFid.toString();
      const signerKey = signer.signerEventBody.key;
      
      if (!appMap[appFid]) {
        appMap[appFid] = {
          fid: metadata.requestFid,
          signers: [],
          totalMessages: 0,
          appStats: {
            casts: 0,
            reactions: 0,
            links: 0,
            verifications: 0,
          }
        };
      }

      const stats = messageStats[appFid];
      console.log('Stats for signer', signerKey, ':', stats);

      const processedSigner: ProcessedSigner = {
        key: signerKey,
        keyType: signer.signerEventBody.keyType,
        eventType: signer.signerEventBody.eventType,
        blockNumber: signer.blockNumber,
        transactionHash: signer.transactionHash,
        blockTimestamp: signer.blockTimestamp,
        metadata,
        messageStats: stats ? {
          casts: stats.casts || 0,
          reactions: stats.reactions || 0,
          links: stats.links || 0,
          verifications: stats.verifications || 0,
          total: (stats.casts || 0) + (stats.reactions || 0) + (stats.links || 0) + (stats.verifications || 0),
          lastUsed: stats.lastUsed,
        } : {
          casts: 0,
          reactions: 0,
          links: 0,
          verifications: 0,
          total: 0,
          lastUsed: null,
        },
      };

      appMap[appFid].signers.push(processedSigner);
      appMap[appFid].totalMessages += processedSigner.messageStats?.total || 0;
      appMap[appFid].appStats.casts += processedSigner.messageStats?.casts || 0;
      appMap[appFid].appStats.reactions += processedSigner.messageStats?.reactions || 0;
      appMap[appFid].appStats.links += processedSigner.messageStats?.links || 0;
      appMap[appFid].appStats.verifications += processedSigner.messageStats?.verifications || 0;

      if (processedSigner.messageStats?.lastUsed) {
        const lastUsedDate = new Date(processedSigner.messageStats.lastUsed);
        if (!appMap[appFid].lastUsed || lastUsedDate > new Date(appMap[appFid].lastUsed)) {
          appMap[appFid].lastUsed = processedSigner.messageStats.lastUsed;
        }
      }
    } catch (error) {
      console.warn('Failed to process signer:', error, signer);
    }
  }
  
  console.log('Final apps map:', appMap);
  return appMap;
}

export function farcasterTimeToDate(time: number): Date {
  const FARCASTER_EPOCH = 1609459200;
  return new Date((FARCASTER_EPOCH + time) * 1000);
}

export function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diffInMs / (1000 * 60));
  const hours = Math.floor(diffInMs / (1000 * 60 * 60));
  const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const months = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 30));
  
  if (minutes < 60) {
    return `${minutes} minutes ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (days < 30) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else {
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  }
}