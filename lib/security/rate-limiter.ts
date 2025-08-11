// lib/security/rate-limiter.ts
import { User } from "@/lib/mongodb/models/User";
import { connectDB } from "@/lib/mongodb/connection";

interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  lockoutDuration: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5,
  lockoutDuration: 30 * 60 * 1000 // 30 minutes
};

// In-memory rate limiting (for development/simple deployments)
const rateLimitStore = new Map<string, { count: number; firstAttempt: number; lockedUntil?: number }>();

export async function rateLimit(
  identifier: string, 
  ip?: string, 
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<void> {
  const key = `${identifier}:${ip || 'global'}`;
  const now = Date.now();
  
  // Clean up expired entries
  cleanupExpiredEntries();
  
  let entry = rateLimitStore.get(key);
  
  if (!entry) {
    entry = { count: 0, firstAttempt: now };
    rateLimitStore.set(key, entry);
  }
  
  // Check if locked
  if (entry.lockedUntil && entry.lockedUntil > now) {
    throw new Error('Too many failed attempts. Account temporarily locked.');
  }
  
  // Reset if window expired
  if (now - entry.firstAttempt > config.windowMs) {
    entry.count = 0;
    entry.firstAttempt = now;
    delete entry.lockedUntil;
  }
  
  entry.count++;
  
  if (entry.count > config.maxAttempts) {
    entry.lockedUntil = now + config.lockoutDuration;
    throw new Error('Account locked due to too many failed attempts.');
  }
  
  rateLimitStore.set(key, entry);
}

export async function clearRateLimit(identifier: string, ip?: string): Promise<void> {
  const key = `${identifier}:${ip || 'global'}`;
  rateLimitStore.delete(key);
}

function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.lockedUntil && entry.lockedUntil < now) {
      rateLimitStore.delete(key);
    }
  }
}

// ===== lib/security/device-fingerprint.ts =====



