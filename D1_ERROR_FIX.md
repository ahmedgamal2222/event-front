# 🔧 حل مشكلة D1_ERROR في جدول المهام

## المشكلة
```
D1_ERROR: table tasks has no column named creator_email: SQLITE_ERROR
```

## السبب
جدول `tasks` في قاعدة البيانات D1 لا يحتوي على عمود `creator_email`، ولكن الكود يحاول إدراج قيمة فيه.

## ✅ الحل (في الباك إند event-api)

### 1. إضافة عمود `creator_email` إلى جدول المهام

**الخيار الأول: تشغيل Migration في D1**

```sql
-- migration.sql
ALTER TABLE tasks ADD COLUMN creator_email TEXT;
```

**تشغيل Migration:**
```bash
# في مجلد الباك إند
wrangler d1 execute YOUR_DATABASE_NAME --file=./migration.sql
```

### 2. تحديث Schema في الكود

إذا كان لديك ملف schema أو initialization، تأكد من إضافة العمود:

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  assigned_to TEXT,
  creator_email TEXT,           -- ← إضافة هذا السطر
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);
```

### 3. تحديث الكود في Worker

**في ملف worker (index.ts أو main.ts):**

تأكد من أن الكود يطابق الأعمدة الموجودة:

```typescript
// إنشاء مهمة جديدة
case '/api/crm/tasks': {
  if (req.method === 'POST') {
    const body = await req.json();
    const { 
      contact_id, 
      title, 
      description, 
      due_date, 
      priority = 'medium', 
      status = 'pending',
      assigned_to,
      creator_email  // ← تأكد من وجود هذا
    } = body;

    const result = await env.DB.prepare(`
      INSERT INTO tasks (
        contact_id, 
        title, 
        description, 
        due_date, 
        priority, 
        status,
        assigned_to,
        creator_email,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      contact_id, 
      title, 
      description, 
      due_date, 
      priority, 
      status,
      assigned_to,
      creator_email
    ).run();

    return jsonResponse({
      success: true,
      data: { id: result.meta.last_row_id }
    });
  }
  break;
}
```

### 4. الحل السريع (إذا لم تكن بحاجة لـ creator_email)

إذا كنت لا تحتاج لحفظ `creator_email`، ببساطة:

1. أزل `creator_email` من قائمة الأعمدة في INSERT
2. أزله من القيم VALUES
3. أزله من bind()

```typescript
// بدون creator_email
const result = await env.DB.prepare(`
  INSERT INTO tasks (
    contact_id, 
    title, 
    description, 
    due_date, 
    priority, 
    status,
    assigned_to,
    created_at,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`).bind(
  contact_id, 
  title, 
  description, 
  due_date, 
  priority, 
  status,
  assigned_to
).run();
```

## 🔍 التشخيص السريع

**للتحقق من الأعمدة الموجودة حالياً:**

```bash
wrangler d1 execute YOUR_DATABASE_NAME --command="PRAGMA table_info(tasks);"
```

**النتيجة ستظهر جميع الأعمدة الموجودة:**
```
cid | name          | type    | notnull | dflt_value | pk
----|---------------|---------|---------|------------|----
0   | id            | INTEGER | 0       | NULL       | 1
1   | contact_id    | INTEGER | 1       | NULL       | 0
2   | title         | TEXT    | 1       | NULL       | 0
3   | description   | TEXT    | 0       | NULL       | 0
...
```

إذا لم تجد `creator_email` في القائمة، اتبع الحل أعلاه.

## 🚀 خطوات التنفيذ الموصى بها

### الخطوة 1: النسخ الاحتياطي
```bash
# احفظ نسخة احتياطية من البيانات الحالية
wrangler d1 execute YOUR_DATABASE_NAME --command="SELECT * FROM tasks;" > tasks_backup.sql
```

### الخطوة 2: إضافة العمود
```bash
wrangler d1 execute YOUR_DATABASE_NAME --command="ALTER TABLE tasks ADD COLUMN creator_email TEXT;"
```

### الخطوة 3: تحديث الكود
- افتح ملف worker الرئيسي
- تأكد من إضافة `creator_email` في INSERT و bind

### الخطوة 4: إعادة النشر
```bash
wrangler publish
# أو
wrangler deploy
```

### الخطوة 5: الاختبار
```bash
# اختبر إنشاء مهمة جديدة
curl -X POST https://event-api.info1703.workers.dev/api/crm/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contact_id": 1,
    "title": "Test Task",
    "description": "Testing creator_email",
    "due_date": "2026-08-10",
    "priority": "high",
    "status": "pending",
    "assigned_to": "admin@example.com",
    "creator_email": "creator@example.com"
  }'
```

## 📋 الكود الكامل المقترح

```typescript
// في worker - مسار POST /api/crm/tasks
if (url.pathname === '/api/crm/tasks' && req.method === 'POST') {
  try {
    const body = await req.json();
    const { 
      contact_id, 
      title, 
      description = '', 
      due_date = null, 
      priority = 'medium', 
      status = 'pending',
      assigned_to = null,
      creator_email = null  // قيمة افتراضية null
    } = body;

    // Validation
    if (!contact_id || !title) {
      return jsonResponse({
        success: false,
        error: 'contact_id and title are required'
      }, 400);
    }

    // Insert with creator_email
    const result = await env.DB.prepare(`
      INSERT INTO tasks (
        contact_id, 
        title, 
        description, 
        due_date, 
        priority, 
        status,
        assigned_to,
        creator_email,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      contact_id, 
      title, 
      description, 
      due_date, 
      priority, 
      status,
      assigned_to,
      creator_email
    ).run();

    if (result.success) {
      return jsonResponse({
        success: true,
        data: { 
          id: result.meta.last_row_id,
          message: 'Task created successfully'
        }
      }, 201);
    }

    throw new Error('Failed to create task');

  } catch (error) {
    console.error('Error creating task:', error);
    return jsonResponse({
      success: false,
      error: error.message || 'Internal server error'
    }, 500);
  }
}
```

## ⚠️ ملاحظات هامة

1. **لا تنسى النسخ الاحتياطي** قبل تعديل Schema
2. **اختبر في بيئة التطوير** أولاً قبل Production
3. **تحقق من جميع استعلامات SELECT** التي تقرأ من جدول tasks - قد تحتاج لإضافة creator_email
4. **Migration لمرة واحدة**: ALTER TABLE يُنفذ مرة واحدة فقط، لا تكرره

## 🎯 التحقق من النجاح

بعد تطبيق الحل، يجب أن:
- ✅ إنشاء المهام يعمل بدون أخطاء
- ✅ `creator_email` يُحفظ بشكل صحيح
- ✅ لا توجد أخطاء D1_ERROR في console

---

**إذا استمرت المشكلة:**
- تحقق من اسم العمود في الكود (case sensitive)
- تأكد من تشغيل Migration بنجاح
- راجع wrangler logs للأخطاء التفصيلية
