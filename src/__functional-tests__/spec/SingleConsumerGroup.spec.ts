import { AsyncRedisAdapter } from "@src/redis/AsyncRedisAdapter";
import { RedisStreamCleaner } from "@src/RedisStreamCleaner";
import { CONSUMER_GROUP_ONE, CONSUMER_ONE, REDIS_CLIENT, TEST_STREAM } from "../Fixtures";

describe("Cleaning all read and ack messages from a Stream with single consumer group", () => {
  const asyncRedis = new AsyncRedisAdapter(REDIS_CLIENT);

  afterEach(async () => {
    await asyncRedis.flushdb();
  });

  describe("Without pending messages", () => {
    it.each([
      { totalMessageCount: 0, readAndAckMessages: 0, remainingMessagesAfterClean: 0 },
      { totalMessageCount: 2, readAndAckMessages: 1, remainingMessagesAfterClean: 1 },
      { totalMessageCount: 100, readAndAckMessages: 35, remainingMessagesAfterClean: 65 },
      { totalMessageCount: 200, readAndAckMessages: 200, remainingMessagesAfterClean: 0 },
      { totalMessageCount: 3000, readAndAckMessages: 1582, remainingMessagesAfterClean: 1418 },
    ])(
      "should clear all read and ack messages that was already read by the consumer group - total: $totalMessageCount | readAndAck: $readAndAckMessages | remaining: $remainingMessagesAfterClean",
      async (testCaseParameters) => {
        for (let i = 0; i < testCaseParameters.totalMessageCount; i++) {
          await asyncRedis.xadd(TEST_STREAM, "*",["item", i.toString()]);
        }

        await asyncRedis.xgroup(TEST_STREAM, CONSUMER_GROUP_ONE);

        for (let i = 0; i < testCaseParameters.readAndAckMessages; i++) {
          const xreadgroupResult = await asyncRedis.xreadgroup(TEST_STREAM, CONSUMER_GROUP_ONE, CONSUMER_ONE, 1, ">");
          await asyncRedis.xack(TEST_STREAM, CONSUMER_GROUP_ONE, Object.keys(xreadgroupResult.messages[0]).find(Boolean));
        }

        const xInfoResponseBefore = await asyncRedis.xinfo(TEST_STREAM);
        expect(xInfoResponseBefore.length).toBe(testCaseParameters.totalMessageCount);

        await new RedisStreamCleaner(REDIS_CLIENT).cleanStreamMessages(TEST_STREAM);

        const xInfoResponseAfter = await asyncRedis.xinfo(TEST_STREAM);
        expect(xInfoResponseAfter.length).toBe(testCaseParameters.remainingMessagesAfterClean);
      }
    );
  });

  describe("With pending messages", () => {
    it.each([
      { totalMessageCount: 0, readMessages: 0, ackMessages: 0, remainingMessagesAfterClean: 0 },
      { totalMessageCount: 2, readMessages: 1, ackMessages: 0, remainingMessagesAfterClean: 2 },
      { totalMessageCount: 100, readMessages: 35, ackMessages: 25, remainingMessagesAfterClean: 75 },
      { totalMessageCount: 200, readMessages: 200, ackMessages: 0, remainingMessagesAfterClean: 200 },
      { totalMessageCount: 200, readMessages: 200, ackMessages: 200, remainingMessagesAfterClean: 0 },
      { totalMessageCount: 3000, readMessages: 1582, ackMessages: 1000, remainingMessagesAfterClean: 2000 },
    ])(
      "should clear all read and ack messages that was already read by the consumer group, considering pending messages - total: $totalMessageCount | read: $readMessages | ack: $ackMessages | remaining: $remainingMessagesAfterClean",
      async (testCaseParameters) => {
        for (let i = 0; i < testCaseParameters.totalMessageCount; i++) {
          await asyncRedis.xadd(TEST_STREAM, "*", ["item", i.toString()]);
        }

        await asyncRedis.xgroup(TEST_STREAM, CONSUMER_GROUP_ONE);

        let ackCount = 0;
        for (let i = 0; i < testCaseParameters.readMessages; i++) {
          const xreadgroupResult = await asyncRedis.xreadgroup(TEST_STREAM, CONSUMER_GROUP_ONE, CONSUMER_ONE, 1, ">");

          if (ackCount < testCaseParameters.ackMessages) {
            await asyncRedis.xack(TEST_STREAM, CONSUMER_GROUP_ONE, Object.keys(xreadgroupResult.messages[0]).find(Boolean));
            ackCount++;
          }
        }

        const xInfoResponseBefore = await asyncRedis.xinfo(TEST_STREAM);
        expect(xInfoResponseBefore.length).toBe(testCaseParameters.totalMessageCount);

        await new RedisStreamCleaner(REDIS_CLIENT).cleanStreamMessages(TEST_STREAM);

        const xInfoResponseAfter = await asyncRedis.xinfo(TEST_STREAM);
        expect(xInfoResponseAfter.length).toBe(testCaseParameters.remainingMessagesAfterClean);
      }
    );
  });
});
