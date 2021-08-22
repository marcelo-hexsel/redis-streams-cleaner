import { XInfoResponse } from "@src/redis/XInfoResponse";

describe("XInfoResponse", () => {
  describe("discoverLastProcessedStreamId", () => {
    it("should discover oldest pending item as last processed and return immediate before id", () => {
      const xInfoResponse = new XInfoResponse();

      xInfoResponse.groups = [
        {
          "last-delivered-id": "1113-0",
          name: "group-1",
          "pel-count": 0,
          consumers: [],
          pending: [{ "1112-1": {} }, { "1112-2": {} }],
        },
        {
          "last-delivered-id": "1112-0",
          name: "group-2",
          "pel-count": 0,
          consumers: [],
          pending: [{ "1112-0": {} }],
        },
      ];

      expect(xInfoResponse.discoverLastProcessedStreamId()).toBe("1111-999");
    });

    it("should discover last-delivered-id item as last processed and return it", () => {
      const xInfoResponse = new XInfoResponse();

      xInfoResponse.groups = [
        {
          "last-delivered-id": "1113-0",
          name: "group-1",
          "pel-count": 0,
          consumers: [],
          pending: [],
        },
        {
          "last-delivered-id": "1112-0",
          name: "group-2",
          "pel-count": 0,
          consumers: [],
          pending: [],
        },
      ];

      expect(xInfoResponse.discoverLastProcessedStreamId()).toBe("1112-0");
    });
  });
});
