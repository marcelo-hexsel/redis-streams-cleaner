import { RedisClient } from "redis";
import { promisify } from "util";
import { XInfoResponse } from "./XInfoResponse";
import { XRangeResponse } from "./XRangeResponse";
import { XReadGroupResponse } from "./XReadGroupResponse";
import { RedisResponseParser } from "./RedisResponseParser";

export class AsyncRedisAdapter {
  private redisResponseParser = new RedisResponseParser();

  /* eslint-disable @typescript-eslint/no-explicit-any*/
  public sendCommand: (command: string, args?: any[]) => any;

  constructor(redisClient: RedisClient) {
    this.sendCommand = <(command: string, args?: any[]) => any>promisify(redisClient.sendCommand).bind(redisClient);
  }
  /* eslint-enable @typescript-eslint/no-explicit-any*/

  async flushdb(): Promise<unknown> {
    return await this.sendCommand("FLUSHDB");
  }

  async xadd(streamKey: string, id: string, fields: Array<unknown>): Promise<unknown> {
    return await this.sendCommand("XADD", [streamKey, id, ...fields]);
  }

  async xgroup(streamKey: string, groupName: string): Promise<unknown> {
    return await this.sendCommand("XGROUP", ["CREATE", streamKey, groupName, 0, "MKSTREAM"]);
  }

  async xreadgroup(streamKey: string, groupName: string, consumerName: string, count: number, id: string): Promise<XReadGroupResponse> {
    const rawxreadgroup = await this.sendCommand("XREADGROUP", ["GROUP", groupName, consumerName, "COUNT", count, "STREAMS", streamKey, id]);

    return this.redisResponseParser.parse(["messages", rawxreadgroup[0][1]]) as XReadGroupResponse;
  }

  async xack(streamKey: string, groupName: string, id: string): Promise<unknown> {
    return await this.sendCommand("XACK", [streamKey, groupName, id]);
  }

  async xinfo(streamKey: string): Promise<XInfoResponse> {
    const rawxinfoResult = await this.sendCommand("XINFO", ["STREAM", streamKey, "FULL"]);

    return Object.assign(new XInfoResponse(), this.redisResponseParser.parse(rawxinfoResult));
  }

  async xrange(streamKey: string, initialId: string, finalId: string, count?: number): Promise<XRangeResponse> {
    const parameters = [streamKey, initialId, finalId] as Array<unknown>;

    if (count) {
      parameters.push("COUNT", count);
    }

    const rawxrangeResult = ["messages", await this.sendCommand("XRANGE", parameters)];

    return this.redisResponseParser.parse(rawxrangeResult) as XRangeResponse;
  }

  async xdel(streamKey: string, id: string): Promise<void> {
    await this.sendCommand("XDEL", [streamKey, id]);
  }
}
