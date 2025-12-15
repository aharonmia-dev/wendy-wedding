# 💕 Wendy - אפליקציית תקציב חתונה

אפליקציית ווב רספונסיבית לניהול תקציב חתונה לזוגות מאורסים.

## 🎉 מה בנינו?

✅ **Splash Screen** - מסך פתיחה יפהפה עם לוגו wendy ולבבות נופלים  
✅ **מערכת התחברות** - הרשמה/התחברות עם Supabase Auth  
✅ **שיתוף בין בני זוג** - מערכת הזמנות לאירוע משותף  
✅ **Navigation Bar** - תפריט ניווט רספונסיבי (מובייל + דסקטופ)  
✅ **מסך תקציב מלא** - ניהול קטגוריות וסעיפי תקציב  
✅ **Real-time sync** - עדכון אוטומטי בין שני המשתמשים  
✅ **עיצוב מהמם** - אנימציות לבבות וצבעים חמים  

---

## 📁 מבנה הפרויקט

```
wendy-app/
├── index.html              # דף הכניסה
│
├── css/
│   ├── global.css         # עיצוב כללי + splash + לבבות
│   └── budget.css         # עיצוב מסך תקציב
│
└── js/
    ├── app.js             # מנהל ראשי
    ├── router.js          # ניווט בין מסכים
    ├── auth.js            # התחברות
    ├── events.js          # ניהול אירועים
    ├── supabase.js        # חיבור ל-Supabase
    ├── ui.js              # עזרי UI
    │
    └── budget/
        ├── budget-service.js  # לוגיקת תקציב
        └── budget-ui.js       # תצוגת תקציב
```

---

## 🚀 איך להתקין?

### שלב 1: העלאת הקבצים ל-GitHub

1. פתחי את ה-Repository שלך ב-GitHub
2. העלי את **כל התיקייה `wendy-app`** (כולל css, js, index.html)
3. שמרי את השינויים

### שלב 2: וידוא שה-SQL רץ ב-Supabase

אם עוד לא הרצת, היכנסי ל-Supabase → SQL Editor והריצי:

```sql
-- טבלת קטגוריות
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '💰',
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- טבלת סעיפי תקציב
CREATE TABLE budget_items (
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

-- RLS Policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

-- Policies לקטגוריות
CREATE POLICY "Users can view categories of their events" ON categories
  FOR SELECT USING (
    event_id IN (
      SELECT event_id FROM event_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert categories to their events" ON categories
  FOR INSERT WITH CHECK (
    event_id IN (
      SELECT event_id FROM event_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update categories of their events" ON categories
  FOR UPDATE USING (
    event_id IN (
      SELECT event_id FROM event_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete categories of their events" ON categories
  FOR DELETE USING (
    event_id IN (
      SELECT event_id FROM event_members WHERE user_id = auth.uid()
    )
  );

-- Policies לסעיפי תקציב
CREATE POLICY "Users can view budget items of their events" ON budget_items
  FOR SELECT USING (
    event_id IN (
      SELECT event_id FROM event_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert budget items to their events" ON budget_items
  FOR INSERT WITH CHECK (
    event_id IN (
      SELECT event_id FROM event_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update budget items of their events" ON budget_items
  FOR UPDATE USING (
    event_id IN (
      SELECT event_id FROM event_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete budget items of their events" ON budget_items
  FOR DELETE USING (
    event_id IN (
      SELECT event_id FROM event_members WHERE user_id = auth.uid()
    )
  );
```

### שלב 3: בדיקת החיבור ל-Supabase

וודאי שהקובץ `js/supabase.js` מכיל את הנתונים הנכונים שלך:

```javascript
const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-KEY";
```

---

## 🎯 איך זה עובד?

### 1️⃣ התחברות
- פתיחת האפליקציה → מסך splash עם wendy
- לחיצה על "בואו נתחיל" → טופס התחברות
- הרשמה/התחברות → מעבר לאפליקציה

### 2️⃣ שיתוף עם בן/בת זוג
- לחיצה על 💌 בHeader → יצירת לינק הזמנה
- שליחת הלינק לבן/בת הזוג
- הוא/היא נרשמים דרך הלינק → מתחברים לאותו אירוע

### 3️⃣ ניהול תקציב
- **קטגוריות ברירת מחדל**: צילום, אולם, לבוש כלה, לבוש חתן, מוזיקה, פרחים
- הוספת קטגוריות נוספות: לחיצה על "➕ הוסף קטגוריה"
- הוספת סעיפים: לחיצה על `+` בכל קטגוריה
- עריכת סעיף: לחיצה על ✏️
- סימון ששולם: סימון ה-checkbox → **לבבות חגיגיים!** 💕

### 4️⃣ Real-time
כל שינוי שעושה משתמש אחד מתעדכן **אוטומטית** אצל המשתמש השני!

---

## 🎨 פיצ'רים מיוחדים

### לבבות נופלים 💕
- לבבות CSS טהור (לא תמונות!)
- 10 גוונים שונים של ורוד/אדום
- 3 גדלים
- נופלים כל הזמן ברקע

### עיצוב רספונסיבי
- **דסקטופ**: תפריט צד + כפתורים עם טקסט
- **מובייל**: תפריט תחתון + רק אייקונים

### אנימציות חלקות
- מעבר מהsplash לטופס
- כניסת כרטיסים
- hover effects
- לבבות במקומות מיוחדים (תשלום, הזמנה...)

---

## 📱 מסכים זמינים

✅ **תקציב** (מוכן ועובד!)  
🔜 **ספקים** (בקרוב)  
🔜 **תשלומים** (בקרוב)  
🔜 **מתנות** (בקרוב)  
🔜 **משימות** (בקרוב)  
🔜 **סיכום** (בקרוב)  

---

## 🐛 פתרון בעיות

### האפליקציה לא עולה?
- וודאי שהעלאת את **כל התיקיות** (css/, js/) ל-GitHub
- בדקי ב-Console של הדפדפן (F12) אם יש שגיאות

### לא מצליחה להתחבר?
- וודאי שהרצת את ה-SQL ב-Supabase
- בדקי שמפתחות ה-Supabase נכונים ב-`js/supabase.js`

### Real-time לא עובד?
- היכנסי ל-Supabase → Database → Replication
- וודאי ש-`categories` ו-`budget_items` מסומנים

### השינויים לא נשמרים?
- בדקי ב-Supabase → Authentication שהמשתמש מחובר
- בדקי ב-Network (F12) אם יש שגיאות 403/401

---

## 💡 טיפים לפיתוח

### איך להוסיף מסך חדש?

1. **צרי קובץ HTML חדש** ב-`js/[feature]/[feature]-ui.js`
2. **הוסיפי ל-router.js**:
```javascript
case 'my-new-view':
  MyNewViewUI.render();
  break;
```
3. **הוסיפי כפתור בNavigation** ב-`index.html`

### איך לשנות צבעים?
עדכני את ה-CSS variables ב-`css/global.css`:
```css
:root {
  --pink-primary: #ec4899;  /* שנה כאן */
  --pink-dark: #be185d;
}
```

---

## 📞 תמיכה

יש בעיה? רוצה להוסיף פיצ'ר?  
חזרי אליי ונמשיך לבנות יחד! 💕

---

## 🎉 מה הלאה?

הצעדים הבאים:
1. ✅ **תקציב** - מוכן!
2. 🔜 **ספקים** - ניהול ספקים והצעות מחיר
3. 🔜 **תשלומים** - לוח תשלומים ותזכורות
4. 🔜 **מתנות** - רישום מתנות + יבוא מExcel
5. 🔜 **משימות** - checklist כמו שהכנת
6. 🔜 **Dashboard** - סיכום ותרשימים

---

בהצלחה עם החתונה! 💍✨
