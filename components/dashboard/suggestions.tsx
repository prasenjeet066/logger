import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Check, Loader2 } from 'lucide-react';

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

const SuggestedUsers: React.FC < SuggestedUsersProps > = ({ className = '' }) => {
  const [users, setUsers] = useState < SuggestedUser[] > ([]);
  const [loading, setLoading] = useState(true);
  const [followingStates, setFollowingStates] = useState < Record < string, boolean >> ({});
  const [followingLoading, setFollowingLoading] = useState < Record < string, boolean >> ({});
  
  useEffect(() => {
    fetchSuggestedUsers();
  }, []);
  
  const fetchSuggestedUsers = async () => {
    try {
      const response = await fetch('/api/users/suggested');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        
        // Initialize following states
        const initialStates: Record < string, boolean > = {};
        data.forEach((user: SuggestedUser) => {
          initialStates[user._id] = user.isFollowing;
        });
        setFollowingStates(initialStates);
      }
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFollow = async (userId: string) => {
    setFollowingLoading(prev => ({ ...prev, [userId]: true }));
    
    try {
      const response = await fetch('/api/users/follow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (response.ok) {
        setFollowingStates(prev => ({ ...prev, [userId]: true }));
        // Update followers count locally
        setUsers(prev => prev.map(user =>
          user._id === userId ?
          { ...user, followersCount: user.followersCount + 1 } :
          user
        ));
      }
    } catch (error) {
      console.error('Error following user:', error);
    } finally {
      setFollowingLoading(prev => ({ ...prev, [userId]: false }));
    }
  };
  
  const handleUnfollow = async (userId: string) => {
    setFollowingLoading(prev => ({ ...prev, [userId]: true }));
    
    try {
      const response = await fetch('/api/users/unfollow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (response.ok) {
        setFollowingStates(prev => ({ ...prev, [userId]: false }));
        // Update followers count locally
        setUsers(prev => prev.map(user =>
          user._id === userId ?
          { ...user, followersCount: Math.max(0, user.followersCount - 1) } :
          user
        ));
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
    } finally {
      setFollowingLoading(prev => ({ ...prev, [userId]: false }));
    }
  };
  
  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }
  
  if (users.length === 0) {
    return null;
  }
  
  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Who to follow
        </h3>
      </div>
      
      <div className="divide-y divide-gray-100">
        {users.map((user) => (
          <div key={user._id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-3">
              <div className="relative">
                <img
                  src={user.avatarUrl || '/default-avatar.png'}
                  alt={user.displayName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                {user.isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {user.displayName}
                    </h4>
                    <p className="text-sm text-gray-500 truncate">
                      @{user.username}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => followingStates[user._id] ? handleUnfollow(user._id) : handleFollow(user._id)}
                    disabled={followingLoading[user._id]}
                    className={`ml-3 px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      followingStates[user._id]
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {followingLoading[user._id] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : followingStates[user._id] ? (
                      <>
                        <Check className="w-4 h-4" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Follow
                      </>
                    )}
                  </button>
                </div>
                
                {user.bio && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {user.bio}
                  </p>
                )}
                
                <p className="text-xs text-gray-500 mt-1">
                  {user.followersCount.toLocaleString()} followers
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-gray-100">
        <button className="text-blue-500 hover:text-blue-600 text-sm font-medium transition-colors">
          Show more
        </button>
      </div>
    </div>
  );
};

export default SuggestedUsers