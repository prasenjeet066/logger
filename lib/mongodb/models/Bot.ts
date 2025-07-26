import mongoose, { type Document, Schema, Types } from "mongoose"

export interface IBot extends Document {
  _id: string
  displayName: string
  dio: string
  username: string
  password: string
  email: string
  script: string
  shell: string
  type: string
  avatarUrl: string 
  coverUrl: string 
  followersCount : number
  followingCount : number
  postsCount : number
  ownerId: Types.ObjectId // use ObjectId type
  createdAt: Date
}

const BotSchema = new Schema < IBot > ({
  displayName: {
    type: String,
    required: true,
  },
  dio: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  script: {
    type: String,
    required: true,
  },
  shell: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  avatarUrl: {
    type: String,
    default: null,
  },
  coverUrl: {
    type: String,
    default: null,
  },
  followersCount: {
    type: Number,
    default: 0,
  },
  followingCount: {
    type: Number,
    default: 0,
  },
  postsCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: { createdAt: true, updatedAt: false }
})

export default mongoose.models.Bot || mongoose.model < IBot > ("Bot", BotSchema)