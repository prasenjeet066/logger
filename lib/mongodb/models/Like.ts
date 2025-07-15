import mongoose, { type Document, Schema } from "mongoose"

export interface ILike extends Document {
  userId: string
  postId: string
  createdAt: Date
}

const LikeSchema = new Schema<ILike>(
  {
    userId: { type: String, required: true },
    postId: { type: String, required: true },
  },
  {
    timestamps: true,
  },
)

LikeSchema.index({ userId: 1, postId: 1 }, { unique: true })
LikeSchema.index({ postId: 1 })

export const Like = mongoose.models.Like || mongoose.model<ILike>("Like", LikeSchema)
