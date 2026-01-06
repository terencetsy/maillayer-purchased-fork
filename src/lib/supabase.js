// /src/lib/supabase.js
// Supabase client configuration for browser and server

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  )
}

// Browser client (public, anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Server-side admin client (service role key for privileged operations)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Helper to get user from server-side request
export async function getUserFromRequest(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return { user: null, error: new Error('No authorization token') }
  }

  const { data: { user }, error } = await supabase.auth.getUser(token)
  return { user, error }
}

// Helper to verify user owns a brand
export async function verifyBrandOwnership(brandId, userId) {
  const { data, error } = await supabase
    .from('brands')
    .select('id')
    .eq('id', brandId)
    .eq('user_id', userId)
    .single()
  
  return !error && data !== null
}
