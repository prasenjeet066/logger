import mongoose, { type Document, Schema } from "mongoose"

export interface IHashtag extends Document {
  name: string
  postsCount: number
  createdAt: Date
  updatedAt: Date
}

const HashtagSchema = new Schema<IHashtag>(
  {
    name: { type: String, required: true, unique: true },
    postsCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
)

HashtagSchema.index({ name: 1 })
HashtagSchema.index({ postsCount: -1 })

export const Hashtag = mongoose.models.Hashtag || mongoose.model<IHashtag>("Hashtag", HashtagSchema)
