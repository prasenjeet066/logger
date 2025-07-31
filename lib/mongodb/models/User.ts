import mongoose, { type Document, Schema } from "mongoose"
import bcrypt from "bcryptjs"

// Define interfaces for nested objects
interface IVerificationWays {
  emailOtp: boolean
  phoneOtp: boolean
  fingerPrint: boolean
}

interface ISuperAccess {
  role: 'admin' | 'context' | 'moderator'
  createdAt: Date | null
  expireAt: Date | null
  verificationWays: IVerificationWays
}

interface IObj2FA {
  waysVerify: Array<{
    name: string
  }>
}

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
  enable2FA?: boolean
  obj2FA: IObj2FA
  pinnedPostId?: string
  emailVerified?: Date
  resetPasswordToken?: string
  resetPasswordExpires?: Date
  superAccess?: ISuperAccess
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>
  getEnabledVerificationWays(): string[]
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(email: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        },
        message: 'Please provide a valid email address'
      }
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      validate: {
        validator: function(username: string) {
          return /^[a-zA-Z0-9_]+$/.test(username)
        },
        message: 'Username can only contain letters, numbers, and underscores'
      }
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'Display name cannot exceed 50 characters'],
    },
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters long'],
      validate: {
        validator: function(password: string) {
          // Only validate if password is being set
          if (!password) return true
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)
        },
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      }
    },
    avatarUrl: {
      type: String,
      default: null,
      validate: {
        validator: function(url: string) {
          if (!url) return true
          try {
            new URL(url)
            return true
          } catch {
            return false
          }
        },
        message: 'Please provide a valid URL for avatar'
      }
    },
    coverUrl: {
      type: String,
      default: null,
      validate: {
        validator: function(url: string) {
          if (!url) return true
          try {
            new URL(url)
            return true
          } catch {
            return false
          }
        },
        message: 'Please provide a valid URL for cover image'
      }
    },
    bio: {
      type: String,
      maxlength: [160, 'Bio cannot exceed 160 characters'],
      default: "",
    },
    location: {
      type: String,
      maxlength: [50, 'Location cannot exceed 50 characters'],
      default: "",
    },
    website: {
      type: String,
      maxlength: [100, 'Website URL cannot exceed 100 characters'],
      default: "",
      validate: {
        validator: function(url: string) {
          if (!url) return true
          try {
            new URL(url)
            return true
          } catch {
            return false
          }
        },
        message: 'Please provide a valid website URL'
      }
    },
    enable2FA: {
      type: Boolean,
      default: false
    },
    obj2FA: {
      waysVerify: [{
        name: {
          type: String,
          required: true
        },
      }],
      default: { waysVerify: [] }
    },
    pinnedPostId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      default: null
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    superAccess: {
      role: {
        type: String,
        enum: {
          values: ['admin', 'context', 'moderator'],
          message: 'Role must be either admin, context, or moderator'
        }
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
      },
      default: null
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
      min: [0, 'Followers count cannot be negative']
    },
    followingCount: {
      type: Number,
      default: 0,
      min: [0, 'Following count cannot be negative']
    },
    postsCount: {
      type: Number,
      default: 0,
      min: [0, 'Posts count cannot be negative']
    },
    userType: {
      type: String,
      enum: {
        values: ['human', 'bot'],
        message: 'User type must be either human or bot'
      },
      default: 'human',
    },
    botId: {
      type: Schema.Types.ObjectId,
      ref: 'Bot',
      default: null,
      validate: {
        validator: function(this: IUser, botId: string) {
          // If userType is 'bot', botId should be provided
          if (this.userType === 'bot' && !botId) {
            return false
          }
          // If userType is 'human', botId should be null
          if (this.userType === 'human' && botId) {
            return false
          }
          return true
        },
        message: 'Bot users must have a botId, human users must not have a botId'
      }
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
)

// Compound indexes for better query performance
userSchema.index({ email: 1, emailVerified: 1 })
userSchema.index({ username: 1, userType: 1 })
userSchema.index({ userType: 1, botId: 1 })
userSchema.index({ createdAt: -1, userType: 1 })
userSchema.index({ isVerified: 1, isPrivate: 1 })
userSchema.index({ resetPasswordToken: 1, resetPasswordExpires: 1 }, { sparse: true })

// Pre-save middleware for password hashing
userSchema.pre("save", async function(next) {
  if (!this.isModified("password") || !this.password) return next()
  
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error: any) {
    next(error)
  }
})

// Pre-save middleware for validation
userSchema.pre("save", function(next) {
  // Ensure bot users have botId and human users don't
  if (this.userType === 'bot' && !this.botId) {
    return next(new Error('Bot users must have a botId'))
  }
  if (this.userType === 'human' && this.botId) {
    return next(new Error('Human users cannot have a botId'))
  }
  
  // Ensure superAccess expiration is in the future
  if (this.superAccess?.expireAt && this.superAccess.expireAt <= new Date()) {
    return next(new Error('Super access expiration date must be in the future'))
  }
  
  next()
})

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false
  return bcrypt.compare(candidatePassword, this.password)
}

userSchema.methods.getEnabledVerificationWays = function(): string[] {
  const verificationWays =
    this.superAccess &&
    typeof this.superAccess === 'object' &&
    !Array.isArray(this.superAccess) &&
    this.superAccess.verificationWays &&
    typeof this.superAccess.verificationWays === 'object' ?
    this.superAccess.verificationWays : {}
  
  return Object.keys(verificationWays).filter(key => verificationWays[key as keyof IVerificationWays])
}

userSchema.methods.hasActiveSuperAccess = function(): boolean {
  if (!this.superAccess) return false
  if (!this.superAccess.expireAt) return true // No expiration means permanent access
  return this.superAccess.expireAt > new Date()
}

userSchema.methods.canResetPassword = function(): boolean {
  if (!this.resetPasswordToken || !this.resetPasswordExpires) return false
  return this.resetPasswordExpires > new Date()
}

// Virtual for full name or display identifier
userSchema.virtual('displayIdentifier').get(function() {
  return this.displayName || this.username
})

// Transform output to remove sensitive fields
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password
    delete ret.resetPasswordToken
    delete ret.resetPasswordExpires
    return ret
  },
})

// Transform output for public profiles (additional security)
userSchema.methods.toPublicJSON = function() {
  const user = this.toJSON()
  if (!this.showEmail) {
    delete user.email
  }
  // Remove super access info from public view
  delete user.superAccess
  delete user.obj2FA
  delete user.enable2FA
  return user
}

export const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema)