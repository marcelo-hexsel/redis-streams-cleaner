import * as Redis from "redis";

export const REDIS_CLIENT = Redis.createClient({
  host: "localhost",
  port: 6379,
  db: 1,
});

export const TEST_STREAM = "TEST_STREAM";
export const CONSUMER_GROUP_ONE = "consumer-group-one";
export const CONSUMER_ONE = "consumer-one";
