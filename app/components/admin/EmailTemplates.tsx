/**
 * EmailTemplates.tsx
 * قوالب بريد إلكتروني احترافية متوافقة مع Gmail وتجنب SPAM
 * تستخدم جداول HTML و inline CSS لأفضل توافق
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string; // Plain text alternative
}

interface TemplateVars {
  name: string;
  eventName: string;
  eventDate?: string;
  venue?: string;
  logoUrl?: string;
  primaryColor?: string;
  footerText?: string;
  unsubscribeLink?: string;
  [key: string]: any;
}

/**
 * قالب أساسي احترافي يستخدم لجميع الرسائل
 */
function getBaseTemplate(vars: TemplateVars, content: string): string {
  const primaryColor = vars.primaryColor || '#6C63FF';
  const logoUrl = vars.logoUrl || '';
  
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${vars.eventName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 600px;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background: linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -20)} 100%); border-radius: 8px 8px 0 0;">
              ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="max-height: 60px; margin-bottom: 15px;" />` : ''}
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">${vars.eventName}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 40px 30px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom: 15px; text-align: center; color: #6b7280; font-size: 14px; line-height: 1.6;">
                    ${vars.footerText || 'شكراً لاختياركم المشاركة معنا'}
                  </td>
                </tr>
                ${vars.unsubscribeLink ? `
                <tr>
                  <td style="padding-top: 10px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <a href="${vars.unsubscribeLink}" style="color: #9ca3af; font-size: 12px; text-decoration: none;">إلغاء الاشتراك</a>
                  </td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>

        </table>
        
        <!-- Email Footer Text -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin-top: 15px;">
          <tr>
            <td style="padding: 0 20px; text-align: center; color: #9ca3af; font-size: 11px; line-height: 1.5;">
              هذه رسالة آلية، يرجى عدم الرد عليها مباشرة.
              <br>
              © ${new Date().getFullYear()} ${vars.eventName} - جميع الحقوق محفوظة
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * تعديل لون (تفتيح أو تغميق)
 */
function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

/**
 * زر CTA احترافي
 */
function getButton(text: string, url: string, color: string = '#6C63FF'): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 25px auto;">
      <tr>
        <td style="border-radius: 6px; background-color: ${color};">
          <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * قائمة معلومات منظمة
 */
function getInfoList(items: { label: string; value: string; icon?: string }[]): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
      ${items.map(item => `
      <tr>
        <td style="padding: 12px 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-bottom: none;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="color: #6b7280; font-size: 13px; font-weight: 600; padding-bottom: 4px;">
                ${item.icon || '📋'} ${item.label}
              </td>
            </tr>
            <tr>
              <td style="color: #111827; font-size: 15px; font-weight: 500;">
                ${item.value}
              </td>
            </tr>
          </table>
        </td>
      </tr>
      `).join('')}
      <tr>
        <td style="padding: 0; border: 1px solid #e5e7eb; border-top: none; height: 1px;"></td>
      </tr>
    </table>
  `;
}

/**
 * رسالة التسجيل المعلق (قيد الانتظار)
 */
export function getPendingTemplate(vars: TemplateVars): EmailTemplate {
  const content = `
    <p style="margin: 0 0 20px; color: #111827; font-size: 16px; line-height: 1.6;">
      مرحباً <strong>${vars.name}</strong>،
    </p>
    <p style="margin: 0 0 20px; color: #374151; font-size: 15px; line-height: 1.6;">
      شكراً لتسجيلك في <strong>${vars.eventName}</strong>! تم استلام طلبك بنجاح وهو الآن قيد المراجعة من قبل فريقنا.
    </p>
    <div style="background-color: #fef3c7; border-right: 4px solid #f59e0b; padding: 16px 20px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
        ⏳ <strong>حالة الطلب:</strong> قيد الانتظار<br>
        سيتم إعلامك بمجرد مراجعة طلبك والموافقة عليه.
      </p>
    </div>
    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      إذا كان لديك أي استفسار، لا تتردد في التواصل معنا.
    </p>
  `;

  const text = `مرحباً ${vars.name},\n\nشكراً لتسجيلك في ${vars.eventName}! تم استلام طلبك بنجاح وهو الآن قيد المراجعة.\n\nسيتم إعلامك بمجرد مراجعة طلبك والموافقة عليه.\n\nمع تحيات فريق ${vars.eventName}`;

  return {
    subject: `⏳ تم استلام تسجيلك في ${vars.eventName}`,
    html: getBaseTemplate(vars, content),
    text
  };
}

/**
 * رسالة القبول (Approved)
 */
export function getApprovedTemplate(vars: TemplateVars): EmailTemplate {
  const infoItems = [];
  if (vars.eventDate) infoItems.push({ label: 'التاريخ', value: vars.eventDate, icon: '📅' });
  if (vars.venue) infoItems.push({ label: 'المكان', value: vars.venue, icon: '📍' });
  if (vars.regType) infoItems.push({ label: 'نوع التسجيل', value: vars.regType, icon: '🏷️' });

  const content = `
    <p style="margin: 0 0 20px; color: #111827; font-size: 16px; line-height: 1.6;">
      مرحباً <strong>${vars.name}</strong>،
    </p>
    <div style="background-color: #d1fae5; border-right: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 6px; text-align: center;">
      <p style="margin: 0 0 10px; font-size: 32px;">✅</p>
      <p style="margin: 0; color: #065f46; font-size: 18px; font-weight: 700;">
        مبروك! تمت الموافقة على تسجيلك
      </p>
    </div>
    <p style="margin: 0 0 20px; color: #374151; font-size: 15px; line-height: 1.6;">
      يسعدنا إعلامك بأنه تمت الموافقة على طلب تسجيلك في <strong>${vars.eventName}</strong>. نتطلع لرؤيتك قريباً!
    </p>
    ${infoItems.length > 0 ? getInfoList(infoItems) : ''}
    ${vars.actionUrl ? getButton('عرض التفاصيل', vars.actionUrl, vars.primaryColor) : ''}
    <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      نتمنى لك تجربة رائعة معنا! 🎉
    </p>
  `;

  const text = `مرحباً ${vars.name},\n\nمبروك! تمت الموافقة على تسجيلك في ${vars.eventName}.\n\n${infoItems.map(i => `${i.label}: ${i.value}`).join('\n')}\n\nنتطلع لرؤيتك قريباً!\n\nمع تحيات فريق ${vars.eventName}`;

  return {
    subject: `✅ تمت الموافقة على تسجيلك في ${vars.eventName}`,
    html: getBaseTemplate(vars, content),
    text
  };
}

/**
 * رسالة الدفع والتذكرة (Payment Confirmed + Ticket)
 */
export function getPaymentConfirmedTemplate(vars: TemplateVars): EmailTemplate {
  const infoItems = [
    { label: 'رقم الطلب', value: vars.orderRef || 'N/A', icon: '#️⃣' },
    { label: 'المبلغ المدفوع', value: vars.amount || 'N/A', icon: '💰' },
  ];
  if (vars.eventDate) infoItems.push({ label: 'تاريخ الحدث', value: vars.eventDate, icon: '📅' });
  if (vars.venue) infoItems.push({ label: 'المكان', value: vars.venue, icon: '📍' });

  const content = `
    <p style="margin: 0 0 20px; color: #111827; font-size: 16px; line-height: 1.6;">
      مرحباً <strong>${vars.name}</strong>،
    </p>
    <div style="background-color: #dbeafe; border-right: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 6px; text-align: center;">
      <p style="margin: 0 0 10px; font-size: 32px;">💳</p>
      <p style="margin: 0; color: #1e40af; font-size: 18px; font-weight: 700;">
        تم تأكيد دفعتك بنجاح
      </p>
    </div>
    <p style="margin: 0 0 20px; color: #374151; font-size: 15px; line-height: 1.6;">
      شكراً لإتمام عملية الدفع. تم تأكيد تسجيلك بنجاح في <strong>${vars.eventName}</strong>.
    </p>
    ${getInfoList(infoItems)}
    ${vars.ticketUrl ? `
    <div style="background-color: #f0fdf4; border: 2px dashed #10b981; padding: 20px; margin: 25px 0; border-radius: 6px; text-align: center;">
      <p style="margin: 0 0 15px; color: #065f46; font-size: 16px; font-weight: 600;">
        🎫 تذكرتك جاهزة
      </p>
      ${getButton('تحميل التذكرة', vars.ticketUrl, '#10b981')}
      <p style="margin: 10px 0 0; color: #6b7280; font-size: 13px;">
        يرجى إحضار هذه التذكرة معك يوم الحدث (مطبوعة أو على هاتفك)
      </p>
    </div>
    ` : ''}
    <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      نتطلع لرؤيتك في الحدث! إذا كان لديك أي استفسار، تواصل معنا.
    </p>
  `;

  const text = `مرحباً ${vars.name},\n\nتم تأكيد دفعتك بنجاح!\n\nرقم الطلب: ${vars.orderRef}\nالمبلغ: ${vars.amount}\n\n${vars.ticketUrl ? `رابط التذكرة: ${vars.ticketUrl}\n\n` : ''}نتطلع لرؤيتك في ${vars.eventName}!\n\nمع تحيات فريق ${vars.eventName}`;

  return {
    subject: `💳 تأكيد الدفع - تذكرتك لحضور ${vars.eventName}`,
    html: getBaseTemplate(vars, content),
    text
  };
}

/**
 * رسالة الرفض (Rejected)
 */
export function getRejectedTemplate(vars: TemplateVars): EmailTemplate {
  const content = `
    <p style="margin: 0 0 20px; color: #111827; font-size: 16px; line-height: 1.6;">
      مرحباً <strong>${vars.name}</strong>،
    </p>
    <p style="margin: 0 0 20px; color: #374151; font-size: 15px; line-height: 1.6;">
      نشكرك على اهتمامك بالتسجيل في <strong>${vars.eventName}</strong>.
    </p>
    <div style="background-color: #fee2e2; border-right: 4px solid #ef4444; padding: 16px 20px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.5;">
        للأسف، لم نتمكن من قبول طلبك في هذا الوقت. ${vars.reason ? `<br><br><strong>السبب:</strong> ${vars.reason}` : ''}
      </p>
    </div>
    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      نقدر اهتمامك ونتمنى لك التوفيق. لأي استفسارات، لا تتردد في التواصل معنا.
    </p>
  `;

  const text = `مرحباً ${vars.name},\n\nنشكرك على اهتمامك بالتسجيل في ${vars.eventName}.\n\nللأسف، لم نتمكن من قبول طلبك في هذا الوقت.${vars.reason ? `\n\nالسبب: ${vars.reason}` : ''}\n\nمع تحيات فريق ${vars.eventName}`;

  return {
    subject: `إشعار بخصوص تسجيلك في ${vars.eventName}`,
    html: getBaseTemplate(vars, content),
    text
  };
}

/**
 * رسالة قائمة الانتظار (Waitlisted)
 */
export function getWaitlistedTemplate(vars: TemplateVars): EmailTemplate {
  const content = `
    <p style="margin: 0 0 20px; color: #111827; font-size: 16px; line-height: 1.6;">
      مرحباً <strong>${vars.name}</strong>،
    </p>
    <p style="margin: 0 0 20px; color: #374151; font-size: 15px; line-height: 1.6;">
      شكراً لتسجيلك في <strong>${vars.eventName}</strong>.
    </p>
    <div style="background-color: #f3e8ff; border-right: 4px solid #8b5cf6; padding: 16px 20px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0; color: #5b21b6; font-size: 14px; line-height: 1.5;">
        🕐 تم إضافتك إلى <strong>قائمة الانتظار</strong>.<br>
        سيتم إعلامك فور توفر مقعد لك.
      </p>
    </div>
    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      نقدر صبرك ونأمل أن نتمكن من استضافتك قريباً!
    </p>
  `;

  const text = `مرحباً ${vars.name},\n\nشكراً لتسجيلك في ${vars.eventName}.\n\nتم إضافتك إلى قائمة الانتظار. سيتم إعلامك فور توفر مقعد.\n\nمع تحيات فريق ${vars.eventName}`;

  return {
    subject: `🕐 تم إضافتك لقائمة الانتظار - ${vars.eventName}`,
    html: getBaseTemplate(vars, content),
    text
  };
}

/**
 * رسالة تسجيل الحضور (Checked In)
 */
export function getCheckedInTemplate(vars: TemplateVars): EmailTemplate {
  const content = `
    <p style="margin: 0 0 20px; color: #111827; font-size: 16px; line-height: 1.6;">
      مرحباً <strong>${vars.name}</strong>،
    </p>
    <div style="background-color: #d1fae5; border-right: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 6px; text-align: center;">
      <p style="margin: 0 0 10px; font-size: 32px;">✔️</p>
      <p style="margin: 0; color: #065f46; font-size: 18px; font-weight: 700;">
        تم تسجيل حضورك بنجاح!
      </p>
    </div>
    <p style="margin: 0 0 20px; color: #374151; font-size: 15px; line-height: 1.6;">
      مرحباً بك في <strong>${vars.eventName}</strong>! نتمنى لك تجربة ممتعة ومفيدة.
    </p>
    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
      استمتع بالفعاليات والأنشطة المتنوعة. نراك هناك! 🎉
    </p>
  `;

  const text = `مرحباً ${vars.name},\n\nتم تسجيل حضورك بنجاح في ${vars.eventName}!\n\nاستمتع بالفعاليات ونتمنى لك تجربة رائعة.\n\nمع تحيات فريق ${vars.eventName}`;

  return {
    subject: `✔️ تم تسجيل حضورك في ${vars.eventName}`,
    html: getBaseTemplate(vars, content),
    text
  };
}

/**
 * جلب القالب المناسب حسب الحالة
 */
export function getTemplateByStatus(status: string, vars: TemplateVars): EmailTemplate {
  switch (status) {
    case 'pending':
      return getPendingTemplate(vars);
    case 'approved':
      return getApprovedTemplate(vars);
    case 'paid':
      return getPaymentConfirmedTemplate(vars);
    case 'rejected':
      return getRejectedTemplate(vars);
    case 'waitlisted':
      return getWaitlistedTemplate(vars);
    case 'checked_in':
      return getCheckedInTemplate(vars);
    default:
      return getPendingTemplate(vars);
  }
}
