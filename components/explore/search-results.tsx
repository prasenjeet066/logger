"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, UserPlus, UserCheck, Filter, SortAsc, Grid3X3, List, Users, FileText, Sparkles } from "lucide-react"
import { VerificationBadge } from "@/components/badge/verification-badge"
import { PostCard } from "@/components/dashboard/post-card"
import { Spinner } from "@/components/loader/spinner"
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

interface Post {
  _id: string
  content: string
  createdAt: string
  authorId: string
  author: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
    isVerified: boolean
  }
  likesCount: number
  repostsCount: number
  repliesCount: number
  isLiked: boolean
  isReposted: boolean
  mediaUrls: string[] | null
  mediaType: string | null
}

interface SearchResultsProps {
  searchQuery: string
  users: UserProfile[]
  posts: Post[]
  isLoading: boolean
  currentUserId: string
  onFollow: (userId: string, isFollowing: boolean) => void
  sortBy: string
  setSortBy: (value: string) => void
  filterType: string
  setFilterType: (value: string) => void
}

export function SearchResults({
  searchQuery,
  users,
  posts,
  isLoading,
  currentUserId,
  onFollow,
  sortBy,
  setSortBy,
  filterType,
  setFilterType,
}: SearchResultsProps) {
  const [activeTab, setActiveTab] = useState("top")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner />
        <p className="text-gray-500 mt-4">Searching for "{searchQuery}"...</p>
      </div>
    )
  }

  const totalResults = users.length + posts.length

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-600 rounded-xl">
            <Search className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Search Results</h2>
        </div>
        <p className="text-gray-600">
          Found <span className="font-semibold text-blue-600">{totalResults}</span> results for "
          <span className="font-semibold">{searchQuery}</span>"
        </p>
      </div>

      {/* Filters and Controls */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SortAsc className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Most Relevant</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="media">With Media</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12 bg-gray-100 rounded-xl p-1">
          <TabsTrigger
            value="top"
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Top Results</span>
            <span className="sm:hidden">Top</span>
            <Badge variant="secondary" className="ml-1">
              {totalResults}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="people"
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">People</span>
            <span className="sm:hidden">Users</span>
            <Badge variant="secondary" className="ml-1">
              {users.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="posts"
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Posts</span>
            <Badge variant="secondary" className="ml-1">
              {posts.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Top Results */}
        <TabsContent value="top" className="space-y-8 mt-6">
          {users.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">People</h3>
                <Badge variant="secondary">{users.length}</Badge>
              </div>
              <div
                className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
              >
                {users.slice(0, 3).map((user) => (
                  <UserCard key={user._id} user={user} currentUserId={currentUserId} onFollow={onFollow} />
                ))}
              </div>
            </section>
          )}

          {posts.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Posts</h3>
                <Badge variant="secondary">{posts.length}</Badge>
              </div>
              <div className="border rounded-xl overflow-hidden bg-white">
                {posts.slice(0, 3).map((post, index) => (
                  <div key={post._id} className={index > 0 ? "border-t" : ""}>
                    <PostCard post={post as any} onUpdate={() => {}} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </TabsContent>

        {/* People Tab */}
        <TabsContent value="people" className="mt-6">
          {users.length > 0 ? (
            <div
              className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}
            >
              {users.map((user) => (
                <UserCard key={user._id} user={user} currentUserId={currentUserId} onFollow={onFollow} />
              ))}
            </div>
          ) : (
            <EmptyState icon={Users} title="No people found" description={`No users found for "${searchQuery}"`} />
          )}
        </TabsContent>

        {/* Posts Tab */}
        <TabsContent value="posts" className="mt-6">
          {posts.length > 0 ? (
            <div className="border rounded-xl overflow-hidden bg-white">
              {posts.map((post, index) => (
                <div key={post._id} className={index > 0 ? "border-t" : ""}>
                  <PostCard post={post as any} onUpdate={() => {}} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={FileText} title="No posts found" description={`No posts found for "${searchQuery}"`} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// User Card Component
function UserCard({
  user,
  currentUserId,
  onFollow,
}: {
  user: UserProfile
  currentUserId: string
  onFollow: (userId: string, isFollowing: boolean) => void
}) {
  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-white to-gray-50">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Link href={`/profile/${user.username}`}>
            <Avatar className="h-14 w-14 ring-2 ring-white shadow-md">
              <AvatarImage src={user.avatarUrl || undefined} />
              <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                {user.displayName?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <Link href={`/profile/${user.username}`}>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-lg text-gray-900 truncate hover:text-blue-600 transition-colors">
                  {user.displayName}
                </h4>
                {user.isVerified && <VerificationBadge verified={true} size={16} className="h-4 w-4" />}
              </div>
              <p className="text-gray-500 text-sm truncate">@{user.username}</p>
            </Link>

            {user.bio && <p className="text-gray-600 text-sm mt-2 line-clamp-2">{user.bio}</p>}

            <div className="flex items-center gap-1 mt-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">{user.followersCount.toLocaleString()}</span>
              <span className="text-sm text-gray-500">followers</span>
            </div>
          </div>

          {user._id !== currentUserId && (
            <Button
              variant={user.isFollowing ? "outline" : "default"}
              size="sm"
              onClick={() => onFollow(user._id, user.isFollowing)}
              className={user.isFollowing ? "hover:bg-red-50 hover:text-red-600 hover:border-red-200" : ""}
            >
              {user.isFollowing ? (
                <>
                  <UserCheck className="h-4 w-4 mr-1" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-1" />
                  Follow
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Empty State Component
function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: any
  title: string
  description: string
}) {
  return (
    <div className="text-center py-16">
      <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
        <Icon className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-md mx-auto">{description}</p>
    </div>
  )
}
