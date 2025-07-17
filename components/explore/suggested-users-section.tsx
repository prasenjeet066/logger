"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { UserPlus, UserCheck, Users, ArrowUpRight, Star } from "lucide-react"
import { VerificationBadge } from "@/components/badge/verification-badge"
import Link from "next/link"

interface UserProfile {
  _id: string
  username: string
  displayName: string
  bio: string | null
  avatarUrl: string | null
  followersCount: number
  isFollowing: boolean
  isVerified?: boolean
}

interface SuggestedUsersSectionProps {
  users: UserProfile[]
  currentUserId: string
  onFollow: (userId: string, isFollowing: boolean) => void
}

export function SuggestedUsersSection({ users, currentUserId, onFollow }: SuggestedUsersSectionProps) {
  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Suggested for You</h2>
            <p className="text-gray-600">Connect with interesting people</p>
          </div>
        </div>
        <Button variant="outline" className="hidden sm:flex bg-transparent">
          View All
          <ArrowUpRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Users Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {users.slice(0, 6).map((user, index) => (
          <Card
            key={user._id}
            className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-gradient-to-br from-white to-gray-50"
          >
            <CardContent className="p-6">
              {/* User Header */}
              <div className="flex items-start gap-4 mb-4">
                <Link href={`/profile/${user.username}`} className="relative">
                  <Avatar className="h-16 w-16 ring-4 ring-white shadow-lg">
                    <AvatarImage src={user.avatarUrl || undefined} />
                    <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                      {user.displayName?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {user.isVerified && (
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
                      <VerificationBadge verified={true} size={16} className="h-4 w-4" />
                    </div>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${user.username}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-gray-900 truncate hover:text-blue-600 transition-colors">
                        {user.displayName}
                      </h3>
                      {index < 3 && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                    </div>
                    <p className="text-gray-500 text-sm truncate">@{user.username}</p>
                  </Link>

                  {/* Follower Count */}
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">{user.followersCount.toLocaleString()}</span>
                      <span className="text-sm text-gray-500">followers</span>
                    </div>
                    {index < 3 && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs">
                        Popular
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {user.bio && <p className="text-gray-600 text-sm line-clamp-2 mb-4 leading-relaxed">{user.bio}</p>}

              {/* Follow Button */}
              {user._id !== currentUserId && (
                <Button
                  variant={user.isFollowing ? "outline" : "default"}
                  onClick={() => onFollow(user._id, user.isFollowing)}
                  className={`w-full transition-all duration-200 ${
                    user.isFollowing
                      ? "hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  }`}
                >
                  {user.isFollowing ? (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
