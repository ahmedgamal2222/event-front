'use client';
import { useState, useEffect, useCallback } from 'react';
import { fetchAllEvents, updateEventVisibility } from '../../../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev';

const S = {
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem', colorScheme: 'dark' } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 } as React.CSSProperties),
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '1rem', padding: '1.25rem' } as React.CSSProperties,
  label: { fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block', fontWeight: 600 } as React.CSSProperties,
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  draft:     { label: 'مسودة',   color: '#fcd34d', bg: 'rgba(245,158,11,0.15)',  icon: '📝' },
  published: { label: 'منشور',  color: '#86efac', bg: 'rgba(16,185,129,0.15)',  icon: '✅' },
  archived:  { label: 'مؤرشف', color: '#a5b4fc', bg: 'rgba(108,99,255,0.15)', icon: '🗂' },
};

function ArchiveWarning({ ev }: { ev: any }) {
  const reasons: string[] = [];
  if (ev.status === 'draft') reasons.push('الحالة "مسودة"');
  if (!ev.is_visible) reasons.push('مخفي عن الزوار');
  if (!ev.archive_enabled) reasons.push('غير مفعّل في الأرشيف');
  if (reasons.length === 0) return null;
  return (
    <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '0.35rem', padding: '0.4rem 0.7rem', fontSize: '0.7rem', color: '#fcd34d', marginTop: '0.5rem' }}>
      ⚠️ لن يظهر في الأرشيف — السبب: {reasons.join(' · ')}
    </div>
  );
}

const EMPTY_EVENT = {
  slug: '', name: '', name_ar: '',
  tagline: '', tagline_ar: '', description_ar: '', location_ar: '',
  start_date: '', end_date: '',
  status: 'published',
  edition_number: '', sort_order: 0,
  primary_color: '#6C63FF', email: '',
  is_visible: 1, archive_enabled: 1,
};

export default function AdminEvents({ token }: { token: string }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newEvent, setNewEvent] = useState({ ...EMPTY_EVENT });
  const [msg, setMsg] = useState({ text: '', err: false });
  const [createdSlug, setCreatedSlug] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [expanded, setExpanded] = useState<number | null>(null);

  const notify = (text: string, err = false) => {
    setMsg({ text, err });
    if (!err) setTimeout(() => setMsg({ text: '', err: false }), 5000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await fetchAllEvents(token); setEvents(r.data || []); }
    catch { setEvents([]); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const saveVisibility = async (ev: any, patch: any) => {
    setSaving(ev.id);
    try {
      await updateEventVisibility(ev.id, patch, token);
      setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, ...patch } : e));
      notify('✅ تم الحفظ');
    } catch (e: any) { notify(e.message, true); }
    setSaving(null);
  };

  const changeStatus = async (ev: any, status: string) => {
    setSaving(ev.id);
    try {
      await fetch(`${API_BASE}/api/events/${ev.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, status } : e));
      notify('✅ تم تغيير الحالة');
    } catch (e: any) { notify(e.message, true); }
    setSaving(null);
  };

  const set = (k: string, v: any) => setNewEvent(prev => ({ ...prev, [k]: v }));

  const handleCreate = async () => {
    const e = newEvent;
    if (!e.slug.trim()) return notify('الـ Slug مطلوب (مثال: s3-summit-2027)', true);
    if (!e.name.trim()) return notify('الاسم الإنجليزي مطلوب', true);
    if (!e.name_ar.trim()) return notify('الاسم العربي مطلوب', true);
    if (!e.start_date) return notify('تاريخ البداية مطلوب', true);
    if (!e.end_date) return notify('تاريخ النهاية مطلوب', true);
    setCreating(true);
    try {
      const r = await fetch(`${API_BASE}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...e,
          slug: e.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'),
          sort_order: Number(e.sort_order) || 0,
          is_visible: Number(e.is_visible),
          archive_enabled: Number(e.archive_enabled),
        }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error || 'فشل إنشاء الحدث');
      const slug = e.slug.trim().toLowerCase();
      setCreatedSlug(slug);
      notify(`✅ تم إنشاء الحدث! يمكنك الآن إضافة المحتوى.`);
      setShowCreate(false);
      setNewEvent({ ...EMPTY_EVENT });
      await load();
    } catch (e: any) { notify(e.message, true); }
    setCreating(false);
  };

  const filtered = events.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.name?.toLowerCase().includes(q) || e.name_ar?.includes(q) || e.slug?.includes(q);
    return matchSearch && (filterStatus === 'all' || e.status === filterStatus);
  }).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

  const fmt = (d: string) => d ? new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
  const archiveCount = events.filter(e => e.archive_enabled && e.is_visible && (e.status === 'published' || e.status === 'archived')).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', margin: 0 }}>🗂 إدارة الأحداث والأرشيف</h1>
          <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '0.25rem 0 0' }}>
            {events.length} حدث إجمالاً · {archiveCount} ظاهر في الأرشيف العام
          </p>
        </div>
        <button style={S.btn('#10b981')} onClick={() => { setShowCreate(v => !v); setCreatedSlug(''); }}>
          {showCreate ? '✕ إلغاء' : '➕ إنشاء حدث جديد'}
        </button>
      </div>

      {/* رسائل */}
      {msg.text && (
        <div style={{ background: msg.err ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${msg.err ? '#ef444440' : 'rgba(16,185,129,0.3)'}`, borderRadius: '0.5rem', padding: '0.75rem 1rem', color: msg.err ? '#fca5a5' : '#86efac', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span>{msg.text}</span>
          {createdSlug && !msg.err && (
            <a href={`/${createdSlug}`} target="_blank" rel="noopener noreferrer"
              style={{ ...S.btn('#6C63FF'), textDecoration: 'none', fontSize: '0.78rem', padding: '0.35rem 0.85rem' }}>
              🔗 فتح صفحة الحدث
            </a>
          )}
        </div>
      )}

      {/* شرح الأرشيف */}
      <div style={{ background: 'rgba(108,99,255,0.05)', border: '1px solid rgba(108,99,255,0.18)', borderRadius: '0.6rem', padding: '0.7rem 1rem', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.7 }}>
        <strong style={{ color: '#a5b4fc' }}>📌 شرط ظهور الحدث في الأرشيف العام:</strong>
        &nbsp; الحالة = <strong style={{ color: '#86efac' }}>منشور</strong> أو <strong style={{ color: '#a5b4fc' }}>مؤرشف</strong>
        &nbsp;+ <strong style={{ color: 'white' }}>ظاهر للزوار</strong>
        &nbsp;+ <strong style={{ color: 'white' }}>مفعّل في الأرشيف</strong>
      </div>

      {/* ══ فورم إنشاء حدث جديد ══ */}
      {showCreate && (
        <div style={{ ...S.card, border: '1px solid rgba(16,185,129,0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ color: '#86efac', margin: 0, fontWeight: 700 }}>➕ إنشاء حدث جديد</h3>
            <span style={{ fontSize: '0.7rem', color: '#475569' }}>* إلزامي — الصور والمحتوى تُضاف بعد الإنشاء</span>
          </div>

          {/* المعرّف والأسماء */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: '#6C63FF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(108,99,255,0.2)', paddingBottom: '0.3rem', marginBottom: '0.7rem' }}>🔑 المعرّف والأسماء</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.7rem' }}>
              <div>
                <label style={S.label}>Slug — رابط الحدث *</label>
                <input style={{ ...S.inp, fontFamily: 'monospace' }} dir="ltr" value={newEvent.slug} placeholder="s3-summit-2027"
                  onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))} />
                {newEvent.slug && <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: '0.2rem' }}>الرابط: /{newEvent.slug}</div>}
              </div>
              <div>
                <label style={S.label}>الاسم (إنجليزي) *</label>
                <input style={S.inp} dir="ltr" value={newEvent.name} placeholder="S3 Summit 2027"
                  onChange={e => set('name', e.target.value)} />
              </div>
              <div>
                <label style={S.label}>الاسم (عربي) *</label>
                <input style={S.inp} value={newEvent.name_ar} placeholder="قمة الشركات الناشئة ٢٠٢٧"
                  onChange={e => set('name_ar', e.target.value)} />
              </div>
              <div>
                <label style={S.label}>اسم / رقم النسخة</label>
                <input style={S.inp} value={newEvent.edition_number} placeholder="النسخة الثانية · Edition 2"
                  onChange={e => set('edition_number', e.target.value)} />
              </div>
            </div>
          </div>

          {/* التواريخ والمكان */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: '#6C63FF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(108,99,255,0.2)', paddingBottom: '0.3rem', marginBottom: '0.7rem' }}>📅 التواريخ والمكان</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.7rem' }}>
              <div><label style={S.label}>تاريخ البداية *</label><input style={S.inp} type="date" value={newEvent.start_date} onChange={e => set('start_date', e.target.value)} /></div>
              <div><label style={S.label}>تاريخ النهاية *</label><input style={S.inp} type="date" value={newEvent.end_date} onChange={e => set('end_date', e.target.value)} /></div>
              <div><label style={S.label}>المكان (عربي)</label><input style={S.inp} value={newEvent.location_ar} placeholder="دمشق، سوريا" onChange={e => set('location_ar', e.target.value)} /></div>
            </div>
          </div>

          {/* الوصف والهوية */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: '#6C63FF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(108,99,255,0.2)', paddingBottom: '0.3rem', marginBottom: '0.7rem' }}>📝 الوصف والهوية</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.7rem' }}>
              <div><label style={S.label}>الشعار التعريفي (عربي)</label><input style={S.inp} value={newEvent.tagline_ar} placeholder="نحو ريادة أعمال أقوى" onChange={e => set('tagline_ar', e.target.value)} /></div>
              <div><label style={S.label}>البريد الإلكتروني</label><input style={S.inp} dir="ltr" type="email" value={newEvent.email} placeholder="info@event.com" onChange={e => set('email', e.target.value)} /></div>
              <div>
                <label style={S.label}>اللون الرئيسي</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ position: 'relative', width: 38, height: 38, flexShrink: 0 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '0.4rem', background: newEvent.primary_color, border: '2px solid rgba(255,255,255,0.15)' }} />
                    <input type="color" value={newEvent.primary_color} onChange={e => set('primary_color', e.target.value)}
                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                  </div>
                  <input style={{ ...S.inp, fontFamily: 'monospace' }} dir="ltr" value={newEvent.primary_color} onChange={e => set('primary_color', e.target.value)} maxLength={7} />
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={S.label}>وصف مختصر عربي (يظهر في الأرشيف)</label>
                <textarea rows={2} style={{ ...S.inp, resize: 'vertical' }} value={newEvent.description_ar} placeholder="نبذة عن الحدث..." onChange={e => set('description_ar', e.target.value)} />
              </div>
            </div>
          </div>

          {/* الحالة والأرشيف */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.7rem', color: '#6C63FF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(108,99,255,0.2)', paddingBottom: '0.3rem', marginBottom: '0.7rem' }}>🗂 الحالة والأرشيف</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.7rem' }}>
              <div>
                <label style={S.label}>حالة الحدث</label>
                <select style={S.inp} value={newEvent.status} onChange={e => set('status', e.target.value)}>
                  <option value="draft">📝 مسودة (مخفي عن الزوار)</option>
                  <option value="published">✅ منشور (ظاهر للعموم)</option>
                  <option value="archived">🗂 مؤرشف (سجل تاريخي)</option>
                </select>
              </div>
              <div>
                <label style={S.label}>ترتيب في الأرشيف</label>
                <input style={S.inp} type="number" min={0} value={newEvent.sort_order} onChange={e => set('sort_order', Number(e.target.value))} />
                <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: '0.2rem' }}>رقم أصغر = يظهر أولاً (0 = حسب التاريخ)</div>
              </div>
              <div>
                <label style={{ ...S.label, marginBottom: '0.6rem' }}>إعدادات الأرشيف</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    { key: 'is_visible', label: '👁 ظاهر للزوار' },
                    { key: 'archive_enabled', label: '🗂 يظهر في الأرشيف' },
                  ].map(f => (
                    <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={!!(newEvent as any)[f.key]} onChange={e => set(f.key, e.target.checked ? 1 : 0)} style={{ accentColor: '#6C63FF', width: 16, height: 16 }} />
                      <span style={{ fontSize: '0.82rem', color: (newEvent as any)[f.key] ? 'white' : '#64748b' }}>{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            {newEvent.status === 'draft' && (
              <div style={{ marginTop: '0.6rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '0.4rem', padding: '0.5rem 0.75rem', fontSize: '0.73rem', color: '#fcd34d' }}>
                ⚠️ حالة "مسودة" = لن يظهر الحدث للزوار ولن يُحسب في الأرشيف حتى تغيّر الحالة
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button style={{ ...S.btn('#10b981'), padding: '0.6rem 2rem' }} onClick={handleCreate} disabled={creating}>
              {creating ? '⏳ جار الإنشاء...' : '✅ إنشاء الحدث'}
            </button>
            <button style={{ ...S.btn('#374151'), padding: '0.6rem 1rem' }} onClick={() => { setShowCreate(false); setNewEvent({ ...EMPTY_EVENT }); }}>إلغاء</button>
            <span style={{ flex: 1, fontSize: '0.7rem', color: '#475569', alignSelf: 'center' }}>
              الصور (غلاف / شعار) والمحتوى (متحدثون، جدول، رعاة...) تُضاف من تبويبات لوحة التحكم بعد الإنشاء
            </span>
          </div>
        </div>
      )}

      {/* الفلاتر */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input style={{ ...S.inp, maxWidth: 260 }} placeholder="🔍 بحث..." value={search} onChange={e => setSearch(e.target.value)} />
        {(['all', 'draft', 'published', 'archived'] as const).map(s => {
          const c = { all: events.length, draft: events.filter(e => e.status === 'draft').length, published: events.filter(e => e.status === 'published').length, archived: events.filter(e => e.status === 'archived').length };
          const l = { all: `الكل (${c.all})`, draft: `📝 مسودة (${c.draft})`, published: `✅ منشور (${c.published})`, archived: `🗂 مؤرشف (${c.archived})` };
          return (
            <button key={s} onClick={() => setFilterStatus(s)}
              style={{ padding: '0.35rem 0.85rem', borderRadius: '0.35rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', background: filterStatus === s ? '#6C63FF' : 'rgba(255,255,255,0.06)', color: filterStatus === s ? 'white' : '#94a3b8' }}>
              {(l as any)[s]}
            </button>
          );
        })}
      </div>

      {/* قائمة الأحداث */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>⏳ جار التحميل...</div>
      ) : filtered.length === 0 ? (
        <div style={{ ...S.card, textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🗂</div>
          <p>لا توجد أحداث تطابق البحث</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(ev => {
            const isOpen = expanded === ev.id;
            const isSaving = saving === ev.id;
            const sm = STATUS_META[ev.status] || STATUS_META.draft;
            const inArchive = ev.archive_enabled && ev.is_visible && (ev.status === 'published' || ev.status === 'archived');
            return (
              <div key={ev.id} style={{ ...S.card, border: `1px solid ${isOpen ? 'rgba(108,99,255,0.4)' : 'rgba(108,99,255,0.12)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  {/* Thumb */}
                  {ev.cover_image
                    ? <img src={ev.cover_image} alt="" style={{ width: 64, height: 45, objectFit: 'cover', borderRadius: '0.4rem', flexShrink: 0 }} />
                    : <div style={{ width: 64, height: 45, borderRadius: '0.4rem', background: `${ev.primary_color || '#6C63FF'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>🗓</div>
                  }
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>{ev.name_ar || ev.name}</span>
                      {ev.edition_number && <span style={{ fontSize: '0.68rem', color: '#a5b4fc', background: 'rgba(108,99,255,0.1)', borderRadius: '0.25rem', padding: '0.1rem 0.4rem' }}>{ev.edition_number}</span>}
                      <span style={{ background: sm.bg, color: sm.color, border: `1px solid ${sm.color}30`, borderRadius: '0.3rem', padding: '0.1rem 0.5rem', fontSize: '0.68rem', fontWeight: 700 }}>{sm.icon} {sm.label}</span>
                      <span style={{ fontSize: '0.68rem', color: inArchive ? '#86efac' : '#64748b', background: inArchive ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)', borderRadius: '0.25rem', padding: '0.1rem 0.4rem', border: `1px solid ${inArchive ? 'rgba(16,185,129,0.2)' : 'transparent'}` }}>
                        {inArchive ? '🗂 في الأرشيف' : '📦 خارج الأرشيف'}
                      </span>
                      <span style={{ fontSize: '0.62rem', color: '#3d4459', fontFamily: 'monospace' }}>#{ev.id}</span>
                    </div>
                    <div style={{ fontSize: '0.73rem', color: '#64748b' }}>📅 {fmt(ev.start_date)} — {fmt(ev.end_date)}</div>
                  </div>
                  {/* Toggles */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flexShrink: 0 }}>
                    {[
                      { field: 'is_visible', onLabel: '👁 ظاهر', offLabel: '🚫 مخفي', onColor: '#6C63FF' },
                      { field: 'archive_enabled', onLabel: '🗂 أرشيف', offLabel: '📦 خارج', onColor: '#10b981' },
                    ].map(t => (
                      <div key={t.field} style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                        <div onClick={() => saveVisibility(ev, { [t.field]: ev[t.field] ? 0 : 1 })}
                          style={{ width: 32, height: 18, borderRadius: 9, background: ev[t.field] ? t.onColor : 'rgba(255,255,255,0.08)', position: 'relative', cursor: 'pointer', flexShrink: 0, border: `1px solid ${ev[t.field] ? t.onColor : 'rgba(255,255,255,0.1)'}` }}>
                          <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: ev[t.field] ? 17 : 2, transition: 'left 0.15s' }} />
                        </div>
                        <span style={{ fontSize: '0.7rem', color: ev[t.field] ? '#94a3b8' : '#475569' }}>{ev[t.field] ? t.onLabel : t.offLabel}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setExpanded(isOpen ? null : ev.id)}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.4rem', color: '#64748b', padding: '0.35rem 0.65rem', cursor: 'pointer', fontSize: '0.75rem', flexShrink: 0 }}>
                    {isOpen ? '▲' : '▼'}
                  </button>
                </div>

                <ArchiveWarning ev={ev} />

                {isOpen && (
                  <div style={{ marginTop: '1.1rem', paddingTop: '1.1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.7rem', marginBottom: '0.85rem' }}>
                      <div>
                        <label style={S.label}>تغيير الحالة</label>
                        <select style={S.inp} value={ev.status} disabled={isSaving} onChange={e => changeStatus(ev, e.target.value)}>
                          <option value="draft">📝 مسودة</option>
                          <option value="published">✅ منشور</option>
                          <option value="archived">🗂 مؤرشف</option>
                        </select>
                      </div>
                      <div>
                        <label style={S.label}>رقم النسخة</label>
                        <input style={S.inp} defaultValue={ev.edition_number || ''} placeholder="النسخة الأولى"
                          onBlur={e => { if (e.target.value !== (ev.edition_number || '')) saveVisibility(ev, { edition_number: e.target.value || null }); }} />
                      </div>
                      <div>
                        <label style={S.label}>ترتيب الأرشيف</label>
                        <input style={S.inp} type="number" defaultValue={ev.sort_order || 0}
                          onBlur={e => { const v = Number(e.target.value); if (v !== (ev.sort_order || 0)) saveVisibility(ev, { sort_order: v }); }} />
                      </div>
                    </div>
                    {/* المحتوى المرتبط */}
                    <div style={{ background: 'rgba(108,99,255,0.04)', borderRadius: '0.5rem', padding: '0.65rem 0.9rem', marginBottom: '0.85rem', fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.75, border: '1px solid rgba(108,99,255,0.1)' }}>
                      <strong style={{ color: '#a5b4fc', display: 'block', marginBottom: '0.3rem' }}>📦 المحتوى المرتبط بالحدث #{ev.id} — محفوظ كاملاً في الأرشيف</strong>
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        {['🎙 متحدثون', '📅 جدول أعمال', '🏅 رعاة', '❓ أسئلة شائعة', '📸 صور المكان', '🎫 تذاكر', '📝 مقالات', '📋 تسجيلات', '💳 مدفوعات', '🎨 تصميم تذكرة', '📊 بكسل تتبع'].map(i => (
                          <span key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '0.3rem', padding: '0.15rem 0.5rem', fontSize: '0.68rem' }}>{i}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button style={{ ...S.btn(), padding: '0.4rem 1.1rem', fontSize: '0.8rem' }} disabled={isSaving}
                        onClick={() => saveVisibility(ev, { is_visible: ev.is_visible, archive_enabled: ev.archive_enabled, sort_order: ev.sort_order || 0, edition_number: ev.edition_number || null })}>
                        {isSaving ? '⏳' : '💾 حفظ'}
                      </button>
                      <a href={`/${ev.slug}`} target="_blank" rel="noopener noreferrer"
                        style={{ ...S.btn('rgba(255,255,255,0.05)'), color: '#a5b4fc', textDecoration: 'none', border: '1px solid rgba(108,99,255,0.25)', fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}>
                        🔗 عرض الحدث
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* إحصائيات */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
        {[
          { label: 'إجمالي الأحداث', value: events.length, icon: '🗂', color: '#a5b4fc' },
          { label: 'منشورة',         value: events.filter(e => e.status === 'published').length, icon: '✅', color: '#86efac' },
          { label: 'في الأرشيف',     value: archiveCount, icon: '🗃', color: '#fcd34d' },
          { label: 'مسودات',         value: events.filter(e => e.status === 'draft').length, icon: '📝', color: '#f9a8d4' },
        ].map(s => (
          <div key={s.label} style={{ ...S.card, textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '1.4rem' }}>{s.icon}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: s.color, lineHeight: 1.2 }}>{s.value}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
