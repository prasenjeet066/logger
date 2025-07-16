"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { type UpdateSettingsData, updateSettingsSchema } from "@/lib/validations/settings"
import connectMongoDB from "@/lib/mongodb/connection"
import User from "@/lib/mongodb/models/User"
import { revalidatePath } from "next/cache"
import { z } from "zod" // Import zod for z.ZodError

export async function updateUserSettings(data: UpdateSettingsData) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const validatedData = updateSettingsSchema.parse(data)
    await connectMongoDB()

    const updateFields: any = {
      displayName: validatedData.displayName,
      bio: validatedData.bio,
      website: validatedData.website,
      location: validatedData.location,
      isPrivate: validatedData.isPrivate,
      allowMessages: validatedData.allowMessages,
      showEmail: validatedData.showEmail,
      emailNotifications: validatedData.emailNotifications,
      pushNotifications: validatedData.pushNotifications,
      soundEnabled: validatedData.soundEnabled,
      darkMode: validatedData.darkMode,
      language: validatedData.language,
    }

    const updatedUser = await User.findByIdAndUpdate(session.user.id, updateFields, { new: true }).lean()

    if (!updatedUser) {
      return { success: false, error: "User not found" }
    }

    // Revalidate paths that might display user profile or settings
    revalidatePath("/settings")
    revalidatePath(`/profile/${updatedUser.username}`)
    revalidatePath("/dashboard") // If dashboard shows user info

    return { success: true, data: updatedUser }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.flatten().fieldErrors }
    }
    console.error("Error in updateUserSettings Server Action:", error)
    return { success: false, error: error.message || "Failed to update settings" }
  }
}

export async function deleteUserAccount(userId: string) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.id !== userId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    await connectMongoDB()
    const result = await User.findByIdAndDelete(userId)

    if (!result) {
      return { success: false, error: "User not found" }
    }

    // Sign out the user after account deletion
    // This needs to be handled on the client-side after the action returns success
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting user account:", error)
    return { success: false, error: error.message || "Failed to delete account" }
  }
}
