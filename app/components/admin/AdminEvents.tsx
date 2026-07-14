'use client';
import { useState, useEffect, useCallback } from 'react';
import { fetchAllEvents, updateEventVisibility, createEvent, uploadImage } from '../../../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev';

const S = {
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem', colorScheme: 'dark' } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 } as React.CSSProperties),
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '1rem', padding: '1.25rem' } as React.CSSProperties,
  label: { fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block', fontWeight: 600 } as React.CSSProperties,
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: 'مسودة',    color: '#fcd34d', bg: 'rgba(245,158,11,0.15)' },
  published: { label: 'منشور',   color: '#86efac', bg: 'rgba(16,185,129,0.15)' },
  archived:  { label: 'مؤرشف',  color: '#a5b4fc', bg: 'rgba(108,99,255,0.15)' },
};

function Badge({ status }: { status: string }) {
  const m = STATUS_META[status] || { label: status, color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
  return (
    <span style={{ background: m.bg, color: m.color, border: `1px solid ${m.color}40`, borderRadius: '0.35rem', padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 700 }}>
      {m.label}
    </span>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
      <div onClick={() => onChange(!checked)} style={{
        width: 38, height: 22, borderRadius: 11, background: checked ? '#6C63FF' : 'rgba(255,255,255,0.1)',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        border: `1px solid ${checked ? '#6C63FF' : 'rgba(255,255,255,0.2)'}`,
      }}>
        <div style={{
          width: 16, height: 16, borderRadius: '50%', background: 'white',
          position: 'absolute', top: 2, left: checked ? 18 : 2, transition: 'left 0.2s',
        }} />
      </div>
      <span style={{ fontSize: '0.82rem', color: checked ? '#a5b4fc' : '#64748b', fontWeight: 600 }}>{label}</span>
    </label>
  );
}

const EMPTY_EVENT = { slug: '', name: '', name_ar: '', start_date: '', end_date: '', status: 'draft', edition_number: '', sort_order: 0 };

export default function AdminEvents({ token }: { token: string }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newEvent, setNewEvent] = useState(EMPTY_EVENT);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [msg, setMsg] = useState({ text: '', err: false });
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [expanded, setExpanded] = useState<number | null>(null);

  const notify = (text: string, err = false) => {
    setMsg({ text, err });
    setTimeout(() => setMsg({ text: '', err: false }), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchAllEvents(token);
      setEvents(r.data || []);
    } catch { setEvents([]); } finally { setLoading(false); }
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

  const handleCreate = async () => {
    if (!newEvent.slug || !newEvent.name || !newEvent.start_date || !newEvent.end_date)
      return notify('slug, الاسم، تاريخ البداية والنهاية مطلوبة', true);
    setCreating(true);
    try {
      let cover_image: string | null = null;
      let logo: string | null = null;
      if (coverFile) cover_image = (await uploadImage(coverFile, token)).url;
      if (logoFile)  logo        = (await uploadImage(logoFile, token)).url;
      await fetch(`${API_BASE}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...newEvent, sort_order: Number(newEvent.sort_order) || 0, cover_image, logo }),
      });
      notify('✅ تم إنشاء الحدث');
      setShowCreate(false);
      setNewEvent(EMPTY_EVENT);
      setCoverFile(null); setLogoFile(null);
      await load();
    } catch (e: any) { notify(e.message, true); }
    setCreating(false);
  };

  const filtered = events.filter(e => {
    const matchSearch = !search || e.name?.toLowerCase().includes(search.toLowerCase()) || e.name_ar?.includes(search) || e.slug?.includes(search);
    const matchStatus = filterStatus === 'all' || e.status === filterStatus;
    return matchSearch && matchStatus;
  }).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', margin: 0 }}>🗂 إدارة الأحداث</h1>
          <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '0.25rem 0 0' }}>
            {events.length} حدث • التحكم في الرؤية والأرشيف والترتيب
          </p>
        </div>
        <button style={S.btn('#10b981')} onClick={() => setShowCreate(v => !v)}>
          {showCreate ? '✕ إلغاء' : '+ إنشاء حدث جديد'}
        </button>
      </div>

      {/* Messages */}
      {msg.text && (
        <div style={{ background: msg.err ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${msg.err ? '#ef444440' : 'rgba(16,185,129,0.3)'}`, borderRadius: '0.5rem', padding: '0.75rem', color: msg.err ? '#fca5a5' : '#86efac' }}>
          {msg.text}
        </div>
      )}

      {/* Create Form */}
      {showCreate && (
        <div style={{ ...S.card, border: '1px solid rgba(16,185,129,0.3)' }}>
          <h3 style={{ color: '#86efac', margin: '0 0 1.25rem', fontWeight: 700 }}>➕ إنشاء حدث جديد</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={S.label}>Slug (رابط الحدث) *</label>
              <input style={S.inp} dir="ltr" value={newEvent.slug} placeholder="s3-summit-2026"
                onChange={e => setNewEvent(v => ({ ...v, slug: e.target.value.toLowerCase().replace(/\s/g, '-') }))} />
            </div>
            <div>
              <label style={S.label}>الاسم (إنجليزي) *</label>
              <input style={S.inp} dir="ltr" value={newEvent.name}
                onChange={e => setNewEvent(v => ({ ...v, name: e.target.value }))} />
            </div>
            <div>
              <label style={S.label}>الاسم (عربي)</label>
              <input style={S.inp} value={newEvent.name_ar}
                onChange={e => setNewEvent(v => ({ ...v, name_ar: e.target.value }))} />
            </div>
            <div>
              <label style={S.label}>رقم النسخة (مثال: النسخة الثانية)</label>
              <input style={S.inp} value={newEvent.edition_number}
                onChange={e => setNewEvent(v => ({ ...v, edition_number: e.target.value }))} placeholder="النسخة الأولى" />
            </div>
            <div>
              <label style={S.label}>تاريخ البداية *</label>
              <input style={S.inp} type="date" value={newEvent.start_date}
                onChange={e => setNewEvent(v => ({ ...v, start_date: e.target.value }))} />
            </div>
            <div>
              <label style={S.label}>تاريخ النهاية *</label>
              <input style={S.inp} type="date" value={newEvent.end_date}
                onChange={e => setNewEvent(v => ({ ...v, end_date: e.target.value }))} />
            </div>
            <div>
              <label style={S.label}>الحالة</label>
              <select style={S.inp} value={newEvent.status} onChange={e => setNewEvent(v => ({ ...v, status: e.target.value }))}>
                <option value="draft">مسودة</option>
                <option value="published">منشور</option>
                <option value="archived">مؤرشف</option>
              </select>
            </div>
            <div>
              <label style={S.label}>ترتيب العرض (الأصغر أولاً)</label>
              <input style={S.inp} type="number" value={newEvent.sort_order}
                onChange={e => setNewEvent(v => ({ ...v, sort_order: Number(e.target.value) }))} />
            </div>
            <div>
              <label style={S.label}>صورة الغلاف</label>
              <input type="file" accept="image/*" style={S.inp}
                onChange={e => setCoverFile(e.target.files?.[0] || null)} />
            </div>
            <div>
              <label style={S.label}>الشعار (Logo)</label>
              <input type="file" accept="image/*" style={S.inp}
                onChange={e => setLogoFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
            <button style={{ ...S.btn('#10b981'), padding: '0.6rem 1.5rem' }} onClick={handleCreate} disabled={creating}>
              {creating ? '⏳ جار الإنشاء...' : '✅ إنشاء الحدث'}
            </button>
            <button style={{ ...S.btn('#6b7280'), padding: '0.6rem 1rem' }} onClick={() => setShowCreate(false)}>
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input style={{ ...S.inp, maxWidth: 260 }} placeholder="🔍 بحث باسم الحدث..." value={search}
          onChange={e => setSearch(e.target.value)} />
        {(['all', 'draft', 'published', 'archived'] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            style={{ padding: '0.35rem 0.9rem', borderRadius: '0.35rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
              background: filterStatus === s ? '#6C63FF' : 'rgba(255,255,255,0.06)',
              color: filterStatus === s ? 'white' : '#94a3b8' }}>
            {s === 'all' ? `الكل (${events.length})` : s === 'draft' ? `مسودة (${events.filter(e => e.status === 'draft').length})` : s === 'published' ? `منشور (${events.filter(e => e.status === 'published').length})` : `مؤرشف (${events.filter(e => e.status === 'archived').length})`}
          </button>
        ))}
      </div>

      {/* Events List */}
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
            return (
              <div key={ev.id} style={{ ...S.card, transition: 'border-color 0.2s', border: `1px solid ${isOpen ? 'rgba(108,99,255,0.4)' : 'rgba(108,99,255,0.15)'}` }}>
                {/* Row header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  {/* Cover thumb */}
                  {ev.cover_image ? (
                    <img src={ev.cover_image} alt="" style={{ width: 60, height: 42, objectFit: 'cover', borderRadius: '0.4rem', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }} />
                  ) : (
                    <div style={{ width: 60, height: 42, borderRadius: '0.4rem', background: 'rgba(108,99,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>🗓</div>
                  )}

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>{ev.name_ar || ev.name}</span>
                      {ev.edition_number && <span style={{ fontSize: '0.72rem', color: '#a5b4fc', background: 'rgba(108,99,255,0.1)', borderRadius: '0.3rem', padding: '0.1rem 0.4rem' }}>{ev.edition_number}</span>}
                      <Badge status={ev.status} />
                      <span style={{ fontSize: '0.72rem', color: '#475569', fontFamily: 'monospace' }}>#{ev.id}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      {formatDate(ev.start_date)} — {formatDate(ev.end_date)}
                      {ev.sort_order > 0 && <span style={{ marginRight: '0.75rem' }}>ترتيب: {ev.sort_order}</span>}
                    </div>
                  </div>

                  {/* Quick toggles */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flexShrink: 0 }}>
                    <Toggle checked={!!ev.is_visible} label={ev.is_visible ? '👁 ظاهر' : '🚫 مخفي'}
                      onChange={v => saveVisibility(ev, { is_visible: v })} />
                    <Toggle checked={!!ev.archive_enabled} label={ev.archive_enabled ? '🗂 في الأرشيف' : '📦 خارج الأرشيف'}
                      onChange={v => saveVisibility(ev, { archive_enabled: v })} />
                  </div>

                  {/* Expand */}
                  <button onClick={() => setExpanded(isOpen ? null : ev.id)}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.4rem', color: '#94a3b8', padding: '0.4rem 0.7rem', cursor: 'pointer', fontSize: '0.82rem', flexShrink: 0 }}>
                    {isOpen ? '▲ طيّ' : '▼ تفاصيل'}
                  </button>
                </div>

                {/* Expanded edit panel */}
                {isOpen && (
                  <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <h4 style={{ color: '#a5b4fc', margin: '0 0 1rem', fontSize: '0.88rem', fontWeight: 700 }}>⚙️ إعدادات الظهور والأرشيف</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={S.label}>رقم النسخة (مثال: النسخة الثانية)</label>
                        <input style={S.inp} defaultValue={ev.edition_number || ''}
                          onChange={e => setEvents(prev => prev.map(x => x.id === ev.id ? { ...x, edition_number: e.target.value } : x))}
                          placeholder="النسخة الأولى" />
                      </div>
                      <div>
                        <label style={S.label}>ترتيب العرض في الأرشيف</label>
                        <input style={S.inp} type="number" defaultValue={ev.sort_order || 0}
                          onChange={e => setEvents(prev => prev.map(x => x.id === ev.id ? { ...x, sort_order: Number(e.target.value) } : x))} />
                        <span style={{ fontSize: '0.72rem', color: '#475569' }}>الأصغر يظهر أولاً</span>
                      </div>
                      <div>
                        <label style={S.label}>حالة الحدث</label>
                        <select style={S.inp} value={ev.status}
                          onChange={async e => {
                            const newStatus = e.target.value;
                            setEvents(prev => prev.map(x => x.id === ev.id ? { ...x, status: newStatus } : x));
                            try {
                              await fetch(`${API_BASE}/api/events/${ev.id}`, {
                                method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ status: newStatus }),
                              });
                              notify('✅ تم تغيير الحالة');
                            } catch { notify('حدث خطأ', true); }
                          }}>
                          <option value="draft">مسودة</option>
                          <option value="published">منشور</option>
                          <option value="archived">مؤرشف</option>
                        </select>
                      </div>
                    </div>

                    {/* Archive info box */}
                    <div style={{ background: 'rgba(108,99,255,0.06)', borderRadius: '0.6rem', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.7, border: '1px solid rgba(108,99,255,0.15)' }}>
                      <strong style={{ color: '#a5b4fc' }}>💡 ماذا يعني كل خيار؟</strong><br />
                      <strong style={{ color: '#e2e8f0' }}>👁 ظاهر:</strong> يظهر هذا الحدث للزوار في الموقع.<br />
                      <strong style={{ color: '#e2e8f0' }}>🗂 في الأرشيف:</strong> يظهر في صفحة الأرشيف `/archive`.<br />
                      <strong style={{ color: '#e2e8f0' }}>🔢 الترتيب:</strong> رقم أصغر = يظهر أولاً في القائمة.<br />
                      <strong style={{ color: '#e2e8f0' }}>📌 رقم النسخة:</strong> يُعرض كبادج على بطاقة الحدث.
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <button style={{ ...S.btn('#6C63FF'), padding: '0.5rem 1.5rem' }} disabled={isSaving}
                        onClick={() => saveVisibility(ev, {
                          is_visible: ev.is_visible,
                          archive_enabled: ev.archive_enabled,
                          sort_order: ev.sort_order || 0,
                          edition_number: ev.edition_number || null,
                        })}>
                        {isSaving ? '⏳ جار الحفظ...' : '💾 حفظ التغييرات'}
                      </button>
                      <a href={`/${ev.slug}`} target="_blank" rel="noopener noreferrer"
                        style={{ ...S.btn('rgba(255,255,255,0.06)'), color: '#a5b4fc', textDecoration: 'none', border: '1px solid rgba(108,99,255,0.3)' }}>
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

      {/* Stats summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
        {[
          { label: 'إجمالي الأحداث', value: events.length, icon: '🗂', color: '#a5b4fc' },
          { label: 'منشورة',         value: events.filter(e => e.status === 'published').length, icon: '✅', color: '#86efac' },
          { label: 'ظاهرة للزوار',   value: events.filter(e => e.is_visible).length, icon: '👁', color: '#fcd34d' },
          { label: 'في الأرشيف',     value: events.filter(e => e.archive_enabled).length, icon: '🗃', color: '#f9a8d4' },
        ].map(s => (
          <div key={s.label} style={{ ...S.card, textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: s.color, lineHeight: 1.2 }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
