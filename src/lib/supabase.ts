import { createClient } from "@supabase/supabase-js";

// Replace these with your actual Supabase project credentials
const supabaseUrl: string = "https://kcndgryyfmleusefjowx.supabase.co";
const supabaseAnonKey: string =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjbmRncnl5Zm1sZXVzZWZqb3d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MjQ3MTEsImV4cCI6MjA3NTUwMDcxMX0.RuL0DbTJsBhxVYHx-0hT7lr9KHM9UlsjfIeFrRnAvlI";

// Check if credentials are configured
const isValidUrl = (url: string) => url.startsWith("http://") || url.startsWith("https://");
const isConfigured =
  supabaseUrl !== "YOUR_SUPABASE_URL" && supabaseAnonKey !== "YOUR_SUPABASE_ANON_KEY" && isValidUrl(supabaseUrl);

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export const isSupabaseConfigured = isConfigured;
