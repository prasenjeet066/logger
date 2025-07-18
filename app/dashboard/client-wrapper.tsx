"use client"

import { useMobile } from "@/hooks/use-mobile"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { WebDashboardContent } from "@/components/dashboard/web/dashboard-content"

interface DashboardWrapperProps {
  user: {
    id: string
    email: string
    username: string
    avatarUrl?: string
  }
}

export function DashboardWrapper({ user }: DashboardWrapperProps) {
  const isMobile = useMobile()
  
  if (isMobile) {
    return <DashboardContent user={user} />
  } else {
    return <WebDashboardContent user={user} />
  }
}