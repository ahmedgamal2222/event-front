'use client';
import { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev';

const S = {
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem', colorScheme: 'dark' } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 } as React.CSSProperties),
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '0.8rem', padding: '1.25rem' } as React.CSSProperties,
  label: { fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block', fontWeight: 600 } as React.CSSProperties,
  tag: (active: boolean, color = '#6C63FF') => ({
    padding: '0.2rem 0.7rem', borderRadius: 20, fontSize: '0.78rem', cursor: 'pointer', border: `1px solid ${active ? color : 'rgba(255,255,255,0.12)'}`,
    background: active ? color + '25' : 'transparent', color: active ? '#a5b4fc' : '#94a3b8', fontWeight: active ? 600 : 400,
  } as React.CSSProperties),
};

const STATUS_OPTS = [
  { value: 'pending', label: '⏳ قيد الانتظار' },
  { value: 'approved', label: '✅ مقبول' },
  { value: 'rejected', label: '❌ مرفوض' },
  { value: 'waitlisted', label: '🔶 قائمة انتظار' },
  { value: 'cancelled', label: '🚫 ملغى' },
];
const TYPE_OPTS = [
  { value: 'startup', label: '🚀 شركة ناشئة' },
  { value: 'general', label: '👤 حضور عام' },
  { value: 'investor', label: '💼 مستثمر' },
  { value: 'speaker', label: '🎙️ متحدث' },
  { value: 'sponsor', label: '🏅 راعي' },
  { value: 'media', label: '📹 إعلام' },
];
const CITIES = ['دمشق', 'حلب', 'حمص', 'اللاذقية', 'طرطوس', 'حماة', 'دير الزور', 'الرقة', 'القامشلي', 'إدلب', 'درعا', 'خارج سوريا'];

// ─── Checkbox group ───────────────────────────────────────────────────────────
function MultiCheck({ options, selected, onChange }: { options: { value: string; label: string }[]; selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => toggle(o.value)} style={S.tag(selected.includes(o.value))}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function AdminCampaigns({ eventId, token }: { eventId: number; token: string }) {
  const [tab, setTab] = useState<'compose' | 'history'>('compose');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [preview, setPreview] = useState<{ count: number; sample: any[] } | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Filters
  const [filters, setFilters] = useState<any>({
    status: ['approved'],
    reg_type: [],
    city: [],
    has_paid: null, // null=any, true=paid, false=unpaid
    date_from: '', date_to: '',
  });

  // Compose
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [contentMode, setContentMode] = useState<'html' | 'preview'>('html');
  const [sending, setSending] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const showMsg = (msg: string, err = false) => { if (err) setError(msg); else setSuccess(msg); setTimeout(() => { setError(''); setSuccess(''); }, 4000); };

  const loadHistory = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/events/${eventId}/campaigns`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      setCampaigns(d.data || []);
    } catch { setCampaigns([]); }
  }, [eventId, token]);

  useEffect(() => { if (tab === 'history') loadHistory(); }, [tab, loadHistory]);

  const buildFilters = () => {
    const f: any = {};
    if (filters.status.length > 0) f.status = filters.status;
    if (filters.reg_type.length > 0) f.reg_type = filters.reg_type;
    if (filters.city.length > 0) f.city = filters.city;
    if (filters.has_paid !== null) f.has_paid = filters.has_paid;
    if (filters.date_from) f.date_from = filters.date_from;
    if (filters.date_to) f.date_to = filters.date_to;
    if (!selectAll && selectedIds.length > 0) f.ids = selectedIds;
    return f;
  };

  const handlePreview = async () => {
    setPreviewLoading(true); setPreview(null);
    try {
      const r = await fetch(`${API_BASE}/api/events/${eventId}/campaigns/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filters: buildFilters() }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error);
      setPreview(d.data);
      // Pre-select all if no manual selection
      if (selectAll || selectedIds.length === 0) {
        setSelectedIds(d.data.sample.map((s: any) => s.id));
      }
    } catch (e: any) { showMsg(e.message, true); }
    setPreviewLoading(false);
  };

  const handleSend = async () => {
    if (!subject.trim() || !bodyHtml.trim()) { showMsg('الموضوع والمحتوى مطلوبان', true); return; }
    if (!confirm(`هل تريد إرسال البريد لـ ${preview?.count || 'المحددين'}؟`)) return;
    setSending(true);
    try {
      const r = await fetch(`${API_BASE}/api/events/${eventId}/campaigns/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: campaignName, subject, body_html: bodyHtml, filters: buildFilters() }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error);
      showMsg(`✅ تم الإرسال: ${d.data.sent} نجح، ${d.data.failed} فشل`);
      setSubject(''); setBodyHtml(''); setCampaignName(''); setPreview(null);
      loadHistory();
    } catch (e: any) { showMsg(e.message, true); }
    setSending(false);
  };

  const togglePerson = (id: number) => {
    setSelectAll(false);
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const tabStyle = (active: boolean) => ({
    padding: '0.5rem 1.25rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem',
    background: active ? '#6C63FF' : 'rgba(255,255,255,0.05)', color: active ? 'white' : '#94a3b8',
  } as React.CSSProperties);

  const BLOCKS = [
    { label: 'اسم المستلم', insert: '{{name}}' },
    { label: 'البريد', insert: '{{email}}' },
    { label: 'المدينة', insert: '{{city}}' },
    { label: 'اسم الشركة', insert: '{{company}}' },
    { label: 'رقم التذكرة', insert: '{{ticket_code}}' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', margin: 0 }}>📧 الحملات البريدية</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={tabStyle(tab === 'compose')} onClick={() => setTab('compose')}>✉️ إنشاء حملة</button>
          <button style={tabStyle(tab === 'history')} onClick={() => setTab('history')}>📋 السجل</button>
        </div>
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef444440', borderRadius: '0.5rem', padding: '0.75rem', color: '#fca5a5' }}>❌ {error}</div>}
      {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.5rem', padding: '0.75rem', color: '#86efac' }}>{success}</div>}

      {/* ── Compose ── */}
      {tab === 'compose' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Filters card */}
          <div style={S.card}>
            <div style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: '1rem' }}>🎯 تحديد المستلمين</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={S.label}>حالة التسجيل</label>
                <MultiCheck options={STATUS_OPTS} selected={filters.status}
                  onChange={v => setFilters((f: any) => ({ ...f, status: v }))} />
              </div>
              <div>
                <label style={S.label}>نوع التسجيل</label>
                <MultiCheck options={TYPE_OPTS} selected={filters.reg_type}
                  onChange={v => setFilters((f: any) => ({ ...f, reg_type: v }))} />
              </div>
              <div>
                <label style={S.label}>المدينة</label>
                <MultiCheck options={CITIES.map(c => ({ value: c, label: c }))} selected={filters.city}
                  onChange={v => setFilters((f: any) => ({ ...f, city: v }))} />
              </div>
              <div>
                <label style={S.label}>حالة الدفع</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {[{ v: null, l: '🔘 الكل' }, { v: true, l: '✅ دفع' }, { v: false, l: '❌ لم يدفع' }].map(o => (
                    <button key={String(o.v)} type="button" onClick={() => setFilters((f: any) => ({ ...f, has_paid: o.v }))}
                      style={S.tag(filters.has_paid === o.v, '#10b981')}>{o.l}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={S.label}>من تاريخ</label>
                  <input type="date" style={S.inp} value={filters.date_from}
                    onChange={e => setFilters((f: any) => ({ ...f, date_from: e.target.value }))} /></div>
                <div><label style={S.label}>إلى تاريخ</label>
                  <input type="date" style={S.inp} value={filters.date_to}
                    onChange={e => setFilters((f: any) => ({ ...f, date_to: e.target.value }))} /></div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button style={{ ...S.btn('#3b82f6'), display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                onClick={handlePreview} disabled={previewLoading}>
                {previewLoading ? '⏳ جار...' : '🔍 معاينة المستلمين'}
              </button>
              {preview && <span style={{ color: '#a5b4fc', fontSize: '0.85rem' }}>
                {selectAll ? `سيُرسل لـ ${preview.count} شخص` : `${selectedIds.length} محدد`}
              </span>}
            </div>
          </div>

          {/* Recipients preview list */}
          {preview && (
            <div style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ fontWeight: 700, color: 'white' }}>
                  👥 المستلمون ({preview.count})
                  {preview.count > 10 && <span style={{ color: '#94a3b8', fontSize: '0.75rem', marginRight: 8 }}>— يظهر أول 10</span>}
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#94a3b8', fontSize: '0.82rem' }}>
                  <input type="checkbox" checked={selectAll}
                    onChange={e => { setSelectAll(e.target.checked); if (e.target.checked) setSelectedIds([]); }}
                    style={{ accentColor: '#6C63FF' }} />
                  تحديد الكل ({preview.count})
                </label>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 280, overflowY: 'auto' }}>
                {preview.sample.map((p: any) => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0.5rem', borderRadius: '0.4rem', cursor: 'pointer', background: selectedIds.includes(p.id) ? 'rgba(108,99,255,0.1)' : 'transparent' }}>
                    <input type="checkbox" checked={selectAll || selectedIds.includes(p.id)}
                      onChange={() => togglePerson(p.id)} style={{ accentColor: '#6C63FF', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: 600 }}>{p.name}</div>
                      <div style={{ color: '#64748b', fontSize: '0.72rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span>{p.email}</span>
                        {p.city && <span>· {p.city}</span>}
                        <span>· {p.reg_type}</span>
                        <span style={{ color: p.has_paid ? '#86efac' : '#fca5a5' }}>{p.has_paid ? '· ✅ دفع' : '· ❌ لم يدفع'}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Email compose */}
          <div style={S.card}>
            <div style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: '1rem' }}>✉️ محتوى البريد</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div><label style={S.label}>اسم الحملة (للأرشيف)</label>
                <input style={S.inp} value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="مثال: حملة ترحيب يوليو 2026" /></div>
              <div><label style={S.label}>موضوع البريد *</label>
                <input style={S.inp} value={subject} onChange={e => setSubject(e.target.value)} placeholder="مثال: تذكير بموعد الحدث — S3 Summit 2026" /></div>

              {/* Variables */}
              <div>
                <label style={S.label}>إدراج متغير شخصي</label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {BLOCKS.map(b => (
                    <button key={b.insert} type="button"
                      onClick={() => setBodyHtml(prev => prev + b.insert)}
                      style={{ ...S.btn('#374151'), fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={S.label}>محتوى البريد (HTML) *</label>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button onClick={() => setContentMode('html')} style={{ ...S.btn(contentMode === 'html' ? '#6C63FF' : '#374151'), padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}>HTML</button>
                    <button onClick={() => setContentMode('preview')} style={{ ...S.btn(contentMode === 'preview' ? '#6C63FF' : '#374151'), padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}>معاينة</button>
                  </div>
                </div>
                {contentMode === 'html' ? (
                  <textarea rows={14} style={{ ...S.inp, fontFamily: 'monospace', fontSize: '0.83rem', resize: 'vertical', lineHeight: 1.5 }}
                    value={bodyHtml} onChange={e => setBodyHtml(e.target.value)}
                    placeholder={`<div style="font-family:Arial;direction:rtl;color:#333;max-width:600px;margin:auto;padding:20px">\n  <h2>مرحباً {{name}}</h2>\n  <p>شكراً لتسجيلك في S3 Summit!</p>\n</div>`} />
                ) : (
                  <div style={{ minHeight: 200, padding: '1rem', background: 'white', borderRadius: '0.5rem', direction: 'rtl' }}
                    dangerouslySetInnerHTML={{ __html: bodyHtml || '<p style="color:#999">لا يوجد محتوى بعد</p>' }} />
                )}
              </div>
            </div>
          </div>

          <button
            style={{ ...S.btn(), alignSelf: 'flex-start', padding: '0.7rem 2.5rem', fontSize: '0.95rem', opacity: sending ? 0.7 : 1 }}
            onClick={handleSend} disabled={sending || !subject || !bodyHtml}>
            {sending ? '⏳ جار الإرسال...' : `📤 إرسال لـ ${preview ? (selectAll ? preview.count : selectedIds.length || preview.count) : '...'} شخص`}
          </button>
        </div>
      )}

      {/* ── History ── */}
      {tab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {campaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', ...S.card }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
              <p>لم يتم إرسال أي حملة بعد</p>
            </div>
          ) : campaigns.map(c => (
            <div key={c.id} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>{c.name || c.subject}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: 2 }}>{c.subject}</div>
                <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: 4 }}>
                  {c.sent_at ? new Date(c.sent_at).toLocaleString('ar-SA') : 'مسودة'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#86efac', fontWeight: 700 }}>{c.total_sent}</div>
                  <div style={{ color: '#64748b', fontSize: '0.7rem' }}>أُرسل</div>
                </div>
                {c.total_failed > 0 && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#fca5a5', fontWeight: 700 }}>{c.total_failed}</div>
                    <div style={{ color: '#64748b', fontSize: '0.7rem' }}>فشل</div>
                  </div>
                )}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#a5b4fc', fontWeight: 700 }}>{c.recipients_count}</div>
                  <div style={{ color: '#64748b', fontSize: '0.7rem' }}>إجمالي</div>
                </div>
                <span style={{
                  padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600,
                  background: c.status === 'sent' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                  color: c.status === 'sent' ? '#86efac' : '#fcd34d',
                }}>{c.status === 'sent' ? '✅ أُرسل' : '📝 مسودة'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
