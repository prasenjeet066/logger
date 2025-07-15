// 🔒 Supabase has been removed from this project.
//    This stub prevents build errors for outdated imports like
//    `import { createServerClient } from '@/lib/supabase/server'`.

export function createServerClient() {
  throw new Error(
    "Supabase has been removed from this project. " + "Please migrate any remaining Supabase logic to Mongoose.",
  )
}

// Optional legacy value
export const supabase: null = null
export default supabase
