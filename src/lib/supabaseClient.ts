import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qujnuunnuexsfmodrpyg.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1am51dW5udWV4c2Ztb2RycHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMTQ1NDUsImV4cCI6MjA2NDU5MDU0NX0.3uYv4gPLajbQCAZTsaQ-WQChqFokuFS1koB6emD6xdk";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
