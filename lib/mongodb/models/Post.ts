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
  watch: number
  isPinned: boolean
  processed: boolean
  reviewResults?: any
  visibility: "public" | "private" | "f-private"
  restrictions?: any
  imageNSFW?: any
  watchedBy: string[]
  createdAt: Date
  updatedAt: Date
}

const postSchema = new Schema<IPost>(
  {
    content: {
      type: String,
      required: true,
      maxlength: 380, // Updated to match your frontend limit
      trim: true
    },
    authorId: {
      type: String,
      required: true,
      ref: "User",
    },
    mediaUrls: {
      type: [String],
      default: []
    },
    mediaType: {
      type: String,
      enum: ["image", "video", "gif"],
      default: null,
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0
    },
    repostsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    repliesCount: {
      type: Number,
      default: 0,
      min: 0
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
    hashtags: {
      type: [String],
      default: []
    },
    mentions: {
      type: [String],
      default: []
    },
    processed: {
      type: Boolean,
      default: false
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    watch: {
      type: Number,
      default: 0,
      required: true,
      min: 0
    },
    reviewResults: {
      type: Schema.Types.Mixed,
      default: null
    },
    visibility: {
      type: String,
      enum: ["public", "private", "f-private"],
      default: "public"
    },
    restrictions: {
      type: Schema.Types.Mixed,
      default: null
    },
    imageNSFW: {
      type: Schema.Types.Mixed,
      default: null
    },
    watchedBy: {
      type: [String],
      ref: "User",
      default: []
    }
  },
  {
    timestamps: true,
  }
)

// Indexes for performance
postSchema.index({ authorId: 1, createdAt: -1 })
postSchema.index({ createdAt: -1 })
postSchema.index({ hashtags: 1 })
postSchema.index({ mentions: 1 })
postSchema.index({ originalPostId: 1 })
postSchema.index({ parentPostId: 1 })
postSchema.index({ visibility: 1 })

// Static method for getting watch count
postSchema.statics.getWatchByPostId = async function(postId: string): Promise<number | null> {
  const post = await this.findById(postId).select("watch").lean()
  return post ? post.watch : null
}

// Pre-save middleware to validate data
postSchema.pre('save', function(next) {
  // Ensure arrays are properly initialized
  if (!this.hashtags) this.hashtags = []
  if (!this.mentions) this.mentions = []
  if (!this.mediaUrls) this.mediaUrls = []
  if (!this.watchedBy) this.watchedBy = []
  
  // Validate content
  if (!this.content || this.content.trim().length === 0) {
    next(new Error('Content is required'))
    return
  }
  
  // Validate authorId
  if (!this.authorId) {
    next(new Error('Author ID is required'))
    return
  }
  
  next()
})

export const Post = mongoose.models.Post || mongoose.model<IPost>("Post", postSchema)