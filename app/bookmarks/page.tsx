import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/mongodb/connection";
import BookmarksModel from "@/lib/mongodb/models/Bookmarks";
import { authOptions } from "@/lib/auth/auth-config";
import BookmarksComponent from '@/components/bookmarks';

interface Store {
  storeName: string;
  _store: string[];
}

interface Bookmarks {
  _id?: string;
  userId: string;
  store: Store[] | null;
}

export const revalidate = 60;

export default async function BookmarksPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/auth/sign-in");
  }
  
  try {
    await connectDB();
    
    // Find single bookmark document for the user
    const bookmarksData = await BookmarksModel.findOne({ userId: session.user.id }).lean();
    
    return <BookmarksComponent datas={bookmarksData} user={session.user} />;
    
  } catch (e) {
    console.error("BookmarksPage error:", e);
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Failed to load bookmarks</h2>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
}