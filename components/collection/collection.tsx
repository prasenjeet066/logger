import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Plus, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/loader/spinner";

interface NewCollectionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newCollectionName: string;
  setNewCollectionName: (name: string) => void;
  handleNewCollection: () => void;
  isLoading: boolean;
}

const Collection = {
  NewCollection: ({ 
    open, 
    onOpenChange, 
    newCollectionName, 
    setNewCollectionName, 
    handleNewCollection, 
    isLoading 
  }: NewCollectionProps) => {
    const handleCancel = () => {
      setNewCollectionName('');
      onOpenChange(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleNewCollection();
      }
      if (e.key === 'Escape') {
        handleCancel();
      }
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="collection-name" className="text-sm font-medium">
                Collection Name
              </label>
              <input
                id="collection-name"
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Enter collection name..."
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={handleKeyDown}
                autoFocus
                disabled={isLoading}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleNewCollection} 
                disabled={isLoading || !newCollectionName.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
};

export default Collection;