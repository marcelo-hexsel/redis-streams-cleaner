export interface RedisStreamCleanerOptions {
  timeToKeepBeforeLastProcessedMessage: number;
}

export const DEFAULT_OPTIONS = <RedisStreamCleanerOptions>{
  timeToKeepBeforeLastProcessedMessage: 0,
};
