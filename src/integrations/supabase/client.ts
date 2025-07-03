import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const SUPABASE_URL = "https://yyotjoreossbqggyevek.supabase.co"
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5b3Rqb3Jlb3NzYnFnZ3lldmVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMDE0ODYsImV4cCI6MjA2Njc3NzQ4Nn0.OEGR0xGD4QprW4uyrCWwr13p-j4dUj_8gztWUrXn2Eg"

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)