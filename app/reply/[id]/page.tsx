import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-config"
import { ReplyDetailContent } from "@/components/reply/reply-detail-content"

interface ReplyPageProps {
  params: {
    id: string
  }
}

export default async function ReplyPage({ params }: ReplyPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/sign-in")
  }

  return <ReplyDetailContent replyId={params.id} userId={(session.user as any).id} />
}
