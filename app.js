// js/app.js
// מנהל את זרימת האפליקציה: התחברות → ניווט → מסכים

// ===============================
// HEARTS ANIMATION (מהסplash)
// ===============================

const heartColors = [
  'heart-pink-light', 'heart-pink', 'heart-pink-medium',
  'heart-pink-dark', 'heart-rose', 'heart-red-light',
  'heart-red', 'heart-red-dark', 'heart-crimson', 'heart-burgundy'
];

const heartSizes = ['heart-small', 'heart', 'heart-medium'];

function createHeart() {
  const heart = document.createElement('div');
  const colorClass = heartColors[Math.floor(Math.random() * heartColors.length)];
  const sizeClass = heartSizes[Math.floor(Math.random() * heartSizes.length)];

  heart.className = `heart ${colorClass} ${sizeClass}`;
  heart.style.left = Math.random() * 100 + '%';

  const duration = Math.random() * 6 + 8;
  heart.style.animationDuration = duration + 's';
  heart.style.animationDelay = Math.random() * 3 + 's';

  document.body.appendChild(heart);

  setTimeout(() => {
    if (heart.parentNode) {
      heart.remove();
    }
  }, (duration + 3) * 1000);
}

function startHeartRain() {
  setInterval(createHeart, 500);
}

window.createHeart = createHeart; // נגיש גלובלית

// ===============================
// SPLASH SCREEN LOGIC
// ===============================

function initSplash() {
  const continueBtn = document.getElementById('continueBtn');
  const loginForm = document.getElementById('loginForm');
  const appName = document.getElementById('appName');
  const subtitle = document.getElementById('subtitle');

  if (continueBtn) {
    continueBtn.onclick = () => {
      // כניסת השם למצב קומפקטי
      appName.classList.add('compact');
      subtitle.classList.add('compact');

      // הסתרת הכפתור
      continueBtn.style.opacity = '0';
      continueBtn.style.transform = 'translateY(20px) scale(0.8)';

      setTimeout(() => {
        continueBtn.style.display = 'none';

        // הצגת הטופס
        loginForm.style.display = 'block';
        setTimeout(() => {
          loginForm.classList.add('show');
          document.getElementById('email').focus();
        }, 100);
      }, 400);

      // יצירת לבבות חגיגיים
      for (let i = 0; i < 8; i++) {
        setTimeout(createHeart, i * 100);
      }
    };
  }
}

// ===============================
// AUTH LOGIC
// ===============================

function initAuth() {
  const btnSignUp = document.getElementById('btnSignUp');
  const btnSignIn = document.getElementById('btnSignIn');

  if (btnSignUp) {
    btnSignUp.onclick = async () => {
      try {
        clearMsg();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!email || !password) {
          return showMsg('נא למלא אימייל וסיסמה', 'err');
        }

        await signUp(email, password);
        showMsg('נרשמת בהצלחה! ✅ עכשיו התחברי', 'ok');
      } catch (e) {
        showMsg(e.message || String(e), 'err');
        console.error(e);
      }
    };
  }

  if (btnSignIn) {
    btnSignIn.onclick = async () => {
      try {
        clearMsg();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        if (!email || !password) {
          return showMsg('נא למלא אימייל וסיסמה', 'err');
        }

        await signIn(email, password);
        showMsg('התחברת! ✅', 'ok');

        // יצירת לבבות חגיגיים
        for (let i = 0; i < 15; i++) {
          setTimeout(createHeart, i * 80);
        }
      } catch (e) {
        showMsg(e.message || String(e), 'err');
        console.error(e);
      }
    };
  }
}

// ===============================
// MAIN APP LOGIC
// ===============================

function initMainApp() {
  const btnSignOut = document.getElementById('btnSignOut');
  const btnInvitePartner = document.getElementById('btnInvitePartner');

  if (btnSignOut) {
    btnSignOut.onclick = async () => {
      try {
        await signOut();
        showAuthScreen();
      } catch (e) {
        alert('שגיאה: ' + e.message);
      }
    };
  }

  if (btnInvitePartner) {
    btnInvitePartner.onclick = async () => {
      showInviteModal();
    };
  }

  // Navigation items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const view = item.dataset.view;
      Router.navigateTo(view);
    });
  });

  // Router
  Router.init();
}

// ===============================
// INVITE MODAL
// ===============================

async function showInviteModal() {
  try {
    const user = await getUser();
    const event = await ensureMyEvent(user.id);
    const link = await createInviteLink(event.id, user.id);

    document.getElementById('inviteLink').value = link;
    document.getElementById('inviteModal').classList.remove('hidden');

    // לבבות!
    for (let i = 0; i < 10; i++) {
      setTimeout(createHeart, i * 100);
    }
  } catch (e) {
    alert('שגיאה: ' + e.message);
  }
}

function initInviteModal() {
  const btnCopyInvite = document.getElementById('btnCopyInvite');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const modal = document.getElementById('inviteModal');

  if (btnCopyInvite) {
    btnCopyInvite.onclick = async () => {
      try {
        const link = document.getElementById('inviteLink').value;
        await navigator.clipboard.writeText(link);
        alert('הלינק הועתק! 💕');

        // לבבות!
        for (let i = 0; i < 8; i++) {
          setTimeout(createHeart, i * 100);
        }
      } catch (e) {
        alert('לא הצלחתי להעתיק. תעתיקי ידנית');
      }
    };
  }

  if (btnCloseModal) {
    btnCloseModal.onclick = () => {
      modal.classList.add('hidden');
    };
  }

  // סגירה בלחיצה על הרקע
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });
}

// ===============================
// SCREEN MANAGEMENT
// ===============================

function showAuthScreen() {
  document.getElementById('authScreen').classList.remove('hidden');
  document.getElementById('mainApp').classList.add('hidden');
}

function showMainApp() {
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');
}

// ===============================
// APP STATE REFRESH
// ===============================

let refreshing = false;

async function refreshApp() {
  if (refreshing) return;
  refreshing = true;

  try {
    const user = await getUser();

    if (!user) {
      showAuthScreen();
      refreshing = false;
      return;
    }

    // המשתמש מחובר
    showMainApp();

    // עדכון פרטי משתמש
    const userEmail = document.getElementById('userEmail');
    if (userEmail) {
      userEmail.textContent = user.email || user.id.substring(0, 8);
    }

    // אם יש הזמנה ממתינה
    const pendingToken = popStashedInviteToken();
    if (pendingToken) {
      try {
        await redeemInvite(pendingToken, user.id);
        alert('הצטרפת לאירוע דרך הזמנה! 💕');

        // לבבות חגיגיים!
        for (let i = 0; i < 20; i++) {
          setTimeout(createHeart, i * 80);
        }
      } catch (e) {
        alert('שגיאה בהזמנה: ' + e.message);
      }
    }

    // וידוא שיש אירוע
    await ensureMyEvent(user.id);

    // טעינת המסך הנוכחי
    Router.handleRoute();

  } catch (e) {
    console.error('refreshApp error:', e);
    alert('שגיאה: ' + e.message);
  } finally {
    refreshing = false;
  }
}

// ===============================
// BOOT
// ===============================

window.addEventListener('DOMContentLoaded', () => {
  console.log('✅ Wendy App is starting...');

  // התחלת לבבות
  startHeartRain();
  for (let i = 0; i < 10; i++) {
    setTimeout(createHeart, i * 300);
  }

  // אתחול הזמנה מ-URL
  stashInviteTokenIfExists();

  // אתחול UI
  initSplash();
  initAuth();
  initMainApp();
  initInviteModal();

  // רענון מצב התחברות
  refreshApp();

  // האזנה לשינויי התחברות
  supabaseClient.auth.onAuthStateChange(() => {
    refreshApp();
  });
});
