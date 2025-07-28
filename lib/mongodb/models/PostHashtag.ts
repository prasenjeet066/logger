import mongoose, { type Document, Schema } from "mongoose"
import { Hashtag } from "@/lib/mongodb/models/Hashtag";

export interface IPostHashtag extends Document {
  postId: string
  hashtagId: string
  createdAt: Date
}

const PostHashtagSchema = new Schema < IPostHashtag > (
{
  postId: { type: String, required: true, ref: "Post" },
  hashtagId: { type: String, required: true },
},
{
  timestamps: true,
}, )

PostHashtagSchema.index({ postId: 1, hashtagId: 1 }, { unique: true })
PostHashtagSchema.index({ hashtagId: 1 })
// adjust the import path if needed

// After a new PostHashtag is created
PostHashtagSchema.post("save", async function(doc) {
  try {
    await Hashtag.findOneAndUpdate({ name: doc.hashtagId },
    {
      $inc: { postsCount: 1 },
      $setOnInsert: { createdAt: new Date(), updatedAt: new Date() }
    }, { upsert: true, new: true });
  } catch (error) {
    console.error("Error incrementing hashtag postsCount:", error);
  }
});

// After a PostHashtag is removed
PostHashtagSchema.post("remove", async function(doc) {
  try {
    await Hashtag.findOneAndUpdate({ name: doc.hashtagId }, { $inc: { postsCount: -1 } });
  } catch (error) {
    console.error("Error decrementing hashtag postsCount:", error);
  }
});
export const PostHashtag = mongoose.models.PostHashtag || mongoose.model < IPostHashtag > ("PostHashtag", PostHashtagSchema)