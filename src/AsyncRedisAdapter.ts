import { RedisClient } from "redis";
import { promisify } from "util";
import { XInfoResponse } from "./redis/XInfoResponse";
import { XRangeResponse } from "./redis/XRangeResponse";
import { RedisResponseParser } from "./RedisResponseParser";

export class AsyncRedisAdapter {
  private redisResponseParser = new RedisResponseParser();

  public sendCommand: (command: string, args?: any[]) => any;

  constructor(redisClient: RedisClient) {
    this.sendCommand = <(command: string, args?: any[]) => any>promisify(redisClient.sendCommand).bind(redisClient);
  }

  async flushdb() {
    return await this.sendCommand("FLUSHDB");
  }

  async xadd(streamKey: string, fields: Array<unknown>) {
    return await this.sendCommand("XADD", [streamKey, "*", ...fields]);
  }

  async xgroup(streamKey: string, groupName: string) {
    return await this.sendCommand("XGROUP", ["CREATE", streamKey, groupName, 0]);
  }

  async xreadgroup(streamKey: string, groupName: string, consumerName: string, count: number, id: string) {
    return await this.sendCommand("XREADGROUP", ["GROUP", groupName, consumerName, "COUNT", count, "STREAMS", streamKey, id]);
  }

  async xack(streamKey: string, groupName: string, id: string) {
    return await this.sendCommand("XACK", [streamKey, groupName, id]);
  }

  async xinfo(streamKey: string) {
    const rawxinfoResult = await this.sendCommand("XINFO", ["STREAM", streamKey, "FULL"]);

    return this.redisResponseParser.parse(rawxinfoResult) as XInfoResponse;
  }

  async xrange(streamKey: string, initialId: string, finalId: string, count?: number) {
    const parameters = [streamKey, initialId, finalId] as Array<unknown>;

    if (count) {
      parameters.push("COUNT", count);
    }

    const rawxrangeResult = ["messages", await this.sendCommand("XRANGE", parameters)];

    return this.redisResponseParser.parse(rawxrangeResult) as XRangeResponse;
  }

  async xdel(streamKey: string, id: string) {
    await this.sendCommand("XDEL", [streamKey, id]);
  }
}
