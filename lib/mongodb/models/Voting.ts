import mongoose, { Schema, type Document, type Model } from "mongoose"

const VoteSchema = new Schema({
  postId: {
    type: String,
    required: true,
    ref: 'Post'
  },
  voteItems: [
    {
      title: {
        type: String,
        required: true
      },
      _html: {
        type: String,
        default: ""
      },
      votedNumber: {
        type: Number,
        default: 0
      },
      validate: {
        type: Date
      },
      voterList: [
        {
          type: String,
          ref: 'User'
        }
      ]
    }
  ]
}, {
  timestamps: true
})

// Static method to get all unique voter users for a vote
VoteSchema.statics.getAllVoterUsers = async function (voteId: string) {
  const voteDoc = await this.findById(voteId).populate('voteItems.voterList')
  if (!voteDoc) return []

  const users: any[] = []
  const userIds = new Set<string>()

  voteDoc.voteItems.forEach(item => {
    item.voterList.forEach((user: any) => {
      if (!userIds.has(user._id.toString())) {
        userIds.add(user._id.toString())
        users.push(user)
      }
    })
  })

  return users
}

// Interface for Vote Document
export interface IVote extends Document {
  postId: string
  voteItems: {
    title: string
    _html?: string
    votedNumber: number
    voterList: string[]
  }[]
}

// Interface for Vote Model with static method
interface IVoteModel extends Model<IVote> {
  getAllVoterUsers(voteId: string): Promise<any[]>
}

export default mongoose.models.Vote as IVoteModel || mongoose.model<IVote, IVoteModel>("Vote", VoteSchema)