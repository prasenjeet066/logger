import mongoose, { type Document, Schema } from "mongoose"

export interface INotification extends Document {
  userId: string
  type: "like" | "reply" | "follow" | "repost" | "mention"
  fromUserId: string
  postId?: string
  isRead: boolean
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true },
    type: { type: String, required: true, enum: ["like", "reply", "follow", "repost", "mention"] },
    fromUserId: { type: String, required: true },
    postId: { type: String },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
)

NotificationSchema.index({ userId: 1, createdAt: -1 })
NotificationSchema.index({ userId: 1, isRead: 1 })

export const Notification =
  mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema)
