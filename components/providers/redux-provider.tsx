// components/providers/redux-provider.tsx
"use client"

import { Provider } from 'react-redux'
import { store } from '@/store/main.ts'

interface ReduxProviderProps {
  children: React.ReactNode
}

export function ReduxProvider({ children }: ReduxProviderProps) {
  return <Provider store={store}>{children}</Provider>
}