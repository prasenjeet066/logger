import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-config";
import { connectDB } from "@/lib/mongodb/connection";
import { User } from "@/lib/mongodb/models/User";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Current user API - Session:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userId: (session?.user as any)?.id,
      username: (session?.user as any)?.username
    });
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Find the user by email
    const user = await User.findOne({ email: session.user.email }).lean();
    console.log('Current user API - Found user:', {
      found: !!user,
      userId: user?._id?.toString(),
      username: user?.username,
      email: user?.email
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if this user is also in SuperUser collection
    

    // Remove sensitive info
    const {
      password,
      resetPasswordToken,
      resetPasswordExpires,
      ...userResponse
    } = user;

    return NextResponse.json({
      ...userResponse,
      
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}