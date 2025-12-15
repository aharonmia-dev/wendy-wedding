// js/events.js

// --- Invite param helpers ---
const INVITE_STORAGE_KEY = "pending_invite_token";

function getInviteTokenFromUrl() {
  return new URL(window.location.href).searchParams.get("invite");
}

function removeInviteFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("invite");
  window.history.replaceState({}, "", url.toString());
}

// אם נכנסו עם invite אבל המשתמש עוד לא מחובר – נשמור את זה זמנית
window.stashInviteTokenIfExists = function () {
  const t = getInviteTokenFromUrl();
  if (t) {
    sessionStorage.setItem(INVITE_STORAGE_KEY, t);
    removeInviteFromUrl();
  }
};

window.popStashedInviteToken = function () {
  const t = sessionStorage.getItem(INVITE_STORAGE_KEY);
  if (t) sessionStorage.removeItem(INVITE_STORAGE_KEY);
  return t;
};

// --- DB LOGIC ---
window.ensureMyEvent = async function (userId) {
  // 1) האם המשתמש כבר חבר באירוע?
  const { data: mem, error: memErr } = await supabaseClient
    .from("event_members")
    .select("event_id, role, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (memErr) throw memErr;

  if (mem?.length) {
    const eventId = mem[0].event_id;

    const { data: ev, error: evErr } = await supabaseClient
      .from("events")
      .select("id,title,created_at")
      .eq("id", eventId)
      .single();

    if (evErr) throw evErr;
    return ev;
  }

  // 2) אם אין חברות באף אירוע — יוצרים אירוע חדש
  const { data: created, error: insErr } = await supabaseClient
    .from("events")
    .insert([{ created_by: userId, title: "Our Wedding" }])
    .select("id,title,created_at")
    .single();

  if (insErr) throw insErr;

  // 3) מוסיפים את המשתמש כ-owner
  const { error: memInsErr } = await supabaseClient.from("event_members").insert([
    { event_id: created.id, user_id: userId, role: "owner" },
  ]);

  if (memInsErr) throw memInsErr;

  return created;
};

window.createInviteLink = async function (eventId, userId) {
  // אם כבר יש הזמנה פתוחה לאירוע הזה — מחזירים אותה (אין כפילויות)
  const { data: existing, error: selErr } = await supabaseClient
    .from("invites")
    .select("token")
    .eq("event_id", eventId)
    .is("accepted_at", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (selErr) throw selErr;

  const base = window.location.origin + window.location.pathname;

  if (existing?.length) {
    return `${base}?invite=${encodeURIComponent(existing[0].token)}`;
  }

  // אחרת — יוצרים הזמנה חדשה
  const token = crypto.randomUUID();

  const { error: insErr } = await supabaseClient.from("invites").insert([
    { event_id: eventId, token, created_by: userId },
  ]);

  if (insErr) throw insErr;

  return `${base}?invite=${encodeURIComponent(token)}`;
};

window.redeemInvite = async function (token, userId) {
  const { data: invite, error: selErr } = await supabaseClient
    .from("invites")
    .select("id,event_id,accepted_at")
    .eq("token", token)
    .single();

  if (selErr) throw selErr;
  if (invite.accepted_at) throw new Error("הלינק הזה כבר נוצל.");

  // להצטרף לאירוע (בלי כפילויות)
  const { error: joinErr } = await supabaseClient.from("event_members").upsert(
    [{ event_id: invite.event_id, user_id: userId, role: "partner" }],
    { onConflict: "event_id,user_id" }
  );
  if (joinErr) throw joinErr;

  // לסמן שההזמנה נוצלה
  const { error: updErr } = await supabaseClient
    .from("invites")
    .update({ accepted_by: userId, accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  if (updErr) throw updErr;

  return invite.event_id;
};

window.loadMembers = async function (eventId) {
  const { data, error } = await supabaseClient
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
};
