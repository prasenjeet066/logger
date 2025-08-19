import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-config"

export default async function MessagesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/sign-in")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 bengali-font">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">বার্তা</h1>
        <p className="text-gray-600">এই বৈশিষ্ট্যটি শীঘ্রই আসছে...</p>
      </div>
    </div>
  )
}
