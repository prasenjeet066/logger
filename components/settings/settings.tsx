"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Settings, MoreHorizontal, UserPlus, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { VerificationBadge } from "@/components/badge/verification-badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { debounce } from "lodash"
import { signOut } from "next-auth/react"
import { Spinner } from "@/components/loader/spinner"
import { PostCard } from "@/components/dashboard/post-card" // Import PostCard
export const SettingsContent = () =>
{
  return (
    <div className='w-screen'>
       <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="flex items-center px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-8">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Settings and Privacy</h1>
          </div>
          </header>
          <div>
            
          </div>
    </div>
  )
}