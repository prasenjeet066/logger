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
PostHashtagSchema.pre("save", async function(next) {
  try {
    // Check if hashtag exists, create if it doesn't
    const existingHashtag = await Hashtag.findOne({ name: this.hashtagName })
    
    if (!existingHashtag) {
      await Hashtag.create({
        name: this.hashtagName,
        postsCount: 0
      })
      console.log(`Created new hashtag: ${this.hashtagName}`)
    }
    
    next()
  } catch (error) {
    console.error("Error in pre-save hook:", error)
    next(error)
  }
})

// After a new PostHashtag is created
PostHashtagSchema.post("save", async function(doc) {
  try {
    await Hashtag.findOneAndUpdate(
      { name: doc.hashtagName },
      { $inc: { postsCount: 1 } }
    )
  } catch (error) {
    console.error("Error incrementing hashtag postsCount:", error)
  }
})

// Handle deletions
PostHashtagSchema.post("remove", async function(doc) {
  try {
    await Hashtag.findOneAndUpdate(
      { name: doc.hashtagName },
      { $inc: { postsCount: -1 } }
    )
  } catch (error) {
    console.error("Error decrementing hashtag postsCount:", error)
  }
})

PostHashtagSchema.post("findOneAndDelete", async function(doc) {
  if (doc) {
    try {
      await Hashtag.findOneAndUpdate(
        { name: doc.hashtagName },
        { $inc: { postsCount: -1 } }
      )
    } catch (error) {
      console.error("Error decrementing hashtag postsCount:", error)
    }
  }
})

export const PostHashtag = mongoose.models.PostHashtag || mongoose.model<IPostHashtag>("PostHashtag", PostHashtagSchema)