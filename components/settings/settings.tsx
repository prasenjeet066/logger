"use client"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Settings, MoreHorizontal, UserPlus, ArrowLeft, User, Lock, Key } from "lucide-react"
import { useRouter } from "next/navigation"
import { VerificationBadge } from "@/components/badge/verification-badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { debounce } from "lodash"
import { signOut } from "next-auth/react"
import { Spinner } from "@/components/loader/spinner"
import { PostCard } from "@/components/dashboard/post-card"
import { AccountSettings, PrivacyAndPersonalSettings, PasswordAndSecuritySettings } from '@/components/settings/options'
// Import or define your Settings components
// import { Settings } from "@/components/settings" // Uncomment and adjust path as needed

// Placeholder components - replace with your actual components


export const SettingsContent = ({ user, t }) => {
  const router = useRouter()
  
  const SettingsMenusList = [
  {
    name: 'Account',
    icon: User,
    _component: <AccountSettings/> // Use the placeholder component
  },
  {
    name: 'Privacy and Personal',
    icon: Lock,
    _component: <PrivacyAndPersonalSettings/> // Use the placeholder component
  },
  {
    name: 'Password and Security',
    icon: Key,
    _component: <PasswordAndSecuritySettings/> // Use the placeholder component
  }]
  
  const [currentSection, setCurrentSection] = useState(null)
  const [currentSectionLb, setCurrentSectionLb] = useState(null)
  useEffect(() => {
    t = decodeURIComponent(t)
    if (t !== null && t.length > 2) {
      const foundSetting = SettingsMenusList.find(item => item.name === t)
      if (foundSetting) {
        setCurrentSection(foundSetting._component)
        setCurrentSectionLb(foundSetting.name)
      } else {
        setCurrentSectionLb(null)
        setCurrentSection(null)
      }
    } else {
      setCurrentSectionLb(null)
      setCurrentSection(null)
    }
  }, [t]) // Remove SettingsMenusList from dependencies to avoid infinite re-renders
  
  const handleSettingClick = (component) => {
    setCurrentSection(component)
  }
  
  return (
    <div className='w-screen'>
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="flex items-center px-4 py-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => currentSection !== null ? setCurrentSection(null) : router.back()} 
            className="mr-8"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Settings and Privacy</h1>
        </div>
      </header>
      
      <div className="p-4">
        
        {currentSection === null ? (
          <div className="space-y-2">
            {SettingsMenusList.map((Setting, index) => (
              <Button 
                key={index}
                variant="ghost" 
                className="w-full justify-start bg-none text-gray-800 hover:bg-gray-100 p-4 h-auto"
                onClick={() =>{
               setCurrentSectionLb(Setting.name)
                handleSettingClick(Setting._component)}}
              >
                <Setting.icon className="h-5 w-5 mr-3" />
                <span className='font-semibold'>{Setting.name}</span>
              </Button>
            ))}
          </div>
        ) : (
          <div>
            <div>
              


    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/settings">Settings</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={"/settings?t="+ encodeURIComponent(currentSectionLb)}>{currentSectionLb}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )

            </div>
            {currentSection}
          </div>
        )}
      </div>
    </div>
  )
}