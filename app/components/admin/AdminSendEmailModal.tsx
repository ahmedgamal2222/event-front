'use client';
/**
 * AdminSendEmailModal — إرسال بريد إلكتروني لجهة اتصال من داخل ملفها.
 *
 * - محرر أغنياء (RichEditor) للتحكم الكامل في شكل الرسالة (خط، حجم، تلوين، عناوين...)
 * - اقتراحات قوالب جاهزة وسمات لونية مختارة بعناية
 * - إرسال فعلي عبر SendGrid + التسجيل التلقائي في "سجل التواصل" الخاص بالشخص
 */
import { useState } from 'react';
import RichEditor from './RichEditor';

interface Props {
  contactId: number;
  contactName: string;
  contactEmail?: string;
  token: string;
  apiBase: string;
  eventId?: number;
  onClose: () => void;
  onSent: (res: any) => void;
}

const S = {
  inp: {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '0.5rem',
    padding: '0.55rem 0.85rem',
    color: 'white',
    outline: 'none',
    width: '100%',
    fontSize: '0.9rem',
    colorScheme: 'dark',
  } as React.CSSProperties,
  label: { fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block' } as React.CSSProperties,
};

const THEMES: { key: string; label: string; color: string; gradient: string }[] = [
  { key: 'purple', label: 'بنفسجي', color: '#8b5cf6', gradient: 'linear-gradient(135deg,#6C63FF,#8b5cf6)' },
  { key: 'blue',   label: 'أزرق',   color: '#3b82f6', gradient: 'linear-gradient(135deg,#2563eb,#38bdf8)' },
  { key: 'green',  label: 'أخضر',   color: '#10b981', gradient: 'linear-gradient(135deg,#059669,#34d399)' },
  { key: 'orange', label: 'برتقالي', color: '#f59e0b', gradient: 'linear-gradient(135deg,#ea580c,#fbbf24)' },
  { key: 'rose',   label: 'وردي',   color: '#f472b6', gradient: 'linear-gradient(135deg,#be123c,#f472b6)' },
  { key: 'teal',   label: 'فيروزي', color: '#2dd4bf', gradient: 'linear-gradient(135deg,#0d9488,#2dd4bf)' },
];

const TEMPLATES: { key: string; label: string; subject: string; body: string }[] = [
  {
    key: 'invite',
    label: '🎫 دعوة',
    subject: 'دعوة كريمة للمشاركة',
    body: `<p dir="rtl">عزيزي/عزيزتي <strong>[[الاسم]]</strong>،</p><p dir="rtl">يسعدنا دعوتكم للمشاركة في فعاليتنا القادمة، ونتطلع لرؤيتكم بيننا.</p><p dir="rtl">للتسجيل أو الاستفسار لا تترددوا في التواصل معنا.</p><p dir="rtl">مع وافر التقدير،</p>`,
  },
  {
    key: 'follow_up',
    label: '📋 متابعة',
    subject: 'متابعة لطلبكم',
    body: `<p dir="rtl">عزيزي/عزيزتي <strong>[[الاسم]]</strong>،</p><p dir="rtl">نود التواصل معكم لمتابعة حالة طلبكم والعمل على إنجازها في أقرب وقت.</p><p dir="rtl">شكراً لثقتكم بنا،</p>`,
  },
  {
    key: 'confirm',
    label: '✅ تأكيد',
    subject: 'تأكيد مشاركتكم',
    body: `<p dir="rtl">عزيزي/عزيزتي <strong>[[الاسم]]</strong>،</p><p dir="rtl">نؤكد لكم استلام مشاركتكم بنجاح، وجميع الخطوات القادمة ستتواصل معكم عبر البريد.</p><p dir="rtl">شكراً لانضمامكم إلينا،</p>`,
  },
  {
    key: 'payment',
    label: '💳 دفع',
    subject: 'تذكير بإتمام الدفع',
    body: `<p dir="rtl">عزيزي/عزيزتي <strong>[[الاسم]]</strong>،</p><p dir="rtl">نذكركم بإتمام عملية الدفع لضمان حجز مكانكم في الفعالية، وفي حال وجود أي استفسار نحن بخدمتكم.</p><p dir="rtl">مع التحية،</p>`,
  },
  {
    key: 'thanks',
    label: '🙏 شكر',
    subject: 'شكراً لتواصلكم معنا',
    body: `<p dir="rtl">عزيزي/عزيزتي <strong>[[الاسم]]</strong>،</p><p dir="rtl">نشكركم على تواصلكم معنا واهتمامكم، وسيقوم فريقنا بالرد عليكم في أقرب وقت ممكن.</p><p dir="rtl">مع خالص الشكر،</p>`,
  },
];

export default function AdminSendEmailModal({ contactId, contactName, contactEmail, token, apiBase, eventId, onClose, onSent }: Props) {
  const [to, setTo] = useState(contactEmail || '');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [theme, setTheme] = useState('purple');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('admin_user') || '{}') : {};

  const applyTemplate = (t: typeof TEMPLATES[number]) => {
    setSubject(t.subject);
    setBodyHtml(t.body.replace('[[الاسم]]', contactName || 'العميل'));
  };

  const canSend = !!to.trim() && !!subject.trim() && bodyHtml.replace(/<[^>]*>/g, '').trim().length > 0 && !sending;

  const send = async () => {
    if (!canSend) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch(`${apiBase}/api/crm/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          contact_id: contactId,
          subject,
          html: bodyHtml,
          theme,
          logged_by: currentUser.name || currentUser.email || 'admin',
          event_id: eventId || null,
        }),
      });
      const d = await res.json();
      if (d.success) onSent(d);
      else setError(d.error || 'فشل إرسال الرسالة');
    } catch (e: any) {
      setError(e.message || 'فشل إرسال الرسالة');
    } finally {
      setSending(false);
    }
  };

  const activeTheme = THEMES.find(t => t.key === theme) || THEMES[0];
return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: 14 }}>
      <div style={{
        width: 860, maxWidth: '100%', maxHeight: '94vh', overflowY: 'auto',
        background: '#13102a', border: '1px solid rgba(108,99,255,0.35)',
        borderRadius: '1.1rem', boxShadow: '0 25px 80px rgba(0,0,0,0.55)',
      }}>
        {/* Header with live color theme preview */}
        <div style={{ background: activeTheme.gradient, padding: '0.95rem 1.25rem', borderRadius: '1.1rem 1.1rem 0 0', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>✉️ إرسال بريد إلى {contactName}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>المرسل: {currentUser.name || currentUser.email || 'admin'}</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '0.4rem', width: 30, height: 30, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700 }}>✕</button>
        </div>

        <div style={{ padding: '1.1rem 1.25rem' }}>
          {/* To + Subject */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 12 }}>
            <div>
              <label style={S.label}>إلى (بريد الشخص) *</label>
              <input style={{ ...S.inp, color: to.includes('@') ? '#34d399' : '#fca5a5' }} value={to} onChange={e => setTo(e.target.value)} placeholder="email@example.com" />
            </div>
            <div>
              <label style={S.label}>الموضوع *</label>
              <input style={S.inp} value={subject} onChange={e => setSubject(e.target.value)} placeholder="موضوع الرسالة..." />
            </div>
          </div>

          {/* Colors + templates */}
          <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <label style={S.label}>لون الرسالة</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {THEMES.map(t => (
                  <button
                    key={t.key}
                    title={t.label}
                    onClick={() => setTheme(t.key)}
                    style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: t.gradient,
                      border: theme === t.key ? '2px solid white' : '2px solid transparent',
                      cursor: 'pointer', boxShadow: theme === t.key ? '0 0 0 3px rgba(108,99,255,0.35)' : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={S.label}>قوالب جاهزة</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {TEMPLATES.map(t => (
                  <button
                    key={t.key}
                    onClick={() => applyTemplate(t)}
                    style={{
                      background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#d1d5db', borderRadius: '0.4rem', padding: '0.3rem 0.7rem',
                      cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, transition: 'all .15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(108,99,255,0.2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
{/* Editor */}
          <div style={{ marginTop: 12 }}>
            <label style={S.label}>محتوى الرسالة * — يمكنك تغيير الخط، الحجم، الألوان، العناوين، والقوائم من شريط الأدوات</label>
            <RichEditor
              value={bodyHtml}
              onChange={setBodyHtml}
              token={token}
              placeholder="اكتب رسالتك هنا… حرِّر الخط، الحجم، الألوان والصور بكل سهولة"
              minHeight={300}
              showPreview
            />
          </div>

          {/* Error / notice */}
          {error && (
            <div style={{ marginTop: 12, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>
              {error}
            </div>
          )}

          {/* Note */}
          <div style={{ marginTop: 12, background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: '#a5b4fc' }}>
            💾 بعد الإرسال سيتم تسجيل الرسالة تلقائياً في <strong>سجل التواصل الخاص بـ {contactName}</strong> وسيتم الانتقال إليه مباشرة.
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
            <button
              onClick={send}
              disabled={!canSend}
              style={{
                background: activeTheme.gradient,
                color: 'white', border: 'none', borderRadius: '0.5rem',
                padding: '0.55rem 1.5rem', cursor: canSend ? 'pointer' : 'not-allowed',
                fontSize: '0.88rem', fontWeight: 700, opacity: canSend ? 1 : 0.45, transition: 'all .15s',
              }}
            >
              {sending ? '⏳ جاري الإرسال...' : '📤 إرسال الرسالة'}
            </button>
            <button
              onClick={onClose}
              disabled={sending}
              style={{ background: '#374151', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.55rem 1.25rem', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
