import { RedisClient } from "redis";
import { AsyncRedisAdapter } from "./redis/AsyncRedisAdapter";
import { calculateIdBefore, immediateBeforeId } from "./redis/RedisStreamIdHelper";

const DEFAULT_OPTIONS = <RedisStreamCleanerOptions>{
  timeToKeepBeforeLastProcessedMessage: 0,
};

export class RedisStreamCleaner {
  private asyncRedis: AsyncRedisAdapter;
  private options: RedisStreamCleanerOptions;

  constructor(redisClient: RedisClient, options?: RedisStreamCleanerOptions) {
    this.options = options || DEFAULT_OPTIONS;
    this.asyncRedis = new AsyncRedisAdapter(redisClient);
  }

  public async cleanStreamMessages(streamKey: string): Promise<void> {
    const lastProcessedId = await this.discoverLastProcessedStreamId(streamKey);

    if (!lastProcessedId) return;

    const lastMessageIdToKeep = calculateIdBefore(lastProcessedId, this.options.timeToKeepBeforeLastProcessedMessage);

    await this.deleteMessagesOlderThan(streamKey, lastMessageIdToKeep);
  }

  private async discoverLastProcessedStreamId(streamKey: string): Promise<string> {
    const xInfoResponse = await this.asyncRedis.xinfo(streamKey);

    if (!xInfoResponse) return undefined;

    const oldestPendingId = xInfoResponse.discoverOldestPendingId();
    if (oldestPendingId) return immediateBeforeId(oldestPendingId);

    return xInfoResponse.discoverOldestDeliveredId();
  }

  private async deleteMessagesOlderThan(streamKey: string, oldestDeliveredId: string): Promise<void> {
    let idsToDelete: Array<string>;
    do {
      idsToDelete = await this.findMessagesToDelete(streamKey, oldestDeliveredId);

      const deletePromises = idsToDelete.map((id) => this.asyncRedis.xdel(streamKey, id));

      await Promise.all(deletePromises);
    } while (idsToDelete.length > 0);
  }

  private async findMessagesToDelete(streamKey: string, oldestDeliveredId: string): Promise<Array<string>> {
    const messagesToDelete = await this.asyncRedis.xrange(streamKey, "0-0", oldestDeliveredId, 1000);

    return messagesToDelete.messages.map((m) => Object.keys(m).find(Boolean));
  }
}

export interface RedisStreamCleanerOptions {
  timeToKeepBeforeLastProcessedMessage: number;
}
