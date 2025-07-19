import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-config";
import { connectDB } from "@/lib/mongodb/connection";
import { User } from "@/lib/mongodb/models/User";
import { SuperUser } from "@/lib/mongodb/models/SuperUser"; // adjust import if needed

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Find the user by email
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if this user is also in SuperUser collection
    const superUser = await SuperUser.findOne({ userId: user._id }).lean();
    const isSuperUser = !!superUser;

    // Remove sensitive info
    const {
      password,
      resetPasswordToken,
      resetPasswordExpires,
      ...userResponse
    } = user;

    return NextResponse.json({
      ...userResponse,
      isSuperUser,
      superUserInfo: superUser || null, // optionally include superuser fields
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}