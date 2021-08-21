import { RedisClient } from "redis";
import { AsyncRedisAdapter } from "./redis/AsyncRedisAdapter";
import { immediateBeforeId } from "./redis/RedisStreamIdHelper";

export class RedisStreamCleaner {
  private asyncRedis: AsyncRedisAdapter;

  constructor(redisClient: RedisClient) {
    this.asyncRedis = new AsyncRedisAdapter(redisClient);
  }

  public async cleanStreamMessages(streamKey: string) {
    const lastProcessedId = await this.discoverLastProcessedStreamId(streamKey);

    if (!lastProcessedId) return;

    await this.deleteMessagesOlderThan(streamKey, lastProcessedId);
  }

  private async discoverLastProcessedStreamId(streamKey: string) {
    const xInfoResponse = await this.asyncRedis.xinfo(streamKey);

    if (!xInfoResponse) return undefined;

    const oldestPendingId = xInfoResponse.discoverOldestPendingId();
    if (oldestPendingId) return immediateBeforeId(oldestPendingId);

    return xInfoResponse.discoverOldestDeliveredId();
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
