'use client'

import { ProfileContent } from "@/components/profile/profile-content"
import { WebProfileContent } from "@/components/profile/web/profile-content"
import { useSession } from "next-auth/react"
import { useMobile } from "@/hooks/use-mobile"
export default function ProfilePage({ params }: { params: { username: string } }) {
  const isMobile = useMobile()
  const { data: session, status } = useSession()
  
  

  // If not logged in, redirect to sign-in page
  // This might be too aggressive if profiles are public.
  // Consider if public profiles should be viewable without login.
  // For now, assuming profiles are public but actions require login.
  // if (status === "unauthenticated") {
  //   redirect("/auth/sign-in")
  // }
  if (isMobile) {
    return <ProfileContent username={params.username} />
    
  } else if(!isMobile){
    return <WebProfileContent username={params.username} />
  }
  
}
