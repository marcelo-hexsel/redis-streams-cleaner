export interface XInfoResponse {
  length: number;
  "radix-tree-keys": number;
  "radix-tree-nodes": number;
  "last-generated-id": string;
  entries: Array<unknown>;
  groups: Array<ConsumerGroup>;
}

interface ConsumerGroup {
  name: string;
  "last-delivered-id": string;
  "pel-count": number;
  pending: Array<unknown>;
  consumers: Array<Consumer>;
}

interface Consumer {
  name: string;
  "seen-time": number;
  "pel-count": number;
  pending: Array<unknown>;
}
