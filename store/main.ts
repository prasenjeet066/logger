// store/index.ts
import { configureStore } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import profileReducer from './slices/profileSlice'
import postsReducer from './slices/postsSlice'
import authReducer from './slices/authSlice'

export const store = configureStore({
  reducer: {
    profile: profileReducer,
    posts: postsReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export type RootState = ReturnType < typeof store.getState >
  export type AppDispatch = typeof store.dispatch

// Typed hooks
export const useAppDispatch = () => useDispatch < AppDispatch > ()
export const useAppSelector: TypedUseSelectorHook < RootState > = useSelector
