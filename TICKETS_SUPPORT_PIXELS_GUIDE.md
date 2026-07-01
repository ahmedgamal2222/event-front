# نظام التذاكر والدعم الفني والبكسل - دليل الاستخدام

## 🎫 نظام التذاكر (Ticketing System)

### قاعدة البيانات
تم إنشاء جدولين جديدين:

**ticket_types** - أنواع التذاكر المتاحة
- `id`: معرّف فريد
- `event_id`: معرّف الحدث
- `name_ar/name_en`: اسم التذكرة
- `price_per_unit`: السعر
- `duration_type`: نوع المدة (single_day | three_days | full_event | custom_days)
- `custom_days`: عدد الأيام (للنوع custom_days)
- `day_numbers`: أيام محددة (JSON array)
- `quantity_available/quantity_sold`: الكمية المتاحة والمباعة

**tickets** - التذاكر المشتراة
- `ticket_number`: رقم فريد للتذكرة
- `qr_code`: كود QR للفحص
- `valid_from/valid_to`: تاريخ الصلاحية
- `status`: available | used | expired | cancelled

### مثال على الاستخدام

#### في الواجهة الأمامية:
```tsx
import TicketsSection from '@/app/components/TicketsSection';

// في صفحة الحدث
<TicketsSection eventId={eventId} />
```

#### في لوحة التحكم:
```tsx
import AdminTickets from '@/app/components/admin/AdminTickets';

<AdminTickets eventId={eventId} token={token} />
```

### API الخاص بالتذاكر

**الحصول على قائمة التذاكر:**
```bash
GET /api/events/:eventId/tickets
```

**إنشاء تذكرة جديدة (Admin):**
```bash
POST /api/events/:eventId/tickets
{
  "name_ar": "تذكرة عادية",
  "name_en": "Standard Ticket",
  "price_per_unit": 500,
  "duration_type": "full_event",
  "quantity_available": 1000,
  "sort_order": 1
}
```

**تحديث تذكرة:**
```bash
PUT /api/events/:eventId/tickets/:id
```

**حذف تذكرة:**
```bash
DELETE /api/events/:eventId/tickets/:id
```

---

## 💬 نظام الدعم الفني (Support System)

### قاعدة البيانات
جدول `support_messages` يحتوي على:
- `name/email/phone`: بيانات المستخدم
- `subject/message`: محتوى الرسالة
- `category`: التصنيف (general | technical | registration | ticketing | other)
- `status`: جديدة | مفتوحة | قيد المعالجة | تم حلها | مغلقة
- `priority`: urgent | high | medium | low
- `admin_response`: رد الأدمن

### المكونات

#### 1. SupportWidget (الواجهة الأمامية)
```tsx
import SupportWidget from '@/app/components/SupportWidget';

// في الصفحة الرئيسية
<SupportWidget eventId={eventId} primaryColor="#2563eb" />
```

**الميزات:**
- زر عومي جميل مع أيقونة تواصل 💬
- نموذج استجابي بحقول: الاسم، البريد، الهاتف، الموضوع، الرسالة
- تصنيفات متعددة للرسائل
- تأكيد فوري بعد الإرسال

#### 2. AdminSupport (لوحة التحكم)
```tsx
import AdminSupport from '@/app/components/admin/AdminSupport';

<AdminSupport eventId={eventId} token={token} />
```

**الميزات:**
- قائمة الرسائل مع فلترة حسب الحالة
- عرض تفصيلي للرسالة
- إمكانية الرد مباشرة
- تتبع حالة الرسالة والأولوية
- تصنيف الرسائل ملونة للتمييز السريع

### API الخاص بالدعم الفني

**إرسال رسالة دعم (عام):**
```bash
POST /api/events/:eventId/support/messages
{
  "name": "أحمد محمد",
  "email": "user@example.com",
  "phone": "+966501234567",
  "subject": "مشكلة في التسجيل",
  "message": "لا أستطيع التسجيل...",
  "category": "registration"
}
```

**الحصول على الرسائل (Admin):**
```bash
GET /api/events/:eventId/support/messages
Headers: Authorization: Bearer <token>
```

**الرد على رسالة:**
```bash
PUT /api/events/:eventId/support/messages/:id
Headers: Authorization: Bearer <token>
{
  "admin_response": "تم حل المشكلة...",
  "admin_name": "Admin Name",
  "status": "resolved",
  "priority": "high"
}
```

---

## 📊 نظام البكسل والتتبع (Pixel Tracking)

### قاعدة البيانات
جدول `pixel_tracking` يدعم:
- Facebook Pixel ID + كود البكسل
- LinkedIn Partner ID + Insight Tag
- Twitter Tracking ID + Conversion Tag
- Google Analytics (gtag) ID + كود gtag
- Custom HTML/JavaScript code

### المكونات

#### 1. AdminPixels (إدارة الأكواد)
```tsx
import AdminPixels from '@/app/components/admin/AdminPixels';

<AdminPixels eventId={eventId} token={token} />
```

**الميزات:**
- واجهة سهلة لإضافة/تعديل جميع أكواز الـ pixels
- تقسيم واضح لكل منصة
- إمكانية لصق الأكواز الكاملة مباشرة
- حقول منفصلة للـ IDs والأكواز

#### 2. PixelInjector (حقن الأكواز)
```tsx
import PixelInjector from '@/app/components/PixelInjector';

// في layout.tsx أو page.tsx
<PixelInjector eventId={eventId} />
```

**الميزات:**
- تحميل جميع أكواز البكسل من قاعدة البيانات
- حقن الأكواز تلقائياً في رأس الصفحة (HTML Head)
- يعمل في الجزء الأمامي فقط (Client Component)

### API الخاص بالبكسل

**الحصول على أكواز البكسل:**
```bash
GET /api/events/:eventId/support/pixels
```

**تحديث أكواز البكسل (Admin):**
```bash
PUT /api/events/:eventId/support/pixels
Headers: Authorization: Bearer <token>
{
  "facebook_pixel_id": "123456789",
  "facebook_pixel_code": "<script>...</script>",
  "linkedin_pixel_id": "123456",
  "linkedin_pixel_code": "<script>...</script>",
  "twitter_pixel_id": "abc123",
  "twitter_pixel_code": "<script>...</script>",
  "gtag_id": "G-XXXXXXXXXX",
  "gtag_code": "<script>...</script>",
  "custom_pixel_code": "<script>...</script>",
  "is_active": 1
}
```

### أمثلة على أكواد البكسل

#### Facebook Pixel
```html
<!-- Facebook Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'YOUR_PIXEL_ID');
fbq('track', 'PageView');
</script>
```

#### LinkedIn Insight Tag
```html
<script type="text/javascript">
_linkedin_partner_id = "YOUR_PARTNER_ID";
window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
window._linkedin_data_partner_ids.push(_linkedin_partner_id);
</script><script type="text/javascript">
(function(){var s = document.getElementsByTagName("script")[0];
var b = document.createElement("script");
b.type = "text/javascript";b.async = true;
b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
s.parentNode.insertBefore(b, s);})();
</script>
```

---

## 📝 خطوات الاستخدام

### 1. **التهيئة الأولية**

في ملف layout.tsx أو page.tsx:

```tsx
import PixelInjector from '@/app/components/PixelInjector';
import SupportWidget from '@/app/components/SupportWidget';

export default function EventPage({ params }: { params: { slug: string } }) {
  const eventId = 1; // حسب الحدث

  return (
    <>
      <PixelInjector eventId={eventId} />
      <SupportWidget eventId={eventId} primaryColor="#3b82f6" />
      
      {/* باقي الصفحة */}
      <TicketsSection eventId={eventId} />
    </>
  );
}
```

### 2. **إدارة التذاكر (Admin)**

في لوحة التحكم:

```tsx
import AdminTickets from '@/app/components/admin/AdminTickets';

<AdminTickets eventId={eventId} token={token} />
```

ثم:
- انقر على "إضافة تذكرة جديدة"
- ملء البيانات (الاسم، السعر، النوع، الكمية)
- اختر نوع المدة (يوم واحد / 3 أيام / كل الأيام / عدد أيام محدد)
- احفظ

### 3. **إدارة الدعم الفني (Admin)**

في لوحة التحكم:

```tsx
import AdminSupport from '@/app/components/admin/AdminSupport';

<AdminSupport eventId={eventId} token={token} />
```

ثم:
- عرض جميع الرسائل الواردة
- فلترة حسب الحالة أو الأولوية
- اختر رسالة واضغط عليها
- أرسل ردك مباشرة

### 4. **إضافة أكواز البكسل (Admin)**

في لوحة التحكم:

```tsx
import AdminPixels from '@/app/components/admin/AdminPixels';

<AdminPixels eventId={eventId} token={token} />
```

ثم:
- اضغط على "تحميل الموجود" (لتحديث البيانات الحالية)
- أدرج معرّفات الأكواد من كل منصة
- الصق الأكواز الكاملة في حقول HTML/JavaScript
- احفظ الأكواد

---

## 🔍 نصائح الاستخدام الاحترافية

### للتذاكر:
- ✅ استخدم أنواع مختلفة حسب أيام الحدث
- ✅ حدّث كمية التذاكر المتاحة تدريجياً
- ✅ استخدم الترتيب (Sort Order) لتحديد عرض التذاكر

### للدعم الفني:
- ✅ رد سريع على رسائل الأولوية العالية
- ✅ صنّف الرسائل حسب النوع
- ✅ غيّر الحالة تدريجياً من جديدة → قيد المعالجة → تم حلها

### للبكسل:
- ✅ اختبر الأكواز بعد الحفظ باستخدام أدوات المتصفح (F12)
- ✅ استخدم أكثر من بكسل واحد لقياس شامل
- ✅ تحقق من شروط الخصوصية قبل إضافة البكسل

---

## 🚀 النشر والتحديث

### للبيئة المحلية:
```bash
# تطبيق migrations
wrangler d1 migrations apply event-db

# تشغيل البيئة المحلية
npm run dev
```

### للإنتاج:
```bash
# نشر الكود والـ DB
wrangler deploy
```

---

## 📞 دعم إضافي

للمزيد من التفاصيل التقنية، راجع:
- `ADMIN_GUIDE.md` - دليل الإدارة الشامل
- `lib/api.ts` - دوال الـ API
- `migrations/0007_tickets_system.sql` - هيكل قاعدة التذاكر
- `migrations/0008_support_and_pixels.sql` - هيكل الدعم والبكسل
