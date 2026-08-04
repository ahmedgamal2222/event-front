'use client';
/**
 * AdminEmailTemplates — إدارة قوالب البريد الإلكتروني لكل حالة تسجيل
 * يتيح: تعديل نص البريد (عربي + إنجليزي) لكل حالة، وتفعيل/إيقاف الإرسال
 */
import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev';

const S = {
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem', colorScheme: 'dark' } as React.CSSProperties,
  ta:  { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.85rem', colorScheme: 'dark', resize: 'vertical' as const, minHeight: 90 } as React.CSSProperties,
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '1rem', padding: '1.25rem' } as React.CSSProperties,
  label: { fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block' } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 } as React.CSSProperties),
};

const STATUS_META: Record<string, { label: string; color: string; icon: string; hint: string }> = {
  pending:    { label: 'قيد الانتظار',    color: '#f59e0b', icon: '⏳', hint: 'تُرسل فور التسجيل الجديد' },
  approved:   { label: 'مقبول',           color: '#10b981', icon: '✅', hint: 'تُرسل عند قبول الطلب من الأدمن' },
  paid:       { label: 'مدفوع',           color: '#06b6d4', icon: '💳', hint: 'تُرسل عند تأكيد الدفع' },
  rejected:   { label: 'مرفوض',           color: '#ef4444', icon: '❌', hint: 'تُرسل عند رفض الطلب' },
  waitlisted: { label: 'قائمة الانتظار', color: '#8b5cf6', icon: '🕐', hint: 'تُرسل عند إضافته لقائمة الانتظار' },
  cancelled:  { label: 'ملغى',            color: '#6b7280', icon: '🚫', hint: 'لا تُرسل رسالة بشكل افتراضي' },
  checked_in: { label: 'حضر',             color: '#10b981', icon: '✔️', hint: 'تُرسل عند تسجيل الحضور الفعلي' },
};

interface Template {
  status: string;
  subject_ar: string;
  subject_en: string;
  body_ar: string;
  body_en: string;
  send_email: number;
}

interface Props {
  eventId: number;
  token: string;
}

export default function AdminEmailTemplates({ eventId, token }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openStatus, setOpenStatus] = useState<string | null>('pending');
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!eventId || !token) return;
    setLoading(true);
    fetch(`${API}/api/events/${eventId}/registrations/email-templates`, { headers })
      .then(r => r.json())
      .then(d => { if (d.success) setTemplates(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId, token]);

  const update = (status: string, field: keyof Template, value: any) => {
    setTemplates(prev => prev.map(t => t.status === status ? { ...t, [field]: value } : t));
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/events/${eventId}/registrations/email-templates`, {
        method: 'PUT', headers, body: JSON.stringify(templates),
      });
      const d = await res.json();
      if (d.success) alert('✅ تم حفظ القوالب');
      else alert('❌ ' + (d.error || 'خطأ في الحفظ'));
    } finally { setSaving(false); }
  };

  if (loading) return <p style={{ color: '#94a3b8', padding: 24 }}>جاري التحميل...</p>;

  const current = templates.find(t => t.status === openStatus);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', margin: 0 }}>📧 قوالب البريد</h1>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: 4 }}>تحكم في الرسائل المرسلة لكل حالة تسجيل — عربي وإنجليزي</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Language toggle */}
          <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', overflow: 'hidden' }}>
            {(['ar','en'] as const).map(l => (
              <button key={l} onClick={() => setLang(l)}
                style={{ padding: '0.35rem 0.85rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, border: 'none',
                  background: lang === l ? '#6C63FF' : 'transparent', color: lang === l ? 'white' : '#94a3b8' }}>
                {l === 'ar' ? '🇸🇦 عربي' : '🇬🇧 English'}
              </button>
            ))}
          </div>
          <button style={S.btn()} onClick={save} disabled={saving}>
            {saving ? 'جاري الحفظ...' : '💾 حفظ الكل'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 14, alignItems: 'start' }}>
        {/* Status List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {templates.map(t => {
            const meta = STATUS_META[t.status] || { label: t.status, color: '#6b7280', icon: '📧', hint: '' };
            const isActive = openStatus === t.status;
            return (
              <button key={t.status} onClick={() => setOpenStatus(t.status)}
                style={{
                  textAlign: 'right', padding: '0.65rem 0.85rem', borderRadius: '0.6rem',
                  border: `1px solid ${isActive ? meta.color + '60' : 'rgba(255,255,255,0.07)'}`,
                  background: isActive ? meta.color + '15' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'all 0.15s',
                }}>
                <span style={{ fontSize: '1.1rem' }}>{meta.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: isActive ? meta.color : 'white', fontWeight: 600, fontSize: '0.85rem' }}>{meta.label}</div>
                  <div style={{ fontSize: '0.65rem', color: t.send_email ? '#10b981' : '#6b7280', marginTop: 2 }}>
                    {t.send_email ? '✓ الإرسال مفعّل' : '✗ الإرسال متوقف'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Template Editor */}
        {current && (() => {
          const meta = STATUS_META[current.status] || { label: current.status, color: '#6b7280', icon: '📧', hint: '' };
          return (
            <div style={{ ...S.card, borderColor: meta.color + '40', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Title */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.5rem' }}>{meta.icon}</span>
                  <div>
                    <div style={{ color: meta.color, fontWeight: 700, fontSize: '1rem' }}>{meta.label}</div>
                    <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: 2 }}>{meta.hint}</div>
                  </div>
                </div>
                {/* Toggle send */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                  <div
                    onClick={() => update(current.status, 'send_email', current.send_email ? 0 : 1)}
                    style={{
                      width: 44, height: 24, borderRadius: 12, background: current.send_email ? '#10b981' : '#374151',
                      position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
                    }}>
                    <div style={{
                      position: 'absolute', top: 3, left: current.send_email ? 23 : 3, width: 18, height: 18,
                      borderRadius: '50%', background: 'white', transition: 'left 0.2s',
                    }} />
                  </div>
                  <span style={{ color: current.send_email ? '#10b981' : '#6b7280', fontSize: '0.82rem', fontWeight: 600 }}>
                    {current.send_email ? 'الإرسال مفعّل' : 'الإرسال متوقف'}
                  </span>
                </label>
              </div>

              {current.send_email ? (
                <>
                  {/* Subject */}
                  <div>
                    <label style={S.label}>
                      {lang === 'ar' ? 'موضوع الرسالة (عربي)' : 'Subject (English)'}
                    </label>
                    <input
                      style={S.inp}
                      dir={lang === 'ar' ? 'rtl' : 'ltr'}
                      value={lang === 'ar' ? current.subject_ar : current.subject_en}
                      onChange={e => update(current.status, lang === 'ar' ? 'subject_ar' : 'subject_en', e.target.value)}
                      placeholder={lang === 'ar' ? 'موضوع البريد بالعربية...' : 'Email subject in English...'}
                    />
                  </div>
                  {/* Body */}
                  <div>
                    <label style={S.label}>
                      {lang === 'ar' ? 'نص الرسالة (عربي)' : 'Body (English)'}
                      <span style={{ color: '#475569', marginRight: 6, fontSize: '0.7rem' }}>يمكن استخدام سطر جديد للفقرات</span>
                    </label>
                    <textarea
                      style={S.ta}
                      dir={lang === 'ar' ? 'rtl' : 'ltr'}
                      value={lang === 'ar' ? current.body_ar : current.body_en}
                      onChange={e => update(current.status, lang === 'ar' ? 'body_ar' : 'body_en', e.target.value)}
                      placeholder={lang === 'ar' ? 'نص الرسالة بالعربية...' : 'Email body in English...'}
                      rows={5}
                    />
                  </div>
                  <div style={{ background: 'rgba(108,99,255,0.07)', borderRadius: '0.5rem', padding: '0.65rem 1rem', fontSize: '0.75rem', color: '#818cf8' }}>
                    💡 الاسم الأول للمستلم يُضاف تلقائياً في أعلى الرسالة.
                  </div>
                </>
              ) : (
                <div style={{ color: '#64748b', fontSize: '0.85rem', padding: '1rem 0', textAlign: 'center' }}>
                  الإرسال متوقف لهذه الحالة — لن تصل أي رسالة عند تغيير الحالة إلى "{meta.label}".
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
