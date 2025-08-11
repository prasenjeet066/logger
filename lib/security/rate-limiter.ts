import { Redis } from 'ioredis'

const redis = new Redis(process.env.REDIS_URL!)

interface RateLimitConfig {
  windowMs: number
  maxAttempts: number
  lockoutDuration: number
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5,
  lockoutDuration: 30 * 60 * 1000 // 30 minutes
}

export async function rateLimit(
  identifier: string, 
  ip?: string, 
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<void> {
  const key = `rate_limit:${identifier}:${ip || 'global'}`
  const lockKey = `locked:${key}`
  
  // Check if locked
  const isLocked = await redis.get(lockKey)
  if (isLocked) {
    throw new Error('Too many failed attempts. Account temporarily locked.')
  }
  
  const current = await redis.incr(key)
  
  if (current === 1) {
    await redis.expire(key, Math.ceil(config.windowMs / 1000))
  }
  
  if (current > config.maxAttempts) {
    // Lock the account
    await redis.setex(lockKey, Math.ceil(config.lockoutDuration / 1000), '1')
    await redis.del(key) // Reset attempts counter
    throw new Error('Account locked due to too many failed attempts.')
  }
}

export async function clearRateLimit(identifier: string, ip?: string): Promise<void> {
  const key = `rate_limit:${identifier}:${ip || 'global'}`
  const lockKey = `locked:${key}`
  
  await Promise.all([
    redis.del(key),
    redis.del(lockKey)
  ])
}