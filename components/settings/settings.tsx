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
  PrivacyAndPersonalSettings,
  PasswordAndSecuritySettings,
} from "@/components/settings/options"

interface SettingsContentProps {
  user: any
  t: string
}

interface BreadcrumbItemType {
  label: string
  component: JSX.Element
}

export const SettingsContent: React.FC<SettingsContentProps> = ({ user, t }) => {
  const router = useRouter()

  const [breadcrumbTrail, setBreadcrumbTrail] = useState<BreadcrumbItemType[]>([])
  const [currentSection, setCurrentSection] = useState<JSX.Element | null>(null)

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

  // Dynamic navigation for nested links
  function sendPathLink(_obj: {
    name: string | string[]
    icon: any
    _component: JSX.Element
  }) {
    if (!_obj || !Object.keys(_obj).length) return

    const label =
      typeof _obj.name === "string"
        ? _obj.name
        : Array.isArray(_obj.name)
        ? _obj.name.join(" / ")
        : "Unknown"
    const matchedItem = SettingsMenusList.find(item => item.name === _obj.name);
    if (matchedItem) {
      setCurrentSection(matchedItem._component)
      setBreadcrumbTrail(matchedItem.name)
    }else{
    const newCrumb:BreadcrumbItemType = {
      label,
      component: _obj._component,
    }

    setBreadcrumbTrail((prev) => [...prev, newCrumb])
    setCurrentSection(_obj._component)
  }
  }

  // Initialize based on query param
  useEffect(() => {
    const decoded = decodeURIComponent(t)
    if (decoded && decoded.length > 2) {
      const foundSetting = SettingsMenusList.find((item) => item.name === decoded)
      if (foundSetting) {
        setCurrentSection(foundSetting._component)
        setBreadcrumbTrail([{ label: "Settings" }, { label: foundSetting.name, component: foundSetting._component }])
      } else {
        setCurrentSection(null)
        setBreadcrumbTrail([{ label: "Settings" }])
      }
    } else {
      setCurrentSection(null)
      setBreadcrumbTrail([{ label: "Settings" }])
    }
  }, [t])

  const handleBack = () => {
    if (breadcrumbTrail.length > 2) {
      const newTrail = [...breadcrumbTrail]
      newTrail.pop()
      const last = newTrail[newTrail.length - 1]
      setBreadcrumbTrail(newTrail)
      setCurrentSection(last.component)
    } else {
      setCurrentSection(null)
      setBreadcrumbTrail([{ label: "Settings" }])
    }
  }

  return (
    <div className="w-screen">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="flex items-center px-4 py-3">
          <Button variant="ghost" size="icon" onClick={handleBack} className="mr-8">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col justify-start">
            <h1 className="text-lg font-semibold">Settings and Privacy</h1>
            <Breadcrumb className="text-sm">
              <BreadcrumbList>
                {breadcrumbTrail.map((crumb, index) => (
                  <Fragment key={index}>
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link href={`/settings?t=${encodeURIComponent(crumb.label)}`}>
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

      <div className="p-4">
        {currentSection === null ? (
          <div className="space-y-2">
            {SettingsMenusList.map((Setting, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start text-gray-800 hover:bg-gray-100 p-4 h-auto"
                onClick={() => {
                  setBreadcrumbTrail([
                    { label: "Settings" },
                    { label: Setting.name, component: Setting._component },
                  ])
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