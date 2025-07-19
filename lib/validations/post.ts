import { z } from "zod"

export const createPostSchema = z.object({
  content: z.string().min(1, "Content is required").max(280, "Content must be less than 280 characters"),
  replyTo: z.string().optional(),
  mediaUrls: z.array(z.string()).optional(),
  mediaType: z.enum(["image", "video", "gif",null]).optional(),
})

export const updateProfileSchema = z.object({
  displayName: z.string().min(1, "Display name is required").max(50),
  bio: z.string().max(160, "Bio must be less than 160 characters").optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  location: z.string().max(30, "Location must be less than 30 characters").optional(),
})

export type CreatePostData = z.infer<typeof createPostSchema>
export type UpdateProfileData = z.infer<typeof updateProfileSchema>
