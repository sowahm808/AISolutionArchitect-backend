import { RedisOptions } from "ioredis";

const DEFAULT_REDIS_PORT = 6379;

function parseRedisPort(value: string | undefined): number {
  if (!value) return DEFAULT_REDIS_PORT;

  const port = Number(value);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid REDIS_PORT value: ${value}`);
  }

  return port;
}

export function createRedisConnectionOptions(): RedisOptions {
  const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST;

  if (redisUrl?.startsWith("redis://") || redisUrl?.startsWith("rediss://")) {
    const url = new URL(redisUrl);

    return {
      host: url.hostname,
      port: parseRedisPort(url.port),
      username: url.username ? decodeURIComponent(url.username) : undefined,
      password: url.password ? decodeURIComponent(url.password) : undefined,
      tls: url.protocol === "rediss:" ? {} : undefined,
    };
  }

  return {
    host: redisUrl || "localhost",
    port: parseRedisPort(process.env.REDIS_PORT),
  };
}
