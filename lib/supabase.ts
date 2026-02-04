// Supabase client setup
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iyucgptjmhugrzygkokq.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5dWNncHRqbWh1Z3J6eWdrb2txIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NDY2OTgsImV4cCI6MjA4MTEyMjY5OH0.rejNdhhWqBBJeflohHVGAxFbQFIspW59qEty_5JY86E'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

