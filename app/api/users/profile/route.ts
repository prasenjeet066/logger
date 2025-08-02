import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { connectDB } from "@/lib/mongodb/connection"
import { User } from "@/lib/mongodb/models/User"

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    await connectDB()
    
    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    const body = await request.json()
    const {
      displayName, 
      bio, 
      location, 
      website, 
      isPrivate, 
      allowMessages, 
      showEmail, 
      superAccess, 
      avatarUrl, 
      coverUrl,
      pinnedPostId,
      // Privacy settings
      lock_profile,
      hide_following_list,
      show_activity_status,
      public_send_message,
      show_in_search,
      personalized_ads,
      ...config
    } = body
    
    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        ...config,
        displayName: displayName || user.displayName,
        bio: bio || "",
        location: location || "",
        website: website || "",
        isPrivate: isPrivate !== undefined ? isPrivate : user.isPrivate,
        coverUrl: coverUrl !== undefined ? coverUrl : user.coverUrl,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : user.avatarUrl,
        allowMessages: allowMessages !== undefined ? allowMessages : user.allowMessages,
        showEmail: showEmail !== undefined ? showEmail : user.showEmail,
        pinnedPostId: pinnedPostId !== undefined ? pinnedPostId : user.pinnedPostId,
        superAccess: superAccess !== undefined && superAccess !== null ? superAccess : user.superAccess,
        // Privacy settings
        lock_profile: lock_profile !== undefined ? lock_profile : user.lock_profile,
        hide_following_list: hide_following_list !== undefined ? hide_following_list : user.hide_following_list,
        show_activity_status: show_activity_status !== undefined ? show_activity_status : user.show_activity_status,
        public_send_message: public_send_message !== undefined ? public_send_message : user.public_send_message,
        show_in_search: show_in_search !== undefined ? show_in_search : user.show_in_search,
        personalized_ads: personalized_ads !== undefined ? personalized_ads : user.personalized_ads,
      }, 
      { new: true, runValidators: true }
    ).lean()
    
    if (!updatedUser) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }
    
    // Remove sensitive information
    const { password, resetPasswordToken, resetPasswordExpires, ...userResponse } = updatedUser
    
    return NextResponse.json(userResponse)
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}