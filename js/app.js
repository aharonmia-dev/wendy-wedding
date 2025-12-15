// js/app.js

function wireUI() {
  const btnSignUp = el("btnSignUp");
  const btnSignIn = el("btnSignIn");
  const btnSignOut = el("btnSignOut");
  const btnCopy = el("btnCopy");

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


  btnSignOut.onclick = async () => {
    try {
      console.log("SIGNOUT CLICKED");
      await supabase.auth.signOut();
      console.log("SIGNED OUT OK");

      // לכפות רענון כדי שלא ישאר UI ישן
      location.reload();
    } catch (e) {
      console.error("SIGNOUT FAILED:", e);
      showMsg(e.message || String(e), "err");
    }
  };

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

let refreshing = false;

async function refreshApp() {
  if (refreshing) return;
  refreshing = true;

  try {
    const user = await getUser();

    if (!user) {
      setLoggedInUI(false);
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

    const event = await ensureMyEvent(user.id);
    el("eventLine").textContent = `Event ID: ${event.id} · ${event.title}`;

    el("btnInvite").onclick = async () => {
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

window.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOMContentLoaded - booting app");

  // אם נכנסו עם invite=... לפני login, נשמור אותו ואז נסיר מה-URL
  stashInviteTokenIfExists();

  wireUI();
  refreshApp();

  supabaseClient.auth.onAuthStateChange(() => refreshApp());
});
