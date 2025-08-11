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
