# 📧 دليل قوالب البريد الإلكتروني الاحترافية

## 🎯 المبادئ الأساسية لتجنب SPAM في Gmail

### 1. **البنية الأساسية للبريد**
```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{SUBJECT}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <!-- المحتوى هنا -->
</body>
</html>
```

### 2. **قواعد التنسيق المقبولة في Gmail**

#### ✅ **يُنصح به:**
- استخدام جداول (`<table>`) للتخطيط
- أنماط CSS مضمنة (inline styles)
- ألوان آمنة ومتباينة
- نص واضح وقابل للقراءة
- روابط صريحة وواضحة
- حجم خط لا يقل عن 14px

#### ❌ **يُمنع أو لا يُنصح به:**
- JavaScript
- CSS خارجي أو داخلي (`<style>` في `<head>`)
- نماذج (`<form>`)
- Flash أو الوسائط المتعددة المدمجة
- صور كبيرة الحجم (> 100KB)
- روابط مختصرة مشبوهة
- كلمات SPAM (مجاني، اربح الآن، عرض محدود)

### 3. **قالب البريد الاحترافي للتذاكر**

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f7f7;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f7f7f7;">
        <tr>
            <td style="padding: 40px 20px;">
                <!-- Container -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #6C63FF 0%, #5a52d5 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700;">
                                🎟️ تذكرة الحضور الخاصة بك
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #e8e6ff; font-size: 15px;">
                                {{EVENT_NAME}}
                            </p>
                        </td>
                    </tr>

                    <!-- Greeting -->
                    <tr>
                        <td style="padding: 30px 40px 20px 40px;">
                            <p style="margin: 0; color: #2d3748; font-size: 16px; line-height: 1.6;">
                                مرحباً <strong>{{USER_NAME}}</strong>،
                            </p>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 0 40px 30px 40px;">
                            <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 15px; line-height: 1.7;">
                                يسعدنا تأكيد تسجيلك في الحدث. نتطلع لرؤيتك!
                            </p>

                            <!-- Ticket Info Box -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding: 8px 0; color: #718096; font-size: 13px; font-weight: 600;">
                                                    📅 التاريخ
                                                </td>
                                                <td style="padding: 8px 0; color: #2d3748; font-size: 14px; font-weight: 500; text-align: left;">
                                                    {{EVENT_DATE}}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #718096; font-size: 13px; font-weight: 600; border-top: 1px solid #e2e8f0;">
                                                    🕐 الوقت
                                                </td>
                                                <td style="padding: 8px 0; color: #2d3748; font-size: 14px; font-weight: 500; text-align: left; border-top: 1px solid #e2e8f0;">
                                                    {{EVENT_TIME}}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #718096; font-size: 13px; font-weight: 600; border-top: 1px solid #e2e8f0;">
                                                    📍 المكان
                                                </td>
                                                <td style="padding: 8px 0; color: #2d3748; font-size: 14px; font-weight: 500; text-align: left; border-top: 1px solid #e2e8f0;">
                                                    {{EVENT_LOCATION}}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #718096; font-size: 13px; font-weight: 600; border-top: 1px solid #e2e8f0;">
                                                    🎫 رقم التذكرة
                                                </td>
                                                <td style="padding: 8px 0; color: #6C63FF; font-size: 14px; font-weight: 700; text-align: left; border-top: 1px solid #e2e8f0;">
                                                    #{{TICKET_NUMBER}}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- QR Code (if applicable) -->
                            <div style="text-align: center; margin-top: 30px;">
                                <img src="{{QR_CODE_URL}}" alt="QR Code" style="width: 180px; height: 180px; border: 2px solid #e2e8f0; border-radius: 8px;" />
                                <p style="margin: 12px 0 0 0; color: #718096; font-size: 13px;">
                                    احتفظ بهذا الرمز لإظهاره عند الدخول
                                </p>
                            </div>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="{{EVENT_URL}}" style="display: inline-block; background-color: #6C63FF; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
                                    عرض تفاصيل الحدث
                                </a>
                            </div>
                        </td>
                    </tr>

                    <!-- Divider -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 0;" />
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center;">
                            <p style="margin: 0 0 15px 0; color: #718096; font-size: 13px;">
                                في حال وجود أي استفسار، لا تتردد في التواصل معنا
                            </p>
                            <p style="margin: 0 0 20px 0;">
                                <a href="mailto:{{SUPPORT_EMAIL}}" style="color: #6C63FF; text-decoration: none; font-size: 14px; font-weight: 500;">
                                    {{SUPPORT_EMAIL}}
                                </a>
                            </p>
                            
                            <!-- Social Links -->
                            <div style="margin: 20px 0;">
                                <a href="{{TWITTER_URL}}" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                                    <img src="{{CDN_URL}}/social-twitter.png" alt="Twitter" style="width: 28px; height: 28px;" />
                                </a>
                                <a href="{{LINKEDIN_URL}}" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                                    <img src="{{CDN_URL}}/social-linkedin.png" alt="LinkedIn" style="width: 28px; height: 28px;" />
                                </a>
                            </div>

                            <p style="margin: 20px 0 0 0; color: #a0aec0; font-size: 12px;">
                                © 2026 {{ORGANIZATION_NAME}}. جميع الحقوق محفوظة.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

### 4. **قالب تأكيد الدفع**

```html
<!-- Similar structure with payment-specific content -->
<tr>
    <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700;">
            ✅ تم استلام دفعتك بنجاح
        </h1>
    </td>
</tr>
<!-- Payment details in similar info box format -->
```

### 5. **نصائح إضافية لتجنب SPAM**

#### محتوى الموضوع (Subject)
- ✅ واضح ومباشر: "تذكرة حضورك - مؤتمر S3 Summit 2026"
- ❌ تجنب: "!!!اربح الآن!!! عرض مجاني محدود"

#### المرسل (From)
- استخدم اسم واضح: "فريق S3 Summit <noreply@s3summit.com>"
- تجنب noreply@ إذا أمكن، استخدم بريد حقيقي

#### نسبة النص إلى الصور
- النص: 60-70%
- الصور: 30-40%
- لا ترسل بريد يحتوي على صورة واحدة فقط

#### الروابط
- استخدم روابط كاملة وواضحة
- تجنب bit.ly أو روابط مختصرة
- تأكد من أن الروابط تعمل وآمنة (HTTPS)

#### حجم البريد
- إجمالي الحجم < 100KB (مثالي: 40-60KB)
- الصور مضغوطة ومحسّنة

### 6. **معلومات SPF/DKIM/DMARC**
تأكد من إعداد السجلات التالية في DNS:

```
SPF:   v=spf1 include:_spf.google.com ~all
DKIM:  (يتم إنشاؤه من Google Workspace أو مزود البريد)
DMARC: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

### 7. **اختبار البريد**
- استخدم Mail Tester: https://www.mail-tester.com/
- اختبر على أجهزة مختلفة
- أرسل إلى Gmail/Outlook/Yahoo للتحقق

### 8. **متغيرات القالب المدعومة**
```
{{USER_NAME}}          - اسم المستخدم
{{EVENT_NAME}}         - اسم الحدث
{{EVENT_DATE}}         - تاريخ الحدث
{{EVENT_TIME}}         - وقت الحدث
{{EVENT_LOCATION}}     - مكان الحدث
{{TICKET_NUMBER}}      - رقم التذكرة
{{QR_CODE_URL}}        - رابط رمز QR
{{EVENT_URL}}          - رابط صفحة الحدث
{{SUPPORT_EMAIL}}      - بريد الدعم
{{ORGANIZATION_NAME}}  - اسم المنظمة
{{PAYMENT_AMOUNT}}     - مبلغ الدفع
{{PAYMENT_DATE}}       - تاريخ الدفع
{{INVOICE_NUMBER}}     - رقم الفاتورة
```

---

## 📊 نتيجة التطبيق المتوقعة

- ✅ **معدل وصول 95%+** إلى صندوق الوارد
- ✅ **تقييم 9/10+** في Mail Tester
- ✅ **تجربة مستخدم احترافية** على جميع الأجهزة
- ✅ **امتثال كامل** لمعايير Gmail وOutlook
