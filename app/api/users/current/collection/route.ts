import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-config";
import { connectDB } from "@/lib/mongodb/connection";
import BookmarksModel from "@/lib/mongodb/models/Bookmarks"; // Fixed import name

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    await connectDB();
    const bookmarks = await BookmarksModel.find({ userId: session.user.id }).lean();
    return NextResponse.json(bookmarks ?? []);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch bookmarks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    if (!body.store || !Array.isArray(body.store)) {
      return NextResponse.json({ error: "Invalid store data" }, { status: 400 });
    }
    
    await connectDB();
    let bookmarkDoc = await BookmarksModel.findOne({ userId: session.user.id });
    
    if (bookmarkDoc) {
      const existingStores = bookmarkDoc.store ?? [];
      const newStores = body.store;
      const mergedStores = [...existingStores];
      
      newStores.forEach(newStore => {
        const index = mergedStores.findIndex(s => s.storeName === newStore.storeName);
        
        if (index === -1) {
          mergedStores.push(newStore);
        } else {
          // Merge _store arrays without duplicates
          const existingItems = mergedStores[index]._store || [];
          const itemsToAdd = newStore._store.filter(item => !existingItems.includes(item));
          mergedStores[index]._store = existingItems.concat(itemsToAdd);
        }
      });
      
      bookmarkDoc.store = mergedStores;
      await bookmarkDoc.save();
    } else {
      bookmarkDoc = await BookmarksModel.create({
        userId: session.user.id,
        store: body.store,
      });
    }
    
    return NextResponse.json(bookmarkDoc);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create/update bookmarks" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    
    await connectDB();
    const bookmarkDoc = await BookmarksModel.findOne({ userId: session.user.id });
    
    if (!bookmarkDoc) {
      return NextResponse.json({ error: "No bookmarks found" }, { status: 404 });
    }
    
    let updatedStores = bookmarkDoc.store ?? [];
    
    // Remove whole stores by name
    if (Array.isArray(body.removeStores)) {
      updatedStores = updatedStores.filter(s => !body.removeStores.includes(s.storeName));
    }
    
    // Remove specific items inside stores
    if (Array.isArray(body.removeItems)) {
      body.removeItems.forEach(({ storeName, items }) => {
        const storeIndex = updatedStores.findIndex(s => s.storeName === storeName);
        if (storeIndex !== -1 && Array.isArray(items)) {
          updatedStores[storeIndex]._store = updatedStores[storeIndex]._store.filter(
            item => !items.includes(item)
          );
        }
      });
    }
    
    // Rename stores by oldName -> newName
    if (Array.isArray(body.renameStores)) {
      body.renameStores.forEach(({ oldName, newName }) => {
        const storeIndex = updatedStores.findIndex(s => s.storeName === oldName);
        if (storeIndex !== -1) {
          updatedStores[storeIndex].storeName = newName;
        }
      });
    }
    
    bookmarkDoc.store = updatedStores;
    await bookmarkDoc.save();
    
    return NextResponse.json(bookmarkDoc);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update bookmarks" }, { status: 500 });
  }
}