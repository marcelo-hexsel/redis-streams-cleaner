import { RedisClient } from "redis";
import { AsyncRedisAdapter } from "./AsyncRedisAdapter";

export class RedisStreamCleaner {
  private asyncRedis: AsyncRedisAdapter;

  constructor(redisClient: RedisClient) {
    this.asyncRedis = new AsyncRedisAdapter(redisClient);
  }

  public async cleanStreamMessages(streamKey: string) {
    const oldestDeliveredId = await this.findOldestDeliveredId(streamKey);

    if (!oldestDeliveredId) return;

    await this.deleteMessagesOlderThan(streamKey, oldestDeliveredId);
  }

  private async findOldestDeliveredId(streamKey: string) {
    const xInfoResponse = await this.asyncRedis.xinfo(streamKey);

    if (!xInfoResponse) return undefined;

    return xInfoResponse.groups
      .map((m) => {
        return m["last-delivered-id"];
      })
      .sort()
      .find(Boolean);
  }

  private async deleteMessagesOlderThan(streamKey: string, oldestDeliveredId: string) {
    let idsToDelete: Array<string>;
    do {
      idsToDelete = await this.findMessagesToDelete(streamKey, oldestDeliveredId);

      const deletePromises = idsToDelete.map((id) => this.asyncRedis.xdel(streamKey, id));

      await Promise.all(deletePromises);
    } while (idsToDelete.length > 0);
  }

  private async findMessagesToDelete(streamKey: string, oldestDeliveredId: string) {
    const messagesToDelete = await this.asyncRedis.xrange(streamKey, "0-0", oldestDeliveredId, 1000);

    return messagesToDelete.messages.map((m) => Object.keys(m).find(Boolean));
  }
}
