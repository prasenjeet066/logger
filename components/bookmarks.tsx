'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Spinner from '@/components/Spinner'; // assuming you have this component
import PostCard from '@/components/PostCard'; // assuming you have this component

interface Store {
  storeName: string;
  _store: string[];
}

interface Bookmarks {
  userId: string;
  store: Store[] | null;
}

interface BookmarksProps {
  datas?: Bookmarks | null;
  user: any;
}

const Bookmarks = ({ datas, user }: BookmarksProps) => {
  const [bookmarks, setBookmarks] = useState<Bookmarks | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewCollectionForm, setShowNewCollectionForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [editingCollection, setEditingCollection] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [activeCollection, setActiveCollection] = useState<string | undefined>(undefined);
  const [posts, setPosts] = useState<any[]>([]);

  const router = useRouter();

  // Initialize bookmarks and activeCollection
  useEffect(() => {
    if (datas) {
      setBookmarks(datas);
      if (datas.store && datas.store.length > 0) {
        setActiveCollection(datas.store[0].storeName);
      } else {
        setActiveCollection(undefined);
      }
    }
  }, [datas]);

  // Load posts whenever activeCollection or bookmarks changes
  useEffect(() => {
    async function loadPosts() {
      if (!activeCollection || !bookmarks?.store) {
        setPosts([]);
        return;
      }

      const store = bookmarks.store.find(s => s.storeName === activeCollection);
      if (!store) {
        setPosts([]);
        return;
      }

      setIsLoading(true);
      try {
        const postDatas = await Promise.all(
          store._store.map(async (postId) => {
            const res = await fetch('/api/posts/' + postId);
            if (res.ok) {
              return await res.json();
            }
            return null;
          })
        );
        setPosts(postDatas.filter(Boolean));
      } catch (error) {
        console.error('Failed to fetch posts', error);
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadPosts();
  }, [activeCollection, bookmarks]);

  // Create new collection
  const handleNewCollection = async () => {
    if (!newCollectionName.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/users/current/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store: [{
            storeName: newCollectionName.trim(),
            _store: []
          }]
        }),
      });

      if (response.ok) {
        const updatedBookmarks = await response.json();
        setBookmarks(updatedBookmarks);
        setNewCollectionName('');
        setShowNewCollectionForm(false);
        setActiveCollection(newCollectionName.trim());
      } else {
        console.error('Failed to create collection');
      }
    } catch (error) {
      console.error('Error creating collection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete collection
  const handleDeleteCollection = async (storeName: string) => {
    if (!confirm(`Are you sure you want to delete "${storeName}" collection?`)) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/users/current/collection', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ removeStores: [storeName] }),
      });

      if (response.ok) {
        const updatedBookmarks = await response.json();
        setBookmarks(updatedBookmarks);
        // If deleted collection was active, reset activeCollection to first or undefined
        if (activeCollection === storeName) {
          if (updatedBookmarks.store && updatedBookmarks.store.length > 0) {
            setActiveCollection(updatedBookmarks.store[0].storeName);
          } else {
            setActiveCollection(undefined);
            setPosts([]);
          }
        }
      } else {
        console.error('Failed to delete collection');
      }
    } catch (error) {
      console.error('Error deleting collection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Rename collection
  const handleRenameCollection = async (oldName: string) => {
    if (!editingName.trim() || editingName.trim() === oldName) {
      setEditingCollection(null);
      setEditingName('');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/users/current/collection', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          renameStores: [{
            oldName,
            newName: editingName.trim()
          }]
        }),
      });

      if (response.ok) {
        const updatedBookmarks = await response.json();
        setBookmarks(updatedBookmarks);
        setEditingCollection(null);
        setEditingName('');
        // If renamed collection was active, update activeCollection state
        if (activeCollection === oldName) {
          setActiveCollection(editingName.trim());
        }
      } else {
        console.error('Failed to rename collection');
      }
    } catch (error) {
      console.error('Error renaming collection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove item from collection
  const handleRemoveItem = async (storeName: string, item: string) => {
    if (!confirm('Are you sure you want to remove this item?')) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/users/current/collection', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          removeItems: [{
            storeName,
            items: [item]
          }]
        }),
      });

      if (response.ok) {
        const updatedBookmarks = await response.json();
        setBookmarks(updatedBookmarks);
      } else {
        console.error('Failed to remove item');
      }
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditingCollection = (storeName: string) => {
    setEditingCollection(storeName);
    setEditingName(storeName);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-start items-center">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <X className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Saved Collections</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* New Collection Form */}
        {showNewCollectionForm && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-md font-medium mb-3">Create New Collection</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Collection name..."
                className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNewCollection();
                  if (e.key === 'Escape') {
                    setShowNewCollectionForm(false);
                    setNewCollectionName('');
                  }
                }}
                autoFocus
              />
              <Button onClick={handleNewCollection} disabled={isLoading || !newCollectionName.trim()}>
                Create
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowNewCollectionForm(false);
                  setNewCollectionName('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Collections Display */}
        {!bookmarks?.store || bookmarks.store.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-gray-400 mb-4">
              <Plus className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No collections yet</h3>
            <p className="text-gray-500 mb-4">Create your first collection to start saving bookmarks</p>
            <Button
              onClick={() => setShowNewCollectionForm(true)}
              className="bg-gray-800 text-white hover:bg-gray-700"
            >
              Create Collection
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mb-6">
            {bookmarks.store.map((store, index) => (
              <Button
                key={index}
                className={activeCollection === store.storeName ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-gray-800'}
                onClick={() => {
                  if (activeCollection !== store.storeName) {
                    setActiveCollection(store.storeName);
                  }
                }}
              >
                {editingCollection === store.storeName ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleRenameCollection(store.storeName)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRenameCollection(store.storeName);
                      }
                      if (e.key === 'Escape') {
                        setEditingCollection(null);
                        setEditingName('');
                      }
                    }}
                    autoFocus
                    className="px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ) : (
                  <span
                    onDoubleClick={() => startEditingCollection(store.storeName)}
                    className="cursor-pointer select-none"
                  >
                    {store.storeName}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCollection(store.storeName);
                  }}
                  title={`Delete collection ${store.storeName}`}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={() => setShowNewCollectionForm(true)}
              className="flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> New Collection
            </Button>
          </div>
        )}

        {/* Posts Display */}
        {isLoading ? (
          <div className="min-h-screen flex items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div>
            {posts.length === 0 && (
              <p className="text-center text-gray-500">No posts in this collection.</p>
            )}
            {posts.map((post) => (
              <div key={post._id} className="p-4 pt-2 border-b border-gray-200">
                {JSON.stringify(post)}
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-red-600"
                  onClick={() => handleRemoveItem(activeCollection!, post._id)}
                >
                  Remove from collection
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookmarks;