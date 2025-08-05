// store/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

interface CurrentUser {
  _id: string
  username: string
  displayName: string
  email: string
  avatarUrl: string | null
  isVerified: boolean
}

interface AuthState {
  currentUser: CurrentUser | null
  isLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  currentUser: null,
  isLoading: false,
  error: null,
}

// Async thunks
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/users/current')
      
      if (!response.ok) {
        throw new Error('Failed to fetch current user')
      }
      
      const currentUser = await response.json()
      return currentUser
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch current user')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearCurrentUser: (state) => {
      state.currentUser = null
      state.error = null
    },
    updateCurrentUser: (state, action: PayloadAction<Partial<CurrentUser>>) => {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentUser = action.payload
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.currentUser = null
      })
  },
})

export const { clearCurrentUser, updateCurrentUser } = authSlice.actions

export default authSlice.reducer