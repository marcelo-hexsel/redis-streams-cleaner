import { RedisClient } from "redis";
import { AsyncRedisAdapter } from "./redis/AsyncRedisAdapter";
import { calculateIdWithTimeToKeep } from "./redis/RedisStreamIdHelper";
import { DEFAULT_OPTIONS, RedisStreamCleanerOptions } from "./RedisStreamCleanerOptions";

export class RedisStreamCleaner {
  private asyncRedis: AsyncRedisAdapter;
  private options: RedisStreamCleanerOptions;

  constructor(redisClient: RedisClient, options?: RedisStreamCleanerOptions) {
    this.options = options || DEFAULT_OPTIONS;
    this.asyncRedis = new AsyncRedisAdapter(redisClient);
  }

  public async cleanStreamMessages(streamKey: string): Promise<void> {
    const xInfoResponse = await this.asyncRedis.xinfo(streamKey);

    if (!xInfoResponse) return;

    const lastProcessedId = xInfoResponse.discoverLastProcessedStreamId();

    if (!lastProcessedId) return;

    const idWithTimeToKeep = calculateIdWithTimeToKeep(lastProcessedId, this.options.timeToKeepBeforeLastProcessedMessage);

    await this.deleteMessagesUntil(streamKey, idWithTimeToKeep);
  }

  private async deleteMessagesUntil(streamKey: string, oldestDeliveredId: string): Promise<void> {
    let idsToDelete: Array<string>;
    do {
      idsToDelete = await this.findMessagesToDelete(streamKey, oldestDeliveredId);

      idsToDelete.forEach(async (id) => await this.asyncRedis.xdel(streamKey, id));
    } while (idsToDelete.length > 0);
  }

  private async findMessagesToDelete(streamKey: string, oldestDeliveredId: string): Promise<Array<string>> {
    const messagesToDelete = await this.asyncRedis.xrange(streamKey, "0-0", oldestDeliveredId, 1000);

    return messagesToDelete.messages.map((m) => Object.keys(m).find(Boolean));
  }
}
