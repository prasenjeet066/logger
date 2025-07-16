"use client"

import { ProfileContent } from "@/components/profile/profile-content"
import { useSession } from "next-auth/react"

export default function ProfilePage({ params }: { params: { username: string } }) {
  const { data: session, status } = useSession()

  // If not logged in, redirect to sign-in page
  // This might be too aggressive if profiles are public.
  // Consider if public profiles should be viewable without login.
  // For now, assuming profiles are public but actions require login.
  // if (status === "unauthenticated") {
  //   redirect("/auth/sign-in")
  // }

  return <ProfileContent username={params.username} />
}
