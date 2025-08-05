// store/slices/profileSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

export interface ProfileData {
  _id: string
  username: string
  displayName: string
  bio: string | null
  avatarUrl: string | null
  bannerUrl: string | null
  coverUrl: string | null
  website: string | null
  location: string | null
  createdAt: string
  postsCount: number
  isVerified: boolean
  followersCount: number
  followingCount: number
  isFollowing: boolean
  pinnedPostId?: string | null
  public_send_message?: boolean
}

export interface BotData {
  _id: string
  displayName: string
  dio: string
  username: string
  email: string
  script: string
  shell: string
  type: string
  avatarUrl: string | null
  coverUrl: string | null
  followersCount: number
  followingCount: number
  postsCount: number
  ownerId: {
    _id: string
    name?: string
    email?: string
    username?: string
  }
  createdAt: string
}

export interface MutualFollower {
  _id: string
  username: string
  displayName: string
  avatarUrl: string | null
}

interface ProfileState {
  profileData: ProfileData | null
  botData: BotData | null
  profileType: 'user' | 'bot'
  mutualFollowers: MutualFollower[]
  mutualFollowersCount: number
  isLoading: boolean
  error: string | null
  isUpdating: boolean
  uploadingAvatar: boolean
  uploadingCover: boolean
}

const initialState: ProfileState = {
  profileData: null,
  botData: null,
  profileType: 'user',
  mutualFollowers: [],
  mutualFollowersCount: 0,
  isLoading: false,
  error: null,
  isUpdating: false,
  uploadingAvatar: false,
  uploadingCover: false,
}

// Async thunks
export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async (username: string, { rejectWithValue }) => {
    try {
      // First try to fetch as a regular user
      const userResponse = await fetch(`/api/users/${username}`)
      
      if (userResponse.ok) {
        const data = await userResponse.json()
        return { type: 'user' as const, data }
      } else {
        // Try to fetch as a bot
        const botResponse = await fetch(`/api/bots/${username}`)
        
        if (botResponse.ok) {
          const data = await botResponse.json()
          return { type: 'bot' as const, data }
        } else {
          throw new Error('Profile not found')
        }
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch profile')
    }
  }
)

export const followUser = createAsyncThunk(
  'profile/followUser',
  async (username: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/users/${username}/follow`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to follow/unfollow user')
      }
      
      const result = await response.json()
      return result
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to follow user')
    }
  }
)

export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async (updateData: Partial<ProfileData>, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }
      
      const updatedProfile = await response.json()
      return updatedProfile
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update profile')
    }
  }
)

export const uploadImage = createAsyncThunk(
  'profile/uploadImage',
  async ({ file, type }: { file: File; type: 'avatar' | 'cover' }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('files', file)

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Upload failed')
      }

      const responseData = await uploadResponse.json()
      return { type, url: responseData.files[0].url }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to upload image')
    }
  }
)

export const fetchMutualFollowers = createAsyncThunk(
  'profile/fetchMutualFollowers',
  async (username: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/users/${username}/mutual-followers`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch mutual followers')
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch mutual followers')
    }
  }
)

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfile: (state) => {
      state.profileData = null
      state.botData = null
      state.mutualFollowers = []
      state.mutualFollowersCount = 0
      state.error = null
    },
    setUploadingAvatar: (state, action: PayloadAction<boolean>) => {
      state.uploadingAvatar = action.payload
    },
    setUploadingCover: (state, action: PayloadAction<boolean>) => {
      state.uploadingCover = action.payload
    },
    updateProfileField: (state, action: PayloadAction<Partial<ProfileData>>) => {
      if (state.profileData) {
        state.profileData = { ...state.profileData, ...action.payload }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch profile
      .addCase(fetchProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.profileType = action.payload.type
        
        if (action.payload.type === 'user') {
          state.profileData = action.payload.data.user
          state.botData = null
        } else {
          state.botData = action.payload.data.bot
          state.profileData = null
        }
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.profileData = null
        state.botData = null
      })
      
      // Follow user
      .addCase(followUser.pending, (state) => {
        state.isUpdating = true
      })
      .addCase(followUser.fulfilled, (state, action) => {
        state.isUpdating = false
        if (state.profileData) {
          state.profileData.isFollowing = action.payload.following
          state.profileData.followersCount += action.payload.following ? 1 : -1
        }
      })
      .addCase(followUser.rejected, (state, action) => {
        state.isUpdating = false
        state.error = action.payload as string
      })
      
      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.isUpdating = true
        state.error = null
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isUpdating = false
        if (state.profileData) {
          state.profileData = { ...state.profileData, ...action.payload }
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isUpdating = false
        state.error = action.payload as string
      })
      
      // Upload image
      .addCase(uploadImage.pending, (state, action) => {
        if (action.meta.arg.type === 'avatar') {
          state.uploadingAvatar = true
        } else {
          state.uploadingCover = true
        }
      })
      .addCase(uploadImage.fulfilled, (state, action) => {
        const { type, url } = action.payload
        
        if (type === 'avatar') {
          state.uploadingAvatar = false
          if (state.profileData) {
            state.profileData.avatarUrl = url
          }
        } else {
          state.uploadingCover = false
          if (state.profileData) {
            state.profileData.coverUrl = url
          }
        }
      })
      .addCase(uploadImage.rejected, (state, action) => {
        state.uploadingAvatar = false
        state.uploadingCover = false
        state.error = action.payload as string
      })
      
      // Fetch mutual followers
      .addCase(fetchMutualFollowers.fulfilled, (state, action) => {
        state.mutualFollowers = action.payload.followers || []
        state.mutualFollowersCount = action.payload.totalCount || 0
      })
  },
})

export const { 
  clearProfile, 
  setUploadingAvatar, 
  setUploadingCover, 
  updateProfileField 
} = profileSlice.actions

export default profileSlice.reducer