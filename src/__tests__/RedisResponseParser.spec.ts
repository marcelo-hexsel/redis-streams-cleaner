import { RedisResponseParser } from "@src/RedisResponseParser";

describe("RedisResponseParser", () => {
  const parser = new RedisResponseParser();

  it("should parse XINFO sample correctly", () => {
    const xinfoResponse = [
      "length",
      2,
      "radix-tree-keys",
      1,
      "radix-tree-nodes",
      2,
      "last-generated-id",
      "1629549673182-1",
      "entries",
      [
        ["1629549673182-0", ["item", "1"]],
        ["1629549673182-1", ["item", "2"]],
      ],
      "groups",
      [
        [
          "name",
          "consumer-group-one",
          "last-delivered-id",
          "1629549673182-0",
          "pel-count",
          0,
          "pending",
          [],
          "consumers",
          [["name", "consumer-one", "seen-time", 1629549673183, "pel-count", 0, "pending", []]],
        ],
      ],
    ];

    const expectedParseResult = {
      length: 2,
      "radix-tree-keys": 1,
      "radix-tree-nodes": 2,
      "last-generated-id": "1629549673182-1",
      entries: [{ "1629549673182-0": { item: "1" } }, { "1629549673182-1": { item: "2" } }],
      groups: [
        {
          name: "consumer-group-one",
          "last-delivered-id": "1629549673182-0",
          "pel-count": 0,
          pending: [],
          consumers: [{ name: "consumer-one", "seen-time": 1629549673183, "pel-count": 0, pending: [] }],
        },
      ],
    };

    const parseResult = parser.parse(xinfoResponse);

    expect(parseResult).toEqual(expectedParseResult);
  });
});
