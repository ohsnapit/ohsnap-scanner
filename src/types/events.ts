export type Event = {
  id: string;
  seq: number;
  fid?: number;
  type: string;
  content?: string;
  link?: string;
  raw?: unknown;
  timestamp: number;
};
