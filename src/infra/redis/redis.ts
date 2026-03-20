import { Redis } from "ioredis";
import { config } from "../../config/index.js";

const redis = new Redis(config.redis.uri, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  db: 0,
});

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("ready", () => {
  console.log("Redis ready");
});

redis.on("error", (err) => {
  console.log("Redis error", err);
});

export default redis;
