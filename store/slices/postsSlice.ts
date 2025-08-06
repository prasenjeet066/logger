// store/slices/postsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { Post } from '@/types/post'

interface PostsState {
  posts: Post[]
  replies: Post[]
  reposts: Post[]
  media: Post[]
  pinnedPost: Post | null
  isLoading: boolean
  error: string | null
}

interface nsfwResults {
  fileName: string
  label: string
  score: number
  error ? : string
} []

const initialState: PostsState = {
  posts: [],
  replies: [],
  reposts: [],
  media: [],
  pinnedPost: null,
  isLoading: false,
  error: null,
  nsfwResults: [], // NEW
}

// Async thunks
export const fetchUserPosts = createAsyncThunk(
  'posts/fetchUserPosts',
  async (username: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/users/${username}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts')
      }
      
      const { posts: userPosts } = await response.json()
      return userPosts
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch posts')
    }
  }
)

export const fetchUserReposts = createAsyncThunk(
  'posts/fetchUserReposts',
  async (username: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/users/${username}/reposts`)
      
      if (!response.ok) {
        return [] // Return empty array if reposts endpoint fails
      }
      
      const reposts = await response.json()
      return reposts
    } catch (error) {
      return [] // Return empty array on error
    }
  }
)
// store/slices/postsSlice.ts

export const nsfwMedia = createAsyncThunk(
  'posts/nsfwMedia',
  async (mediaFiles: File[], { rejectWithValue }) => {
    try {
      const results = []
      
      for (const file of mediaFiles) {
        const formData = new FormData()
        formData.append("image", file)
        
        const response = await fetch('/api/context/ai/factCheck/nsfw', {
          method: 'POST',
          body: formData,
        })
        
        if (!response.ok) {
          results.push({ fileName: file.name, error: 'Detection failed' })
          continue
        }
        
        const result = await response.json()
        results.push({
          fileName: file.name,
          label: result.label,
          score: result.score,
        })
      }
      
      return results
    } catch (e) {
      return rejectWithValue("NSFW check failed")
    }
  }
)
export const fetchPinnedPost = createAsyncThunk(
  'posts/fetchPinnedPost',
  async (postId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/post/${postId}`)
      
      if (!response.ok) {
        return null
      }
      
      const pinnedPost = await response.json()
      return pinnedPost
    } catch (error) {
      return null
    }
  }
)

export const likePost = createAsyncThunk(
  'posts/likePost',
  async (postId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to like post')
      }
      
      const result = await response.json()
      return { postId, liked: result.liked }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to like post')
    }
  }
)

export const repostPost = createAsyncThunk(
  'posts/repostPost',
  async (postId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/posts/${postId}/repost`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to repost')
      }
      
      const result = await response.json()
      return { postId, reposted: result.reposted }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to repost')
    }
  }
)

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    clearPosts: (state) => {
      state.posts = []
      state.replies = []
      state.reposts = []
      state.media = []
      state.pinnedPost = null
      state.error = null
    },
    updatePost: (state, action: PayloadAction < Partial < Post > & { _id: string } > ) => {
      const updatePostInArray = (posts: Post[]) =>
        posts.map((post) =>
          post._id === action.payload._id ? { ...post, ...action.payload } : post
        )
      
      state.posts = updatePostInArray(state.posts)
      state.replies = updatePostInArray(state.replies)
      state.reposts = updatePostInArray(state.reposts)
      state.media = updatePostInArray(state.media)
      
      if (state.pinnedPost && state.pinnedPost._id === action.payload._id) {
        state.pinnedPost = { ...state.pinnedPost, ...action.payload }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user posts
      .addCase(fetchUserPosts.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchUserPosts.fulfilled, (state, action) => {
        state.isLoading = false
        const userPosts = action.payload || []
        
        state.posts = userPosts.filter((post: Post) => !post.parentPostId && !post.isRepost)
        state.replies = userPosts.filter((post: Post) => post.parentPostId)
        state.media = userPosts.filter((post: Post) => post.mediaUrls && post.mediaUrls.length > 0)
      })
      .addCase(fetchUserPosts.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(nsfwMedia.fulfilled, (state, action) => {
        state.nsfwResults = action.payload || []
      })
      .addCase(nsfwMedia.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Fetch reposts
      .addCase(fetchUserReposts.fulfilled, (state, action) => {
        state.reposts = action.payload
      })
      
      // Fetch pinned post
      .addCase(fetchPinnedPost.fulfilled, (state, action) => {
        state.pinnedPost = action.payload
      }).addCase(likePost.fulfilled, (state, action) => {
        const { postId, liked } = action.payload
        
        const updatePostLike = (posts: Post[]) =>
          posts.map((post) =>
            post._id === postId ?
            {
              ...post,
              isLiked: liked,
              likesCount: post.likesCount + (liked ? 1 : -1),
            } :
            post
          )
        
        state.posts = updatePostLike(state.posts)
        state.replies = updatePostLike(state.replies)
        state.reposts = updatePostLike(state.reposts)
        state.media = updatePostLike(state.media)
        
        if (state.pinnedPost && state.pinnedPost._id === postId) {
          state.pinnedPost = {
            ...state.pinnedPost,
            isLiked: liked,
            likesCount: state.pinnedPost.likesCount + (liked ? 1 : -1),
          }
        }
      })
      
      // Repost
      .addCase(repostPost.fulfilled, (state, action) => {
        const { postId, reposted } = action.payload
        
        const updatePostRepost = (posts: Post[]) =>
          posts.map((post) =>
            post._id === postId ?
            {
              ...post,
              isReposted: reposted,
              repostsCount: post.repostsCount + (reposted ? 1 : -1),
            } :
            post
          )
        
        state.posts = updatePostRepost(state.posts)
        state.replies = updatePostRepost(state.replies)
        state.reposts = updatePostRepost(state.reposts)
        state.media = updatePostRepost(state.media)
        
        if (state.pinnedPost && state.pinnedPost._id === postId) {
          state.pinnedPost = {
            ...state.pinnedPost,
            isReposted: reposted,
            repostsCount: state.pinnedPost.repostsCount + (reposted ? 1 : -1),
          }
        }
      })
  },
})

export const { clearPosts, updatePost } = postsSlice.actions

export default postsSlice.reducer