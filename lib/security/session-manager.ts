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
