import mongoose, { Document, Schema, Model, Types } from 'mongoose';

// 1. Define TypeScript interface
export interface ISuperUser extends Document {
  userId: Types.ObjectId; // references Users._id
  name: string;
  role: 'superadmin' | 'admin' | 'moderator';
  isActive: boolean;
  expireAt ? : Date; // optional field for expiration
  createdAt: Date;
  updatedAt: Date;
  fullInfo: string; // virtual field
}

// 2. Define Mongoose schema
const SuperUserSchema: Schema = new Schema < ISuperUser > (
{
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'moderator'],
    default: 'superadmin',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  expireAt: {
    type: Date,
  },
},
{
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// 3. Virtual field example
SuperUserSchema.virtual('fullInfo').get(function(this: ISuperUser) {
  return `${this.role}: ${this.userId.toString()}`;
});

// 4. Middleware: check expireAt and update isActive
SuperUserSchema.pre('save', function(this: ISuperUser, next) {
  if (this.expireAt && this.expireAt <= new Date()) {
    this.isActive = false;
  }
  next();
});

// Optionally, middleware to check on every findOne / find
SuperUserSchema.post('find', function(docs: ISuperUser[]) {
  docs.forEach((doc) => {
    if (doc.expireAt && doc.expireAt <= new Date() && doc.isActive) {
      doc.isActive = false;
      doc.save().catch(console.error);
    }
  });
});

SuperUserSchema.post('findOne', function(doc: ISuperUser | null) {
  if (doc && doc.expireAt && doc.expireAt <= new Date() && doc.isActive) {
    doc.isActive = false;
    doc.save().catch(console.error);
  }
});

// 5. Export model
export const SuperUser: Model < ISuperUser > =
  mongoose.models.SuperUser || mongoose.model < ISuperUser > ('SuperUser', SuperUserSchema);