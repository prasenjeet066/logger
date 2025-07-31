import mongoose, { type Document, Schema } from "mongoose"
import bcrypt from "bcryptjs"

// --- Sub-schemas ---
const WaysVerifySchema = new Schema(
  {
    name: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const Obj2FASchema = new Schema(
  {
    waysVerify: {
      type: [WaysVerifySchema],
      default: []
    }
  },
  { _id: false }
);

// --- Interface ---
export interface IUser extends Document {
  _id: string
  email: string
  username: string
  displayName: string
  password?: string
  avatarUrl?: string
  coverUrl?: string
  bio?: string
  location?: string
  website?: string
  isVerified: boolean
  isPrivate: boolean
  allowMessages: boolean
  showEmail: boolean
  followersCount: number
  followingCount: number
  postsCount: number
  userType: 'human' | 'bot'
  botId?: string
  createdAt: Date
  updatedAt: Date
  pinnedPostId: string
  emailVerified?: Date
  resetPasswordToken?: string
  resetPasswordExpires?: Date
  enable2FA?: boolean
  obj2FA: {
    waysVerify: {
      name: string
    }[]
  }
  superAccess?: {
    role?: 'admin' | 'context' | 'moderator'
    createdAt?: Date | null
    expireAt?: Date | null
    verificationWays?: {
      emailOtp?: boolean
      phoneOtp?: boolean
      fingerPrint?: boolean
    }
  }
  comparePassword(candidatePassword: string): Promise<boolean>
  getEnabledVerificationWays(): string[]
  addVerificationWay(name: string): Promise<void>
  hasVerificationWay(name: string): boolean
  removeVerificationWay(name: string): Promise<void>
}

// --- Main schema ---
const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    password: {
      type: String,
      minlength: 8
    },
    avatarUrl: {
      type: String,
      default: null
    },
    coverUrl: {
      type: String,
      default: null
    },
    bio: {
      type: String,
      maxlength: 160,
      default: ""
    },
    location: {
      type: String,
      maxlength: 50,
      default: ""
    },
    website: {
      type: String,
      maxlength: 100,
      default: ""
    },
    enable2FA: {
      type: Boolean,
      default: false
    },
    obj2FA: {
      type: Obj2FASchema,
      default: () => ({ waysVerify: [] })
    },
    pinnedPostId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      default: null
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    superAccess: {
      role: {
        type: String,
        enum: ['admin', 'context', 'moderator']
      },
      createdAt: {
        type: Date,
        default: null
      },
      expireAt: {
        type: Date,
        default: null
      },
      verificationWays: {
        emailOtp: {
          type: Boolean,
          default: false
        },
        phoneOtp: {
          type: Boolean,
          default: false
        },
        fingerPrint: {
          type: Boolean,
          default: false
        }
      }
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    allowMessages: {
      type: Boolean,
      default: true
    },
    showEmail: {
      type: Boolean,
      default: false
    },
    followersCount: {
      type: Number,
      default: 0
    },
    followingCount: {
      type: Number,
      default: 0
    },
    postsCount: {
      type: Number,
      default: 0
    },
    userType: {
      type: String,
      enum: ['human', 'bot'],
      default: 'human'
    },
    botId: {
      type: Schema.Types.ObjectId,
      ref: 'Bot',
      default: null
    },
    emailVerified: {
      type: Date,
      default: null
    },
    resetPasswordToken: {
      type: String,
      default: null
    },
    resetPasswordExpires: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// --- Indexes ---
userSchema.index({ createdAt: -1 });
userSchema.index({ userType: 1 });
userSchema.index({ botId: 1 });

// --- Middleware: hash password ---
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// --- Methods ---
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getEnabledVerificationWays = function (): string[] {
  const verificationWays =
    this.superAccess &&
    typeof this.superAccess === 'object' &&
    !Array.isArray(this.superAccess) &&
    this.superAccess.verificationWays &&
    typeof this.superAccess.verificationWays === 'object'
      ? this.superAccess.verificationWays
      : {};

  return Object.keys(verificationWays).filter(key => verificationWays[key]);
};

userSchema.methods.addVerificationWay = async function (name: string): Promise<void> {
  if (!this.obj2FA) {
    this.obj2FA = { waysVerify: [] };
  }
  const exists = this.obj2FA.waysVerify.some((way: { name: string }) => way.name === name);
  if (!exists) {
    this.obj2FA.waysVerify.push({ name });
    await this.save();
  }
};

userSchema.methods.hasVerificationWay = function (name: string): boolean {
  if (!this.obj2FA || !Array.isArray(this.obj2FA.waysVerify)) return false;
  return this.obj2FA.waysVerify.some((way: { name: string }) => way.name === name);
};

userSchema.methods.removeVerificationWay = async function (name: string): Promise<void> {
  if (!this.obj2FA || !Array.isArray(this.obj2FA.waysVerify)) return;
  this.obj2FA.waysVerify = this.obj2FA.waysVerify.filter((way: { name: string }) => way.name !== name);
  await this.save();
};

// --- Transform output ---
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    return ret;
  }
});

// --- Export model ---
export const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);