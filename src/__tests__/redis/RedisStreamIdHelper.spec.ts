import { calculateIdWithTimeToKeep, immediateBeforeId } from "@src/redis/RedisStreamIdHelper";

describe("RedisStreamIdHelper", () => {
  describe("immediateBeforeId", () => {
    it.each([
      { id: "1111-0", immediateBefore: "1110-999" },
      { id: "1-1", immediateBefore: "1-0" },
      { id: "123456-9", immediateBefore: "123456-8" },
    ])(
      "should return calculate and return immediate before id, respecting Redis Stream autogenerated id format - id: $id | immediateBefore: $immediateBefore",
      (testCaseParameters) => {
        expect(immediateBeforeId(testCaseParameters.id)).toBe(testCaseParameters.immediateBefore);
      }
    );
  });

  describe("calculateIdWithTimeToKeep", () => {
    it.each([
      { id: "665168681681-0", timeToKeep: 500, result: "665168681181-0" },
      { id: "888188181818-1", timeToKeep: 60000, result: "888188121818-0" },
      { id: "111111111111-9", timeToKeep: 0, result: "111111111111-9" },
      { id: "111111111111-9", timeToKeep: undefined, result: "111111111111-9" },
      { id: "111111111111-9", timeToKeep: null, result: "111111111111-9" },
    ])(
      "should return calculate and return id with before time, respecting Redis Stream autogenerated id format - id: $id | timeToKeep: $timeToKeep | result: $result",
      (testCaseParameters) => {
        expect(calculateIdWithTimeToKeep(testCaseParameters.id, testCaseParameters.timeToKeep)).toBe(testCaseParameters.result);
      }
    );
  });
});
