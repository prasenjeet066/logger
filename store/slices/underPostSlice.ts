// store/slices/createPostSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import type { UploadResult } from "@/lib/blob/client"

interface GiphyMedia {
  url: string
  type: "gif" | "sticker"
  id: string
}

interface CreatePostState {
  uploadedFiles: UploadResult[]
  giphyMedia: GiphyMedia[]
  isPosting: boolean
  error: string | null
  isPosted: boolean
  poll: {
    show: boolean
    question: string
    options: string[]
    duration: string
  }
}

const initialState: CreatePostState = {
  uploadedFiles: [],
  giphyMedia: [],
  isPosting: false,
  error: null,
  isPosted: false,
  poll: {
    show: false,
    question: "",
    options: ["", ""],
    duration: "1 day",
  },
}

const createPostSlice = createSlice({
  name: "createPost",
  initialState,
  reducers: {
    setUploadedFiles(state, action: PayloadAction < UploadResult[] > ) {
      state.uploadedFiles = action.payload
    },
    addUploadedFiles(state, action: PayloadAction < UploadResult[] > ) {
      state.uploadedFiles.push(...action.payload)
    },
    removeUploadedFile(state, action: PayloadAction < string > ) {
      state.uploadedFiles = state.uploadedFiles.filter(f => f.url !== action.payload)
    },
    setGiphyMedia(state, action: PayloadAction < GiphyMedia[] > ) {
      state.giphyMedia = action.payload
    },
    addGiphyMedia(state, action: PayloadAction < GiphyMedia > ) {
      state.giphyMedia.push(action.payload)
    },
    removeGiphyMedia(state, action: PayloadAction < string > ) {
      state.giphyMedia = state.giphyMedia.filter(gif => gif.id !== action.payload)
    },
    setIsPosting(state, action: PayloadAction < boolean > ) {
      state.isPosting = action.payload
    },
    setError(state, action: PayloadAction < string | null > ) {
      state.error = action.payload
    },
    setIsPosted(state, action: PayloadAction < boolean > ) {
      state.isPosted = action.payload
    },
    resetPostState(state) {
      state.uploadedFiles = []
      state.giphyMedia = []
      state.isPosting = false
      state.error = null
      state.isPosted = false
      state.poll = {
        show: false,
        question: "",
        options: ["", ""],
        duration: "1 day",
      }
    },
    setPoll(state, action: PayloadAction < Partial < CreatePostState["poll"] >> ) {
      state.poll = { ...state.poll, ...action.payload }
    },
  },
})

export const {
  setUploadedFiles,
  addUploadedFiles,
  removeUploadedFile,
  setGiphyMedia,
  addGiphyMedia,
  removeGiphyMedia,
  setIsPosting,
  setError,
  setIsPosted,
  resetPostState,
  setPoll,
} = createPostSlice.actions

export default createPostSlice.reducer