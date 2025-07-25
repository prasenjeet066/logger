'use client'
import { useSession } from "next-auth/react"
import { useMobile } from "@/hooks/use-mobile"

export default function SuperAccess() {
  const { data: session, status } = useSession()
  return (
    <>
      
    </>
  )
}