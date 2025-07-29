// components/profile/mutual-followers.tsx

"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

interface MutualFollower {
  _id: string
  username: string
  displayName: string
  avatarUrl: string | null
}

interface MutualFollowersProps {
  targetUsername: string
  targetUserId: string
  targetDisplayName: string
  type ? : 'center' | undefined
}

export function MutualFollowers({ targetUsername, targetUserId, targetDisplayName, type }: MutualFollowersProps) {
  const { data: session } = useSession()
  const [mutualFollowers, setMutualFollowers] = useState < MutualFollower[] > ([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const fetchMutualFollowers = async () => {
      if (!session?.user) {
        setIsLoading(false)
        return
      }
      
      try {
        const response = await fetch(`/api/users/${targetUsername}/mutual-followers`)
        if (response.ok) {
          const data = await response.json()
          setMutualFollowers(data.followers || [])
          setTotalCount(data.totalCount || 0)
        }
      } catch (error) {
        console.error("Error fetching mutual followers:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchMutualFollowers()
  }, [targetUsername, session])
  
  if (isLoading || !session?.user || totalCount === 0) {
    return null
  }
  
  
  // Always only keep up to 3 followers in displayFollowers
  const displayFollowers = mutualFollowers.length > 3 ?
    mutualFollowers.slice(0, 3) :
    mutualFollowers
  
  const remainingCount = totalCount - displayFollowers.length
  return (
    <div className="flex items-center gap-2">
      {type!== 'center' ? (
      <>
      <div className="flex -space-x-2">
        {displayFollowers.map((follower) => (
          <Link key={follower._id} href={`/${follower.username}`}>
            <Avatar className="w-6 h-6 border-2 border-white hover:scale-110 transition-transform cursor-pointer m-[-2px]">
              <AvatarImage src={follower.avatarUrl || undefined} />
              <AvatarFallback className="text-xs">
                {follower.displayName?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </Link>
        ))}
      </div>
      <div className="text-sm text-gray-600">
        <span className="font-medium">
          {displayFollowers.map((follower, index) => (
            <span key={follower._id}>
              <Link 
                href={`/${follower.username}`}
                className="hover:underline font-semibold text-gray-900"
              >
                {follower.displayName}
              </Link>
              {index < displayFollowers.length - 1 && ", "}
            </span>
          ))}
          {remainingCount > 0 && (
            <span> and {remainingCount} more</span>
          )}
        </span>
        <span> follow{totalCount === 1 ? 's' : ''} {targetDisplayName}</span>
      </div></>): (
        <>
          <div className = 'flex flex-col items-center justify-center'>
            <div className='flrx flex-row items-center justify-center'>
            {
              displayFollowers.map((follower)=>(
                            <Avatar className="w-4 h-4 border-2 border-white hover:scale-110 transition-transform cursor-pointer -m-1 border border-white">
              <AvatarImage src={follower.avatarUrl || undefined} />
              <AvatarFallback className="text-xs">
                {follower.displayName?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
              ))
          
            }
            </div>
            <small>
              {displayFollowers.map((followers)=>(
                <>{followers.displayName + " " } </>
              ))}
            </small>
          </div>
        </>
      )}
    </div>
  )
}