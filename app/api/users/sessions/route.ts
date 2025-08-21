import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth/auth-config"
import { SessionManager } from "@/lib/security/session-manager"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = (session.user as any).id
    const sessions = SessionManager.getUserSessions(userId).map((id) => ({ sessionId: id }))
    return NextResponse.json({ sessions })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 })
  }
}