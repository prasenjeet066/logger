import mongoose, { type Document, Schema } from "mongoose"
import { User } from "./User"

export interface IVerification extends Document {
  _id: string
  conformBy: string
  letterIs: string
  selectedPlan: string
  statusIs: 'A' | 'P' | 'R' | 'C'
  createdAt: Date
  updatedAt: Date
}

const verificationSchema = new Schema<IVerification>(
  {
    userId :{
      type: String,
      required:true,
      ref:"User"
    },
    conformBy: {
      type: String,
      required: true,
     // ref: "User"
    },
    letterIs: {
      type: String,
      required: true,
      maxlength: 280
    },
    selectedPlan: {
      type: String,
      required: false
    },
    statusIs: {
      type: String,
      enum: ['P', 'R', 'A', 'C'],
      default: 'P'
    }
  },
  {
    timestamps: true,
  }
)

// Index for createdAt for efficient queries
verificationSchema.index({ createdAt: -1 })

// Middleware to handle user verification status update
verificationSchema.pre('save', async function(next) {
  // Only run this middleware if statusIs field is modified
  if (this.isModified('statusIs')) {
    try {
      if (this.statusIs === 'A') {
        // Update user's verification status
        await User.findByIdAndUpdate(
          this.conformBy,
          { isVerified: true },
          { new: true }
        )
      }
      next()
    } catch (error) {
      next(error as Error)
    }
  } else {
    next()
  }
})

// Clean up hook when verification is deleted
verificationSchema.pre('deleteOne', { document: true }, async function(next) {
  try {
    // If the verification was approved, revert user's verification status
    if (this.statusIs === 'A') {
      await User.findByIdAndUpdate(
        this.conformBy,
        { isVerified: false }
      )
    }
    next()
  } catch (error) {
    next(error as Error)
  }
})

export const Verification = mongoose.models.Verification || mongoose.model<IVerification>("Verification", verificationSchema)