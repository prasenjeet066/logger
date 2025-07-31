import mongoose, { type Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

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
  enable2FA?: boolean;
  obj2FA: {
    waysVerify: Array<{ type: string; value?: string; enabled: boolean }>;
  };
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
  pinnedPostId?: string;
  emailVerified?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
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
      required: function () {
        return this.userType === 'human';
      },
      default: null,
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
    },
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
    },
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
    followersCount: {
      type: Number,
      default: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
    },
    postsCount: {
      type: Number,
      default: 0,
    },
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
    pinnedPostId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
    },
    emailVerified: {
      type: Date,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ email: 1, username: 1 }, { unique: true });
userSchema.index({ createdAt: -1 });
userSchema.index({ userType: 1 });
userSchema.index({ botId: 1 });
userSchema.index({ resetPasswordExpires: 1 }, { expireAfterSeconds: 0 });

// Validation for bot users
userSchema.pre('validate', function (next) {
  if (this.userType === 'bot' && !this.botId) {
    return next(new Error('botId is required for bot users'));
  }
  next();
});

// Hash password before saving
userSchema.pre('save', async function (next) {
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

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Get enabled verification ways
userSchema.methods.getEnabledVerificationWays = function () {
  if (!this.superAccess || !this.superAccess.verificationWays) {
    return [];
  }
  const verificationWays = this.superAccess.verificationWays;
  return Object.keys(verificationWays).filter((key) => verificationWays[key]);
};

// Transform output
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    return ret;
  },
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);