import mongoose, { type Document, Schema } from "mongoose"
import bcrypt from "bcryptjs"

export interface IVerification extends Document {
  _id: string
  conformBy:string
  letterIs:string
  selectedPlan:string
  statusIs?:'A' | 'P' | 'R' | 'C'
  createdAt: Date
  updatedAt: Date
}

const verificationSchema = new Schema<IVerification>(
  {
    conformBy:{
      type:String,
      required:true,
      ref:"User"
    },
    letterIs:{
      type:String,
      required:true,
      maxlength:280
    },
    selectedPlan:{
      type:string,
      required:false
    }
      
    ,
    statusIs:{
      type:string,
      enum:['P','R','A','C'],
      default:'P'
    }
    
  },
  {
    timestamps: true,
  },
)

// Only keep the index for createdAt, as email and username are implicitly indexed by unique: true
verificationSchema.index({ createdAt: -1 })

// Hash password before saving

// Compare password method

// Transform output


export const Verification= mongoose.models.User || mongoose.model<IVerification>("Verification", verificationSchema)

//export default 
