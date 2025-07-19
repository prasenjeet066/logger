import mongoose, { type Document, Schema } from "mongoose"

export interface IPost extends Document {
  _id: string
  content: string
  authorId: string
  mediaUrls?: string[]
  mediaType?: "image" | "video" | "gif" 
  likesCount: number
  repostsCount: number
  repliesCount: number
  isRepost: boolean
  originalPostId?: string
  parentPostId?: string
  hashtags: string[]
  mentions: string[]
  isPinned: boolean
  createdAt: Date
  updatedAt: Date
}

const postSchema = new Schema<IPost>(
  {
    content: {
      type: String,
      required: true,
      maxlength: 280,
    },
    authorId: {
      type: String,
      required: true,
      ref: "User",
    },
    mediaUrls: [
      {
        type: String,
      },
    ],
    mediaType: {
      type: String,
      enum: ["image", "video", "gif"],
      default: null,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    repostsCount: {
      type: Number,
      default: 0,
    },
    repliesCount: {
      type: Number,
      default: 0,
    },
    isRepost: {
      type: Boolean,
      default: false,
    },
    originalPostId: {
      type: String,
      ref: "Post",
      default: null,
    },
    parentPostId: {
      type: String,
      ref: "Post",
      default: null,
    },
    hashtags: [
      {
        type: String,
      },
    ],
    mentions: [
      {
        type: String,
      },
    ],
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for performance
postSchema.index({ authorId: 1, createdAt: -1 })
postSchema.index({ createdAt: -1 })
postSchema.index({ hashtags: 1 })
postSchema.index({ mentions: 1 })
postSchema.index({ originalPostId: 1 })
postSchema.index({ parentPostId: 1 })

export const Post = mongoose.models.Post || mongoose.model<IPost>("Post", postSchema)
