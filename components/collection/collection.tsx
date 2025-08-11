import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Plus, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/loader/spinner"

const Collection = {
  NewCollection: ({ open, onOpenChange , newCollectionName, setNewCollectionName,handleNewCollection,isLoading}) => {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Collection</DialogTitle>
          </DialogHeader>
          <div className =''>
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
          </div>
        </DialogContent>
      </Dialog>
    );
  }
};


export default Collection