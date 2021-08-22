import { XInfoResponse } from "@src/redis/XInfoResponse";
import { XRangeResponse } from "@src/redis/XRangeResponse";
import { RedisStreamCleaner } from "@src/RedisStreamCleaner";
import { RedisClient } from "redis";

const redisClientMock = <RedisClient>{};
redisClientMock.sendCommand = jest.fn();

const asyncRedisAdapterMock = {
  xinfo: jest.fn(),
  xrange: jest.fn(),
  xdel: jest.fn(() => Promise.resolve()),
};

jest.mock("@src/redis/AsyncRedisAdapter", () => {
  return {
    AsyncRedisAdapter: jest.fn().mockImplementation(() => {
      return asyncRedisAdapterMock;
    }),
  };
});

describe("RedisStreamCleaner", () => {
  const cleaner = new RedisStreamCleaner(redisClientMock);
  const streamKey = "FAKE_STREAM";

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should make all calls to Redis in the logic flow when there are stuff to be cleaned", async () => {
    const xInfoResponse = new XInfoResponse();

    xInfoResponse.discoverLastProcessedStreamId = jest.fn(() => "1111-0");
    asyncRedisAdapterMock.xinfo = jest.fn(() => Promise.resolve(xInfoResponse));
    asyncRedisAdapterMock.xdel = jest.fn(() => Promise.resolve());

    let xrangeCalls = 0;
    asyncRedisAdapterMock.xrange = jest.fn(() => {
      if (xrangeCalls === 0) {
        xrangeCalls++;

        return Promise.resolve(<XRangeResponse>{
          messages: [{ "1110-0": {} }, { "1111-0": {} }],
        });
      }

      return Promise.resolve(<XRangeResponse>{
        messages: [],
      });
    });

    await cleaner.cleanStreamMessages(streamKey);

    expect(asyncRedisAdapterMock.xinfo).toBeCalledWith(streamKey);
    expect(asyncRedisAdapterMock.xrange).toBeCalledTimes(2);
    expect(asyncRedisAdapterMock.xrange).toHaveBeenNthCalledWith(1, streamKey, "0-0", "1111-0", 1000);
    expect(asyncRedisAdapterMock.xrange).toHaveBeenNthCalledWith(2, streamKey, "0-0", "1111-0", 1000);
    expect(asyncRedisAdapterMock.xdel).toBeCalledTimes(2);
    expect(asyncRedisAdapterMock.xdel).toHaveBeenNthCalledWith(1, streamKey, "1110-0");
    expect(asyncRedisAdapterMock.xdel).toHaveBeenNthCalledWith(2, streamKey, "1111-0");
  });

  it("should make no calls to Redis in the login flow when there is no info about the stream", async () => {
    asyncRedisAdapterMock.xinfo = jest.fn(() => Promise.resolve(undefined));

    await cleaner.cleanStreamMessages(streamKey);

    expect(asyncRedisAdapterMock.xinfo).toBeCalledWith(streamKey);
    expect(asyncRedisAdapterMock.xrange).not.toBeCalled();
    expect(asyncRedisAdapterMock.xdel).not.toBeCalled();
  });
});
