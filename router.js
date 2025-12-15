// js/router.js
// ניווט פשוט בין מסכים

const Router = {
  currentView: null,
  
  // המסכים הזמינים
  views: {
    dashboard: 'dashboard',
    budget: 'budget',
    suppliers: 'suppliers',
    payments: 'payments',
    gifts: 'gifts',
    tasks: 'tasks'
  },

  init() {
    // האזנה לשינויים ב-URL
    window.addEventListener('hashchange', () => this.handleRoute());
    
    // טעינה ראשונית
    this.handleRoute();
  },

  handleRoute() {
    const hash = window.location.hash.slice(1) || 'budget'; // ברירת מחדל: תקציב
    this.navigateTo(hash);
  },

  navigateTo(viewName) {
    if (!this.views[viewName]) {
      viewName = 'budget'; // fallback
    }

    this.currentView = viewName;
    window.location.hash = viewName;

    // עדכון ה-UI
    this.updateNavigation();
    this.renderView(viewName);
  },

  updateNavigation() {
    // סימון הכפתור הפעיל בניווט
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.view === this.currentView) {
        item.classList.add('active');
      }
    });
  },

  renderView(viewName) {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    // ניקוי התוכן הקודם
    mainContent.innerHTML = '<div class="loading">טוען...</div>';

    // טעינת התצוגה המתאימה
    switch(viewName) {
      case 'budget':
        if (window.BudgetUI) {
          window.BudgetUI.render();
        }
        break;
      case 'dashboard':
        mainContent.innerHTML = '<div class="view-placeholder">📊 Dashboard - בקרוב</div>';
        break;
      case 'suppliers':
        mainContent.innerHTML = '<div class="view-placeholder">🏢 ספקים - בקרוב</div>';
        break;
      case 'payments':
        mainContent.innerHTML = '<div class="view-placeholder">💳 תשלומים - בקרוב</div>';
        break;
      case 'gifts':
        mainContent.innerHTML = '<div class="view-placeholder">🎁 מתנות - בקרוב</div>';
        break;
      case 'tasks':
        mainContent.innerHTML = '<div class="view-placeholder">✅ משימות - בקרוב</div>';
        break;
    }
  }
};

window.Router = Router;
