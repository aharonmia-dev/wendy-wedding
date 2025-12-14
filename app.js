import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://ldprdewokkxrwxgxojrs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkcHJkZXdva2t4cnd4Z3hvanJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MDQwODQsImV4cCI6MjA4MTI4MDA4NH0.kN3_qfUhvwnRVDsMuaWvTKfTE9uBWtCBh--6dBnTgdM";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

const el = (id) => document.getElementById(id);
const screens = ["screenLoading", "screenAuth", "screenApp"];

function showScreen(id) {
  for (const s of screens) el(s)?.classList.add("hidden");
  el(id)?.classList.remove("hidden");
}

function setMsg(text = "") {
  el("authMsg").textContent = text;
}

async function refreshUI() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    el("btnLogout")?.classList.add("hidden");
    showScreen("screenAuth");
    return;
  }

  el("btnLogout")?.classList.remove("hidden");
  showScreen("screenApp");
  el("debug").textContent = JSON.stringify(
    { user_id: session.user.id, email: session.user.email },
    null,
    2
  );
}

el("btnSignUp").addEventListener("click", async () => {
  setMsg("");
  const email = el("email").value.trim();
  const password = el("password").value;

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return setMsg(error.message);

  setMsg("נרשמת! עכשיו התחברי.");
});

el("btnSignIn").addEventListener("click", async () => {
  setMsg("");
  const email = el("email").value.trim();
  const password = el("password").value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return setMsg(error.message);

  await refreshUI();
});

el("btnLogout").addEventListener("click", async () => {
  await supabase.auth.signOut();
  await refreshUI();
});

supabase.auth.onAuthStateChange(() => refreshUI());

// start
showScreen("screenLoading");
refreshUI();
