# 🎨 دليل دمج قوالب البريد الإلكتروني في الباك إند

## نظرة عامة

تم إنشاء قوالب HTML احترافية متوافقة مع Gmail وجميع خدمات البريد الإلكتروني:
- ✅ `ticket-confirmation.html` - تأكيد التذكرة
- ✅ `payment-confirmation.html` - تأكيد الدفع

## 🔧 التكامل مع Cloudflare Workers (event-api)

### 1. تحميل القوالب في Worker

**الخيار الأول: تخزين القوالب كـ Text في Worker**

```typescript
// في ملف worker الرئيسي (index.ts)

// قالب تأكيد التذكرة
const TICKET_TEMPLATE = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<!-- ... نسخ محتوى ticket-confirmation.html كامل هنا ... -->
</html>
`;

// قالب تأكيد الدفع
const PAYMENT_TEMPLATE = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<!-- ... نسخ محتوى payment-confirmation.html كامل هنا ... -->
</html>
`;
```

**الخيار الثاني: استيراد من ملفات (Wrangler 3+)**

```typescript
// في wrangler.toml
[site]
bucket = "./email-templates"

// في الكود
import ticketTemplate from './email-templates/ticket-confirmation.html';
import paymentTemplate from './email-templates/payment-confirmation.html';
```

### 2. دالة استبدال المتغيرات

```typescript
/**
 * استبدال المتغيرات في القالب بالقيم الفعلية
 */
function replaceTemplateVariables(
  template: string, 
  variables: Record<string, string>
): string {
  let result = template;
  
  // استبدال كل متغير
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    result = result.split(placeholder).join(value || '');
  }
  
  return result;
}
```

### 3. دالة إرسال البريد الإلكتروني

```typescript
/**
 * إرسال بريد إلكتروني باستخدام Resend API
 */
async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  env: Env
): Promise<boolean> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM || 'no-reply@yourdomain.com',
        to: [to],
        subject: subject,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Email sending failed:', error);
      return false;
    }

    const result = await response.json();
    console.log('Email sent successfully:', result);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
```

### 4. دالة إرسال تذكرة

```typescript
/**
 * إرسال تذكرة إلكترونية للمستخدم
 */
async function sendTicketEmail(
  userData: {
    email: string;
    name: string;
    ticketNumber: string;
    ticketType: string;
    eventName: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    qrCodeUrl: string;
    ticketUrl: string;
  },
  env: Env
): Promise<boolean> {
  const variables = {
    USER_NAME: userData.name,
    USER_EMAIL: userData.email,
    TICKET_NUMBER: userData.ticketNumber,
    TICKET_TYPE: userData.ticketType,
    EVENT_NAME: userData.eventName,
    EVENT_DATE: userData.eventDate,
    EVENT_TIME: userData.eventTime,
    EVENT_LOCATION: userData.eventLocation,
    QR_CODE_URL: userData.qrCodeUrl,
    TICKET_URL: userData.ticketUrl,
    SUPPORT_EMAIL: env.SUPPORT_EMAIL || 'support@yourdomain.com',
    CURRENT_YEAR: new Date().getFullYear().toString(),
    ORGANIZATION_NAME: env.ORGANIZATION_NAME || 'اسم المنظمة',
  };

  const htmlContent = replaceTemplateVariables(TICKET_TEMPLATE, variables);
  
  const subject = `🎫 تذكرتك لـ ${userData.eventName} - رقم ${userData.ticketNumber}`;
  
  return await sendEmail(userData.email, subject, htmlContent, env);
}
```

### 5. دالة إرسال تأكيد الدفع

```typescript
/**
 * إرسال تأكيد الدفع للمستخدم
 */
async function sendPaymentConfirmationEmail(
  paymentData: {
    email: string;
    name: string;
    phone: string;
    transactionId: string;
    paymentDate: string;
    paymentMethod: string;
    eventName: string;
    ticketType: string;
    amount: string;
    currency: string;
    receiptUrl: string;
  },
  env: Env
): Promise<boolean> {
  const variables = {
    USER_NAME: paymentData.name,
    USER_EMAIL: paymentData.email,
    USER_PHONE: paymentData.phone,
    TRANSACTION_ID: paymentData.transactionId,
    PAYMENT_DATE: paymentData.paymentDate,
    PAYMENT_METHOD: paymentData.paymentMethod,
    EVENT_NAME: paymentData.eventName,
    TICKET_TYPE: paymentData.ticketType,
    AMOUNT: paymentData.amount,
    CURRENCY: paymentData.currency,
    RECEIPT_URL: paymentData.receiptUrl,
    SUPPORT_EMAIL: env.SUPPORT_EMAIL || 'support@yourdomain.com',
    CURRENT_YEAR: new Date().getFullYear().toString(),
    ORGANIZATION_NAME: env.ORGANIZATION_NAME || 'اسم المنظمة',
  };

  const htmlContent = replaceTemplateVariables(PAYMENT_TEMPLATE, variables);
  
  const subject = `✅ تم تأكيد دفعتك - ${paymentData.eventName}`;
  
  return await sendEmail(paymentData.email, subject, htmlContent, env);
}
```

### 6. استخدام في Endpoints

```typescript
// عند إتمام التسجيل والدفع
if (url.pathname === '/api/events/register' && req.method === 'POST') {
  try {
    const body = await req.json();
    
    // 1. حفظ التسجيل في قاعدة البيانات
    const registrationResult = await env.DB.prepare(`
      INSERT INTO registrations (event_id, name, email, reg_type, status, ...)
      VALUES (?, ?, ?, ?, ?, ...)
    `).bind(...).run();
    
    const registrationId = registrationResult.meta.last_row_id;
    
    // 2. إنشاء رمز QR
    const qrCodeUrl = await generateQRCode(registrationId, env);
    
    // 3. إرسال بريد التذكرة
    const ticketSent = await sendTicketEmail({
      email: body.email,
      name: body.name,
      ticketNumber: `TKT-${registrationId}`,
      ticketType: body.reg_type,
      eventName: body.event_name,
      eventDate: body.event_date,
      eventTime: body.event_time,
      eventLocation: body.event_location,
      qrCodeUrl: qrCodeUrl,
      ticketUrl: `https://yourdomain.com/tickets/${registrationId}`,
    }, env);
    
    return jsonResponse({
      success: true,
      data: { 
        id: registrationId,
        ticket_sent: ticketSent 
      }
    });
    
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error.message
    }, 500);
  }
}

// عند إتمام الدفع
if (url.pathname === '/api/payments/confirm' && req.method === 'POST') {
  try {
    const body = await req.json();
    
    // 1. حفظ الدفع في قاعدة البيانات
    const paymentResult = await env.DB.prepare(`
      INSERT INTO payments (registration_id, amount, currency, method, status, ...)
      VALUES (?, ?, ?, ?, 'completed', ...)
    `).bind(...).run();
    
    const paymentId = paymentResult.meta.last_row_id;
    
    // 2. تحديث حالة التسجيل
    await env.DB.prepare(`
      UPDATE registrations 
      SET status = 'confirmed', payment_status = 'paid' 
      WHERE id = ?
    `).bind(body.registration_id).run();
    
    // 3. إرسال تأكيد الدفع
    const paymentConfirmationSent = await sendPaymentConfirmationEmail({
      email: body.email,
      name: body.name,
      phone: body.phone,
      transactionId: `TXN-${paymentId}`,
      paymentDate: new Date().toLocaleString('ar-SA'),
      paymentMethod: body.payment_method,
      eventName: body.event_name,
      ticketType: body.ticket_type,
      amount: body.amount,
      currency: body.currency || 'USD',
      receiptUrl: `https://yourdomain.com/receipts/${paymentId}`,
    }, env);
    
    // 4. بعد 2-3 دقائق، إرسال التذكرة
    // يمكن استخدام Durable Objects أو Queue لجدولة إرسال التذكرة
    
    return jsonResponse({
      success: true,
      data: { 
        payment_id: paymentId,
        confirmation_sent: paymentConfirmationSent 
      }
    });
    
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error.message
    }, 500);
  }
}
```

## 🔐 المتغيرات البيئية (wrangler.toml)

```toml
[vars]
EMAIL_FROM = "events@yourdomain.com"
SUPPORT_EMAIL = "support@yourdomain.com"
ORGANIZATION_NAME = "اسم المنظمة"

[env.production.vars]
RESEND_API_KEY = "re_xxxxxxxxxxxx"  # أو استخدم Secrets

# لحفظ API Key بشكل آمن
# wrangler secret put RESEND_API_KEY
```

## 📧 خدمات البريد الإلكتروني المدعومة

### 1. Resend (موصى به)
```typescript
const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${env.RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'events@yourdomain.com',
    to: [userEmail],
    subject: subject,
    html: htmlContent,
  }),
});
```

### 2. SendGrid
```typescript
const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    personalizations: [{ to: [{ email: userEmail }] }],
    from: { email: 'events@yourdomain.com' },
    subject: subject,
    content: [{ type: 'text/html', value: htmlContent }],
  }),
});
```

### 3. Mailgun
```typescript
const formData = new FormData();
formData.append('from', 'events@yourdomain.com');
formData.append('to', userEmail);
formData.append('subject', subject);
formData.append('html', htmlContent);

const response = await fetch(
  `https://api.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`api:${env.MAILGUN_API_KEY}`)}`,
    },
    body: formData,
  }
);
```

## 🎯 قائمة المتغيرات المتاحة

### متغيرات قالب التذكرة
```
{{USER_NAME}}          - اسم المستخدم
{{USER_EMAIL}}         - البريد الإلكتروني
{{TICKET_NUMBER}}      - رقم التذكرة
{{TICKET_TYPE}}        - نوع التذكرة
{{EVENT_NAME}}         - اسم الفعالية
{{EVENT_DATE}}         - تاريخ الفعالية
{{EVENT_TIME}}         - وقت الفعالية
{{EVENT_LOCATION}}     - موقع الفعالية
{{QR_CODE_URL}}        - رابط رمز QR
{{TICKET_URL}}         - رابط التذكرة الكاملة
{{SUPPORT_EMAIL}}      - بريد الدعم
{{CURRENT_YEAR}}       - السنة الحالية
{{ORGANIZATION_NAME}}  - اسم المنظمة
```

### متغيرات قالب الدفع
```
{{USER_NAME}}          - اسم المستخدم
{{USER_EMAIL}}         - البريد الإلكتروني
{{USER_PHONE}}         - رقم الهاتف
{{TRANSACTION_ID}}     - رقم المعاملة
{{PAYMENT_DATE}}       - تاريخ الدفع
{{PAYMENT_METHOD}}     - طريقة الدفع
{{EVENT_NAME}}         - اسم الفعالية
{{TICKET_TYPE}}        - نوع التذكرة
{{AMOUNT}}             - المبلغ
{{CURRENCY}}           - العملة
{{RECEIPT_URL}}        - رابط الإيصال
{{SUPPORT_EMAIL}}      - بريد الدعم
{{CURRENT_YEAR}}       - السنة الحالية
{{ORGANIZATION_NAME}}  - اسم المنظمة
```

## 🔒 أفضل الممارسات لتجنب Spam

### 1. إعدادات DNS الصحيحة

```dns
; SPF Record
yourdomain.com. IN TXT "v=spf1 include:_spf.resend.com ~all"

; DKIM - يوفره مزود الخدمة (Resend, SendGrid, etc.)
; يتم إعداده تلقائياً عند التحقق من النطاق

; DMARC Record
_dmarc.yourdomain.com. IN TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"
```

### 2. إعدادات البريد

```typescript
const emailConfig = {
  // ✅ استخدم نطاق مخصص محقق
  from: 'events@yourdomain.com',
  
  // ✅ سطر الموضوع واضح وغير clickbait
  subject: 'تذكرتك لـ ' + eventName,
  
  // ❌ تجنب:
  // subject: '🎉🎉🎉 FREE TICKETS WIN NOW!!!',
  
  // ✅ أضف reply-to
  replyTo: 'support@yourdomain.com',
  
  // ✅ أضف headers إضافية
  headers: {
    'X-Priority': '3',
    'X-Mailer': 'Event Management System',
    'List-Unsubscribe': '<mailto:unsubscribe@yourdomain.com>',
  }
};
```

### 3. محتوى البريد

- ✅ نسبة نص/صور: 60-70% نص
- ✅ استخدام table-based layout
- ✅ CSS inline فقط
- ✅ تجنب الكلمات المحظورة (FREE, WIN, CLICK HERE)
- ✅ إضافة رابط إلغاء الاشتراك
- ✅ حجم البريد < 100KB

## 🧪 اختبار القوالب

```typescript
// دالة اختبار بسيطة
async function testEmailTemplate(env: Env) {
  const testData = {
    email: 'test@example.com',
    name: 'أحمد محمد',
    ticketNumber: 'TKT-12345',
    ticketType: 'VIP',
    eventName: 'مؤتمر التقنية 2026',
    eventDate: '15 أغسطس 2026',
    eventTime: '10:00 صباحاً',
    eventLocation: 'مركز الملك عبدالله للمؤتمرات',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TKT-12345',
    ticketUrl: 'https://yourdomain.com/tickets/12345',
  };
  
  const result = await sendTicketEmail(testData, env);
  console.log('Test email sent:', result);
}
```

## 📦 الملفات المطلوبة

```
event-api/
├── index.ts (أو src/index.ts)
├── wrangler.toml
├── email-templates/
│   ├── ticket-confirmation.html
│   └── payment-confirmation.html
└── package.json
```

## 🚀 النشر

```bash
# 1. إضافة RESEND_API_KEY كـ secret
wrangler secret put RESEND_API_KEY

# 2. نشر Worker
wrangler deploy

# 3. اختبار Endpoint
curl -X POST https://event-api.info1703.workers.dev/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

## ✅ الخلاصة

تم توفير:
1. ✅ قوالب HTML احترافية متوافقة مع Gmail
2. ✅ دوال جاهزة للدمج في Worker
3. ✅ أمثلة على التكامل مع Resend/SendGrid/Mailgun
4. ✅ أفضل الممارسات لتجنب Spam
5. ✅ قائمة كاملة بالمتغيرات

**القوالب جاهزة للاستخدام الفوري!** 🎉
