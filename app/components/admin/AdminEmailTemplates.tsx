'use client';
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
  pending:    { label: 'قيد الانتظار',    color: '#f59e0b', icon: 'U+23F3', hint: 'تُرسل فور التسجيل الجديد' },
  approved:   { label: 'مقبول',           color: '#10b981', icon: 'U+2705', hint: 'تُرسل عند قبول الطلب' },
  paid:       { label: 'مدفوع',           color: '#06b6d4', icon: 'U+1F4B3', hint: 'تُرسل عند تأكيد الدفع' },
  rejected:   { label: 'مرفوض',           color: '#ef4444', icon: 'U+274C', hint: 'تُرسل عند رفض الطلب' },
  waitlisted: { label: 'قائمة الانتظار', color: '#8b5cf6', icon: 'U+1F550', hint: 'تُرسل عند الإضافة للقائمة' },
  cancelled:  { label: 'ملغى',            color: '#6b7280', icon: 'U+1F6AB', hint: 'لا تُرسل رسالة افتراضياً' },
  checked_in: { label: 'حضر',             color: '#10b981', icon: 'U+2714', hint: 'تُرسل عند تسجيل الحضور' },
};

const ICONS: Record<string, string> = {
  pending: '⏳', approved: '✅', paid: '💳', rejected: '❌',
  waitlisted: '🕐', cancelled: '🚫', checked_in: '✔️',
};

interface Template {
  status: string;
  subject_ar: string; subject_en: string;
  body_ar: string;    body_en: string;
  send_email: number;
  send_ar: number;    send_en: number;
}

function Toggle({ on, onChange, label, color = '#10b981' }: { on: boolean; onChange: () => void; label: string; color?: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', userSelect: 'none' }}>
      <div onClick={onChange} style={{
        width: 38, height: 20, borderRadius: 10, position: 'relative', flexShrink: 0,
        background: on ? color : '#374151', cursor: 'pointer', transition: 'background 0.2s',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: on ? 19 : 2, width: 16, height: 16,
          borderRadius: '50%', background: 'white', transition: 'left 0.2s',
        }} />
      </div>
      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: on ? color : '#6b7280' }}>{label}</span>
    </label>
  );
}

interface Props { eventId: number; token: string; }

export default function AdminEmailTemplates({ eventId, token }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openStatus, setOpenStatus] = useState<string>('pending');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!eventId || !token) return;
    setLoading(true);
    fetch(`${API}/api/events/${eventId}/registrations/email-templates`, { headers })
      .then(r => r.json())
      .then(d => { if (d.success) setTemplates(d.data.map((t: any) => ({ send_ar: 1, send_en: 0, ...t }))); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId, token]);

  const update = (status: string, field: keyof Template, value: any) =>
    setTemplates(prev => prev.map(t => t.status === status ? { ...t, [field]: value } : t));

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

  const langStatus = (t: Template) => {
    if (!t.send_email) return '✗ متوقف';
    const ar = t.send_ar !== 0;
    const en = t.send_en === 1;
    if (ar && en) return '🌐 عربي + English';
    if (ar) return '🇸🇦 عربي';
    if (en) return '🇬🇧 English';
    return '✗ بدون لغة';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', margin: 0 }}>📧 قوالب البريد</h1>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: 4 }}>
            تحكم كامل بلغة الإرسال لكل حالة — عربي / إنجليزي / الاثنين معاً
          </p>
        </div>
        <button style={S.btn()} onClick={save} disabled={saving}>
          {saving ? 'جاري الحفظ...' : '💾 حفظ الكل'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 14, alignItems: 'start' }}>
        {/* Status sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {templates.map(t => {
            const meta = STATUS_META[t.status];
            const isActive = openStatus === t.status;
            const color = meta?.color || '#6b7280';
            return (
              <button key={t.status} onClick={() => setOpenStatus(t.status)} style={{
                textAlign: 'right', padding: '0.6rem 0.85rem', borderRadius: '0.6rem',
                border: `1px solid ${isActive ? color + '60' : 'rgba(255,255,255,0.07)'}`,
                background: isActive ? color + '15' : 'rgba(255,255,255,0.02)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: '1rem' }}>{ICONS[t.status] || '📧'}</span>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <div style={{ color: isActive ? color : 'white', fontWeight: 600, fontSize: '0.83rem' }}>{meta?.label || t.status}</div>
                  <div style={{ fontSize: '0.63rem', color: '#64748b', marginTop: 2 }}>{langStatus(t)}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Editor */}
        {current && (() => {
          const meta = STATUS_META[current.status];
          const color = meta?.color || '#6b7280';
          const arOn = current.send_ar !== 0;
          const enOn = current.send_en === 1;
          return (
            <div style={{ ...S.card, borderColor: color + '40', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.5rem' }}>{ICONS[current.status] || '📧'}</span>
                  <div>
                    <div style={{ color, fontWeight: 700, fontSize: '1rem' }}>{meta?.label || current.status}</div>
                    <div style={{ color: '#64748b', fontSize: '0.72rem' }}>{meta?.hint}</div>
                  </div>
                </div>
                {/* Master enable/disable */}
                <Toggle
                  on={current.send_email === 1}
                  onChange={() => update(current.status, 'send_email', current.send_email ? 0 : 1)}
                  label={current.send_email ? 'الإرسال مفعّل' : 'الإرسال متوقف'}
                  color='#10b981'
                />
              </div>

              {current.send_email ? (
                <>
                  {/* Language toggles */}
                  <div style={{ display: 'flex', gap: 16, background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem', padding: '0.75rem 1rem', flexWrap: 'wrap' }}>
                    <Toggle
                      on={arOn}
                      onChange={() => update(current.status, 'send_ar', arOn ? 0 : 1)}
                      label='🇸🇦 إرسال بالعربية'
                      color='#6C63FF'
                    />
                    <Toggle
                      on={enOn}
                      onChange={() => update(current.status, 'send_en', enOn ? 0 : 1)}
                      label='🇬🇧 Send in English'
                      color='#0ea5e9'
                    />
                    {arOn && enOn && (
                      <span style={{ color: '#818cf8', fontSize: '0.75rem', alignSelf: 'center' }}>
                        🌐 سيتم إرسال البريد بالعربية والإنجليزية معاً في رسالة واحدة
                      </span>
                    )}
                    {!arOn && !enOn && (
                      <span style={{ color: '#ef4444', fontSize: '0.75rem', alignSelf: 'center' }}>
                        ⚠️ لم يتم تفعيل أي لغة — لن تُرسل أي رسالة
                      </span>
                    )}
                  </div>

                  {/* Two-column editor */}
                  <div style={{ display: 'grid', gridTemplateColumns: arOn && enOn ? '1fr 1fr' : '1fr', gap: 14 }}>
                    {/* Arabic */}
                    {arOn && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ color: '#6C63FF', fontWeight: 700, fontSize: '0.82rem' }}>🇸🇦 العربية</div>
                        <div>
                          <label style={S.label}>الموضوع</label>
                          <input style={S.inp} dir="rtl" value={current.subject_ar}
                            onChange={e => update(current.status, 'subject_ar', e.target.value)}
                            placeholder="موضوع الرسالة بالعربية..." />
                        </div>
                        <div>
                          <label style={S.label}>نص الرسالة</label>
                          <textarea style={S.ta} dir="rtl" value={current.body_ar}
                            onChange={e => update(current.status, 'body_ar', e.target.value)}
                            placeholder="نص الرسالة بالعربية..." rows={5} />
                        </div>
                      </div>
                    )}
                    {/* English */}
                    {enOn && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ color: '#0ea5e9', fontWeight: 700, fontSize: '0.82rem' }}>🇬🇧 English</div>
                        <div>
                          <label style={S.label}>Subject</label>
                          <input style={S.inp} dir="ltr" value={current.subject_en}
                            onChange={e => update(current.status, 'subject_en', e.target.value)}
                            placeholder="Email subject in English..." />
                        </div>
                        <div>
                          <label style={S.label}>Body</label>
                          <textarea style={S.ta} dir="ltr" value={current.body_en}
                            onChange={e => update(current.status, 'body_en', e.target.value)}
                            placeholder="Email body in English..." rows={5} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ background: 'rgba(108,99,255,0.07)', borderRadius: '0.5rem', padding: '0.6rem 1rem', fontSize: '0.75rem', color: '#818cf8' }}>
                    💡 اسم المستلم يُضاف تلقائياً أعلى الرسالة.
                  </div>
                </>
              ) : (
                <div style={{ color: '#64748b', textAlign: 'center', padding: '1.5rem 0', fontSize: '0.85rem' }}>
                  الإرسال متوقف — لن تُرسل أي رسالة لهذه الحالة.
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}