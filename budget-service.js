// js/budget/budget-service.js
// לוגיקת ניהול תקציב מול Supabase

const BudgetService = {
  
  // טעינת כל הקטגוריות של האירוע
  async loadCategories(eventId) {
    const { data, error } = await supabaseClient
      .from('categories')
      .select('*')
      .eq('event_id', eventId)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // טעינת כל הסעיפים של האירוע
  async loadBudgetItems(eventId) {
    const { data, error } = await supabaseClient
      .from('budget_items')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // יצירת קטגוריה חדשה
  async createCategory(eventId, name, icon = '💰') {
    const { data, error } = await supabaseClient
      .from('categories')
      .insert([{
        event_id: eventId,
        name,
        icon,
        display_order: 999
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // יצירת סעיף תקציבי חדש
  async createBudgetItem(eventId, categoryId, name, plannedAmount = 0) {
    const { data, error } = await supabaseClient
      .from('budget_items')
      .insert([{
        event_id: eventId,
        category_id: categoryId,
        name,
        planned_amount: plannedAmount,
        actual_amount: 0,
        is_paid: false
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // עדכון סעיף תקציבי
  async updateBudgetItem(itemId, updates) {
    const { data, error } = await supabaseClient
      .from('budget_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // מחיקת סעיף תקציבי
  async deleteBudgetItem(itemId) {
    const { error } = await supabaseClient
      .from('budget_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  },

  // מחיקת קטגוריה (וכל הסעיפים שלה)
  async deleteCategory(categoryId) {
    const { error } = await supabaseClient
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) throw error;
  },

  // יצירת קטגוריות ברירת מחדל
  async createDefaultCategories(eventId) {
    const defaultCategories = [
      { name: 'צילום ווידאו', icon: '📸' },
      { name: 'אולם וקייטרינג', icon: '🏛️' },
      { name: 'לבוש כלה', icon: '👰' },
      { name: 'לבוש חתן', icon: '🤵' },
      { name: 'מוזיקה והופעות', icon: '🎵' },
      { name: 'פרחים ועיצוב', icon: '💐' }
    ];

    const { data, error } = await supabaseClient
      .from('categories')
      .insert(
        defaultCategories.map((cat, index) => ({
          event_id: eventId,
          name: cat.name,
          icon: cat.icon,
          display_order: index
        }))
      )
      .select();

    if (error) throw error;
    return data;
  },

  // חישוב סיכומים
  calculateSummary(categories, items) {
    let totalPlanned = 0;
    let totalActual = 0;
    let totalPaid = 0;

    items.forEach(item => {
      totalPlanned += parseFloat(item.planned_amount || 0);
      totalActual += parseFloat(item.actual_amount || 0);
      if (item.is_paid) {
        totalPaid += parseFloat(item.actual_amount || 0);
      }
    });

    return {
      totalPlanned,
      totalActual,
      totalPaid,
      remaining: totalPlanned - totalActual
    };
  }
};

window.BudgetService = BudgetService;
