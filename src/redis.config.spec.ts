import { createRedisConnectionOptions } from "./redis.config";

describe("createRedisConnectionOptions", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.REDIS_URL;
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("parses a full Redis URL from REDIS_HOST", () => {
    process.env.REDIS_HOST = "redis://red-d963amho3t8c73c14a50:6379";

    expect(createRedisConnectionOptions()).toMatchObject({
      host: "red-d963amho3t8c73c14a50",
      port: 6379,
    });
  });

  it("prefers REDIS_URL and includes credentials", () => {
    process.env.REDIS_URL = "rediss://user:pass@example.internal:6380";
    process.env.REDIS_HOST = "localhost";

    expect(createRedisConnectionOptions()).toMatchObject({
      host: "example.internal",
      port: 6380,
      username: "user",
      password: "pass",
      tls: {},
    });
  });

  it("supports separate host and port values", () => {
    process.env.REDIS_HOST = "redis.internal";
    process.env.REDIS_PORT = "6381";

    expect(createRedisConnectionOptions()).toMatchObject({
      host: "redis.internal",
      port: 6381,
    });
  });
});
