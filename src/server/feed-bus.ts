import type { Consumer, KafkaMessage, SASLOptions } from "kafkajs";
import { EventEmitter } from "events";
// Local UI event type used by SSE
export type Event = {
  id: string;
  seq: number;
  fid?: number;
  type: string;
  content?: string;
  link?: string;
  raw?: unknown;
  timestamp?: number;
};

class RingBuffer {
  private buf: Event[] = [];
  constructor(private capacity: number) {}
  push(e: Event) {
    this.buf.unshift(e);
    if (this.buf.length > this.capacity) this.buf.length = this.capacity;
  }
  since(seq: number | undefined, limit: number) {
    if (!seq) return this.buf.slice(0, limit);
    // newer than seq are those with seq > given
    const res: Event[] = [];
    for (const e of this.buf) {
      if (e.seq > seq) res.push(e);
      if (res.length >= limit) break;
    }
    return res;
  }
  latestSeq() {
    return this.buf[0]?.seq ?? 0;
  }
}

class FeedBusImpl {
  private static instance: FeedBusImpl | null = null;
  private started = false;
  private seq = 0;
  private buffer = new RingBuffer(1000);
  private consumer: Consumer | null = null;
  private emitter = new EventEmitter();
  private startPromise: Promise<void> | null = null;

  static getInstance(): FeedBusImpl {
    if (!FeedBusImpl.instance) {
      FeedBusImpl.instance = new FeedBusImpl();
    }
    return FeedBusImpl.instance;
  }

  async start() {
    if (this.started) return;
    if (this.startPromise) return this.startPromise;
    
    this.startPromise = this._start();
    return this.startPromise;
  }

  private async _start() {
    if (this.started) return;
    this.started = true;
    const cfg = getKafkaConfig();
    if (!cfg) return;
    
    try {
      const { Kafka } = await import("kafkajs");
      const kafka = new Kafka({ brokers: cfg.brokers, ssl: cfg.ssl, sasl: cfg.sasl });
      const consumer = kafka.consumer({ groupId: `ohsnap-live-${Math.random().toString(36).slice(2)}` });
      this.consumer = consumer;
      await consumer.connect();
      await consumer.subscribe({ topic: cfg.topic, fromBeginning: false });
      await consumer.run({
        eachMessage: async ({ message, topic, partition }) => {
          const evt = this.toEvent(message, topic, partition);
          this.buffer.push(evt);
          this.emitter.emit("event", evt);
        },
      });
    } catch (error) {
      console.error("Failed to start FeedBus:", error);
      this.started = false;
      this.startPromise = null;
      throw error;
    }
  }

  private toEvent(message: KafkaMessage, topic: string, partition: number): Event {
    let payload: unknown = undefined;
    if (message.value) {
      try {
        payload = JSON.parse(message.value.toString());
      } catch {
        payload = { base64: Buffer.from(message.value).toString("base64") } as unknown;
      }
    }
    const p = payload as Record<string, unknown> | undefined;
    const typeNum = Number((p?.type as number | string | undefined) ?? NaN);
    const type = mapType(typeNum);
    let content: string | undefined = undefined;
    const parent = (p?.parent as Record<string, unknown> | undefined) || undefined;
    const targetUrl = p?.targetUrl as string | undefined;
    const link: string | undefined = (parent?.url as string | undefined) || targetUrl || undefined;
    switch (typeNum) {
      case 1:
        content = p?.text as string | undefined;
        break;
      case 2:
        {
          const th = p?.targetHash as string | undefined;
          content = th ? `remove ${shortHash(th)}` : undefined;
        }
        break;
      case 3:
      case 4: {
        const r = Number((p?.reactionType as number | string | undefined) ?? 0);
        const rStr = r === 1 ? "LIKE" : r === 2 ? "RECAST" : `REACTION_${r || "?"}`;
        const targetCast = p?.targetCast as { fid?: number; hash?: string } | undefined;
        if (targetCast?.fid && targetCast?.hash) {
          content = `${rStr} ${targetCast.fid}:${shortHash(targetCast.hash)}`;
        } else if (targetUrl) {
          content = `${rStr} ${targetUrl}`;
        } else {
          content = rStr;
        }
        break;
      }
      case 5:
      case 6: {
        const t = (p?.linkType as string | undefined) || "link";
        const target = (p?.targetFid as number | undefined) ? String(p?.targetFid) : "";
        content = target ? `${t} -> ${target}` : t;
        break;
      }
      case 11: {
        const u = Number((p?.userDataType as number | string | undefined) ?? 0);
        const val = (p?.value as string | undefined) ?? "";
        content = `${mapUserDataType(u)}: ${val}`.trim();
        break;
      }
      default:
        content = (p?.text as string | undefined) || (p?.value as string | undefined) || undefined;
    }
    const seq = ++this.seq;
    return {
      id: (p?.hash as string | undefined) || `${topic}-${partition}-${message.offset}`,
      seq,
      fid: p?.fid ? Number(p.fid as number | string) : undefined,
      type,
      content,
      link,
      raw: payload,
      timestamp: Number((p?.timestamp as number | string | undefined) ?? Date.now()),
    };
  }

  getSince(since?: number, limit = 200) {
    return this.buffer.since(since, limit);
  }

  latestSeq() {
    return this.buffer.latestSeq();
  }

  subscribe(cb: (e: Event) => void) {
    this.emitter.on("event", cb);
    return () => this.emitter.off("event", cb);
  }
}

function mapType(t: number) {
  switch (t) {
    case 1:
      return "CAST_ADD";
    case 2:
      return "CAST_REMOVE";
    case 3:
      return "REACTION_ADD";
    case 4:
      return "REACTION_REMOVE";
    case 5:
      return "LINK_ADD";
    case 6:
      return "LINK_REMOVE";
    case 11:
      return "USER_DATA_ADD";
    default:
      return `TYPE_${t || "UNKNOWN"}`;
  }
}

function shortHash(h?: string) {
  if (!h) return "";
  const s = String(h);
  return s.length > 10 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s;
}

function mapUserDataType(t: number) {
  switch (t) {
    case 1:
      return "PFP";
    case 2:
      return "DISPLAY";
    case 3:
      return "BIO";
    case 5:
      return "USERNAME";
    case 6:
      return "URL";
    default:
      return `USER_DATA_${t || "?"}`;
  }
}

type KafkaConfig = {
  brokers: string[];
  ssl?: boolean;
  sasl?: SASLOptions;
  topic: string;
};

function getKafkaConfig(): KafkaConfig | null {
  const brokers = process.env.KAFKA_BROKERS?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  const topic = process.env.KAFKA_TOPIC || "fc-events";
  if (!brokers.length) return null;
  const cfg: KafkaConfig = { brokers, topic };
  if (process.env.KAFKA_SSL === "true") cfg.ssl = true;
  const mech = process.env.KAFKA_SASL_MECHANISM as "plain" | "scram-sha-256" | "scram-sha-512" | undefined;
  const username = process.env.KAFKA_SASL_USERNAME;
  const password = process.env.KAFKA_SASL_PASSWORD;
  if (mech && username && password) {
    if (mech === "plain" || mech === "scram-sha-256" || mech === "scram-sha-512") {
      cfg.sasl = { mechanism: mech, username, password } as SASLOptions;
    }
  }
  return cfg;
}

export const FeedBus = FeedBusImpl.getInstance();
