import { useState } from "react"

import { Button } from "@/components/ui/button"

import { Menu, UserIcon, Plus, Search } from "lucide-react"

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sidebar } from "@/components/dashboard/sidebar"
import Link from "next/link"
import type { IUser } from "@/lib/mongodb/models/User" // Import IUser type


export const Header = ({profile,handleSignOut}) => {
  return (
    <div className="lg:hidden sticky top-0 border-none bg-white bg-white/50 z-30 backdrop-blur-md px-4 py-2">
        <div className="flex items-center justify-between">
          <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80">
                <Sidebar profile={profile} onSignOut={handleSignOut} />
              </SheetContent>
            </Sheet>
          <h1 className="text-xl font-bold logo-font">Cōdes</h1>
          <div className="flex flex-row w-full items-center gap-4 justify-end">
            
            
          <Link href="/create">
          <Button size="icon" className="rounded-full h-8 w-8 border-2 bg-[transparent] border-gray-100 text-gray-800">
            <Plus className="h-6 w-6" />
          </Button>
        </Link>


            <Link href={`/profile/${profile?.username}`}>
              <Avatar className="h-8 w-8">
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