"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { debounce } from "lodash"
import { Spinner } from "@/components/loader/spinner"
import { SearchSection } from "./search-section"
import { TrendingSection } from "./trending-section"
import { SuggestedUsersSection } from "./suggested-users-section"
import { SearchResults } from "./search-results"

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
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [sortBy, setSortBy] = useState("relevance")
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

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  if (!session?.user || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <Spinner />
          <p className="text-gray-600 mt-4">Loading explore page...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 bengali-font">
      {/* Mobile header */}
      <div className="lg:hidden bg-white/95 backdrop-blur-md border-b px-4 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold logo-font bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Cōdes
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-blue-100"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div
          className={`${sidebarOpen ? "block" : "hidden"} lg:block fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-white/95 backdrop-blur-md border-r lg:border-r-0`}
        >
          <Sidebar profile={currentUser} onSignOut={handleSignOut} />
        </div>

        {/* Main content */}
        <div className="flex-1 max-w-6xl mx-auto">
          <div className="min-h-screen">
            {/* Header with Search */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b z-30 lg:top-0">
              <div className="px-6 py-6">
                <div className="hidden lg:block mb-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore</h1>
                  <p className="text-gray-600">Discover trending topics and connect with new people</p>
                </div>

                <SearchSection
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onSearch={handleSearch}
                  searchHistory={searchHistory}
                  onClearHistory={clearSearchHistory}
                  suggestions={suggestions}
                  showSuggestions={showSuggestions}
                  onSuggestionClick={handleSearch}
                  isLoading={isLoading}
                />
              </div>
            </div>

            <div className="px-6 py-8">
              {!searchQuery ? (
                // Default explore content
                <div className="space-y-12">
                  <TrendingSection hashtags={hashtags} onHashtagClick={handleSearch} />

                  <SuggestedUsersSection users={users} currentUserId={currentUser._id} onFollow={handleFollow} />
                </div>
              ) : (
                // Search results
                <SearchResults
                  searchQuery={searchQuery}
                  users={users}
                  posts={posts}
                  isLoading={isLoading}
                  currentUserId={currentUser._id}
                  onFollow={handleFollow}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  filterType={filterType}
                  setFilterType={setFilterType}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
