import mongoose, { type Document, Schema } from "mongoose"
import { Hashtag } from "@/lib/mongodb/models/Hashtag"

export interface IPostHashtag extends Document {
  postId: string
  hashtagName: string
  createdAt: Date
  updatedAt: Date
}

const PostHashtagSchema = new Schema<IPostHashtag>(
  {
    postId: { type: String, required: true, ref: "Post" },
    hashtagName: { type: String, required: true },
  },
  {
    timestamps: true,
  }
)

PostHashtagSchema.index({ postId: 1, hashtagName: 1 }, { unique: true })
PostHashtagSchema.index({ hashtagName: 1 })

// Pre-save hook to ensure hashtag exists
export const PostHashtag = mongoose.models.PostHashtag || mongoose.model<IPostHashtag>("PostHashtag", PostHashtagSchema)