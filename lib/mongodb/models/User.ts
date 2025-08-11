import mongoose, { type Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import profile_categories from '@/lib/profile-categorys';

export interface IUser extends Document {
  _id: string;
  email: string;
  username: string;
  displayName: string;
  password?: string;
  avatarUrl?: string;
  coverUrl?: string;
  bio?: string;
  location?: string;
  website?: string;
  isVerified: boolean;
  isPrivate: boolean;
  allowMessages: boolean;
  showEmail: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  userType: 'human' | 'bot';
  botId?: string;
  
  // 2FA Configuration
  enable2FA?: boolean;
  obj2FA: {
    waysVerify: Array<{
      type: 'email' | 'phone' | 'authenticator' | 'fingerprint';
      value?: string;
      enabled: boolean;
    }>;
  };
  
  // Super Access Configuration
  superAccess?: {
    role: 'admin' | 'context' | 'moderator';
    createdAt: Date | null;
    expireAt: Date | null;
    verificationWays: {
      emailOtp: boolean;
      phoneOtp: boolean;
      fingerPrint: boolean;
    };
  };
  
  // Profile Settings
  lock_profile: boolean;
  hide_following_list: boolean;
  show_activity_status: boolean;
  public_send_message: boolean;
  show_in_search: boolean;
  category: string;
  personalized_ads: boolean;
  
  // Security & Authentication
  pinnedPostId?: string;
  emailVerified?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  loginAttempts?: number;
  lockUntil?: Date;
  lastLoginAt?: Date;
  lastLoginIP?: string;
  
  // Device Management
  trustedDevices: Array<{
    fingerprint: string;
    name?: string;
    lastUsed: Date;
    trustLevel: 'trusted' | 'suspicious' | 'blocked';
  }>;
  
  // Audit Trail
  securityEvents: Array<{
    action: string;
    ip: string;
    userAgent?: string;
    success: boolean;
    timestamp: Date;
    details?: any;
  }>;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  isAccountLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  addSecurityEvent(event: any): Promise<void>;
  getEnabledVerificationWays(): string[];
  addTrustedDevice(fingerprint: string, name?: string): Promise<void>;
  isTrustedDevice(fingerprint: string): boolean;
}

const Names = profile_categories.map(item => item.name);

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    password: {
      type: String,
      minlength: 12,
      required: function(this: IUser) {
        return this.userType === 'human';
      },
      default: null,
      select: false, // Don't include password in queries by default
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    coverUrl: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: 160,
      default: '',
    },
    location: {
      type: String,
      maxlength: 50,
      default: '',
    },
    website: {
      type: String,
      maxlength: 100,
      default: '',
      validate: {
        validator: function(v: string) {
          if (!v) return true; // Allow empty strings
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Website must be a valid URL starting with http:// or https://'
      }
    },
    
    // 2FA Configuration
    enable2FA: {
      type: Boolean,
      default: false,
    },
    obj2FA: {
      waysVerify: [
        {
          type: {
            type: String,
            enum: ['email', 'phone', 'authenticator', 'fingerprint'],
            required: true,
          },
          value: {
            type: String,
            required: false,
          },
          enabled: {
            type: Boolean,
            default: false,
          },
        },
      ],
      default: { waysVerify: [] },
    },
    
    // Super Access Configuration
    superAccess: {
      type: {
        role: {
          type: String,
          enum: ['admin', 'context', 'moderator'],
        },
        createdAt: {
          type: Date,
          default: null,
        },
        expireAt: {
          type: Date,
          default: null,
        },
        verificationWays: {
          emailOtp: { type: Boolean, default: false },
          phoneOtp: { type: Boolean, default: false },
          fingerPrint: { type: Boolean, default: false },
        },
      },
      required: false,
      default: null,
    },
    
    // Basic Profile Settings
    isVerified: {
      type: Boolean,
      default: false,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    allowMessages: {
      type: Boolean,
      default: true,
    },
    showEmail: {
      type: Boolean,
      default: false,
    },
    
    // Counters
    followersCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    postsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    
    // User Type
    userType: {
      type: String,
      enum: ['human', 'bot'],
      default: 'human',
    },
    botId: {
      type: Schema.Types.ObjectId,
      ref: 'Bot',
      default: null,
    },
    
    // Privacy Settings
    lock_profile: {
      type: Boolean,
      default: false,
    },
    hide_following_list: {
      type: Boolean,
      default: false,
    },
    show_activity_status: {
      type: Boolean,
      default: true,
    },
    public_send_message: {
      type: Boolean,
      default: true,
    },
    show_in_search: {
      type: Boolean,
      default: true,
    },
    category: {
      type: String,
      enum: Names,
      default: "Activist",
    },
    personalized_ads: {
      type: Boolean,
      default: false,
    },
    
    // References
    pinnedPostId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
    },
    
    // Authentication & Security
    emailVerified: {
      type: Date,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      default: null,
      select: false, // Don't include in queries by default
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
      select: false,
    },
    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      default: null,
      select: false,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    lastLoginIP: {
      type: String,
      default: null,
    },
    
    // Device Management
    trustedDevices: [
      {
        fingerprint: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          default: 'Unknown Device',
        },
        lastUsed: {
          type: Date,
          default: Date.now,
        },
        trustLevel: {
          type: String,
          enum: ['trusted', 'suspicious', 'blocked'],
          default: 'trusted',
        },
      },
    ],
    
    // Security Events Log (keep recent events only)
    securityEvents: [
      {
        action: {
          type: String,
          required: true,
        },
        ip: {
          type: String,
          required: true,
        },
        userAgent: {
          type: String,
          default: null,
        },
        success: {
          type: Boolean,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        details: {
          type: Schema.Types.Mixed,
          default: null,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound Indexes for better performance
userSchema.index({ email: 1, username: 1 });
userSchema.index({ userType: 1, isVerified: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLoginAt: -1 });
userSchema.index({ lockUntil: 1 }, { sparse: true });
userSchema.index({ resetPasswordExpires: 1 }, { expireAfterSeconds: 0 });
userSchema.index({ 'securityEvents.timestamp': -1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function(this: IUser) {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

// Pre-validation middleware
userSchema.pre('validate', function(this: IUser, next) {
  // Validate bot users
  if (this.userType === 'bot' && !this.botId) {
    return next(new Error('botId is required for bot users'));
  }
  
  // Validate super access expiration
  if (this.superAccess?.expireAt && this.superAccess.expireAt <= new Date()) {
    this.superAccess = null;
  }
  
  next();
});

// Hash password before saving
userSchema.pre('save', async function(this: IUser, next) {
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

// Limit security events to last 100 entries
userSchema.pre('save', function(this: IUser, next) {
  if (this.securityEvents && this.securityEvents.length > 100) {
    this.securityEvents = this.securityEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 100);
  }
  next();
});

// Instance Methods
userSchema.methods.comparePassword = async function(this: IUser, candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isAccountLocked = function(this: IUser): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

userSchema.methods.incrementLoginAttempts = async function(this: IUser): Promise<void> {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { lockUntil: 1, loginAttempts: 1 }
    });
  }
  
  const updates: any = { $inc: { loginAttempts: 1 } };
  
  // If we're at max attempts and not locked, lock account
  if (this.loginAttempts && this.loginAttempts + 1 >= 5 && !this.isAccountLocked()) {
    updates.$set = {
      lockUntil: new Date(Date.now() + 30 * 60 * 1000) // Lock for 30 minutes
    };
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = async function(this: IUser): Promise<void> {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

userSchema.methods.addSecurityEvent = async function(this: IUser, event: any): Promise<void> {
  const securityEvent = {
    action: event.action,
    ip: event.ip,
    userAgent: event.userAgent || null,
    success: event.success,
    timestamp: new Date(),
    details: event.details || null
  };
  
  return this.updateOne({
    $push: {
      securityEvents: {
        $each: [securityEvent],
        $position: 0, // Add to beginning
        $slice: 100 // Keep only last 100 events
      }
    }
  });
};

userSchema.methods.getEnabledVerificationWays = function(this: IUser): string[] {
  if (!this.superAccess?.verificationWays) return [];
  
  const verificationWays = this.superAccess.verificationWays;
  return Object.keys(verificationWays).filter(
    (key) => verificationWays[key as keyof typeof verificationWays]
  );
};

userSchema.methods.addTrustedDevice = async function(this: IUser, fingerprint: string, name?: string): Promise<void> {
  const device = {
    fingerprint,
    name: name || 'Unknown Device',
    lastUsed: new Date(),
    trustLevel: 'trusted' as const
  };
  
  // Remove existing device with same fingerprint
  await this.updateOne({
    $pull: { trustedDevices: { fingerprint } }
  });
  
  // Add new device
  return this.updateOne({
    $push: { trustedDevices: device }
  });
};

userSchema.methods.isTrustedDevice = function(this: IUser, fingerprint: string): boolean {
  if (!this.trustedDevices) return false;
  
  const device = this.trustedDevices.find(d => d.fingerprint === fingerprint);
  return device?.trustLevel === 'trusted';
};

// Transform output to remove sensitive data
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    delete ret.loginAttempts;
    delete ret.lockUntil;
    delete ret.securityEvents;
    delete ret.trustedDevices;
    return ret;
  },
});

// Ensure model is properly exported
export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);