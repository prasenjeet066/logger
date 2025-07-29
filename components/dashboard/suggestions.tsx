import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Check, Loader2 } from 'lucide-react';
import {MutualFollowers} from "@/components/profile/mutual-follow"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
     <div className =' flex flex-row items-center justify-between'>
       <h1 className='text-md'>
         Introduce With them
       </h1>
       
     </div>
     <div className=  'flex flex-row items-center gap-2 overflow-scroll'>
       {
         users.map((user)=>(
           <div className = 'flex flex-col items-center justify-center'>
               <Avatar className="cursor-pointer h-6 w-6 ring-2 ring-white border-2 border-gray-200 hover:ring-blue-200 transition-all">
              <AvatarImage src={user.avatarUrl || undefined} alt={`${user.displayName}'s avatar`} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {user.displayName?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <h1 className ='text-md'>
              {user.displayName.split(' ')[0] || user.displayName}
            </h1>
            <small className='text-xs'>@{user.username}</small>
            <MutualFollowers targetUsername={user!.username}/>
            <button className='bg-black text-white p-2 px-4 rounded-full'>Follow Him</button>
           </div>
         ))
       }
     </div>
    </div>
  );
};

export default SuggestedUsers