// js/supabase.js
const SUPABASE_URL = "https://ldprdewokkxrwxgxojrs.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkcHJkZXdva2t4cnd4Z3hvanJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MDQwODQsImV4cCI6MjA4MTI4MDA4NH0.kN3_qfUhvwnRVDsMuaWvTKfTE9uBWtCBh--6dBnTgdM";

if (!window.supabase) {
  console.error("❌ Supabase SDK not loaded. Check index.html script tag.");
}

window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true },
});
