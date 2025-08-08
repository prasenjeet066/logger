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
import { ArrowLeft, User, Lock, Key } from "lucide-react"
import Link from "next/link"
import {
  AccountSettings,
  EditProfile,
  PrivacyAndPersonalSettings,
  PasswordAndSecuritySettings,
} from "@/components/settings/options"

interface SettingsContentProps {
  user: any
  slug: string[]
}

interface BreadcrumbItemType {
  label: string
  component ? : JSX.Element
}

export const SettingsContent: React.FC < SettingsContentProps > = ({ user, slug = null }) => {
  const router = useRouter()
  
  const [breadcrumbTrail, setBreadcrumbTrail] = useState < BreadcrumbItemType[] > ([
    { label: "Settings" }
  ])
  const [currentSection, setCurrentSection] = useState < JSX.Element | null > (null)
  
  const SettingsMenusList = [
  {
    name: "Account",
    icon: User,
    _component: <AccountSettings userData={user}  />,
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
  }, {
      name: ['Edit Profile'],
      _component: <EditProfile user={userData} />,
      icon: Pen
    }]
  
  // Dynamic navigation for nested links
  
  
  // Initialize based on slug
  useEffect(() => {
    
    if (slug && !slug==null && slug.length > 0) {
      const slugString = slug[0].replace('_', ' ')
      const matchedSetting = SettingsMenusList.find(
        item => item.name.toLowerCase() === slugString.toLowerCase()
      )
      
      if (matchedSetting) {
        setCurrentSection(matchedSetting._component)
        setBreadcrumbTrail([
          { label: "Settings" },
          { label: matchedSetting.name, component: matchedSetting._component }
        ])
      }
    }
  }, [slug])
  
  const handleBack = () => {
    if (breadcrumbTrail.length > 2) {
      const newTrail = [...breadcrumbTrail]
      newTrail.pop()
      const last = newTrail[newTrail.length - 1]
      setBreadcrumbTrail(newTrail)
      setCurrentSection(last.component || null)
    } else {
      setCurrentSection(null)
      setBreadcrumbTrail([{ label: "Settings" }])
      router.push('/settings')
    }
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
                        <Link href={`/settings/${crumb.label.toLowerCase().replace(' ', '_')}`}>
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
            {SettingsMenusList.map((Setting, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full rounded-none border-b justify-start text-gray-800 hover:bg-gray-100 p-4 h-auto"
                onClick={() => {
                  setBreadcrumbTrail([
                    { label: "Settings" },
                    { label: Setting.name, component: Setting._component },
                  ])
                  setCurrentSection(Setting._component)
                  router.push(`/${Setting.name.toLowerCase().replace(' ', '_')}`)
                }}
              >
                <Setting.icon className="h-5 w-5 mr-3" />
                <span className="font-semibold">{Setting.name}</span>
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