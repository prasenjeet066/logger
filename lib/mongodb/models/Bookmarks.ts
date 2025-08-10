import mongoose, { Document, Schema } from "mongoose";

interface Store {
  storeName: string;
  _store: string[];
}

export interface IBookmarks extends Document {
  userId: string;
  store: Store[] | null;
}

const BookmarksSchema = new Schema<IBookmarks>({
  userId: { type: String, required: true },
  store: [
    {
      storeName: { type: String, required: true },
      _store: { type: [String], required: true },
    },
  ],
});

export default mongoose.model<IBookmarks>("Bookmarks", BookmarksSchema);