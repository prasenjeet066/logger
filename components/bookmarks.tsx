'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus, Trash2, Edit2, ExternalLink } from 'lucide-react';

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

interface Button {
  variant?: 'ghost' | 'default';
  size?: 'icon' | 'sm' | 'default';
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

const Button = ({ variant = 'default', size = 'default', onClick, className = '', children }: Button) => {
  const baseClass = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';
  const variantClass = variant === 'ghost' ? 'hover:bg-accent hover:text-accent-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90';
  const sizeClass = size === 'icon' ? 'h-10 w-10' : size === 'sm' ? 'h-9 px-3' : 'h-10 px-4 py-2';
  
  return (
    <button 
      className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

const Bookmarks = ({ datas, user }: BookmarksProps) => {
  const [bookmarks, setBookmarks] = useState<Bookmarks | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewCollectionForm, setShowNewCollectionForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [editingCollection, setEditingCollection] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (datas) {
      setBookmarks(datas);
    }
  }, [datas]);

  const handleNewCollection = async () => {
    if (!newCollectionName.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/users/current/collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      } else {
        console.error('Failed to create collection');
      }
    } catch (error) {
      console.error('Error creating collection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCollection = async (storeName: string) => {
    if (!confirm(`Are you sure you want to delete "${storeName}" collection?`)) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/users/current/collection', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          removeStores: [storeName]
        }),
      });

      if (response.ok) {
        const updatedBookmarks = await response.json();
        setBookmarks(updatedBookmarks);
      } else {
        console.error('Failed to delete collection');
      }
    } catch (error) {
      console.error('Error deleting collection:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
        headers: {
          'Content-Type': 'application/json',
        },
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
      } else {
        console.error('Failed to rename collection');
      }
    } catch (error) {
      console.error('Error renaming collection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveItem = async (storeName: string, item: string) => {
    if (!confirm('Are you sure you want to remove this item?')) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/users/current/collection', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
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
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <X className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Saved Collections</h1>
          </div>
          <Button 
            size="sm" 
            onClick={() => setShowNewCollectionForm(true)}
            className="bg-gray-800 text-white hover:bg-gray-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Collection
          </Button>
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
          <div className="space-y-4">
            {bookmarks.store.map((store, index) => (
              <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  {editingCollection === store.storeName ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameCollection(store.storeName);
                          if (e.key === 'Escape') {
                            setEditingCollection(null);
                            setEditingName('');
                          }
                        }}
                        autoFocus
                      />
                      <Button size="sm" onClick={() => handleRenameCollection(store.storeName)}>
                        Save
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setEditingCollection(null);
                          setEditingName('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {store.storeName}
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          ({store._store.length} items)
                        </span>
                      </h3>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => startEditingCollection(store.storeName)}
                          className="h-8 w-8"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteCollection(store.storeName)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {store._store.length === 0 ? (
                  <p className="text-gray-500 text-sm">No bookmarks in this collection yet</p>
                ) : (
                  <div className="space-y-2">
                    {store._store.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-700 truncate">{item}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemoveItem(store.storeName, item)}
                          className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
              <span>Loading...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookmarks;