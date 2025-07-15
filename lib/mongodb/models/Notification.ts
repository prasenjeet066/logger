import mongoose, { type Document, Schema } from "mongoose"

export interface INotification extends Document {
  _id: string
  userId: string
  fromUserId: string
  type: "like" | "follow" | "mention" | "reply" | "repost"
  postId?: string
  isRead: boolean
  createdAt: Date
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    fromUserId: {
      type: String,
      required: true,
      ref: "User",
    },
    type: {
      type: String,
      required: true,
      enum: ["like", "follow", "mention", "reply", "repost"],
    },
    postId: {
      type: String,
      ref: "Post",
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for performance
notificationSchema.index({ userId: 1, createdAt: -1 })
notificationSchema.index({ userId: 1, isRead: 1 })

export const Notification =
  mongoose.models.Notification || mongoose.model<INotification>("Notification", notificationSchema)

export default Notification
