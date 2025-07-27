import { Types } from "mongoose"
import mongoose, { type Document, Schema } from "mongoose"
import { User } from "@/lib/mongodb/models/User"
export interface IBot extends Document {
  _id: string
  displayName: string
  dio: string
  username: string
  password: string
  email: string
  script: string
  shell: string
  type: string
  avatarUrl: string
  coverUrl: string
  followersCount: number
  followingCount: number
  postsCount: number
  ownerId: Types.ObjectId
  userId ? : Types.ObjectId // Reference to the auto-created user
  createdAt: Date
}

const BotSchema = new Schema < IBot > ({
  displayName: {
    type: String,
    required: true,
  },
  dio: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  script: {
    type: String,
    required: true,
  },
  shell: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
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
}, {
  timestamps: { createdAt: true, updatedAt: false }
})

// Pre-save middleware to auto-create user
BotSchema.pre("save", async function(next) {
  if (this.isNew) {
    try {
      // Create corresponding user account
      const botUser = new User({
        email: this.email,
        username: this.username,
        displayName: this.displayName,
        password: this.password, // Will be hashed by User schema pre-save
        avatarUrl: this.avatarUrl,
        coverUrl: this.coverUrl,
        bio: this.dio, // Use dio as bio
        userType: 'bot',
        followersCount: this.followersCount,
        followingCount: this.followingCount,
        postsCount: this.postsCount,
        isVerified: true, // Bots are auto-verified
        isPrivate: false, // Bots are public by default
        allowMessages: true,
        showEmail: false,
      })
      
      const savedUser = await botUser.save()
      
      // Set the userId reference
      this.userId = savedUser._id
      
      // Update the user with botId reference
      await User.findByIdAndUpdate(savedUser._id, { botId: this._id })
      
      next()
    } catch (error: any) {
      next(error)
    }
  } else {
    next()
  }
})

// Post-save middleware to update user reference after bot is saved
BotSchema.post("save", async function(doc) {
  if (doc.userId) {
    await User.findByIdAndUpdate(doc.userId, { botId: doc._id })
  }
})

// Pre-remove middleware to clean up associated user
BotSchema.pre("remove", async function(next) {
  try {
    if (this.userId) {
      await User.findByIdAndDelete(this.userId)
    }
    next()
  } catch (error: any) {
    next(error)
  }
})

export const Bot = mongoose.models.Bot || mongoose.model < IBot > ("Bot", BotSchema)

// Service functions for bot creation
export class BotService {
  static async createBot(botData: Partial < IBot > ) {
    const session = await mongoose.startSession()
    session.startTransaction()
    
    try {
      // Create the bot (this will trigger the pre-save middleware)
      const bot = new Bot(botData)
      const savedBot = await bot.save({ session })
      
      await session.commitTransaction()
      return savedBot
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }
  
  static async deleteBot(botId: string) {
    const session = await mongoose.startSession()
    session.startTransaction()
    
    try {
      const bot = await Bot.findById(botId).session(session)
      if (!bot) {
        throw new Error('Bot not found')
      }
      
      // Delete associated user first
      if (bot.userId) {
        await User.findByIdAndDelete(bot.userId).session(session)
      }
      
      // Delete the bot
      await Bot.findByIdAndDelete(botId).session(session)
      
      await session.commitTransaction()
      return { success: true }
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }
  
  static async getBotWithUser(botId: string) {
    return Bot.findById(botId).populate('userId', '-password -resetPasswordToken -resetPasswordExpires')
  }
  
  static async getAllBots() {
    return Bot.find().populate('userId', '-password -resetPasswordToken -resetPasswordExpires')
  }
}

// Usage example:
/*
const newBot = await BotService.createBot({
  displayName: "AI Assistant",
  dio: "I'm an AI assistant bot",
  username: "ai_assistant",
  password: "securepassword123",
  email: "ai@example.com",
  script: "console.log('Hello World')",
  shell: "/bin/bash",
  type: "assistant",
  ownerId: new mongoose.Types.ObjectId("..."), // Owner's user ID
})
*/