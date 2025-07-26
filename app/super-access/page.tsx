'use client'
import { useSession } from "next-auth/react"
import { useMobile } from "@/hooks/use-mobile"
import { useMobile } from "@/hooks/use-mobile"
import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import {Header} from "@/components/dashboard/utils/header"
export default function SuperAccess() {
  const { data: session, status } = useSession()
  const isMobile = useMobile()
  const router = useRouter()
  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }
  return (
    <>
      <div className = "min-h-screen bg-gray-50 font-english" > { " " }
        <Header profile = {profileData} handleSignOut = {handleSignOut}/>
        <div className='flex'>
          {
            isMobile && (
              <div>
              </div>
            )
          }
        </div>
      </div>
    </>
  )
}