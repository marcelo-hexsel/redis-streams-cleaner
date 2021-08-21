import { AsyncRedisAdapter } from "@src/AsyncRedisAdapter";
import { RedisStreamCleaner } from "@src/RedisStreamCleaner";
import { CONSUMER_GROUP_ONE, CONSUMER_ONE, REDIS_CLIENT, TEST_STREAM } from "../Fixtures";

describe("Single Consumer Group", () => {
  const asyncRedis = new AsyncRedisAdapter(REDIS_CLIENT);

  afterEach(async () => {
    await asyncRedis.flushdb();
  });

  it("should clear the only read and ack message that was already read by the consumer group", async () => {
    const firstMessageId = await asyncRedis.xadd(TEST_STREAM, ["item", "1"]);
    await asyncRedis.xadd(TEST_STREAM, ["item", "2"]);

    await asyncRedis.xgroup(TEST_STREAM, CONSUMER_GROUP_ONE);
    await asyncRedis.xreadgroup(TEST_STREAM, CONSUMER_GROUP_ONE, CONSUMER_ONE, 1, ">");
    await asyncRedis.xack(TEST_STREAM, CONSUMER_GROUP_ONE, firstMessageId);

    const xInfoResponseBefore = await asyncRedis.xinfo(TEST_STREAM);
    expect(xInfoResponseBefore.length).toBe(2);

    await new RedisStreamCleaner(REDIS_CLIENT).cleanStreamMessages(TEST_STREAM);

    const xInfoResponseAfter = await asyncRedis.xinfo(TEST_STREAM);
    expect(xInfoResponseAfter.length).toBe(1);
  });
});
