import React, { useState, useEffect } from 'react';
// Icons are used for a better user experience on the button
import { UserPlus, UserCheck, Loader2, X } from 'lucide-react';
import { MutualFollowers } from "@/components/profile/mutual-follow";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// The interface remains the same, which is great.
interface SuggestedUser {
  _id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  followersCount: number;
  isFollowing: boolean;
  isVerified: boolean; // This property was in your interface but not used. I've left it in.
}

interface SuggestedUsersProps {
  className ? : string;
}

// A more descriptive name for the skeleton item
const UserSkeleton = () => (
  <div className="flex flex-col items-center justify-center p-2 space-y-2">
    <div className="bg-gray-200 rounded-full h-20 w-20 animate-pulse"></div>
    <div className="bg-gray-200 h-4 w-20 rounded animate-pulse"></div>
    <div className="bg-gray-200 h-3 w-16 rounded animate-pulse"></div>
    <div className="bg-gray-200 h-9 w-24 rounded-full animate-pulse mt-1"></div>
  </div>
);


const SuggestedUsers: React.FC < SuggestedUsersProps > = ({ className = '' }) => {
  const [users, setUsers] = useState < SuggestedUser[] > ([]);
  const [loading, setLoading] = useState(true);
  // We only need one loading state to track which specific user's follow action is in progress.
  const [followingLoading, setFollowingLoading] = useState < Record < string, boolean >> ({});
  
  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      setLoading(true); // Set loading to true when starting the fetch
      try {
        const response = await fetch('/api/users/suggested');
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        } else {
          // Handle non-ok responses
          console.error('Failed to fetch suggested users');
          setUsers([]); // Clear users on failure
        }
      } catch (error) {
        console.error('Error fetching suggested users:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSuggestedUsers();
  }, []);
  
  // Generic handler for both follow and unfollow actions
  const handleToggleFollow = async (userId: string, action: 'follow' | 'unfollow') => {
    setFollowingLoading(prev => ({ ...prev, [userId]: true }));
    
    // --- Optimistic UI Update ---
    // We update the UI immediately for a snappier user experience.
    const originalUsers = [...users];
    setUsers(prevUsers =>
      prevUsers.map(user => {
        if (user._id === userId) {
          return {
            ...user,
            isFollowing: action === 'follow',
            followersCount: action === 'follow' ?
              user.followersCount + 1 : Math.max(0, user.followersCount - 1),
          };
        }
        return user;
      })
    );
    
    try {
      const response = await fetch(`/api/users/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        // If the API call fails, revert the state to its original form
        console.error(`Error ${action}ing user:`, await response.text());
        setUsers(originalUsers);
      }
    } catch (error) {
      // Also revert on network errors
      console.error(`Network error when ${action}ing user:`, error);
      setUsers(originalUsers);
    } finally {
      setFollowingLoading(prev => ({ ...prev, [userId]: false }));
    }
  };
  
  // Improved loading state with a skeleton loader for better UX
  if (loading) {
    return null;
  }
  
  // Improved empty state: show a message instead of rendering nothing
  if (users.length === 0) {
    return (
      <div className={`bg-white rounded-xl border-b border-gray-200 p-6 text-center ${className}`}>
        <h1 className='font-semibold text-gray-800'>No Suggestions</h1>
        <p className="text-sm text-gray-500 mt-2">Check back later for new people to follow!</p>
      </div>
    );
  }
  
  return (
    <div className={`bg-white rounded-xl border-b border-gray-200 overflow-hidden ${className}`}>
      <div className='flex flex-row items-center justify-between p-4'>
        <h1 className='font-semibold text-gray-700 text-sm'>Suggestions for you</h1>
      </div>
      {/* Use overflow-x-auto for horizontal scroll only when needed */}
      <div className='flex flex-row items-center gap-2 overflow-x-auto p-2 '>
        {users.map((user) => (
          // **CRITICAL FIX**: Added the `key` prop for list rendering.
          <div key={user._id} className='flex border flex-shrink-0 flex-col items-center rounded-lg justify-center p-3 w-40 text-center space-y-1'>
            <Avatar className="cursor-pointer h-16 w-16">
              <AvatarImage src={user.avatarUrl || undefined} alt={`${user.displayName}'s avatar`} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {user.displayName?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <h2 className='text-md font-semibold truncate w-full' title={user.displayName}>
              {user.displayName}
            </h2>
            <div className="h-4"> {/* Placeholder to prevent layout shift */}
              <MutualFollowers targetUsername={user.username}  type='center'/>
            </div>

            {/* --- DYNAMIC BUTTON LOGIC --- */}<div className='flex flex-row items-center justify-center'>
<button className=' rounded-full text-center bg-gray-800 text-white p-2 px-4'>
                <>
                  <UserPlus className="w-4 h-4 mr-1" /> Follow
                </>
            {"Add Follow"}
            </button>
            <button className=' rounded-full text-center bg-gray-100 text-gray-800 p-2'>
                <>
                  <X className="w-4 h-4" />
                  </>
                  </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestedUsers;