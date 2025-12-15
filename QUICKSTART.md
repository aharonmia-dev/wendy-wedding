# 🚀 התקנה מהירה - Wendy App

## צעדים בסיסיים (5 דקות!)

### 1️⃣ העלאת הקבצים ל-GitHub
```
1. פתחי את ה-Repository שלך
2. העלי את כל התיקייה wendy-app/
3. Commit + Push
```

### 2️⃣ הרצת SQL ב-Supabase
```
1. היכנסי ל-Supabase Dashboard
2. SQL Editor (בצד שמאל)
3. העתיקי והדביקי את התוכן מ-setup.sql
4. לחצי Run
```

### 3️⃣ בדיקה שה-Realtime פעיל
```
1. Supabase → Database → Replication
2. סמני ✅ את:
   - categories
   - budget_items
3. שמרי
```

### 4️⃣ פתיחת האפליקציה
```
פתחי את:
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/

או (אם GitHub Pages לא מוגדר):
פתחי את index.html ישירות מהמחשב
```

---

## ✅ איך לדעת שזה עובד?

### מבחן 1: Splash Screen
- אמורה להופיע המילה "wendy" גדולה
- לבבות נופלים ברקע
- כפתור "בואו נתחיל"

### מבחן 2: התחברות
- לחצי "בואו נתחיל"
- הטופס צריך להופיע
- נסי להירשם עם אימייל וסיסמה

### מבחן 3: תקציב
- אחרי התחברות תראי:
  - Header עם "wendy" למעלה
  - תפריט ניווט (תקציב, ספקים...)
  - 6 קטגוריות ברירת מחדל
  - כפתור "הוסף קטגוריה"

### מבחן 4: Real-time
1. פתחי 2 טאבים
2. התחברי באחד מהם
3. הוסיפי סעיף תקציב
4. זה אמור להופיע בטאב השני **אוטומטית**!

---

## 🐛 בעיות נפוצות

### "Cannot read property of undefined"
→ וודאי שהעלאת את **כל התיקיות** (css/, js/)

### "Failed to fetch"
→ בדקי שה-SUPABASE_URL ו-SUPABASE_ANON_KEY נכונים ב-js/supabase.js

### "Row level security policy violation"
→ וודאי שהרצת את ה-SQL policies מ-setup.sql

### לבבות לא נופלים
→ זה בסדר, זה לא משפיע על הפונקציונליות 😊

---

## 💕 מוכנה? בואי נתחיל!

1. העלי הכל ל-GitHub ✅
2. הריצי SQL ✅  
3. פתחי את האפליקציה ✅
4. תהני! 🎉

**יש בעיה? חזרי אליי! 💌**
