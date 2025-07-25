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
}

export function MutualFollowers({ targetUsername, targetUserId, targetDisplayName }: MutualFollowersProps) {
  const { data: session } = useSession()
  const [mutualFollowers, setMutualFollowers] = useState<MutualFollower[]>([])
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

  const displayFollowers = mutualFollowers.slice(0, 3)
  const remainingCount = totalCount - displayFollowers.length

  return (
    <div className="flex items-center gap-2 mt-2 p-3 bg-gray-50 rounded-lg border">
      <div className="flex -space-x-2">
        {displayFollowers.map((follower) => (
          <Link key={follower._id} href={`/${follower.username}`}>
            <Avatar className="w-6 h-6 border-2 border-white hover:scale-110 transition-transform cursor-pointer">
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
      </div>
    </div>
  )
}