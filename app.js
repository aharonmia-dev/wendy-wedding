




// =====================
// CONFIG
// =====================
const SUPABASE_URL = "https://ldprdewokkxrwxgxojrs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkcHJkZXdva2t4cnd4Z3hvanJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MDQwODQsImV4cCI6MjA4MTI4MDA4NH0.kN3_qfUhvwnRVDsMuaWvTKfTE9uBWtCBh--6dBnTgdM";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true } // נשמר ב-localStorage, לא צריך להתחבר כל פעם
});

const el = (id) => document.getElementById(id);

function showMsg(text, type = "ok") {
  const box = el("msg");
  box.className = `msg ${type}`;
  box.textContent = text;
}

function clearMsg() {
  const box = el("msg");
  box.className = "msg";
  box.textContent = "";
}

function getInviteToken() {
  return new URL(window.location.href).searchParams.get("invite");
}

function setLoggedInUI(isLoggedIn) {
  el("authCard").classList.toggle("hidden", isLoggedIn);
  el("appCard").classList.toggle("hidden", !isLoggedIn);
}

async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

// =====================
// AUTH
// =====================
async function signUp(email, password) {
  clearMsg();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

async function signIn(email, password) {
  clearMsg();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signOut() {
  clearMsg();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// =====================
// DB LOGIC (מותאם לטבלאות שלך)
// events: id, created_by, title, created_at
// event_members: event_id, user_id, role, created_at
// invites: id, event_id, token(text), created_by, accepted_by, accepted_at, created_at
// =====================
async function ensureMyEvent(userId) {
  // 1) האם כבר קיים אירוע שיצרתי?
  const { data: events, error: selErr } = await supabase
    .from("events")
    .select("id,title,created_at")
    .eq("created_by", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (selErr) throw selErr;

  if (events?.length) {
    // לוודא שאני חבר/ה באירוע
    await supabase.from("event_members").upsert([{
      event_id: events[0].id,
      user_id: userId,
      role: "owner"
    }], { onConflict: "event_id,user_id" });

    return events[0];
  }

  // 2) ליצור אירוע חדש
  const { data: created, error: insErr } = await supabase
    .from("events")
    .insert([{ created_by: userId, title: "Our Wedding" }])
    .select("id,title,created_at")
    .single();

  if (insErr) throw insErr;

  // 3) להוסיף owner כחבר
  const { error: memErr } = await supabase.from("event_members").insert([{
    event_id: created.id,
    user_id: userId,
    role: "owner"
  }]);
  if (memErr) throw memErr;

  return created;
}

async function createInviteLink(eventId, userId) {
  // token אצלך text -> נייצר UUID כטקסט
  const token = crypto.randomUUID();

  const { error } = await supabase.from("invites").insert([{
    event_id: eventId,
    token,
    created_by: userId
  }]);

  if (error) throw error;

  const base = window.location.origin + window.location.pathname;
  return `${base}?invite=${encodeURIComponent(token)}`;
}

async function redeemInvite(token, userId) {
  // לקרוא את ההזמנה לפי token
  const { data: invite, error: selErr } = await supabase
    .from("invites")
    .select("id,event_id,accepted_at")
    .eq("token", token)
    .single();

  if (selErr) throw selErr;
  if (invite.accepted_at) throw new Error("הלינק הזה כבר נוצל.");

  // להוסיף את המשתמש/ת כחבר/ה באירוע (בלי כפילויות)
  const { error: joinErr } = await supabase.from("event_members").upsert([{
    event_id: invite.event_id,
    user_id: userId,
    role: "partner"
  }], { onConflict: "event_id,user_id" });
  if (joinErr) throw joinErr;

  // לסמן accepted
  const { error: updErr } = await supabase.from("invites")
    .update({ accepted_by: userId, accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  if (updErr) throw updErr;

  // לנקות את הפרמטר מה-URL
  const url = new URL(window.location.href);
  url.searchParams.delete("invite");
  window.history.replaceState({}, "", url.toString());

  return invite.event_id;
}

async function loadMembers(eventId) {
  const { data, error } = await supabase
    .from("event_members")
    .select("user_id,role,created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  el("members").innerHTML = (data || [])
    .map(m => `<div class="item"><div><b>${m.role}</b></div><div class="muted small">${m.user_id}</div></div>`)
    .join("") || `<div class="muted small">אין עדיין חברים</div>`;
}

// =====================
// UI WIRING
// =====================
function wireUI() {
  el("btnSignUp").onclick = async () => {
    try {
      const email = el("email").value.trim();
      const password = el("password").value;
      if (!email || !password) return showMsg("נא למלא אימייל וסיסמה", "err");
      await signUp(email, password);
      showMsg("נרשמת ✅ אם את כבר מחוברת תראי את האפליקציה מיד.", "ok");
    } catch (e) {
      showMsg(e.message || String(e), "err");
    }
  };

  el("btnSignIn").onclick = async () => {
    try {
      const email = el("email").value.trim();
      const password = el("password").value;
      if (!email || !password) return showMsg("נא למלא אימייל וסיסמה", "err");
      await signIn(email, password);
      showMsg("התחברת ✅", "ok");
    } catch (e) {
      showMsg(e.message || String(e), "err");
    }
  };

  el("btnSignOut").onclick = async () => {
    try {
      await signOut();
      showMsg("התנתקת", "ok");
    } catch (e) {
      showMsg(e.message || String(e), "err");
    }
  };

  el("btnCopy").onclick = async () => {
    try {
      await navigator.clipboard.writeText(el("inviteLink").value);
      showMsg("הועתק ✅", "ok");
    } catch {
      showMsg("לא הצלחתי להעתיק. תעתיקי ידנית מהשדה.", "err");
    }
  };
}

async function refreshApp() {
  const user = await getUser();

  if (!user) {
    setLoggedInUI(false);
    return;
  }

  setLoggedInUI(true);
  el("userLine").textContent = user.email ? `אימייל: ${user.email}` : `User: ${user.id}`;

  // אם נכנסו עם invite=... אז ננסה לרידם אחרי שיש user
  const token = getInviteToken();
  if (token) {
    try {
      await redeemInvite(token, user.id);
      showMsg("הצטרפת לאירוע דרך הזמנה ✅", "ok");
    } catch (e) {
      showMsg(e.message || String(e), "err");
    }
  }

  // לוודא שיש לי אירוע (או ליצור)
  const event = await ensureMyEvent(user.id);
  el("eventLine").textContent = `Event ID: ${event.id} · ${event.title}`;

  // כפתור יצירת לינק
  el("btnInvite").onclick = async () => {
    try {
      const link = await createInviteLink(event.id, user.id);
      el("inviteLink").classList.remove("hidden");
      el("inviteLink").value = link;
      el("btnCopy").classList.remove("hidden");
      showMsg("לינק הזמנה נוצר ✅", "ok");
    } catch (e) {
      showMsg(e.message || String(e), "err");
    }
  };

  // להציג חברים
  await loadMembers(event.id);
}

// =====================
// BOOT
// =====================
wireUI();

// רינדור ראשוני לפי session שנשמר
refreshApp();

// כל שינוי סשן (login/logout) מרענן UI
supabase.auth.onAuthStateChange(() => {
  refreshApp();
});
