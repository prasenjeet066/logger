import mongoose, { type Document, Schema } from "mongoose"

export interface IPostHashtag extends Document {
  postId: string
  hashtagId: string
  createdAt: Date
}

const PostHashtagSchema = new Schema<IPostHashtag>(
  {
    postId: { type: String, required: true },
    hashtagId: { type: String, required: true },
  },
  {
    timestamps: true,
  },
)

PostHashtagSchema.index({ postId: 1, hashtagId: 1 }, { unique: true })
PostHashtagSchema.index({ hashtagId: 1 })

export const PostHashtag = mongoose.models.PostHashtag || mongoose.model<IPostHashtag>("PostHashtag", PostHashtagSchema)
