import Redis from 'ioredis';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const url = process.env.REDIS_URL || process.env.REDIS_CONNECTION_STRING;
  if (!url) return null;

  redisClient = new Redis(url);
  // Optionally add error handling
  redisClient.on('error', (err) => {
    console.error('Redis error:', err);
  });

  return redisClient;
}
