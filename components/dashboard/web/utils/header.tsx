"use client"
import {
  useState,
  useEffect,
  useCallback,
  useRef
} from "react"
import { Button } from "@/components/ui/button"
import { Plus, Bell, Menu, Search, User as UserIcon, X } from "lucide-react"
import { debounce } from "lodash"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Spinner } from "@/components/loader/spinner"
import Link from "next/link"
import type { IUser } from "@/lib/mongodb/models/User"

interface UserProfile {
  _id: string
  username: string
  displayName: string
  bio: string | null
  avatarUrl: string | null
  followersCount: number
  isFollowing: boolean
  isVerified ? : boolean
}

interface HeaderProps {
  profile: IUser
  sidebarExpand: boolean
  setSidebarExpand: (expand: boolean) => void
  onCreatePost ? : () => void
}

export function Header({ profile, sidebarExpand, setSidebarExpand, onCreatePost }: HeaderProps) {
  const [Posts, setPosts] = useState([])
  const [Users, setUsers] = useState < UserProfile[] > ([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const searchRef = useRef < HTMLDivElement > (null)
  const inputRef = useRef < HTMLInputElement > (null)
  
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setUsers([])
        setPosts([])
        setShowSearchResults(false)
        setIsSearching(false)
        return
      }
      
      setIsSearching(true)
      try {
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
        
        setShowSearchResults(true)
      } catch (error) {
        console.error("Error searching:", error)
      } finally {
        setIsSearching(false)
      }
    }, 300),
    [],
  )
  
  useEffect(() => {
    debouncedSearch(searchQuery)
  }, [searchQuery, debouncedSearch])
  
  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  
  const clearSearch = () => {
    setSearchQuery("")
    setShowSearchResults(false)
    setUsers([])
    setPosts([])
    inputRef.current?.focus()
  }
  
  const handleSearchResultClick = () => {
    setShowSearchResults(false)
    setSearchQuery("")
  }
  
  return (
    <div className="sticky top-0 z-30 bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className='flex flex-row items-center gap-3'>
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-1 h-8 w-8"
            onClick={() => setSidebarExpand(!sidebarExpand)}
          >
            <Menu className='h-4 w-4'/>
          </Button>
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <h1 className="text-xl  logo-font">Logger</h1>
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex flex-row items-center gap-4">
          {/* Enhanced Search Bar */}
          <div className="relative" ref={searchRef}>
            <div className='relative flex flex-row items-center gap-2 bg-gray-50 hover:bg-gray-100 transition-colors h-9 border border-gray-200 rounded-full px-4 py-2 min-w-[300px] focus-within:border-gray-400 focus-within:bg-white'>
              <Search className='h-4 w-4 text-gray-400 flex-shrink-0'/>
              <input
                ref={inputRef}
                type='text'
                className='outline-none bg-transparent border-0 w-full text-sm placeholder:text-gray-500'
                placeholder='Search users...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setShowSearchResults(true)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-5 w-5 hover:bg-gray-200 rounded-full flex-shrink-0"
                  onClick={clearSearch}
                >
                  <X className='h-3 w-3'/>
                </Button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && searchQuery && (
              <div className='absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 shadow-lg rounded-lg max-h-80 overflow-y-auto z-50'>
                {isSearching ? (
                  <div className='flex items-center justify-center p-4'>
                    <Spinner />
                    <span className='ml-2 text-sm text-gray-500'>Searching...</span>
                  </div>
                ) : (
                  <>
                    {Users.length > 0 ? (
                      <div className='py-2'>
                        <div className='px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b'>
                          Users
                        </div>
                        {Users.map((user) => (
                          <Link 
                            key={user._id} 
                            href={`/profile/${user.username}`}
                            onClick={handleSearchResultClick}
                            className='block'
                          >
                            <div className='flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors cursor-pointer'>
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={user.avatarUrl || "/placeholder.svg"} />
                                <AvatarFallback className="text-xs">
                                  {user.displayName?.charAt(0) || user.username?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className='flex-1 min-w-0'>
                                <div className='flex items-center gap-1'>
                                  <p className='font-medium text-sm text-gray-900 truncate'>
                                    {user.displayName || user.username}
                                  </p>
                                  {user.isVerified && (
                                    <div className='h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center'>
                                      <div className='h-2 w-2 bg-white rounded-full'></div>
                                    </div>
                                  )}
                                </div>
                                <p className='text-xs text-gray-500 truncate'>@{user.username}</p>
                                {user.bio && (
                                  <p className='text-xs text-gray-600 truncate mt-1'>{user.bio}</p>
                                )}
                              </div>

                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className='p-4 text-center'>
                        <p className='text-sm text-gray-500'>No users found for "{searchQuery}"</p>
                        <p className='text-xs text-gray-400 mt-1'>Try searching with different keywords</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Notification Bell */}
          <Button variant="ghost" size="sm" className="p-2 h-9 w-9">
            <Bell className='h-4 w-4'/>
          </Button>

          {/* Create New Button */}
          <Button 
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 h-9 rounded-full transition-colors"
            onClick={onCreatePost}
          >
            <Plus className="h-4 w-4 mr-1"/>
            <span className="text-sm">Create</span>
          </Button>

          {/* User Avatar */}
          <Link href={`/profile/${profile?.username}`}>
            <Avatar className="h-9 w-9 hover:ring-2 hover:ring-gray-200 transition-all cursor-pointer">
              <AvatarImage src={profile?.avatarUrl || "/placeholder.svg"} />
              <AvatarFallback>
                <UserIcon className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </div>
  )
}