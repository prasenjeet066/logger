"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Settings, MoreHorizontal, UserPlus, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { VerificationBadge } from "@/components/badge/verification-badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { debounce } from "lodash"
import { signOut } from "next-auth/react"
import { Spinner } from "@/components/loader/spinner"
import { PostCard } from "@/components/dashboard/post-card" // Import PostCard

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

interface Hashtag {
  name: string
  postsCount: number
}

export function ExploreContent() {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<UserProfile[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [hashtags, setHashtags] = useState<Hashtag[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false) // This state is not used in the new UI, but kept for consistency
  const [activeTab, setActiveTab] = useState("top")
  const [showSettings, setShowSettings] = useState(false) // New state for settings
  const [currentUser, setCurrentUser] = useState<any>(null) // Keeping this as any for now based on previous context
  const router = useRouter()

  const tabs = [
    { id: "top", label: "Top" },
    { id: "latest", label: "Latest" },
    { id: "people", label: "People" },
    { id: "media", label: "Media" },
    { id: "lists", label: "Lists" },
  ]

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
    if (num >= 1000) return (num / 1000).toFixed(1) + "K"
    return num.toString()
  }

  useEffect(() => {
    if (session?.user) {
      fetchCurrentUser()
    }
    fetchTrendingHashtags()
    fetchSuggestedUsers()
  }, [session])

  const fetchCurrentUser = async () => {
    if (!session?.user?.email) return

    try {
      const response = await fetch(`/api/users/current`)
      if (response.ok) {
        const userData = await response.json()
        setCurrentUser(userData)
      }
    } catch (error) {
      console.error("Error fetching current user:", error)
    }
  }

  const fetchTrendingHashtags = async () => {
    try {
      const response = await fetch("/api/hashtags/trending")
      if (response.ok) {
        const data = await response.json()
        setHashtags(data)
      }
    } catch (error) {
      console.error("Error fetching trending hashtags:", error)
    }
  }

  const fetchSuggestedUsers = async () => {
    if (!session?.user) return

    try {
      const response = await fetch("/api/users/suggested")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching suggested users:", error)
    }
  }

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setUsers([])
        setPosts([])
        return
      }

      setIsLoading(true)
      try {
        // Search users and posts
        const [usersResponse, postsResponse] = await Promise.all([
          fetch(`/api/users/search?q=${encodeURIComponent(query)}`),
          fetch(`/api/posts/search?q=${encodeURIComponent(query)}`),
        ])

        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setUsers(usersData)
        }

        if (postsResponse.ok) {
          const postsData = await postsResponse.json()
          setPosts(postsData)
        }
      } catch (error) {
        console.error("Error searching:", error)
      } finally {
        setIsLoading(false)
      }
    }, 300),
    [session?.user],
  )

  useEffect(() => {
    debouncedSearch(searchQuery)
  }, [searchQuery, debouncedSearch])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleFollow = async (userId: string, isFollowing: boolean) => {
    if (!session?.user) return

    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isFollowing ? "unfollow" : "follow" }),
      })

      if (response.ok) {
        const result = await response.json()
        setUsers(
          users.map((u) =>
            u._id === userId
              ? { ...u, isFollowing: result.following, followersCount: u.followersCount + (result.following ? 1 : -1) }
              : u,
          ),
        )
      }
    } catch (error) {
      console.error("Error toggling follow:", error)
    }
  }

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!session?.user) return

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liked: !isLiked }),
      })

      if (response.ok) {
        const result = await response.json()
        setPosts(
          posts.map((post) =>
            post._id === postId
              ? { ...post, isLiked: result.liked, likesCount: post.likesCount + (result.liked ? 1 : -1) }
              : post,
          ),
        )
      }
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  const handleRepost = async (postId: string, isReposted: boolean) => {
    if (!session?.user) return

    try {
      const response = await fetch(`/api/posts/${postId}/repost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reposted: !isReposted }),
      })

      if (response.ok) {
        setPosts(
          posts.map((post) =>
            post._id === postId
              ? {
                  ...post,
                  isReposted: !isReposted,
                  repostsCount: post.repostsCount + (isReposted ? -1 : 1),
                }
              : post,
          ),
        )
      }
    } catch (error) {
      console.error("Error toggling repost:", error)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  if (!session?.user || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="flex items-center px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-8">
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500"
            />
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)} className="ml-4">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
        {/* Search Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={`flex-1 px-4 py-4 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id ? "text-black" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-full" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </header>

      <div className="max-w-6xl mx-auto flex">
        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="border-r border-gray-200 min-h-screen">
            {/* Search Results */}
            {searchQuery ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsContent value="top">
                  {!isLoading ? (
                    posts.length > 0 || users.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {/* Display top users */}
                        {users.slice(0, 3).map((searchUser) => (
                          <article
                            key={searchUser._id}
                            className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center space-x-3">
                              <Link href={`/profile/${searchUser.username}`}>
                                <Avatar className="w-10 h-10 rounded-full">
                                  <AvatarImage src={searchUser.avatarUrl || undefined} />
                                  <AvatarFallback>
                                    {searchUser.displayName?.charAt(0)?.toUpperCase() || "U"}
                                  </AvatarFallback>
                                </Avatar>
                              </Link>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <Link href={`/profile/${searchUser.username}`}>
                                    <h3 className="font-semibold text-black truncate hover:underline">
                                      {searchUser.displayName}
                                    </h3>
                                  </Link>
                                  {searchUser.isVerified && (
                                    <VerificationBadge verified={true} size={16} className="h-4 w-4" />
                                  )}
                  // nooll               <span className="text-gray-500 text-sm">@{searchUser.username}</span>
                                  {searchUser._id !== currentUser._id && (
                                    <Button
                                      variant={searchUser.isFollowing ? "outline" : "default"}
                                      size="sm"
                                      onClick={() => handleFollow(searchUser._id, searchUser.isFollowing)}
                                      className="ml-auto"
                                    >
                                      {searchUser.isFollowing ? "Following" : "Follow"}
                                    </Button>
                                  )}
                                </div>
                                {searchUser.bio && (
                                  <p className="mt-1 text-gray-600 text-sm line-clamp-2">{searchUser.bio}</p>
                                )}
                              </div>
                            </div>
                          </article>
                        ))}
                        {/* Display top posts using PostCard */}
                        {posts.slice(0, 3).map((post) => (
                          <PostCard
                            key={post._id}
                            post={post as any} // Cast to any if Post type is not fully compatible
                            onLike={handleLike}
                            onRepost={handleRepost}
                            onReply={() => router.push(`/post/${post._id}`)} // Example onReply handler
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <Search className="w-16 h-16 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No results found</h3>
                        <p className="text-center">Try searching for something else or check your spelling</p>
                      </div>
                    )
                  ) : (
                    <div className="flex justify-center py-12">
                      <Spinner />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="latest">
                  {!isLoading ? (
                    posts.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {posts.map((post) => (
                          <PostCard
                            key={post._id}
                            post={post as any} // Cast to any if Post type is not fully compatible
                            onLike={handleLike}
                            onRepost={handleRepost}
                            onReply={() => router.push(`/post/${post._id}`)} // Example onReply handler
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <Search className="w-16 h-16 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No latest posts found for "{searchQuery}"</h3>
                        <p className="text-center">Try searching with different keywords</p>
                      </div>
                    )
                  ) : (
                    <div className="flex justify-center py-12">
                      <Spinner />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="people">
                  {!isLoading ? (
                    users.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {users.map((searchUser) => (
                          <article
                            key={searchUser._id}
                            className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center space-x-3">
                              <Link href={`/profile/${searchUser.username}`}>
                                <Avatar className="w-10 h-10 rounded-full">
                                  <AvatarImage src={searchUser.avatarUrl || undefined} />
                                  <AvatarFallback>
                                    {searchUser.displayName?.charAt(0)?.toUpperCase() || "U"}
                                  </AvatarFallback>
                                </Avatar>
                              </Link>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <Link href={`/profile/${searchUser.username}`}>
                                    <h3 className="font-semibold text-black truncate hover:underline">
                                      {searchUser.displayName}
                                    </h3>
                                  </Link>
                                  {searchUser.isVerified && (
                                    <VerificationBadge verified={true} size={16} className="h-4 w-4" />
                                  )}
                                  <span className="text-gray-500 text-sm">@{searchUser.username}</span>
                                  {searchUser._id !== currentUser._id && (
                                    <Button
                                      variant={searchUser.isFollowing ? "outline" : "default"}
                                      size="sm"
                                      onClick={() => handleFollow(searchUser._id, searchUser.isFollowing)}
                                      className="ml-auto"
                                    >
                                      {searchUser.isFollowing ? "Following" : "Follow"}
                                    </Button>
                                  )}
                                </div>
                                {searchUser.bio && (
                                  <p className="mt-1 text-gray-600 text-sm line-clamp-2">{searchUser.bio}</p>
                                )}
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <UserPlus className="w-16 h-16 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No people found for "{searchQuery}"</h3>
                        <p className="text-center">Try searching with different keywords</p>
                      </div>
                    )
                  ) : (
                    <div className="flex justify-center py-12">
                      <Spinner />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="media">
                  <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                    <Search className="w-16 h-16 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No media found for "{searchQuery}"</h3>
                    <p className="text-center">This feature is not yet fully implemented.</p>
                  </div>
                </TabsContent>

                <TabsContent value="lists">
                  <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                    <Search className="w-16 h-16 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No lists found for "{searchQuery}"</h3>
                    <p className="text-center">This feature is not yet fully implemented.</p>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              // Default explore content when no search query
              <div className="space-y-6 p-4">
                {/* What's happening (Trending) Section */}
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h2 className="text-xl font-bold mb-4">What's happening</h2>
                  <div className="space-y-3">
                    {hashtags.slice(0, 5).map((hashtag, index) => (
                      <div
                        key={index}
                        className="hover:bg-gray-100 p-3 rounded-lg cursor-pointer transition-colors"
                        onClick={() => handleSearch(`#${hashtag.name}`)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-gray-500 text-sm">Trending</p>
                            <p className="font-semibold text-black">#{hashtag.name}</p>
                            <p className="text-gray-500 text-sm">{formatNumber(hashtag.postsCount)} posts</p>
                          </div>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4 text-gray-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="link" className="text-blue-500 hover:text-blue-400 text-sm mt-4 px-0">
                    Show more
                  </Button>
                </div>

                {/* Who to Follow Section */}
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h2 className="text-xl font-bold mb-4">Who to follow</h2>
                  <div className="space-y-4">
                    {users.slice(0, 3).map((suggestedUser) => (
                      <div key={suggestedUser._id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Link href={`/profile/${suggestedUser.username}`}>
                            <Avatar className="w-10 h-10 rounded-full">
                              <AvatarImage src={suggestedUser.avatarUrl || undefined} />
                              <AvatarFallback>
                                {suggestedUser.displayName?.charAt(0)?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                          <div>
                            <div className="flex items-center space-x-1">
                              <Link href={`/profile/${suggestedUser.username}`}>
                                <p className="font-semibold text-black text-sm hover:underline">
                                  {suggestedUser.displayName}
                                </p>
                              </Link>
                              {suggestedUser.isVerified && (
                                <VerificationBadge verified={true} size={16} className="h-4 w-4" />
                              )}
                            </div>
                            <p className="text-gray-500 text-sm">@{suggestedUser.username}</p>
                            {suggestedUser.bio && (
                              <p className="text-gray-400 text-xs mt-1 line-clamp-1">{suggestedUser.bio}</p>
                            )}
                          </div>
                        </div>
                        {suggestedUser._id !== currentUser._id && (
                          <Button
                            className="bg-black text-white px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors"
                            onClick={() => handleFollow(suggestedUser._id, suggestedUser.isFollowing)}
                          >
                            {suggestedUser.isFollowing ? "Following" : "Follow"}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button variant="link" className="text-blue-500 hover:text-blue-400 text-sm mt-4 px-0">
                    Show more
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
        {/* Right Sidebar - Hidden on small screens */}
        <aside className="hidden lg:block w-80 p-4 space-y-6">
          {/* What's happening (Trending) */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <h2 className="text-xl font-bold mb-4">What's happening</h2>
            <div className="space-y-3">
              {hashtags.slice(0, 5).map((hashtag, index) => (
                <div
                  key={index}
                  className="hover:bg-gray-100 p-3 rounded-lg cursor-pointer transition-colors"
                  onClick={() => handleSearch(`#${hashtag.name}`)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 text-sm">Trending</p>
                      <p className="font-semibold text-black">#{hashtag.name}</p>
                      <p className="text-gray-500 text-sm">{formatNumber(hashtag.postsCount)} posts</p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4 text-gray-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="link" className="text-blue-500 hover:text-blue-400 text-sm mt-4 px-0">
              Show more
            </Button>
          </div>
          {/* Who to Follow */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <h2 className="text-xl font-bold mb-4">Who to follow</h2>
            <div className="space-y-4">
              {users.slice(0, 3).map((suggestedUser) => (
                <div key={suggestedUser._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Link href={`/profile/${suggestedUser.username}`}>
                      <Avatar className="w-10 h-10 rounded-full">
                        <AvatarImage src={suggestedUser.avatarUrl || undefined} />
                        <AvatarFallback>{suggestedUser.displayName?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div>
                      <div className="flex items-center space-x-1">
                        <Link href={`/profile/${suggestedUser.username}`}>
                          <p className="font-semibold text-black text-sm hover:underline">
                            {suggestedUser.displayName}
                          </p>
                        </Link>
                        {suggestedUser.isVerified && (
                          <VerificationBadge verified={true} size={16} className="h-4 w-4" />
                        )}
                      </div>
                      <p className="text-gray-500 text-sm">@{suggestedUser.username}</p>
                      {suggestedUser.bio && (
                        <p className="text-gray-400 text-xs mt-1 line-clamp-1">{suggestedUser.bio}</p>
                      )}
                    </div>
                  </div>
                  {suggestedUser._id !== currentUser._id && (
                    <Button
                      className="bg-black text-white px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors"
                      onClick={() => handleFollow(suggestedUser._id, suggestedUser.isFollowing)}
                    >
                      {suggestedUser.isFollowing ? "Following" : "Follow"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button variant="link" className="text-blue-500 hover:text-blue-400 text-sm mt-4 px-0">
              Show more
            </Button>
          </div>
        </aside>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
