# 📧 قوالب البريد الإلكتروني الجاهزة للاستخدام

## 📁 الملفات

### 1. قالب تأكيد التذكرة
**الملف:** `email-templates/ticket-confirmation.html`

**المتغيرات المطلوبة:**
```typescript
{
  USER_NAME: string;          // اسم المستخدم
  USER_EMAIL: string;         // البريد الإلكتروني
  TICKET_NUMBER: string;      // رقم التذكرة (مثل: TKT-12345)
  TICKET_TYPE: string;        // نوع التذكرة (VIP, عام, إلخ)
  EVENT_NAME: string;         // اسم الفعالية
  EVENT_DATE: string;         // تاريخ الفعالية (15 أغسطس 2026)
  EVENT_TIME: string;         // وقت الفعالية (10:00 صباحاً)
  EVENT_LOCATION: string;     // موقع الفعالية
  QR_CODE_URL: string;        // رابط صورة QR Code
  TICKET_URL: string;         // رابط صفحة التذكرة الكاملة
  SUPPORT_EMAIL: string;      // بريد الدعم
  CURRENT_YEAR: string;       // السنة الحالية (2026)
  ORGANIZATION_NAME: string;  // اسم المنظمة
}
```

**الاستخدام السريع:**
```typescript
const ticketHTML = replaceTemplateVariables(TICKET_TEMPLATE, {
  USER_NAME: 'أحمد محمد',
  USER_EMAIL: 'ahmed@example.com',
  TICKET_NUMBER: 'TKT-12345',
  TICKET_TYPE: 'VIP',
  EVENT_NAME: 'مؤتمر التقنية 2026',
  EVENT_DATE: '15 أغسطس 2026',
  EVENT_TIME: '10:00 صباحاً',
  EVENT_LOCATION: 'مركز الملك عبدالله',
  QR_CODE_URL: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TKT-12345',
  TICKET_URL: 'https://yourdomain.com/tickets/12345',
  SUPPORT_EMAIL: 'support@yourdomain.com',
  CURRENT_YEAR: '2026',
  ORGANIZATION_NAME: 'اسم المنظمة'
});

await sendEmail('ahmed@example.com', '🎫 تذكرتك للمؤتمر', ticketHTML, env);
```

---

### 2. قالب تأكيد الدفع
**الملف:** `email-templates/payment-confirmation.html`

**المتغيرات المطلوبة:**
```typescript
{
  USER_NAME: string;          // اسم المستخدم
  USER_EMAIL: string;         // البريد الإلكتروني
  USER_PHONE: string;         // رقم الهاتف
  TRANSACTION_ID: string;     // رقم المعاملة (مثل: TXN-67890)
  PAYMENT_DATE: string;       // تاريخ الدفع
  PAYMENT_METHOD: string;     // طريقة الدفع (بطاقة ائتمان، تحويل، إلخ)
  EVENT_NAME: string;         // اسم الفعالية
  TICKET_TYPE: string;        // نوع التذكرة
  AMOUNT: string;             // المبلغ (250)
  CURRENCY: string;           // العملة (USD, SAR, إلخ)
  RECEIPT_URL: string;        // رابط الإيصال
  SUPPORT_EMAIL: string;      // بريد الدعم
  CURRENT_YEAR: string;       // السنة الحالية
  ORGANIZATION_NAME: string;  // اسم المنظمة
}
```

**الاستخدام السريع:**
```typescript
const paymentHTML = replaceTemplateVariables(PAYMENT_TEMPLATE, {
  USER_NAME: 'سارة علي',
  USER_EMAIL: 'sara@example.com',
  USER_PHONE: '+966501234567',
  TRANSACTION_ID: 'TXN-67890',
  PAYMENT_DATE: '6 أغسطس 2026، 2:30 م',
  PAYMENT_METHOD: 'بطاقة ائتمان',
  EVENT_NAME: 'مؤتمر التقنية 2026',
  TICKET_TYPE: 'VIP',
  AMOUNT: '250',
  CURRENCY: 'USD',
  RECEIPT_URL: 'https://yourdomain.com/receipts/67890',
  SUPPORT_EMAIL: 'support@yourdomain.com',
  CURRENT_YEAR: '2026',
  ORGANIZATION_NAME: 'اسم المنظمة'
});

await sendEmail('sara@example.com', '✅ تم تأكيد دفعتك', paymentHTML, env);
```

---

## 🎨 مميزات القوالب

### ✅ متوافقة تماماً مع Gmail
- ✅ Table-based layout (لا Flexbox أو Grid)
- ✅ Inline CSS فقط (لا external stylesheets)
- ✅ نسبة نص/صور متوازنة (60-70% نص)
- ✅ حجم البريد < 100KB
- ✅ تصميم متجاوب (Mobile-First)

### 🎨 تصميم احترافي
- ✅ تدرجات لونية حديثة (Gradients)
- ✅ أيقونات إيموجي واضحة
- ✅ بطاقات معلومات منظمة
- ✅ أزرار CTA بارزة
- ✅ قسم QR Code مميز

### 🌐 دعم كامل للعربية
- ✅ `dir="rtl"` و `lang="ar"`
- ✅ خطوط واضحة ومقروءة
- ✅ تنسيق تواريخ عربية
- ✅ نصوص عربية احترافية

### 🚀 مُحسّن للأداء
- ✅ لا تعتمد على external resources
- ✅ inline images للأيقونات
- ✅ lightweight code
- ✅ fast rendering

---

## 🔧 دالة استبدال المتغيرات (جاهزة للنسخ)

```typescript
/**
 * استبدال المتغيرات في القالب بالقيم الفعلية
 * @param template - قالب HTML مع متغيرات {{VARIABLE}}
 * @param variables - كائن يحتوي على القيم
 * @returns HTML جاهز للإرسال
 */
function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;

  // استبدال كل متغير {{KEY}} بقيمته
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    result = result.split(placeholder).join(value || '');
  }

  return result;
}
```

---

## 📨 أمثلة إرسال البريد

### مثال 1: استخدام Resend API

```typescript
async function sendTicketViaResend(userData: any, env: Env) {
  const html = replaceTemplateVariables(TICKET_TEMPLATE, {
    USER_NAME: userData.name,
    TICKET_NUMBER: `TKT-${userData.id}`,
    // ... باقي المتغيرات
  });

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'events@yourdomain.com',
      to: [userData.email],
      subject: `🎫 تذكرتك - ${userData.eventName}`,
      html: html,
    }),
  });

  return response.ok;
}
```

### مثال 2: استخدام SendGrid API

```typescript
async function sendPaymentViaSendGrid(paymentData: any, env: Env) {
  const html = replaceTemplateVariables(PAYMENT_TEMPLATE, {
    USER_NAME: paymentData.name,
    TRANSACTION_ID: `TXN-${paymentData.id}`,
    // ... باقي المتغيرات
  });

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: paymentData.email }] }],
      from: { email: 'payments@yourdomain.com', name: 'نظام الدفع' },
      subject: '✅ تم تأكيد دفعتك',
      content: [{ type: 'text/html', value: html }],
    }),
  });

  return response.ok;
}
```

---

## 🔒 نصائح تجنب Spam

### 1. إعدادات DNS
```bash
# أضف هذه السجلات في DNS الخاص بنطاقك

# SPF Record
yourdomain.com IN TXT "v=spf1 include:_spf.resend.com ~all"

# DMARC Record
_dmarc.yourdomain.com IN TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"
```

### 2. سطر الموضوع
```typescript
// ✅ جيد
'تذكرتك لمؤتمر التقنية 2026'
'تأكيد دفعتك - مبلغ 250 USD'

// ❌ سيئ (قد يعتبر spam)
'🎉🎉🎉 FREE TICKETS WIN NOW!!!'
'Click here NOW for AMAZING offer!!!'
```

### 3. معلومات المرسل
```typescript
// ✅ استخدم نطاق محقق ومخصص
from: 'events@yourdomain.com'

// ❌ تجنب Gmail/Hotmail
from: 'myevent@gmail.com' // سيرفضه معظم السيرفرات
```

### 4. محتوى البريد
- ✅ نسبة نص/صور: 60-70%
- ✅ تجنب الكلمات الترويجية الزائدة
- ✅ روابط واضحة وصريحة
- ✅ إضافة رابط إلغاء الاشتراك

---

## 📋 Checklist قبل الإرسال

- [ ] تم استبدال **جميع** المتغيرات
- [ ] لا توجد متغيرات فارغة `{{EMPTY}}`
- [ ] تم التحقق من رابط QR Code
- [ ] تم اختبار الروابط (TICKET_URL, RECEIPT_URL)
- [ ] تم تعيين SUPPORT_EMAIL الصحيح
- [ ] DNS settings (SPF, DKIM, DMARC) محدثة
- [ ] تم اختبار البريد على حساب حقيقي
- [ ] البريد يظهر بشكل صحيح في Gmail/Outlook

---

## 🧪 اختبار سريع

```typescript
// دالة اختبار
async function testTemplate() {
  const testHTML = replaceTemplateVariables(TICKET_TEMPLATE, {
    USER_NAME: 'اختبار',
    USER_EMAIL: 'test@example.com',
    TICKET_NUMBER: 'TEST-123',
    TICKET_TYPE: 'اختبار',
    EVENT_NAME: 'فعالية تجريبية',
    EVENT_DATE: '1 يناير 2026',
    EVENT_TIME: '12:00 م',
    EVENT_LOCATION: 'موقع تجريبي',
    QR_CODE_URL: 'https://via.placeholder.com/200',
    TICKET_URL: 'https://example.com/test',
    SUPPORT_EMAIL: 'support@example.com',
    CURRENT_YEAR: '2026',
    ORGANIZATION_NAME: 'منظمة تجريبية'
  });

  // احفظ في ملف محلي للمعاينة
  console.log(testHTML);
}
```

---

## ✅ الخلاصة

**قوالب جاهزة 100% للاستخدام:**
- ✅ تصميم احترافي عصري
- ✅ متوافقة تماماً مع Gmail
- ✅ دعم كامل للعربية RTL
- ✅ سهلة الدمج في أي Backend
- ✅ متغيرات واضحة ومنظمة
- ✅ مُحسّنة لتجنب Spam

**جاهزة للنسخ واللصق مباشرة في الباك إند! 🚀**
