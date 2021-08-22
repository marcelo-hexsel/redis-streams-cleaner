import { AsyncRedisAdapter } from "@src/redis/AsyncRedisAdapter";
import { RedisStreamCleaner } from "@src/RedisStreamCleaner";
import { CONSUMER_GROUP_ONE, CONSUMER_GROUP_TWO, CONSUMER_ONE, CONSUMER_TWO, REDIS_CLIENT, TEST_STREAM } from "../Fixtures";

describe("Cleaning all read and ack messages from a Stream with single consumer group", () => {
  const asyncRedis = new AsyncRedisAdapter(REDIS_CLIENT);

  afterEach(async () => {
    await asyncRedis.flushdb();
  });

  describe("Without pending messages", () => {
    it.each([
      { totalMessageCount: 0, readAndAckMessagesCGOne: 0, readAndAckMessagesCGTwo: 0, remainingMessagesAfterClean: 0 },
      { totalMessageCount: 2, readAndAckMessagesCGOne: 1, readAndAckMessagesCGTwo: 1, remainingMessagesAfterClean: 1 },
      { totalMessageCount: 2, readAndAckMessagesCGOne: 2, readAndAckMessagesCGTwo: 1, remainingMessagesAfterClean: 1 },
      { totalMessageCount: 2, readAndAckMessagesCGOne: 2, readAndAckMessagesCGTwo: 2, remainingMessagesAfterClean: 0 },
      { totalMessageCount: 100, readAndAckMessagesCGOne: 35, readAndAckMessagesCGTwo: 30, remainingMessagesAfterClean: 70 },
    ])(
      "should clear all read and ack messages that was already read by both consumer groups - total: $totalMessageCount | readAndAckMessagesCGOne: $readAndAckMessagesCGOne | readAndAckMessagesCGTwo: $readAndAckMessagesCGTwo | remaining: $remainingMessagesAfterClean",
      async (testCaseParameters) => {
        for (let i = 0; i < testCaseParameters.totalMessageCount; i++) {
          await asyncRedis.xadd(TEST_STREAM, "*", ["item", i.toString()]);
        }

        await asyncRedis.xgroup(TEST_STREAM, CONSUMER_GROUP_ONE);
        await asyncRedis.xgroup(TEST_STREAM, CONSUMER_GROUP_TWO);

        for (let i = 0; i < testCaseParameters.readAndAckMessagesCGOne; i++) {
          const xreadgroupResult = await asyncRedis.xreadgroup(TEST_STREAM, CONSUMER_GROUP_ONE, CONSUMER_ONE, 1, ">");
          await asyncRedis.xack(TEST_STREAM, CONSUMER_GROUP_ONE, Object.keys(xreadgroupResult.messages[0]).find(Boolean));
        }

        for (let i = 0; i < testCaseParameters.readAndAckMessagesCGTwo; i++) {
          const xreadgroupResult = await asyncRedis.xreadgroup(TEST_STREAM, CONSUMER_GROUP_TWO, CONSUMER_TWO, 1, ">");
          await asyncRedis.xack(TEST_STREAM, CONSUMER_GROUP_TWO, Object.keys(xreadgroupResult.messages[0]).find(Boolean));
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
      { totalMessageCount: 0, readMessagesCGOne: 0, ackMessagesCGOne: 0, readMessagesCGTwo: 0, ackMessagesCGTwo: 0, remainingMessagesAfterClean: 0 },
      { totalMessageCount: 2, readMessagesCGOne: 1, ackMessagesCGOne: 0, readMessagesCGTwo: 2, ackMessagesCGTwo: 2, remainingMessagesAfterClean: 2 },
      { totalMessageCount: 2, readMessagesCGOne: 1, ackMessagesCGOne: 1, readMessagesCGTwo: 2, ackMessagesCGTwo: 2, remainingMessagesAfterClean: 1 },
      { totalMessageCount: 2, readMessagesCGOne: 2, ackMessagesCGOne: 1, readMessagesCGTwo: 2, ackMessagesCGTwo: 2, remainingMessagesAfterClean: 1 },
      { totalMessageCount: 2, readMessagesCGOne: 2, ackMessagesCGOne: 2, readMessagesCGTwo: 2, ackMessagesCGTwo: 2, remainingMessagesAfterClean: 0 },
    ])(
      "should clear all read and ack messages that was already read by both consumer groups, considering pending messages - total: $totalMessageCount | readsCGOne: $readMessagesCGOne | ackCGOne: $ackMessagesCGOne | readsCGTwo: $readMessagesCGTwo | ackCGTwo: $ackMessagesCGTwo | remaining: $remainingMessagesAfterClean",
      async (testCaseParameters) => {
        for (let i = 0; i < testCaseParameters.totalMessageCount; i++) {
          await asyncRedis.xadd(TEST_STREAM, "*", ["item", i.toString()]);
        }

        await asyncRedis.xgroup(TEST_STREAM, CONSUMER_GROUP_ONE);
        await asyncRedis.xgroup(TEST_STREAM, CONSUMER_GROUP_TWO);

        let ackCount = 0;
        for (let i = 0; i < testCaseParameters.readMessagesCGOne; i++) {
          const xreadgroupResult = await asyncRedis.xreadgroup(TEST_STREAM, CONSUMER_GROUP_ONE, CONSUMER_ONE, 1, ">");

          if (ackCount < testCaseParameters.ackMessagesCGOne) {
            await asyncRedis.xack(TEST_STREAM, CONSUMER_GROUP_ONE, Object.keys(xreadgroupResult.messages[0]).find(Boolean));
            ackCount++;
          }
        }

        ackCount = 0;
        for (let i = 0; i < testCaseParameters.readMessagesCGTwo; i++) {
          const xreadgroupResult = await asyncRedis.xreadgroup(TEST_STREAM, CONSUMER_GROUP_TWO, CONSUMER_TWO, 1, ">");

          if (ackCount < testCaseParameters.ackMessagesCGTwo) {
            await asyncRedis.xack(TEST_STREAM, CONSUMER_GROUP_TWO, Object.keys(xreadgroupResult.messages[0]).find(Boolean));
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
