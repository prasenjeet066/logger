"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, UserPlus, UserCheck, Hash, TrendingUp, X, Filter, SortAsc } from "lucide-react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Menu } from "lucide-react"
import { useRouter } from "next/navigation"
import { VerificationBadge } from "@/components/badge/verification-badge"
import { PostCard } from "@/components/dashboard/post-card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { debounce } from "lodash"
import { signOut } from "next-auth/react"
import { Spinner } from "@/components/loader/spinner" // Updated import path

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
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("top")
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [sortBy, setSortBy] = useState("relevance")
  const [viewMode, setViewMode] = useState("list")
  const [filterType, setFilterType] = useState("all")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    if (session?.user) {
      fetchCurrentUser()
    }
    loadSearchHistory()
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

  const loadSearchHistory = () => {
    const history = localStorage.getItem("searchHistory")
    if (history) {
      setSearchHistory(JSON.parse(history))
    }
  }

  const saveToSearchHistory = (query: string) => {
    if (!query.trim()) return
    const newHistory = [query, ...searchHistory.filter((h) => h !== query)].slice(0, 10)
    setSearchHistory(newHistory)
    localStorage.setItem("searchHistory", JSON.stringify(newHistory))
  }

  const clearSearchHistory = () => {
    setSearchHistory([])
    localStorage.removeItem("searchHistory")
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
        setSuggestions([])
        setShowSuggestions(false)
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
          setSuggestions(usersData.slice(0, 5).map((u: any) => u.username))
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
    setShowSuggestions(searchQuery.length > 0)
  }, [searchQuery, debouncedSearch])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    saveToSearchHistory(query)
    setShowSuggestions(false)
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
    <div className="min-h-screen bg-gray-50 bengali-font">
      {/* Mobile header */}
      <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold logo-font">Cōdes</h1>
        <div className="flex flex-row items-center justify-center pl-4 pr-4 py-2 text-lg outline-none border-none gap-2 bg-gray-50 rounded-full">
          <input
            placeholder="Search for people, posts, or hashtags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="outline-none border-none bg-gray-50 text-sm"
            onFocus={() => setShowSuggestions(true)}
          />
          <Search className="h-4 w-4 text-gray-400" />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div
          className={`${sidebarOpen ? "block" : "hidden"} lg:block fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-white border-r lg:border-r-0`}
        >
          <Sidebar profile={currentUser} onSignOut={handleSignOut} />
        </div>

        {/* Main content */}
        <div className="flex-1 max-w-6xl mx-auto">
          <div className="border-x bg-white min-h-screen">
            {/* Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b z-30">
              <div className="px-4 py-4">
                {/* Search Filters */}
                {searchQuery && (
                  <div className="flex items-center gap-3 mt-4 flex-wrap">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-32">
                        <SortAsc className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="recent">Most Recent</SelectItem>
                        <SelectItem value="popular">Most Popular</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-28">
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
                )}
              </div>
            </div>

            <div className="p-4">
              {!searchQuery ? (
                // Default explore content
                <div className="space-y-8">
                  {/* Trending Section */}
                  <section>
                    <div className="flex items-center gap-2 mb-6">
                      <TrendingUp className="h-6 w-6 text-gray-800" />
                      <h3 className="text-md font-bold">Trending Now</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {hashtags.slice(0, 6).map((hashtag, index) => (
                        <Card
                          key={index}
                          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                          onClick={() => handleSearch(`#${hashtag.name}`)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-full">
                                  <Hash className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-semibold">#{hashtag.name}</p>
                                  <p className="text-sm text-gray-500">{hashtag.postsCount} posts</p>
                                </div>
                              </div>
                              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Hot
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>

                  <Separator />

                  {/* Suggested Users */}
                  <section>
                    <div className="flex items-center gap-2 mb-6">
                      <UserPlus className="h-6 w-6 text-gray-800" />
                      <h3 className="text-md font-bold">Suggested for you</h3>
                    </div>

                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                      {users.slice(0, 6).map((suggestedUser) => (
                        <Card key={suggestedUser._id} className="hover:shadow-lg transition-all duration-200">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <Link href={`/profile/${suggestedUser.username}`}>
                                <Avatar className="h-12 w-12 cursor-pointer">
                                  <AvatarImage src={suggestedUser.avatarUrl || undefined} />
                                  <AvatarFallback className="text-lg font-semibold">
                                    {suggestedUser.displayName?.charAt(0)?.toUpperCase() || "U"}
                                  </AvatarFallback>
                                </Avatar>
                              </Link>
                              <div className="flex-1 min-w-0">
                                <Link href={`/profile/${suggestedUser.username}`}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold truncate hover:underline">
                                      {suggestedUser.displayName}
                                    </h4>
                                    {suggestedUser.isVerified && (
                                      <VerificationBadge verified={true} size={16} className="h-4 w-4" />
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-500 truncate">@{suggestedUser.username}</p>
                                </Link>
                                {suggestedUser.bio && (
                                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{suggestedUser.bio}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-2">{suggestedUser.followersCount} followers</p>
                              </div>
                              {suggestedUser._id !== currentUser._id && (
                                <Button
                                  variant={suggestedUser.isFollowing ? "outline" : "default"}
                                  size="sm"
                                  onClick={() => handleFollow(suggestedUser._id, suggestedUser.isFollowing)}
                                  className="shrink-0"
                                >
                                  {suggestedUser.isFollowing ? (
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
                      ))}
                    </div>
                  </section>
                </div>
              ) : (
                // Search results
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Search results for "{searchQuery}"</h3>
                    {isLoading && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span>Searching...</span>
                      </div>
                    )}
                  </div>

                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                      <TabsTrigger value="top" className="text-sm">
                        Top Results
                      </TabsTrigger>
                      <TabsTrigger value="people" className="text-sm">
                        People
                      </TabsTrigger>
                      <TabsTrigger value="posts" className="text-sm">
                        Posts
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="top" className="space-y-8">
                      {!isLoading && (
                        <div className="space-y-8">
                          {users.length > 0 && (
                            <section>
                              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <UserPlus className="h-5 w-5" />
                                People ({users.length})
                              </h4>
                              <div className="grid gap-4">
                                {users.slice(0, 3).map((searchUser) => (
                                  <Card key={searchUser._id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                      <div className="flex items-center justify-between">
                                        <Link
                                          href={`/profile/${searchUser.username}`}
                                          className="flex items-center gap-3 flex-1 min-w-0"
                                        >
                                          <Avatar className="h-12 w-12">
                                            <AvatarImage src={searchUser.avatarUrl || undefined} />
                                            <AvatarFallback>
                                              {searchUser.displayName?.charAt(0)?.toUpperCase() || "U"}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <p className="font-semibold truncate">{searchUser.displayName}</p>
                                              {searchUser.isVerified && (
                                                <VerificationBadge verified={true} size={14} className="h-3.5 w-3.5" />
                                              )}
                                            </div>
                                            <p className="text-sm text-gray-500 truncate">@{searchUser.username}</p>
                                            <p className="text-xs text-gray-500">
                                              {searchUser.followersCount} followers
                                            </p>
                                          </div>
                                        </Link>
                                        {searchUser._id !== currentUser._id && (
                                          <Button
                                            variant={searchUser.isFollowing ? "outline" : "default"}
                                            size="sm"
                                            onClick={() => handleFollow(searchUser._id, searchUser.isFollowing)}
                                          >
                                            {searchUser.isFollowing ? (
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
                                ))}
                              </div>
                            </section>
                          )}

                          {posts.length > 0 && (
                            <section>
                              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Hash className="h-5 w-5" />
                                Posts ({posts.length})
                              </h4>
                              <div className="border rounded-lg overflow-hidden">
                                {posts.slice(0, 3).map((post) => (
                                  <div key={post._id} className="border-b last:border-b-0">
                                    <PostCard post={post as any} onUpdate={() => {}} />
                                  </div>
                                ))}
                              </div>
                            </section>
                          )}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="people">
                      {!isLoading ? (
                        users.length > 0 ? (
                          <div className="grid gap-4">
                            {users.map((searchUser) => (
                              <Card key={searchUser._id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                  <div className="flex items-center justify-between">
                                    <Link
                                      href={`/profile/${searchUser.username}`}
                                      className="flex items-center gap-4 flex-1 min-w-0"
                                    >
                                      <Avatar className="h-14 w-14">
                                        <AvatarImage src={searchUser.avatarUrl || undefined} />
                                        <AvatarFallback className="text-lg">
                                          {searchUser.displayName?.charAt(0)?.toUpperCase() || "U"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <p className="font-semibold truncate text-lg">{searchUser.displayName}</p>
                                          {searchUser.isVerified && (
                                            <VerificationBadge verified={true} size={16} className="h-4 w-4" />
                                          )}
                                        </div>
                                        <p className="text-gray-500 truncate">@{searchUser.username}</p>
                                        {searchUser.bio && (
                                          <p className="text-gray-600 mt-2 line-clamp-2">{searchUser.bio}</p>
                                        )}
                                        <p className="text-sm text-gray-500 mt-2">
                                          {searchUser.followersCount} followers
                                        </p>
                                      </div>
                                    </Link>
                                    {searchUser._id !== currentUser._id && (
                                      <Button
                                        variant={searchUser.isFollowing ? "outline" : "default"}
                                        onClick={() => handleFollow(searchUser._id, searchUser.isFollowing)}
                                      >
                                        {searchUser.isFollowing ? (
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
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No people found for "{searchQuery}"</p>
                            <p className="text-gray-400 text-sm mt-2">Try searching with different keywords</p>
                          </div>
                        )
                      ) : (
                        <div className="flex justify-center py-12">
                          <Spinner />
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="posts">
                      {!isLoading ? (
                        posts.length > 0 ? (
                          <div className="border rounded-lg overflow-hidden">
                            {posts.map((post) => (
                              <div key={post._id} className="border-b last:border-b-0">
                                <PostCard post={post as any} onUpdate={() => {}} />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <Hash className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No posts found for "{searchQuery}"</p>
                            <p className="text-gray-400 text-sm mt-2">Try searching with different keywords</p>
                          </div>
                        )
                      ) : (
                        <div className="flex justify-center py-12">
                          <Spinner />
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
