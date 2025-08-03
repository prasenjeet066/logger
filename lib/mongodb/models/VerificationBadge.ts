import mongoose, { type Document, Schema } from 'mongoose';
import { User } from "@/lib/mongodb/models/User";

export interface IVerificationForm extends Document {
  _id: string;
  userId: string;
  currentStatus: 'pending' | 'rejected' | 'approved';
  isReviewed: boolean;
  reviewedBy: string | null;
  documentTypes: string[] | null;
  allDocuments: { name: string;fileUrl: string } [] | null;
  userMessage: string;
  _plan: string | null;
  requestPlan: string | null;
}

const VerificationFormSchema = new Schema < IVerificationForm > ({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  currentStatus: {
    type: String,
    enum: ["pending", "rejected", "approved"],
    default: "pending"
  },
  isReviewed: {
    type: Boolean,
    default: false
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: "User", // optional: if reviewer is also a user
    default: null
  },
  documentTypes: [{
    type: String,
    default: null
  }],
  allDocuments: [{
    name: { type: String },
    fileUrl: { type: String }
  }],
  userMessage: {
    type: String,
    maxlength: 160,
    default: ""
  },
  _plan: {
    type: String,
    default: null
  },
  requestPlan: {
    type: String,
    default: null
  }
});

// export
export const VerificationForm =
  mongoose.models.VerificationForm ||
  mongoose.model < IVerificationForm > ('VerificationForm', VerificationFormSchema);