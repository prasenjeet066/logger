// Fixed profile-content.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/loader/spinner"
import { Header } from "@/components/dashboard/utils/header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sidebar } from "@/components/dashboard/sidebar"
import { MutualFollowers } from "@/components/profile/mutual-follow"
import { PostCard } from "@/components/dashboard/post-card"
import { EditProfileDialog } from "./edit-profile-dialog"
import { Menu, X, UserPlus, UserCheck, Calendar, MapPin, LinkIcon, Plus, Search, Bot, Code, Terminal, User ,MessageSquareShare} from "lucide-react"
import { formatDistanceToNow,format } from "date-fns"
import Link from "next/link"
import { ImageViewer } from "@/components/media/image-viewer"
import { VerificationBadge } from "@/components/badge/verification-badge"
import { signOut } from "next-auth/react"

// Redux imports
import { useAppDispatch, useAppSelector } from "@/store/main"
import {
  fetchProfile,
  followUser,
  clearProfile,
  fetchMutualFollowers
} from "@/store/slices/profileSlice"
import {
  fetchUserPosts,
  fetchUserReposts,
  fetchPinnedPost,
  likePost,
  repostPost,
  clearPosts
} from "@/store/slices/postsSlice"
import { fetchCurrentUser } from "@/store/slices/authSlice"

interface ProfileContentProps {
  username: string
}

export function ProfileContent({ username }: ProfileContentProps) {
  const { data: session, status } = useSession()
  const dispatch = useAppDispatch()
  const router = useRouter()
  
  // Redux selectors with null safety
  const profileState = useAppSelector((state) => state.profile)
  const postsState = useAppSelector((state) => state.posts)
  const authState = useAppSelector((state) => state.auth)
  
  // Destructure with defaults to prevent undefined errors
  const {
    profileData = null,
      botData = null,
      profileType = 'user',
      mutualFollowers = [],
      mutualFollowersCount = 0,
      isLoading: profileLoading = false,
      error: profileError = null,
      isUpdating = false
  } = profileState || {}
  
  const {
    posts = [],
      replies = [],
      reposts = [],
      media = [],
      pinnedPost = null,
      isLoading: postsLoading = false
  } = postsState || {}
  
  const { currentUser = null } = authState || {}
  
  // Local state
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useMobile()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("posts")
  const [imageViewerOpen, setImageViewerOpen] = useState < string | null > (null)
  
  // Fetch data on component mount with error handling
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (session?.user) {
          dispatch(fetchCurrentUser())
        }
        
        dispatch(clearProfile())
        dispatch(clearPosts())
        dispatch(fetchProfile(username))
      } catch (error) {
        console.error('Error fetching initial data:', error)
      }
    }
    
    fetchData()
  }, [dispatch, username, session?.user])
  
  // Fetch posts when profile is loaded with error handling
  useEffect(() => {
    const fetchPostsData = async () => {
      try {
        if (profileData || botData) {
          await Promise.all([
            dispatch(fetchUserPosts(username)),
            dispatch(fetchUserReposts(username))
          ])
          
          // Fetch pinned post for users only
          if (profileData?.pinnedPostId) {
            dispatch(fetchPinnedPost(profileData.pinnedPostId))
          }
          
          // Fetch mutual followers for users only
          if (profileData) {
            dispatch(fetchMutualFollowers(username))
          }
        }
      } catch (error) {
        console.error('Error fetching posts data:', error)
      }
    }
    
    fetchPostsData()
  }, [dispatch, username, profileData, botData])
  
  const handleFollow = async () => {
    if (profileType === 'bot' || !session?.user || !profileData) return
    
    try {
      await dispatch(followUser(profileData.username)).unwrap()
    } catch (error) {
      console.error('Error following user:', error)
    }
  }
  
  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!session?.user) return
    
    try {
      await dispatch(likePost(postId)).unwrap()
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }
  
  const handleRepost = async (postId: string, isReposted: boolean) => {
    if (!session?.user) return
    
    try {
      await dispatch(repostPost(postId)).unwrap()
    } catch (error) {
      console.error('Error reposting:', error)
    }
  }
  
  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }
  
  const isLoading = profileLoading || postsLoading
  
  if (isLoading && !profileData && !botData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }
  
  if (profileError && !profileData && !botData) {
    return (
      <div className="min-h-screen flex items-center justify-center font-english">
        <div className="text-center">
          <p className="text-xl mb-4">Profile not found</p>
          <Link href="/">
            <Button>Go back home</Button>
          </Link>
        </div>
      </div>
    )
  }
  
  // Get current profile data based on type with null safety
  const currentProfile = profileType === 'user' ? profileData : botData
  const isOwnProfile = profileType === 'user' && profileData && currentUser && profileData._id === currentUser._id
  
  const renderTabContent = (tabPosts: any[], emptyMessage: string, type ? : string) => {
    // Ensure tabPosts is an array
    const safePosts = Array.isArray(tabPosts) ? tabPosts : []
    
    if (safePosts.length === 0 && !pinnedPost) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>{emptyMessage}</p>
        </div>
      );
    }
    /**
     * <div class="grid grid-flow-col grid-rows-3 gap-4">
  <div class="row-span-3 ...">01</div>
  <div class="col-span-2 ...">02</div>
  <div class="col-span-2 row-span-2 ...">03</div>
</div>
     */
  if (type === 'media') {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 p-2">
      {safePosts.flatMap((_post, postIndex) => {
        if (_post.mediaType === 'image' && Array.isArray(_post.mediaUrls)) {
          return [
            // Date label (sticky)
            <span
              key={`date-${postIndex}`}
              className="col-span-full text-xs font-medium  p-2 sticky divide-y divide-dashed top-0 z-10"
            >
              {format(new Date(_post.createdAt), "do MMMM, yyyy")}
            </span>
            
            ,

            // Media images
            ..._post.mediaUrls.map((_url, urlIndex) => (
              <div
                key={`${postIndex}-${urlIndex}`}
                className="relative aspect-square overflow-hidden rounded-lg group"
              >
                <img
                  src={_url}
                  alt={`media-${postIndex}-${urlIndex}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ))
          ];
        }
        return [];
      })}
    </div>
  );
}
    return (
      <div>
        {/* Show pinned post only in posts tab */}
        {activeTab === "posts" && pinnedPost && (
          <div>
            <div className="flex items-center text-semibold text-sm px-4 py-2 bg-gray-50">
              <small>Pinned Post</small>
            </div>
            <PostCard
              key={pinnedPost._id}
              post={pinnedPost}
              onLike={handleLike}
              onRepost={handleRepost}
              onReply={() => {
                dispatch(fetchUserPosts(username))
              }}
            />
          </div>
        )}

        {safePosts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>{emptyMessage}</p>
          </div>
        ) : (
          safePosts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onLike={handleLike}
              onRepost={handleRepost}
              onReply={() => dispatch(fetchUserPosts(username))}
            />
          ))
        )}
      </div>
    );
  };
  
  // Bot-specific render method with null safety
  const renderBotInfo = () => {
    if (!botData) return null
    
    return (
      <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 text-blue-700">
          <Bot className="h-5 w-5" />
          <span className="font-semibold">Bot Account</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Type:</span>
            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
              botData.type === 'active' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              {botData.type}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-gray-500" />
            <span className="text-gray-700">{botData.shell}</span>
          </div>
          
          <div>
            <span className="font-medium text-gray-700">Owner:</span>
            <span className="ml-2 text-gray-600">
              {botData.ownerId?.username || botData.ownerId?.name || 'Unknown'}
            </span>
          </div>
          
          <div>
            <span className="font-medium text-gray-700">Email:</span>
            <span className="ml-2 text-gray-600">{botData.email}</span>
          </div>
        </div>

        {botData.script && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Code className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-gray-700">Script:</span>
            </div>
            <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm max-h-32 overflow-y-auto">
              <pre className="whitespace-pre-wrap">{botData.script}</pre>
            </div>
          </div>
        )}
      </div>
    )
  }
  
  // Early return if no profile data is available
  if (!currentProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 font-english">
      <Header profile={currentProfile} handleSignOut={handleSignOut}/>
      
      <div className="flex">
        {/* Main content */}
        <div className="flex-1 max-w-2xl mx-auto">
          <div className="border-x bg-white min-h-screen">
            <div className="sticky top-0 bg-white/50 z-30 backdrop-blur-md px-4 py-3">
              <div className="flex items-center gap-2">
                {profileType === 'bot' && <Bot className="h-5 w-5 text-blue-600" />}
                <h2 className="text-xl font-semibold flex flex-row gap-2 items-center">
                  {currentProfile?.displayName}
                  {profileType === 'user' && profileData?.isVerified && (
                    <VerificationBadge verified={true} size={20} className="h-8 w-8 z-10 bg-white rounded-full" />
                  )}
                </h2>
              </div>
              <p className="text-sm text-gray-500">
                {currentProfile?.postsCount || 0} posts
              </p>
            </div>

            {/* Cover Image */}
            <div className="relative">
              <div
                className={`w-full h-48 ${
                  profileType === 'bot' 
                    ? 'bg-gray-100' 
                    : 'bg-gray-100'
                }`}
                style={{
                  backgroundImage: currentProfile?.coverUrl ? `url(${currentProfile.coverUrl})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            </div>

            {/* Profile Header */}
            <div className="p-4 border-b relative">
              <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col items-center justify-center">
                  <Avatar className="w-24 h-24 -mt-12 border-4 border-white cursor-pointer" onClick={() => {
                    const avatarUrl = currentProfile?.avatarUrl
                    if (avatarUrl) setImageViewerOpen(avatarUrl)
                  }}>
                    <AvatarImage src={currentProfile?.avatarUrl || undefined} />
                    <AvatarFallback className="text-2xl">
                      {currentProfile?.displayName?.charAt(0)?.toUpperCase() || (profileType === 'bot' ? "B" : "U")}
                    </AvatarFallback>
                  </Avatar>
                  
                  {profileType === 'user' && profileData?.isVerified && (
                    <VerificationBadge verified={true} size={20} className="h-8 w-8 z-10 -mt-4 bg-white rounded-full" />
                  )}
                  {profileType === 'bot' && (
                    <div className="h-8 w-8 z-10 -mt-4 bg-blue-600 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <Button variant="outline"
                    className='rounded-full'
                    onClick={() => setEditDialogOpen(true)}>
                      Edit Profile
                    </Button>
                  ) : profileType === 'user' && session?.user && profileData?.public_send_message ? (
                    <>
                      <Button className='rounded-full' variant="outline"><MessageSquareShare className='w-4 h-4'/></Button>
                      <Button
                      className='rounded-full'
                      variant={profileData?.isFollowing ? "outline" : "default"} onClick={handleFollow}>
                        {profileData?.isFollowing ? (
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
                    </>
                  ) : profileType === 'bot' ? (
                    <Button className='rounded-full' variant="outline" disabled>
                      <Bot className="h-4 w-4 mr-1" />
                      Bot Account
                    </Button>
                  ) : (
                    <Link href="/auth/sign-in">
                      <Button className='rounded-full'>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Follow
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-2">
                <h1 className="text-xl font-semibold flex flex-col items-start justify-center">
                <div className='flex flex-row items-center gap-2'> {currentProfile?.displayName}
                  
                  {isOwnProfile &&  !profileData?.isVerified && (
                    <span className='rounded-full bg-gray-100 px-2 py-1 flex items-center gap-1 text-xs text-gray-800' onClick={()=>{
                      // handle verification request....
                      router.push('/settings/')
                    }}>
                                          <VerificationBadge verified={true} size={20} className="h-8 w-8 z-10 bg-white rounded-full text-gray-800" />
                        <small>Get Verified! </small>                  
                    </span>
                  )
                  }
                  </div>
                  <p className="text-gray-500 text-sm font-normal">
                    @{currentProfile?.username}
                  </p>
                </h1>
                
                {/* Bio/Description */}
                {currentProfile?.bio && (
                  <p className="text-gray-900">
                    {currentProfile.bio}
                  </p>
                )}

                {/* Bot-specific information */}
                {profileType === 'bot' && renderBotInfo()}

                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  {profileType === 'user' && profileData?.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profileData.location}
                    </div>
                  )}
                  {profileType === 'user' && profileData?.website && (
                    <div className="flex items-center gap-1">
                      <LinkIcon className="h-4 w-4" />
                      <a
                        href={profileData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {profileData.website}
                      </a>
                    </div>
                  )}
                  
                  {currentProfile?.createdAt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDistanceToNow(new Date(currentProfile.createdAt), { addSuffix: true })} joined
                    </div>
                  )}
                </div>

                <div className="flex gap-4 text-sm">
                  <span>
                    <strong>
                      {currentProfile?.followingCount || 0}
                    </strong> following
                  </span>
                  <span>
                    <strong>
                      {currentProfile?.followersCount || 0}
                    </strong> followers
                  </span>
                </div>
              </div>
              {profileType === 'user' && profileData && (
                <MutualFollowers targetUsername={profileData.username}/>
              )}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-white rounded-none h-12">
                <TabsTrigger
                  value="posts"
                  className="data-[state=active]:border-b-2 logo-font w-full pb-2 data-[state=active]:border-indigo-500 text-gray-800 rounded-none"
                >
                  logs
                </TabsTrigger>
                <TabsTrigger
                  value="replies"
                  className="data-[state=active]:border-b-2 w-full pb-2 data-[state=active]:border-indigo-500 rounded-none"
                >
                  Replies
                </TabsTrigger>
                <TabsTrigger
                  value="reposts"
                  className="data-[state=active]:border-b-2 w-full pb-2 data-[state=active]:border-indigo-500 rounded-none"
                >
                  Reposts
                </TabsTrigger>
                <TabsTrigger
                  value="media"
                  className="data-[state=active]:border-b-2 w-full pb-2 data-[state=active]:border-indigo-500 rounded-none"
                >
                  Media
                </TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="mt-0">
                {renderTabContent(posts, 
                  profileType === 'bot' ? "This bot hasn't posted anything yet" : "No posts yet"
                )}
              </TabsContent>

              <TabsContent value="replies" className="mt-0">
                {renderTabContent(replies, 
                  profileType === 'bot' ? "This bot hasn't replied to anything yet" : "No replies yet"
                )}
              </TabsContent>

              <TabsContent value="reposts" className="mt-0">
                {renderTabContent(reposts, 
                  profileType === 'bot' ? "This bot hasn't reposted anything yet" : "No reposts yet"
                )}
              </TabsContent>

              <TabsContent value="media" className="mt-0">
                {renderTabContent(media, 
                  profileType === 'bot' ? "This bot hasn't shared any media yet" : "No media yet"
                , 'media')}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setSidebarOpen(false)} />
      )}
      
      {/* Edit Profile Dialog - only for users */}
      {isOwnProfile && profileType === 'user' && profileData && (
        <EditProfileDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          profile={profileData}
          onProfileUpdate={(updatedProfile) => {
            // The Redux store will be updated automatically via the updateProfile action
            // No need for manual state updates here
          }}
        />
      )}
      
      {/* Image Viewer */}
      {imageViewerOpen && (
        <ImageViewer
          src={imageViewerOpen}
          isOpen={true}
          onClose={() => setImageViewerOpen(null)}
        />
      )}
    </div>
  )
}