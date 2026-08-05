'use client';
/**
 * AdminInteractions — سجل كامل لكل التواصل (صادر + وارد) مع العملاء
 */
import { useState, useEffect, useCallback } from 'react';

const S = {
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem', colorScheme: 'dark' } as React.CSSProperties,
  ta: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.85rem', colorScheme: 'dark', resize: 'vertical' as const, minHeight: 80 } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 } as React.CSSProperties),
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '1rem', padding: '1.25rem' } as React.CSSProperties,
  label: { fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block' } as React.CSSProperties,
};

const CHANNEL_ICONS: Record<string, string> = {
  call: '📞', whatsapp: '💬', email: '📧', meeting: '🤝', sms: '📱', other: '🔔',
};
const CHANNEL_LABELS: Record<string, string> = {
  call: 'مكالمة', whatsapp: 'واتساب', email: 'بريد', meeting: 'اجتماع', sms: 'رسالة نصية', other: 'أخرى',
};
const DIR_COLOR: Record<string, string> = { outbound: '#10b981', inbound: '#3b82f6' };
const DIR_LABEL: Record<string, string> = { outbound: '↑ صادر', inbound: '↓ وارد' };

interface Interaction {
  id: number; contact_id?: number; contact_name?: string; contact_email?: string;
  contact_phone?: string; contact_org?: string;
  registration_id?: number; reg_type?: string; reg_status?: string;
  event_id?: number; event_name_ar?: string;
  channel: string; direction: string; subject: string; summary?: string;
  logged_by?: string; created_at: string;
}

interface Props { token: string; apiBase: string; eventId: number; readOnly?: boolean; }

const BLANK = { channel: 'call', direction: 'outbound', subject: '', summary: '', contact_name_hint: '' };

export default function AdminInteractions({ token, apiBase, eventId, readOnly }: Props) {
  const [items, setItems] = useState<Interaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const LIMIT = 30;

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Show all interactions: those with event_id match OR those linked to contacts from this event
      const res = await fetch(`${apiBase}/api/crm/interactions?event_id=${eventId}&limit=${LIMIT}&offset=${offset}`, { headers });
      const d = await res.json();
      if (d.success) { setItems(d.data || []); setTotal(d.total || 0); }
    } finally { setLoading(false); }
  }, [eventId, offset, token]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.subject.trim()) return alert('يرجى كتابة موضوع التواصل');
    const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('admin_user') || '{}') : {};
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/crm/interactions`, {
        method: 'POST', headers,
        body: JSON.stringify({ ...form, event_id: eventId, logged_by: currentUser.name || currentUser.email || 'admin' }),
      });
      const d = await res.json();
      if (d.success) { setShowForm(false); setForm({ ...BLANK }); load(); }
      else alert(d.error || 'خطأ في الحفظ');
    } finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm('حذف هذا التواصل؟')) return;
    setDeleting(id);
    try {
      await fetch(`${apiBase}/api/crm/interactions/${id}`, { method: 'DELETE', headers });
      load();
    } finally { setDeleting(null); }
  };

  const fmt = (d: string) => new Date(d).toLocaleString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ color: 'white', fontWeight: 700, fontSize: '1.2rem', margin: 0 }}>💬 سجل التواصل</h2>
          <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '4px 0 0' }}>{total} تواصل مسجل مع العملاء</p>
        </div>
        {!readOnly && (
          <button style={S.btn()} onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ إلغاء' : '+ تسجيل تواصل'}
          </button>
        )}
      </div>

      {/* New interaction form */}
      {showForm && !readOnly && (
        <div style={{ ...S.card, borderColor: 'rgba(139,92,246,0.4)', background: 'rgba(139,92,246,0.05)' }}>
          <h3 style={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.95rem', margin: '0 0 14px' }}>💬 تسجيل تواصل جديد</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={S.label}>قناة التواصل</label>
              <select style={S.inp} value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}>
                {Object.entries(CHANNEL_LABELS).map(([k, v]) => <option key={k} value={k}>{CHANNEL_ICONS[k]} {v}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>الاتجاه</label>
              <select style={S.inp} value={form.direction} onChange={e => setForm(f => ({ ...f, direction: e.target.value }))}>
                <option value="outbound">↑ صادر (من عندنا)</option>
                <option value="inbound">↓ وارد (من العميل)</option>
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={S.label}>موضوع التواصل *</label>
              <input style={S.inp} value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="مثل: متابعة طلب المشاركة، تأكيد الدفع..." />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={S.label}>ملاحظات / ملخص المحادثة</label>
              <textarea style={S.ta} value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                placeholder="ما الذي تم مناقشته؟ ما هو القرار أو الخطوة التالية؟" rows={3} />
            </div>
            <div>
              <label style={S.label}>اسم العميل / جهة الاتصال (اختياري)</label>
              <input style={S.inp} value={form.contact_name_hint} onChange={e => setForm(f => ({ ...f, contact_name_hint: e.target.value }))}
                placeholder="اسم العميل للمرجعية..." />
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button style={S.btn('#8b5cf6')} onClick={save} disabled={saving}>
              {saving ? '⏳ جاري الحفظ...' : '💾 حفظ'}
            </button>
            <button style={S.btn('#374151')} onClick={() => setShowForm(false)}>إلغاء</button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>جاري التحميل...</p>
      ) : items.length === 0 ? (
        <div style={{ ...S.card, textAlign: 'center', padding: '3rem', color: '#475569' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>💬</div>
          <p style={{ margin: 0 }}>لا يوجد سجل تواصل حتى الآن</p>
          <p style={{ margin: '4px 0 0', fontSize: '0.78rem' }}>سجّل أول تواصل مع عميل من الزر أعلاه، أو من صفحة التسجيلات.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(item => (
            <div key={item.id} style={{ ...S.card, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              {/* Icon */}
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: `${DIR_COLOR[item.direction] || '#6b7280'}20`, border: `1px solid ${DIR_COLOR[item.direction] || '#6b7280'}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                {CHANNEL_ICONS[item.channel] || '🔔'}
              </div>
              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>{item.subject}</span>
                  <span style={{ fontSize: '0.68rem', background: `${DIR_COLOR[item.direction] || '#6b7280'}20`, color: DIR_COLOR[item.direction] || '#6b7280', padding: '2px 7px', borderRadius: 99, fontWeight: 600 }}>
                    {DIR_LABEL[item.direction] || item.direction}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '2px 7px', borderRadius: 99 }}>
                    {CHANNEL_LABELS[item.channel] || item.channel}
                  </span>
                </div>
                {item.summary && <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 6px', lineHeight: 1.6 }}>{item.summary}</p>}
                {/* Person info */}
                {(item.contact_name || item.contact_email || item.contact_phone) && (
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '0.4rem', padding: '6px 10px', marginBottom: 4, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {item.contact_name && <span style={{ color: '#e2e8f0', fontSize: '0.78rem', fontWeight: 600 }}>👤 {item.contact_name}</span>}
                    {item.contact_email && <span style={{ color: '#64748b', fontSize: '0.72rem' }}>✉️ {item.contact_email}</span>}
                    {item.contact_phone && <span style={{ color: '#64748b', fontSize: '0.72rem' }}>📱 {item.contact_phone}</span>}
                    {item.contact_org && <span style={{ color: '#64748b', fontSize: '0.72rem' }}>🏢 {item.contact_org}</span>}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  {item.logged_by && <span style={{ color: '#64748b', fontSize: '0.72rem' }}>✍️ {item.logged_by}</span>}
                  <span style={{ color: '#475569', fontSize: '0.72rem' }}>🕐 {fmt(item.created_at)}</span>
                  {item.event_name_ar && <span style={{ color: '#475569', fontSize: '0.72rem' }}>📍 {item.event_name_ar}</span>}
                </div>
              </div>
              {/* Delete */}
              {!readOnly && (
                <button onClick={() => del(item.id)} disabled={deleting === item.id}
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '0.35rem', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.72rem', flexShrink: 0 }}>
                  {deleting === item.id ? '...' : '✕'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > LIMIT && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 4 }}>
          <button style={S.btn('#374151')} disabled={offset === 0} onClick={() => setOffset(o => Math.max(0, o - LIMIT))}>السابق</button>
          <span style={{ color: '#64748b', alignSelf: 'center', fontSize: '0.82rem' }}>{offset + 1}–{Math.min(offset + LIMIT, total)} من {total}</span>
          <button style={S.btn('#374151')} disabled={offset + LIMIT >= total} onClick={() => setOffset(o => o + LIMIT)}>التالي</button>
        </div>
      )}
    </div>
  );
}
