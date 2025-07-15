import mongoose, { type Document, Schema } from "mongoose"

export interface IUser extends Document {
  _id: string
  email: string
  username: string
  displayName: string
  bio?: string
  website?: string
  location?: string
  avatarUrl?: string
  bannerUrl?: string
  isVerified: boolean
  followersCount: number
  followingCount: number
  postsCount: number
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    bio: { type: String, maxlength: 160 },
    website: { type: String },
    location: { type: String, maxlength: 30 },
    avatarUrl: { type: String },
    bannerUrl: { type: String },
    isVerified: { type: Boolean, default: false },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    postsCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
)

UserSchema.index({ email: 1 })
UserSchema.index({ username: 1 })

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema)
