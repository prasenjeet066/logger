// lib/security/audit-logger.ts
export interface AuditEvent {
  userId?: string
  action: string
  resource?: string
  ip: string
  userAgent: string
  success: boolean
  details?: any
  timestamp: Date
}

export class AuditLogger {
  static async log(event: AuditEvent): Promise<void> {
    try {
      // In production, you'd want to send this to a dedicated logging service
      // like CloudWatch, Elasticsearch, or a security information system
      
      const logEntry = {
        ...event,
        id: crypto.randomUUID(),
        timestamp: event.timestamp || new Date()
      }
      
      console.log('AUDIT:', JSON.stringify(logEntry))
      
      // Store critical security events
      if (this.isCriticalEvent(event.action)) {
        await this.storeCriticalEvent(logEntry)
      }
      
    } catch (error) {
      console.error('Failed to log audit event:', error)
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
      'ACCOUNT_DELETED'
    ]
    return criticalActions.includes(action)
  }
  
  private static async storeCriticalEvent(event: any): Promise<void> {
    // Store in secure audit database
    await redis.lpush('critical_events', JSON.stringify(event))
    await redis.expire('critical_events', 365 * 24 * 60 * 60) // Keep for 1 year
  }
}