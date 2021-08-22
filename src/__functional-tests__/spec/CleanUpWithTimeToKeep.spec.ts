import { AsyncRedisAdapter } from "@src/redis/AsyncRedisAdapter";
import { RedisStreamCleaner } from "@src/RedisStreamCleaner";
import { CONSUMER_GROUP_ONE, CONSUMER_ONE, REDIS_CLIENT, TEST_STREAM } from "../Fixtures";

describe("Cleaning all read and ack messages, respecting options.timeToKeepBeforeLastProcessedMessage", () => {
  const asyncRedis = new AsyncRedisAdapter(REDIS_CLIENT);

  afterEach(async () => {
    await asyncRedis.flushdb();
  });

  it.each([
    {
      messageIds: ["999966435762-0", "999966435862-0", "999966435962-0"],
      readMessages: 3,
      ackMessages: 3,
      timeToKeep: 0,
      remainingMessagesAfterClean: 0,
    },
    {
      messageIds: ["999966435762-0", "999966435862-0", "999966435962-0"],
      readMessages: 3,
      ackMessages: 3,
      timeToKeep: 100,
      remainingMessagesAfterClean: 1,
    },
    {
      messageIds: ["999966435762-0", "999966435862-0", "999966435962-0"],
      readMessages: 3,
      ackMessages: 3,
      timeToKeep: 200,
      remainingMessagesAfterClean: 2,
    },
    {
      messageIds: ["999966435762-0", "999966435862-0", "999966435962-0"],
      readMessages: 3,
      ackMessages: 3,
      timeToKeep: 300,
      remainingMessagesAfterClean: 3,
    },
    {
      messageIds: ["999966435762-0", "999966435862-0", "999966435962-0"],
      readMessages: 3,
      ackMessages: 1,
      timeToKeep: 100,
      remainingMessagesAfterClean: 3,
    },
    {
      messageIds: ["999966435762-0", "999966435862-0", "999966435962-0"],
      readMessages: 3,
      ackMessages: 2,
      timeToKeep: 100,
      remainingMessagesAfterClean: 2,
    },
    {
      messageIds: ["999966435762-0", "999966435862-0", "999966435962-0"],
      readMessages: 3,
      ackMessages: 0,
      timeToKeep: 100,
      remainingMessagesAfterClean: 3,
    },
  ])(
    "should clear all read and ack messages that was already read by the consumer group - total: $totalMessageCount | readMessages: $readMessages | ackMessages: $ackMessages | remaining: $remainingMessagesAfterClean | messageIds: $messageIds",
    async (testCaseParameters) => {
      for (let i = 0; i < testCaseParameters.messageIds.length; i++) {
        await asyncRedis.xadd(TEST_STREAM, testCaseParameters.messageIds[i], ["item", i.toString()]);
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
      expect(xInfoResponseBefore.length).toBe(testCaseParameters.messageIds.length);

      await new RedisStreamCleaner(REDIS_CLIENT, { timeToKeepBeforeLastProcessedMessage: testCaseParameters.timeToKeep }).cleanStreamMessages(
        TEST_STREAM
      );

      const xInfoResponseAfter = await asyncRedis.xinfo(TEST_STREAM);
      expect(xInfoResponseAfter.length).toBe(testCaseParameters.remainingMessagesAfterClean);
    }
  );
});
