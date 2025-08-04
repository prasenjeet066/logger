"use client"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Lock, Key } from "lucide-react"
import Link from "next/link"
import {
  AccountSettings,
  PrivacyAndPersonalSettings,
  PasswordAndSecuritySettings,
} from "@/components/settings/options"

interface SettingsContentProps {
  user: any
  t: string
}

export const SettingsContent: React.FC<SettingsContentProps> = ({ user, t }) => {
  const router = useRouter()
  const [additionalObj, setAdditionalObj] = useState<any>(null)
  const [currentSection, setCurrentSection] = useState<JSX.Element | null>(null)
  const [currentSectionLb, setCurrentSectionLb] = useState<string | null>(null)

  const sendPathLink = (_obj: {
    name: string | string[]
    icon: any
    _component: JSX.Element
  }) => {
    if (_obj && Object.keys(_obj).length) {
      setCurrentSection(_obj._component)
      const label =
        typeof _obj.name === "string"
          ? _obj.name
          : Array.isArray(_obj.name)
          ? _obj.name.join(" / ")
          : ""
      setCurrentSectionLb(label)
      setAdditionalObj(_obj)
    }
  }

  const SettingsMenusList = [
    {
      name: "Account",
      icon: User,
      _component: <AccountSettings userData={user} sendPathLink={sendPathLink} />,
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
  ]

  useEffect(() => {
    const decoded = decodeURIComponent(t)
    if (decoded && decoded.length > 2) {
      const foundSetting = SettingsMenusList.find((item) => item.name === decoded)
      if (foundSetting) {
        setCurrentSection(foundSetting._component)
        setCurrentSectionLb(foundSetting.name)
      } else {
        setCurrentSection(null)
        setCurrentSectionLb(null)
      }
    } else {
      setCurrentSection(null)
      setCurrentSectionLb(null)
    }
  }, [t])

  return (
    <div className="w-screen">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="flex items-center px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (currentSection !== null ? setCurrentSection(null) : router.back())}
            className="mr-8"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col justify-start">
            <h1 className="text-lg font-semibold">Settings and Privacy</h1>
            <Breadcrumb className="text-sm">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/settings">Settings</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {currentSectionLb && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link href={`/settings?t=${encodeURIComponent(currentSectionLb)}`}>
                          {currentSectionLb}
                        </Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      </header>

      <div className="p-4">
        {currentSection === null ? (
          <div className="space-y-2">
            {SettingsMenusList.map((Setting, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start text-gray-800 hover:bg-gray-100 p-4 h-auto"
                onClick={() => {
                  setCurrentSectionLb(Setting.name)
                  setCurrentSection(Setting._component)
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