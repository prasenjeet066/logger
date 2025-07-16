import { z } from "zod"

export const updateSettingsSchema = z.object({
  displayName: z.string().min(1, "Display name is required").max(50, "Display name must be less than 50 characters"),
  bio: z.string().max(160, "Bio must be less than 160 characters").optional().or(z.literal("")),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  location: z.string().max(30, "Location must be less than 30 characters").optional().or(z.literal("")),
  isPrivate: z.boolean().default(false),
  allowMessages: z.boolean().default(true),
  showEmail: z.boolean().default(false),
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  soundEnabled: z.boolean().default(true),
  darkMode: z.boolean().default(false),
  language: z.string().default("en"),
})

export type UpdateSettingsData = z.infer<typeof updateSettingsSchema>
