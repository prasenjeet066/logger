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
  userId: string;
  store: Store[] | null;
}

export const revalidate = 60;

export default async function BookmarksPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/auth/sign-in");
  }
  
  try {
    await connectDB();
    
    const bookmarksList = await BookmarksModel.find({ userId: session.user.id }).lean();
    
    return <BookmarksComponent datas={bookmarksList ?? []} user = {session.user}/>;
    
    
  } catch (e) {
    console.error(e);
    return <div>Failed to load bookmarks.</div>;
  }
}