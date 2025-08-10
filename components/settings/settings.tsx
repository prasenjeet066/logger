"use client"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useEffect, useState, Fragment } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Lock, Key, Pen } from "lucide-react"
import Link from "next/link"
import {
  AccountSettings,
  EditProfile,
  PrivacyAndPersonalSettings,
  PasswordAndSecuritySettings,
  VerificationRequest
} from "@/components/settings/options"

interface SettingsContentProps {
  user: any
  slug ? : string[]
}

interface BreadcrumbItemType {
  label: string
  component ? : JSX.Element
}

interface SettingsMenuItem {
  name: string
  icon: React.ComponentType < any >
    _component: JSX.Element
}

export const SettingsContent: React.FC < SettingsContentProps > = ({ user, slug = [] }) => {
  const router = useRouter()
  
  const [breadcrumbTrail, setBreadcrumbTrail] = useState < BreadcrumbItemType[] > ([
    { label: "Settings" }
  ])
  const [currentSection, setCurrentSection] = useState < JSX.Element | null > (null)
  
  const SettingsMenusList: SettingsMenuItem[] = [
  {
    name: "Account",
    icon: User,
    _component: <AccountSettings userData={user} />,
  },
  {
    name: "Privacy and Personal",
    icon: Lock,
    _component: <PrivacyAndPersonalSettings />,
  },
  {
    name: "Password and Security",
    icon: Key,
    _component: <PasswordAndSecuritySettings />,
  },
  {
    name: "Edit Profile",
    icon: Pen,
    _component: <EditProfile user={user} />,
  },
  {
    name: "Verification Request",
    icon: User,
    _component: <VerificationRequest userId={user?.id} />,
  }]
  
  // Initialize based on slug
  useEffect(() => {
    if (slug && slug.length > 0) {
      const slugString = slug[0].replace(/_/g, ' ')
      const matchedSetting = SettingsMenusList.find(
        item => item.name.toLowerCase() === slugString.toLowerCase()
      )
      
      if (matchedSetting) {
        setCurrentSection(matchedSetting._component)
        setBreadcrumbTrail([
          { label: "Settings" },
          { label: matchedSetting.name, component: matchedSetting._component }
        ])
      } else {
        // If no match found, redirect to main settings
        setCurrentSection(null)
        setBreadcrumbTrail([{ label: "Settings" }])
      }
    } else {
      // No slug, show main settings
      setCurrentSection(null)
      setBreadcrumbTrail([{ label: "Settings" }])
    }
  }, [slug, user])
  
  const handleBack = () => {
    if (breadcrumbTrail.length > 1) {
      setCurrentSection(null)
      setBreadcrumbTrail([{ label: "Settings" }])
      router.push('/settings')
    }
  }
  
  const handleSettingClick = (setting: SettingsMenuItem) => {
    
    // Update URL
    const slugName = setting.name.toLowerCase().replace(' ', '_')
    router.push(`/settings/${slugName}`)
  }
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="flex items-center px-4 py-3">
          
            <Button variant="ghost" size="icon" onClick={handleBack} className="mr-4">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          
          <div className="flex flex-col justify-start">
            <h1 className="text-lg font-semibold">Settings and Privacy</h1>
            <Breadcrumb className="text-xs">
              <BreadcrumbList>
                {breadcrumbTrail.map((crumb, index) => (
                  <Fragment key={index}>
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link href={index === 0 ? "/settings" : `/settings/${crumb.label.toLowerCase().replace(' ', '_')}`}>
                          {crumb.label}
                        </Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      </header>

      <div className="p-4 pt-2">
        {currentSection === null ? (
          <div className="space-y-2">
            {SettingsMenusList.map((setting, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full rounded-none border-b justify-start text-gray-800 hover:bg-gray-100 p-4 h-auto"
                onClick={() => handleSettingClick(setting)}
              >
                <setting.icon className="h-5 w-5 mr-3" />
                <span className="font-semibold">{setting.name}</span>
              </Button>
            ))}
          </div>
        ) : (
          <div>{currentSection}</div>
        )}
      </div>
    </div>
  )
}