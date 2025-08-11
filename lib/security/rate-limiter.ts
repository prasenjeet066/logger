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
import crypto from 'crypto';
import { User } from "@/lib/mongodb/models/User";
import { connectDB } from "@/lib/mongodb/connection";

export interface DeviceFingerprint {
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  cookiesEnabled: boolean;
}

export function generateFingerprint(device: DeviceFingerprint): string {
  const fingerprintString = [
    device.userAgent,
    device.screenResolution,
    device.timezone,
    device.language,
    device.platform,
    device.cookiesEnabled.toString()
  ].join('|');
  
  return crypto.createHash('sha256').update(fingerprintString).digest('hex');
}

export async function storeDeviceFingerprint(
  userId: string, 
  fingerprint: string,
  trustLevel: 'trusted' | 'suspicious' | 'blocked' = 'trusted',
  deviceName?: string
): Promise<void> {
  try {
    await connectDB();
    const user = await User.findById(userId);
    if (user) {
      await user.addTrustedDevice(fingerprint, deviceName);
    }
  } catch (error) {
    console.error('Error storing device fingerprint:', error);
  }
}

export async function verifyDeviceFingerprint(
  userId: string, 
  fingerprint: string
): Promise<boolean> {
  try {
    await connectDB();
    const user = await User.findById(userId);
    return user ? user.isTrustedDevice(fingerprint) : false;
  } catch (error) {
    console.error('Error verifying device fingerprint:', error);
    return false;
  }
}

// ===== lib/security/session-manager.ts =====
export class SessionManager {
  private static activeSessions = new Map<string, Set<string>>();
  
  static addSession(userId: string, sessionId: string): void {
    if (!this.activeSessions.has(userId)) {
      this.activeSessions.set(userId, new Set());
    }
    this.activeSessions.get(userId)!.add(sessionId);
  }
  
  static removeSession(userId: string, sessionId: string): void {
    const userSessions = this.activeSessions.get(userId);
    if (userSessions) {
      userSessions.delete(sessionId);
      if (userSessions.size === 0) {
        this.activeSessions.delete(userId);
      }
    }
  }
  
  static getUserSessions(userId: string): string[] {
    return Array.from(this.activeSessions.get(userId) || []);
  }
  
  static invalidateAllUserSessions(userId: string): void {
    this.activeSessions.delete(userId);
  }
  
  static getActiveUsersCount(): number {
    return this.activeSessions.size;
  }
  
  static getAllActiveSessions(): Array<{ userId: string; sessionCount: number }> {
    return Array.from(this.activeSessions.entries()).map(([userId, sessions]) => ({
      userId,
      sessionCount: sessions.size
    }));
  }
  
  static cleanup(): void {
    // Optional: periodically clean up inactive sessions
    // This would require additional logic to track session activity
  }
}

// ===== lib/security/audit-logger.ts =====
import { User } from "@/lib/mongodb/models/User";
import { connectDB } from "@/lib/mongodb/connection";

export interface AuditEvent {
  userId?: string;
  action: string;
  resource?: string;
  ip: string;
  userAgent: string;
  success: boolean;
  details?: any;
  timestamp?: Date;
}

export class AuditLogger {
  static async log(event: AuditEvent): Promise<void> {
    try {
      const logEntry = {
        ...event,
        id: crypto.randomUUID(),
        timestamp: event.timestamp || new Date()
      };
      
      console.log('AUDIT:', JSON.stringify(logEntry));
      
      // Store critical security events in user's security log
      if (this.isCriticalEvent(event.action) && event.userId) {
        await this.storeUserSecurityEvent(event.userId, logEntry);
      }
      
      // For production, you might want to send critical events to external logging service
      if (this.isCriticalEvent(event.action)) {
        await this.handleCriticalEvent(logEntry);
      }
      
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }
  
  private static isCriticalEvent(action: string): boolean {
    const criticalActions = [
      'FAILED_LOGIN',
      'ACCOUNT_LOCKED',
      'PASSWORD_CHANGED',
      '2FA_ENABLED',
      '2FA_DISABLED',
      'SUPER_ACCESS_GRANTED',
      'DATA_EXPORT',
      'ACCOUNT_DELETED',
      'SUSPICIOUS_LOGIN',
      'MULTIPLE_LOGIN_ATTEMPTS'
    ];
    return criticalActions.includes(action);
  }
  
  private static async storeUserSecurityEvent(userId: string, event: any): Promise<void> {
    try {
      await connectDB();
      const user = await User.findById(userId);
      if (user) {
        await user.addSecurityEvent(event);
      }
    } catch (error) {
      console.error('Failed to store user security event:', error);
    }
  }
  
  private static async handleCriticalEvent(event: any): Promise<void> {
    // In production, send to external monitoring service
    // For now, just log to console
    console.warn('CRITICAL SECURITY EVENT:', JSON.stringify(event));
    
    // You could implement email alerts, Slack notifications, etc.
    if (process.env.NODE_ENV === 'production') {
      // await sendSecurityAlert(event);
    }
  }
  
  static async getUserSecurityEvents(userId: string, limit: number = 50): Promise<any[]> {
    try {
      await connectDB();
      const user = await User.findById(userId).select('securityEvents');
      return user?.securityEvents?.slice(0, limit) || [];
    } catch (error) {
      console.error('Failed to get user security events:', error);
      return [];
    }
  }
}

// ===== lib/security/login-security.ts =====
import { User } from "@/lib/mongodb/models/User";
import { connectDB } from "@/lib/mongodb/connection";
import { AuditLogger } from "./audit-logger";

interface LoginAttempt {
  email: string;
  success: boolean;
  ip: string;
  userAgent?: string;
  timestamp: Date;
}

export async function validateLoginAttempt(
  email: string, 
  success: boolean, 
  ip: string,
  userAgent?: string
): Promise<void> {
  try {
    await connectDB();
    
    const attempt: LoginAttempt = {
      email: email.toLowerCase(),
      success,
      ip,
      userAgent,
      timestamp: new Date()
    };
    
    // Log attempt to audit system
    await AuditLogger.log({
      action: success ? 'SUCCESSFUL_LOGIN' : 'FAILED_LOGIN',
      ip,
      userAgent: userAgent || '',
      success,
      details: { email: email.toLowerCase() }
    });
    
    const user = await User.findOne({ email: email.toLowerCase() }).select('+loginAttempts +lockUntil');
    
    if (!user) {
      console.log('Login attempt for non-existent user:', attempt);
      return;
    }
    
    if (success) {
      // Reset failed attempts on successful login
      await user.resetLoginAttempts();
      
      // Update last login info
      await User.findByIdAndUpdate(user._id, {
        lastLoginAt: new Date(),
        lastLoginIP: ip
      });
    } else {
      // Increment failed attempts
      await user.incrementLoginAttempts();
      
      // Log to user's security events
      await AuditLogger.log({
        userId: user._id.toString(),
        action: 'FAILED_LOGIN_ATTEMPT',
        ip,
        userAgent: userAgent || '',
        success: false,
        details: { attemptCount: (user.loginAttempts || 0) + 1 }
      });
    }
    
  } catch (error) {
    console.error('Error logging login attempt:', error);
  }
}
