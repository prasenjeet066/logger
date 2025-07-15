import mongoose, { type Document, Schema } from "mongoose"

export interface IFollow extends Document {
  _id: string
  followerId: string
  followingId: string
  createdAt: Date
}

const followSchema = new Schema<IFollow>(
  {
    followerId: {
      type: String,
      required: true,
      ref: "User",
    },
    followingId: {
      type: String,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
)

// Compound index to prevent duplicate follows and for performance
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true })
followSchema.index({ followerId: 1 })
followSchema.index({ followingId: 1 })

export const Follow = mongoose.models.Follow || mongoose.model<IFollow>("Follow", followSchema)
