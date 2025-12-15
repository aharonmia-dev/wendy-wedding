// js/budget/budget-ui.js
// תצוגת מסך התקציב

const BudgetUI = {
  categories: [],
  items: [],
  currentEvent: null,

  async render() {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    try {
      // קבלת פרטי האירוע הנוכחי
      const user = await getUser();
      if (!user) {
        mainContent.innerHTML = '<div class="error">נא להתחבר תחילה</div>';
        return;
      }

      this.currentEvent = await ensureMyEvent(user.id);

      // טעינת נתונים
      await this.loadData();

      // רינדור
      mainContent.innerHTML = this.buildHTML();

      // חיבור אירועים
      this.attachEventListeners();

      // התחלת real-time sync
      this.setupRealtime();

    } catch (error) {
      console.error('Error rendering budget:', error);
      mainContent.innerHTML = `<div class="error">שגיאה: ${error.message}</div>`;
    }
  },

  async loadData() {
    this.categories = await BudgetService.loadCategories(this.currentEvent.id);
    this.items = await BudgetService.loadBudgetItems(this.currentEvent.id);

    // אם אין קטגוריות - ניצור ברירת מחדל
    if (this.categories.length === 0) {
      this.categories = await BudgetService.createDefaultCategories(this.currentEvent.id);
    }
  },

  buildHTML() {
    const summary = BudgetService.calculateSummary(this.categories, this.items);

    return `
      <div class="budget-view">
        <!-- סיכום כללי -->
        <div class="budget-summary">
          <h2>💰 תקציב החתונה</h2>
          <div class="summary-cards">
            <div class="summary-card planned">
              <div class="label">תקציב מתוכנן</div>
              <div class="amount">₪${this.formatNumber(summary.totalPlanned)}</div>
            </div>
            <div class="summary-card actual">
              <div class="label">בפועל</div>
              <div class="amount">₪${this.formatNumber(summary.totalActual)}</div>
            </div>
            <div class="summary-card remaining">
              <div class="label">נשאר</div>
              <div class="amount">₪${this.formatNumber(summary.remaining)}</div>
            </div>
          </div>
        </div>

        <!-- רשימת קטגוריות -->
        <div class="budget-categories">
          ${this.categories.map(cat => this.buildCategoryHTML(cat)).join('')}
        </div>

        <!-- כפתור הוספת קטגוריה -->
        <button class="btn-add-category" id="btnAddCategory">
          ➕ הוסף קטגוריה
        </button>
      </div>
    `;
  },

  buildCategoryHTML(category) {
    const categoryItems = this.items.filter(item => item.category_id === category.id);
    const totalPlanned = categoryItems.reduce((sum, item) => sum + parseFloat(item.planned_amount || 0), 0);
    const totalActual = categoryItems.reduce((sum, item) => sum + parseFloat(item.actual_amount || 0), 0);

    return `
      <div class="category-card" data-category-id="${category.id}">
        <div class="category-header">
          <div class="category-title">
            <span class="category-icon">${category.icon}</span>
            <span class="category-name">${category.name}</span>
          </div>
          <div class="category-actions">
            <button class="btn-icon btn-add-item" data-category-id="${category.id}" title="הוסף סעיף">+</button>
            <button class="btn-icon btn-delete-category" data-category-id="${category.id}" title="מחק קטגוריה">🗑️</button>
          </div>
        </div>

        <div class="category-items">
          ${categoryItems.length === 0 
            ? '<div class="empty-state">אין סעיפים. לחץ + להוספה</div>' 
            : categoryItems.map(item => this.buildItemHTML(item)).join('')
          }
        </div>

        <div class="category-footer">
          <span>סה"כ:</span>
          <span class="category-total">
            ₪${this.formatNumber(totalActual)} / ₪${this.formatNumber(totalPlanned)}
          </span>
        </div>
      </div>
    `;
  },

  buildItemHTML(item) {
    return `
      <div class="budget-item ${item.is_paid ? 'paid' : ''}" data-item-id="${item.id}">
        <div class="item-checkbox">
          <input 
            type="checkbox" 
            ${item.is_paid ? 'checked' : ''} 
            data-item-id="${item.id}"
            class="item-checkbox-input"
          >
        </div>
        <div class="item-details">
          <div class="item-name">${item.name}</div>
          <div class="item-amounts">
            <span class="planned">₪${this.formatNumber(item.planned_amount)}</span>
            ${item.actual_amount > 0 
              ? `<span class="actual"> → ₪${this.formatNumber(item.actual_amount)}</span>` 
              : ''
            }
          </div>
        </div>
        <button class="btn-icon btn-edit-item" data-item-id="${item.id}">✏️</button>
      </div>
    `;
  },

  attachEventListeners() {
    // הוספת קטגוריה
    document.getElementById('btnAddCategory')?.addEventListener('click', () => {
      this.showAddCategoryDialog();
    });

    // הוספת סעיף
    document.querySelectorAll('.btn-add-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const categoryId = e.target.dataset.categoryId;
        this.showAddItemDialog(categoryId);
      });
    });

    // מחיקת קטגוריה
    document.querySelectorAll('.btn-delete-category').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const categoryId = e.target.dataset.categoryId;
        if (confirm('בטוחה שרוצה למחוק את הקטגוריה? כל הסעיפים יימחקו')) {
          await BudgetService.deleteCategory(categoryId);
          this.render(); // רענון
        }
      });
    });

    // עריכת סעיף
    document.querySelectorAll('.btn-edit-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const itemId = e.target.dataset.itemId;
        this.showEditItemDialog(itemId);
      });
    });

    // סימון ששולם
    document.querySelectorAll('.item-checkbox-input').forEach(checkbox => {
      checkbox.addEventListener('change', async (e) => {
        const itemId = e.target.dataset.itemId;
        await BudgetService.updateBudgetItem(itemId, { is_paid: e.target.checked });
        
        // אנימציית לבבות!
        if (e.target.checked) {
          this.celebratePayment();
        }
      });
    });
  },

  showAddCategoryDialog() {
    const name = prompt('שם הקטגוריה החדשה:');
    if (!name) return;

    const icon = prompt('אימוג\'י (לחץ Enter לברירת מחדל 💰):', '💰');

    BudgetService.createCategory(this.currentEvent.id, name, icon || '💰')
      .then(() => this.render())
      .catch(err => alert('שגיאה: ' + err.message));
  },

  showAddItemDialog(categoryId) {
    const name = prompt('שם הסעיף:');
    if (!name) return;

    const amount = prompt('סכום מתוכנן (בש"ח):', '0');
    const plannedAmount = parseFloat(amount) || 0;

    BudgetService.createBudgetItem(this.currentEvent.id, categoryId, name, plannedAmount)
      .then(() => this.render())
      .catch(err => alert('שגיאה: ' + err.message));
  },

  showEditItemDialog(itemId) {
    const item = this.items.find(i => i.id === itemId);
    if (!item) return;

    const newName = prompt('שם הסעיף:', item.name);
    if (!newName) return;

    const newPlanned = prompt('סכום מתוכנן:', item.planned_amount);
    const newActual = prompt('סכום בפועל:', item.actual_amount || '0');

    BudgetService.updateBudgetItem(itemId, {
      name: newName,
      planned_amount: parseFloat(newPlanned) || 0,
      actual_amount: parseFloat(newActual) || 0
    })
      .then(() => this.render())
      .catch(err => alert('שגיאה: ' + err.message));
  },

  celebratePayment() {
    // לבבות חגיגיים!
    if (window.createHeart) {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => window.createHeart(), i * 100);
      }
    }
  },

  setupRealtime() {
    // האזנה לשינויים real-time
    supabaseClient
      .channel('budget-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'categories', filter: `event_id=eq.${this.currentEvent.id}` },
        () => this.render()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'budget_items', filter: `event_id=eq.${this.currentEvent.id}` },
        () => this.render()
      )
      .subscribe();
  },

  formatNumber(num) {
    return new Intl.NumberFormat('he-IL').format(num);
  }
};

window.BudgetUI = BudgetUI;
