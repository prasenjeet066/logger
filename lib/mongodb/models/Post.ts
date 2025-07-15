import mongoose, { type Document, Schema } from "mongoose"

export interface IPost extends Document {
  _id: string
  content: string
  authorId: string
  replyToId?: string
  mediaUrls?: string[]
  mediaType?: "image" | "video" | "gif"
  likesCount: number
  repliesCount: number
  repostsCount: number
  viewsCount: number
  isPinned: boolean
  createdAt: Date
  updatedAt: Date
}

const PostSchema = new Schema<IPost>(
  {
    content: { type: String, required: true, maxlength: 280 },
    authorId: { type: String, required: true },
    replyToId: { type: String },
    mediaUrls: [{ type: String }],
    mediaType: { type: String, enum: ["image", "video", "gif"] },
    likesCount: { type: Number, default: 0 },
    repliesCount: { type: Number, default: 0 },
    repostsCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
)

PostSchema.index({ authorId: 1, createdAt: -1 })
PostSchema.index({ replyToId: 1 })
PostSchema.index({ createdAt: -1 })

export const Post = mongoose.models.Post || mongoose.model<IPost>("Post", PostSchema)
