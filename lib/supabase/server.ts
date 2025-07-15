// Supabase has been fully removed, but some legacy code may still import
// { createServerClient } from '@/lib/supabase/server'.
// We provide a safe stub so the application can build without errors.

export function createServerClient() {
  throw new Error(
    "Supabase has been removed from this project. Please remove any remaining Supabase code or replace it with MongoDB logic.",
  )
}

// Legacy default export (kept for backwards compatibility, returns null)
export const supabase = null
export default supabase
