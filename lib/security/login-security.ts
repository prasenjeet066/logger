// ===== lib/security/login-security.ts =====
import { User } from "@/lib/mongodb/models/User";
import { connectDB } from "@/lib/mongodb/connection";
import { Auditlogger } from "./audit-logger";

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
    await Auditlogger.log({
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
      await Auditlogger.log({
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
