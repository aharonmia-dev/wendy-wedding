-- ============================================
-- Wendy App - Database Setup
-- הריצי את הSQL הזה ב-Supabase SQL Editor
-- ============================================

-- טבלת קטגוריות תקציב
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '💰',
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- טבלת סעיפי תקציב
CREATE TABLE IF NOT EXISTS budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  planned_amount DECIMAL(10,2) DEFAULT 0,
  actual_amount DECIMAL(10,2) DEFAULT 0,
  is_paid BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- הפעלת RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Policies לקטגוריות
-- ============================================

-- קריאה: רק אירועים שאני חבר בהם
CREATE POLICY "Users can view categories of their events" ON categories
  FOR SELECT USING (
    event_id IN (
      SELECT event_id FROM event_members WHERE user_id = auth.uid()
    )
  );

-- הוספה: רק לאירועים שאני חבר בהם
CREATE POLICY "Users can insert categories to their events" ON categories
  FOR INSERT WITH CHECK (
    event_id IN (
      SELECT event_id FROM event_members WHERE user_id = auth.uid()
    )
  );

-- עדכון: רק אירועים שאני חבר בהם
CREATE POLICY "Users can update categories of their events" ON categories
  FOR UPDATE USING (
    event_id IN (
      SELECT event_id FROM event_members WHERE user_id = auth.uid()
    )
  );

-- מחיקה: רק אירועים שאני חבר בהם
CREATE POLICY "Users can delete categories of their events" ON categories
  FOR DELETE USING (
    event_id IN (
      SELECT event_id FROM event_members WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- Policies לסעיפי תקציב
-- ============================================

-- קריאה: רק אירועים שאני חבר בהם
CREATE POLICY "Users can view budget items of their events" ON budget_items
  FOR SELECT USING (
    event_id IN (
      SELECT event_id FROM event_members WHERE user_id = auth.uid()
    )
  );

-- הוספה: רק לאירועים שאני חבר בהם
CREATE POLICY "Users can insert budget items to their events" ON budget_items
  FOR INSERT WITH CHECK (
    event_id IN (
      SELECT event_id FROM event_members WHERE user_id = auth.uid()
    )
  );

-- עדכון: רק אירועים שאני חבר בהם
CREATE POLICY "Users can update budget items of their events" ON budget_items
  FOR UPDATE USING (
    event_id IN (
      SELECT event_id FROM event_members WHERE user_id = auth.uid()
    )
  );

-- מחיקה: רק אירועים שאני חבר בהם
CREATE POLICY "Users can delete budget items of their events" ON budget_items
  FOR DELETE USING (
    event_id IN (
      SELECT event_id FROM event_members WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- Indexes לביצועים
-- ============================================

CREATE INDEX IF NOT EXISTS idx_categories_event_id ON categories(event_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_event_id ON budget_items(event_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_category_id ON budget_items(category_id);

-- ============================================
-- סיימנו! 🎉
-- ============================================

-- עכשיו אפשר לבדוק שהטבלאות נוצרו:
-- SELECT * FROM categories;
-- SELECT * FROM budget_items;
