// =====================
// CONFIG
// =====================
const SUPABASE_URL = "https://ldprdewokkxrwxgxojrs.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkcHJkZXdva2t4cnd4Z3hvanJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MDQwODQsImV4cCI6MjA4MTI4MDA4NH0.kN3_qfUhvwnRVDsMuaWvTKfTE9uBWtCBh--6dBnTgdM";

if (!window.supabase) {
  console.error("❌ Supabase SDK not loaded. Check index.html script tag.");
}

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true }, // remember login
});

// =====================
// DOM helpers
// =====================
const el = (id) => document.getElementById(id);

function showMsg(text, type = "ok") {
  const box = el("msg");
  if (!box) return alert(text);
  box.className = `msg ${type}`;
  box.textContent = text;
}

function clearMsg() {
  const box = el("msg");
  if (!box) return;
  box.className = "msg";
  box.textContent = "";
}

function setLoggedInUI(isLoggedIn) {
  const a = el("authCard");
  const b = el("appCard");
  if (a) a.classList.toggle("hidden", isLoggedIn);
  if (b) b.classList.toggle("hidden", !isLoggedIn);
}

function getInviteTokenFromUrl() {
  return new URL(window.location.href).searchParams.get("invite");
}

function removeInviteFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("invite");
  window.history.replaceState({}, "", url.toString());
}

// אם נכנסו עם invite אבל המשתמש עוד לא מחובר – נשמור את זה זמנית
const INVITE_STORAGE_KEY = "pending_invite_token";

function stashInviteTokenIfExists() {
  const t = getInviteTokenFromUrl();
  if (t) {
    sessionStorage.setItem(INVITE_STORAGE_KEY, t);
    removeInviteFromUrl();
  }
}

function popStashedInviteToken() {
  const t = sessionStorage.getItem(INVITE_STORAGE_KEY);
  if (t) sessionStorage.removeItem(INVITE_STORAGE_KEY);
  return t;
}

// =====================
// AUTH
// =====================
async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) console.warn("getUser error:", error);
  return data?.user ?? null;
}

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

// ✅ התיקון הקריטי:
// קודם בודקים אם המשתמש חבר באירוע כלשהו דרך event_members.
// רק אם אין לו אירוע – יוצרים אחד חדש ומוסיפים אותו כ-owner.
async function ensureMyEvent(userId) {
  // 1) האם המשתמש כבר חבר באירוע?
  const { data: mem, error: memErr } = await supabase
    .from("event_members")
    .select("event_id, role, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (memErr) throw memErr;

  if (mem?.length) {
    const eventId = mem[0].event_id;

    // להביא את פרטי האירוע
    const { data: ev, error: evErr } = await supabase
      .from("events")
      .select("id,title,created_at")
      .eq("id", eventId)
      .single();

    if (evErr) throw evErr;
    return ev;
  }

  // 2) אם אין חברות באף אירוע — יוצרים אירוע חדש
  const { data: created, error: insErr } = await supabase
    .from("events")
    .insert([{ created_by: userId, title: "Our Wedding" }])
    .select("id,title,created_at")
    .single();

  if (insErr) throw insErr;

  // 3) מוסיפים את המשתמש כ-owner
  const { error: memInsErr } = await supabase.from("event_members").insert([
    {
      event_id: created.id,
      user_id: userId,
      role: "owner",
    },
  ]);

  if (memInsErr) throw memInsErr;

  return created;
}

async function createInviteLink(eventId, userId) {
  // 1) אם כבר יש הזמנה פתוחה לאירוע הזה — מחזירים אותה
  const { data: existing, error: selErr } = await supabase
    .from("invites")
    .select("token")
    .eq("event_id", eventId)
    .is("accepted_at", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (selErr) throw selErr;

  if (existing?.length) {
    const base = window.location.origin + window.location.pathname;
    return `${base}?invite=${encodeURIComponent(existing[0].token)}`;
  }

  // 2) אחרת — יוצרים הזמנה חדשה
  const token = crypto.randomUUID();

  const { error: insErr } = await supabase.from("invites").insert([{
    event_id: eventId,
    token,
    created_by: userId
  }]);

  if (insErr) throw insErr;

  const base = window.location.origin + window.location.pathname;
  return `${base}?invite=${encodeURIComponent(token)}`;
}


async function redeemInvite(token, userId) {
  const { data: invite, error: selErr } = await supabase
    .from("invites")
    .select("id,event_id,accepted_at")
    .eq("token", token)
    .single();

  if (selErr) throw selErr;
  if (invite.accepted_at) throw new Error("הלינק הזה כבר נוצל.");

  // להצטרף לאירוע (בלי כפילויות)
  const { error: joinErr } = await supabase.from("event_members").upsert(
    [
      {
        event_id: invite.event_id,
        user_id: userId,
        role: "partner",
      },
    ],
    { onConflict: "event_id,user_id" }
  );
  if (joinErr) throw joinErr;

  // לסמן שההזמנה נוצלה
  const { error: updErr } = await supabase
    .from("invites")
    .update({ accepted_by: userId, accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  if (updErr) throw updErr;

  return invite.event_id;
}

async function loadMembers(eventId) {
  const { data, error } = await supabase
    .from("event_members")
    .select("user_id,role,created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  el("members").innerHTML =
    (data || [])
      .map(
        (m) =>
          `<div class="item"><div><b>${m.role}</b></div><div class="muted small">${m.user_id}</div></div>`
      )
      .join("") || `<div class="muted small">אין עדיין חברים</div>`;
}

// =====================
// UI WIRING
// =====================
function wireUI() {
  const btnSignUp = el("btnSignUp");
  const btnSignIn = el("btnSignIn");
  const btnSignOut = el("btnSignOut");
  const btnCopy = el("btnCopy");

  if (!btnSignUp || !btnSignIn) {
    console.error("❌ Missing auth button IDs in HTML (btnSignUp/btnSignIn).");
    return;
  }

  btnSignUp.onclick = async () => {
    try {
      const email = el("email").value.trim();
      const password = el("password").value;
      if (!email || !password) return showMsg("נא למלא אימייל וסיסמה", "err");

      await signUp(email, password);
      showMsg("נרשמת ✅ עכשיו התחברי (או אם נוצר סשן – תראי מעבר אוטומטי).", "ok");
    } catch (e) {
      showMsg(e.message || String(e), "err");
      console.error(e);
    }
  };

  btnSignIn.onclick = async () => {
    try {
      const email = el("email").value.trim();
      const password = el("password").value;
      if (!email || !password) return showMsg("נא למלא אימייל וסיסמה", "err");

      await signIn(email, password);
      showMsg("התחברת ✅", "ok");
    } catch (e) {
      showMsg(e.message || String(e), "err");
      console.error(e);
    }
  };

  if (btnSignOut) {
    btnSignOut.onclick = async () => {
      try {
        await signOut();
        showMsg("התנתקת", "ok");
      } catch (e) {
        showMsg(e.message || String(e), "err");
        console.error(e);
      }
    };
  }

  if (btnCopy) {
    btnCopy.onclick = async () => {
      try {
        await navigator.clipboard.writeText(el("inviteLink").value);
        showMsg("הועתק ✅", "ok");
      } catch (e) {
        showMsg("לא הצלחתי להעתיק. תעתיקי ידנית מהשדה.", "err");
        console.error(e);
      }
    };
  }
}

// =====================
// APP STATE
// =====================
let refreshing = false;

async function refreshApp() {
  if (refreshing) return;
  refreshing = true;

  try {
    const user = await getUser();

    if (!user) {
      setLoggedInUI(false);
      refreshing = false;
      return;
    }

    setLoggedInUI(true);
    el("userLine").textContent = user.email ? `אימייל: ${user.email}` : `User: ${user.id}`;

    // אם יש הזמנה שמורה (מה-URL לפני login) – רידם עכשיו
    const pendingToken = popStashedInviteToken();
    if (pendingToken) {
      try {
        await redeemInvite(pendingToken, user.id);
        showMsg("הצטרפת לאירוע דרך הזמנה ✅", "ok");
      } catch (e) {
        showMsg(e.message || String(e), "err");
        console.error(e);
      }
    }

    // ✅ עכשיו ensureMyEvent יבחר אירוע לפי event_members
    const event = await ensureMyEvent(user.id);
    el("eventLine").textContent = `Event ID: ${event.id} · ${event.title}`;

    // כפתור הזמנה
    const btnInvite = el("btnInvite");
    btnInvite.onclick = async () => {
      try {
        const link = await createInviteLink(event.id, user.id);
        el("inviteLink").classList.remove("hidden");
        el("inviteLink").value = link;
        el("btnCopy").classList.remove("hidden");
        showMsg("לינק הזמנה נוצר ✅", "ok");
      } catch (e) {
        showMsg(e.message || String(e), "err");
        console.error(e);
      }
    };

    await loadMembers(event.id);
  } catch (e) {
    console.error("refreshApp fatal:", e);
    showMsg(e.message || String(e), "err");
  } finally {
    refreshing = false;
  }
}

// =====================
// BOOT (DOM safe) + INVITE stash
// =====================
window.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOMContentLoaded - booting app.js");

  // אם נכנסו עם invite=... לפני login, נשמור אותו ואז נסיר מה-URL
  stashInviteTokenIfExists();

  wireUI();
  refreshApp();

  supabase.auth.onAuthStateChange(() => {
    refreshApp();
  });
});
