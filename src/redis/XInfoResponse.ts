export class XInfoResponse {
  length: number;
  "radix-tree-keys": number;
  "radix-tree-nodes": number;
  "last-generated-id": string;
  entries: Array<unknown>;
  groups: Array<ConsumerGroup>;

  public discoverOldestPendingId(): string {
    return this.groups
      .map((m) => {
        return m.pending.map((p) => Object.keys(p).find(Boolean));
      })
      .reduce((acc, it) => {
        acc = [...acc, ...it];

        return acc;
      }, [])
      .sort()
      .find(Boolean);
  }

  public discoverOldestDeliveredId(): string {
    return this.groups
      .map((m) => {
        return m["last-delivered-id"];
      })
      .sort()
      .find(Boolean);
  }
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
