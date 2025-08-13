"use client"

import { ProfileContent } from "@/components/profile/profile-content"
import { WebProfileContent } from "@/components/profile/web/profile-content"
import { useSession } from "next-auth/react"
import { useMobile } from "@/hooks/use-mobile"
import { useEffect, useState } from "react"
import { notFound, redirect } from "next/navigation"

// Input validation and sanitization
function validateUsername(username: string): boolean {
  // Only allow alphanumeric characters, underscores, and hyphens
  // Length between 3-30 characters
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/
  return usernameRegex.test(username)
}

function sanitizeUsername(username: string): string {
  // Remove any potentially harmful characters
  return username.replace(/[^a-zA-Z0-9_-]/g, '')
}

interface ProfileData {
  username: string
  isPublic: boolean
  exists: boolean
  isOwner: boolean
}

export default function ProfilePage({ params }: { params: { username: string } }) {
  const isMobile = useMobile()
  const { data: session, status } = useSession()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Input validation
  const rawUsername = params.username
  if (!validateUsername(rawUsername)) {
    notFound()
  }

  const sanitizedUsername = sanitizeUsername(rawUsername)

  useEffect(() => {
    async function fetchProfileData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch profile data with proper error handling
        const response = await fetch(`/api/profile/${encodeURIComponent(sanitizedUsername)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Include CSRF token if available
            ...(session?.csrfToken && { 'X-CSRF-Token': session.csrfToken }),
          },
        })

        if (response.status === 404) {
          notFound()
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        
        // Validate response data structure
        if (!data || typeof data.username !== 'string' || typeof data.isPublic !== 'boolean') {
          throw new Error('Invalid profile data received')
        }

        const isOwner = session?.user?.username === sanitizedUsername

        setProfileData({
          username: data.username,
          isPublic: data.isPublic,
          exists: true,
          isOwner,
        })

      } catch (err) {
        console.error('Error fetching profile:', err)
        setError('Failed to load profile')
        // Don't expose internal errors to users
        if (err instanceof Error && err.message.includes('404')) {
          notFound()
        }
      } finally {
        setLoading(false)
      }
    }

    // Only fetch if we have a valid username
    if (sanitizedUsername && sanitizedUsername.length > 0) {
      fetchProfileData()
    }
  }, [sanitizedUsername, session])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Something went wrong</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Profile doesn't exist
  if (!profileData?.exists) {
    notFound()
  }

  // Access control logic
  const canViewProfile = profileData.isPublic || 
                        profileData.isOwner || 
                        (session && hasViewPermission(session, profileData.username))

  if (!canViewProfile) {
    if (status === "unauthenticated") {
      // Redirect to sign-in with return URL
      redirect(`/auth/sign-in?callbackUrl=${encodeURIComponent(`/profile/${sanitizedUsername}`)}`)
    } else {
      // User is authenticated but doesn't have permission
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">This profile is private</p>
          </div>
        </div>
      )
    }
  }

  // Render the appropriate component based on device type
  if (isMobile) {
    return <ProfileContent username={sanitizedUsername} />
  } else {
    return <WebProfileContent username={sanitizedUsername} />
  }
}

// Helper function to check additional view permissions
function hasViewPermission(session: any, username: string): boolean {
  // Implement your permission logic here
  // For example: friends, followers, etc.
  return false // Placeholder - implement based on your requirements
}