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

// Pre-save hook - নতুন PostHashtag তৈরির সময়
PostHashtagSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      // প্রথমে চেক করুন হ্যাশট্যাগ আছে কিনা
      const existingHashtag = await Hashtag.findOne({ name: this.hashtagName })
      
      if (existingHashtag) {
        // যদি হ্যাশট্যাগ থাকে, শুধু কাউন্ট বাড়ান
        await Hashtag.findOneAndUpdate(
          { name: this.hashtagName },
          { $inc: { postsCount: 1 } }
        )
      } else {
        // যদি হ্যাশট্যাগ না থাকে, নতুন তৈরি করুন
        await Hashtag.create({
          name: this.hashtagName,
          postsCount: 1
        })
      }
    } catch (error) {
      return next(error)
    }
  }
  next()
})

// Post-remove hook - PostHashtag ডিলিট করার সময়
PostHashtagSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    try {
      const hashtag = await Hashtag.findOne({ name: doc.hashtagName })
      if (hashtag) {
        if (hashtag.postsCount <= 1) {
          // যদি এটি শেষ পোস্ট হয়, হ্যাশট্যাগ ডিলিট করুন
          await Hashtag.findOneAndDelete({ name: doc.hashtagName })
        } else {
          // পোস্ট কাউন্ট কমান
          await Hashtag.findOneAndUpdate(
            { name: doc.hashtagName },
            { $inc: { postsCount: -1 } }
          )
        }
      }
    } catch (error) {
      console.error('Error updating hashtag count after deletion:', error)
    }
  }
})

// Post-deleteOne hook - deleteOne method এর জন্য
PostHashtagSchema.post('deleteOne', async function() {
  const conditions = this.getFilter()
  try {
    const doc = await PostHashtag.findOne(conditions)
    if (doc) {
      const hashtag = await Hashtag.findOne({ name: doc.hashtagName })
      if (hashtag) {
        if (hashtag.postsCount <= 1) {
          await Hashtag.findOneAndDelete({ name: doc.hashtagName })
        } else {
          await Hashtag.findOneAndUpdate(
            { name: doc.hashtagName },
            { $inc: { postsCount: -1 } }
          )
        }
      }
    }
  } catch (error) {
    console.error('Error updating hashtag count after deleteOne:', error)
  }
})

// Post-deleteMany hook - deleteMany method এর জন্য
PostHashtagSchema.post('deleteMany', async function() {
  const conditions = this.getFilter()
  try {
    // যে সব PostHashtag ডিলিট হয়েছে তাদের hashtagName গুলো খুঁজে বের করুন
    const deletedDocs = await PostHashtag.find(conditions)
    
    // প্রতিটি হ্যাশট্যাগের জন্য কাউন্ট আপডেট করুন
    for (const doc of deletedDocs) {
      const hashtag = await Hashtag.findOne({ name: doc.hashtagName })
      if (hashtag) {
        const remainingCount = await PostHashtag.countDocuments({ 
          hashtagName: doc.hashtagName,
          _id: { $ne: doc._id }
        })
        
        if (remainingCount === 0) {
          await Hashtag.findOneAndDelete({ name: doc.hashtagName })
        } else {
          await Hashtag.findOneAndUpdate(
            { name: doc.hashtagName },
            { postsCount: remainingCount }
          )
        }
      }
    }
  } catch (error) {
    console.error('Error updating hashtag counts after deleteMany:', error)
  }
})

// Static method - ম্যানুয়াল sync এর জন্য
PostHashtagSchema.statics.syncHashtagCounts = async function() {
  try {
    const pipeline = [
      {
        $group: {
          _id: '$hashtagName',
          count: { $sum: 1 }
        }
      }
    ]
    
    const counts = await this.aggregate(pipeline)
    
    // সব হ্যাশট্যাগ রিসেট করুন
    await Hashtag.deleteMany({})
    
    // নতুন কাউন্ট দিয়ে হ্যাশট্যাগ তৈরি করুন
    const hashtagsToInsert = counts.map(item => ({
      name: item._id,
      postsCount: item.count
    }))
    
    if (hashtagsToInsert.length > 0) {
      await Hashtag.insertMany(hashtagsToInsert)
    }
    
    return { synced: hashtagsToInsert.length }
  } catch (error) {
    console.error('Error syncing hashtag counts:', error)
    throw error
  }
}

export const PostHashtag = mongoose.models.PostHashtag || mongoose.model<IPostHashtag>("PostHashtag", PostHashtagSchema)