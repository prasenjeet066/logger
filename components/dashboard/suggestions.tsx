import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck, Loader2, X } from 'lucide-react';
import { MutualFollowers } from "@/components/profile/mutual-follow";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SuggestedUser {
  _id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  followersCount: number;
  isFollowing: boolean;
  isVerified: boolean;
}

interface SuggestedUsersProps {
  className ? : string;
}

const UserSkeleton = () => (
  <div className="flex flex-col items-center justify-center p-3 space-y-2 min-w-[120px]">
    <div className="bg-gray-200 rounded-full h-10 w-10 animate-pulse"></div>
    <div className="bg-gray-200 h-4 w-20 rounded animate-pulse"></div>
    <div className="bg-gray-200 h-3 w-16 rounded animate-pulse"></div>
    <div className="bg-gray-200 h-8 w-20 rounded-full animate-pulse mt-2"></div>
  </div>
);

const SuggestedUsers: React.FC < SuggestedUsersProps > = ({ className = '' }) => {
  const [users, setUsers] = useState < SuggestedUser[] > ([]);
  const [loading, setLoading] = useState(true);
  const [followingLoading, setFollowingLoading] = useState < Record < string, boolean >> ({});
  
  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/users/suggested');
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        } else {
          console.error('Failed to fetch suggested users');
          setUsers([]);
        }
      } catch (error) {
        console.error('Error fetching suggested users:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSuggestedUsers();
  }, []);
  
  const handleToggleFollow = async (userId: string, action: 'follow' | 'unfollow') => {
    setFollowingLoading(prev => ({ ...prev, [userId]: true }));
    
    // Optimistic UI Update
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
        console.error(`Error ${action}ing user:`, await response.text());
        setUsers(originalUsers);
      }
    } catch (error) {
      console.error(`Network error when ${action}ing user:`, error);
      setUsers(originalUsers);
    } finally {
      setFollowingLoading(prev => ({ ...prev, [userId]: false }));
    }
  };
  
  const handleDismissUser = (userId: string) => {
    setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
  };
  
  if (loading) {
    return (
      <div className={`bg-white rounded-xl w-full border border-gray-200 overflow-hidden ${className}`}>
        <div className='flex flex-row items-center justify-between p-4'>
          <h1 className='font-semibold text-gray-700 text-sm'>Suggestions for you</h1>
        </div>
        <div className='flex w-full flex-row items-center gap-2 overflow-x-auto p-2'>
          {Array.from({ length: 3 }).map((_, index) => (
            <UserSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }
  
  if (users.length === 0) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 text-center ${className}`}>
        <h1 className='font-semibold text-gray-800'>No Suggestions</h1>
        <p className="text-sm text-gray-500 mt-2">Check back later for new people to follow!</p>
      </div>
    );
  }
  
  return (
    <div className={`bg-white rounded-xl w-full border border-gray-200 overflow-hidden ${className}`}>
      <div className='flex flex-row items-center justify-between p-4'>
        <h1 className='font-semibold text-gray-700 text-sm'>Suggestions for you</h1>
      </div>
      
      <div className='flex w-full flex-row items-center gap-2 overflow-x-auto p-2 scrollbar-hide'>
        {users.map((user) => (
          <div 
            key={user._id} 
            className='min-w-[140px] flex border border-gray-100 flex-shrink-0 flex-col items-center rounded-lg justify-center p-3 text-center space-y-2 hover:border-gray-200 transition-colors'
          >
            {/* Dismiss button */}
            <div className="w-full flex justify-end">
              <button
                onClick={() => handleDismissUser(user._id)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 -mt-1 -mr-1"
                aria-label="Dismiss suggestion"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Avatar */}
            <Avatar className="cursor-pointer h-12 w-12 -mt-2">
              <AvatarImage 
                src={user.avatarUrl || undefined} 
                alt={`${user.displayName}'s avatar`} 
              />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                {user.displayName?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>

            {/* User info */}
            <div className="space-y-1 w-full">
              <h2 
                className='text-sm font-semibold truncate w-full text-gray-900' 
                title={user.displayName}
              >
                {user.displayName}
              </h2>
              <p className="text-xs text-gray-500 truncate w-full" title={user.username}>
                @{user.username}
              </p>
              {user.followersCount > 0 && (
                <p className="text-xs text-gray-400">
                  {user.followersCount} followers
                </p>
              )}
            </div>

            {/* Follow button */}
            <div className='flex w-full items-center justify-center mt-3'>
              <button
                onClick={() => handleToggleFollow(user._id, user.isFollowing ? 'unfollow' : 'follow')}
                disabled={followingLoading[user._id]}
                className={`
                  w-full rounded-full text-center text-xs font-medium px-4 py-2 
                  transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center min-h-[32px]
                  ${user.isFollowing 
                    ? 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200' 
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                  }
                `}
              >
                {followingLoading[user._id] ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : user.isFollowing ? (
                  <>
                    <UserCheck className="w-3 h-3 mr-1" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3 h-3 mr-1" />
                    Follow
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestedUsers;