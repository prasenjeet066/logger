import mongoose, { type Document, Schema } from "mongoose"

export interface ILike extends Document {
  _id: string
  userId: string
  postId: string
  createdAt: Date
}

const likeSchema = new Schema<ILike>(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    postId: {
      type: String,
      required: true,
      ref: "Post",
    },
  },
  {
    timestamps: true,
  },
)

// Compound index to prevent duplicate likes and for performance
likeSchema.index({ userId: 1, postId: 1 }, { unique: true })
likeSchema.index({ postId: 1 })
likeSchema.index({ userId: 1 })

export const Like = mongoose.models.Like || mongoose.model<ILike>("Like", likeSchema)
