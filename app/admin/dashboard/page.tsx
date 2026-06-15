'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchStats, fetchRegistrations, updateRegistration,
  fetchEvent, updateEvent,
  fetchSpeakers, createSpeaker, updateSpeaker, deleteSpeaker,
  fetchSponsors, createSponsor, updateSponsor, deleteSponsor,
  fetchFaqs, createFaq, deleteFaq,
  fetchAgenda, createAgendaDay,
  createAgendaSession, updateAgendaSession, deleteAgendaSession,
} from '../../../lib/api';

function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : ''; }

const STATUS_STYLES: Record<string, { bg: string; label: string }> = {
  pending:    { bg: '#f59e0b', label: 'قيد الانتظار' },
  approved:   { bg: '#10b981', label: 'مقبول' },
  rejected:   { bg: '#ef4444', label: 'مرفوض' },
  waitlisted: { bg: '#8b5cf6', label: 'قائمة الانتظار' },
  cancelled:  { bg: '#6b7280', label: 'ملغى' },
};
const TYPE_LABELS: Record<string, string> = {
  startup: '🚀 ناشئة', general: '👤 عام', investor: '💼 مستثمر',
  speaker: '🎙️ متحدث', sponsor: '🏅 راعي', media: '📹 إعلام',
};
const SESSION_TYPES = ['keynote','talk','workshop','panel','networking','break','competition'];
const SPONSOR_TIERS = ['platinum','gold','silver','bronze','media'];
const TABS = [
  { key: 'overview',       label: '📊 نظرة عامة' },
  { key: 'event',          label: '⚙️ معلومات الحدث' },
  { key: 'registrations',  label: '📋 التسجيلات' },
  { key: 'speakers',       label: '🎙️ المتحدثون' },
  { key: 'agenda',         label: '📅 البرنامج' },
  { key: 'sponsors',       label: '🏅 الرعاة' },
  { key: 'faqs',           label: '❓ الأسئلة الشائعة' },
] as const;
type Tab = typeof TABS[number]['key'];

const S = {
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem', colorScheme: 'dark' } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 } as React.CSSProperties),
  del: { background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440', borderRadius: '0.4rem', padding: '0.35rem 0.7rem', cursor: 'pointer', fontSize: '0.8rem' } as React.CSSProperties,
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '1rem', padding: '1.25rem' } as React.CSSProperties,
  label: { fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block' } as React.CSSProperties,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={S.label}>{label}</label>{children}</div>;
}
function SaveBtn({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return <button style={S.btn()} onClick={onClick} disabled={loading}>{loading ? 'جار الحفظ...' : 'حفظ'}</button>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [eventId] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const t = getToken();
    if (!t) { router.replace('/admin'); return; }
    setToken(t);
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const save = async (fn: () => Promise<any>) => {
    setSaving(true);
    try { await fn(); showToast('✅ تم الحفظ بنجاح'); }
    catch (e: any) { showToast('❌ ' + (e.message || 'حدث خطأ')); }
    finally { setSaving(false); }
  };

  const logout = () => { localStorage.removeItem('admin_token'); router.replace('/admin'); };

  return (
    <div style={{ minHeight: '100vh', background: '#0d0b1a', color: '#e2e8f0', fontFamily: 'Cairo,sans-serif', direction: 'rtl' }}>
      <nav style={{ background: 'rgba(19,16,42,0.9)', borderBottom: '1px solid rgba(108,99,255,0.2)', position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontWeight: 900, fontSize: '1.1rem', flexShrink: 0 }}><span style={{ color: '#6C63FF' }}>S3</span> Admin</span>
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', flexWrap: 'nowrap' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                style={{ padding: '0.3rem 0.7rem', borderRadius: 6, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.78rem', fontWeight: 600, background: activeTab === t.key ? 'rgba(108,99,255,0.35)' : 'transparent', color: activeTab === t.key ? 'white' : '#94a3b8' }}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
            <a href="/s3-summit-2026" target="_blank" style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'none' }}>عرض ↗</a>
            <button onClick={logout} style={{ fontSize: '0.75rem', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>خروج</button>
          </div>
        </div>
      </nav>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#1a1730', border: '1px solid rgba(108,99,255,0.4)', borderRadius: 8, padding: '0.75rem 1.5rem', zIndex: 999, fontSize: '0.9rem', color: 'white' }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {activeTab === 'overview'      && <OverviewTab eventId={eventId} token={token} />}
        {activeTab === 'event'         && <EventTab eventId={eventId} token={token} save={save} saving={saving} />}
        {activeTab === 'registrations' && <RegistrationsTab eventId={eventId} token={token} router={router} />}
        {activeTab === 'speakers'      && <SpeakersTab eventId={eventId} token={token} save={save} saving={saving} showToast={showToast} />}
        {activeTab === 'agenda'        && <AgendaTab eventId={eventId} token={token} save={save} saving={saving} showToast={showToast} />}
        {activeTab === 'sponsors'      && <SponsorsTab eventId={eventId} token={token} save={save} saving={saving} showToast={showToast} />}
        {activeTab === 'faqs'          && <FaqsTab eventId={eventId} token={token} save={save} saving={saving} showToast={showToast} />}
      </div>
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────
function OverviewTab({ eventId, token }: { eventId: number; token: string }) {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => { if (token) fetchStats(eventId).then((r: any) => setStats(r.data)).catch(() => {}); }, [token]);
  const cards = [
    { v: stats?.total_registrations || 0, l: 'إجمالي التسجيلات', c: '#6C63FF', i: '📋' },
    { v: stats?.approved_count || 0,      l: 'المقبولون',          c: '#10b981', i: '✅' },
    { v: stats?.pending_count || 0,       l: 'قيد الانتظار',       c: '#f59e0b', i: '⏳' },
    { v: stats?.startup_count || 0,       l: 'شركات ناشئة',        c: '#8b5cf6', i: '🚀' },
    { v: stats?.investor_count || 0,      l: 'مستثمرون',           c: '#0ea5e9', i: '💼' },
    { v: stats?.speaker_count || 0,       l: 'متحدثون',            c: '#ec4899', i: '🎙️' },
    { v: stats?.general_count || 0,       l: 'حضور عام',           c: '#6b7280', i: '👤' },
  ];
  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '1.5rem' }}>نظرة عامة</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 14 }}>
        {cards.map(({ v, l, c, i }) => (
          <div key={l} style={S.card}>
            <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{i}</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: c }}>{v}</div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Event Info ────────────────────────────────────────────────────────────────
function EventTab({ eventId, token, save, saving }: any) {
  const [form, setForm] = useState<any>({});
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!token) return;
    fetchEvent('s3-summit-2026').then((r: any) => { setForm(r.data); setLoaded(true); }).catch(() => {});
  }, [token]);
  if (!loaded) return <p style={{ color: '#94a3b8' }}>جار التحميل...</p>;
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const fields: Array<{ key: string; label: string; type?: string; textarea?: boolean }> = [
    { key: 'name',           label: 'اسم الحدث (EN)' },
    { key: 'name_ar',        label: 'اسم الحدث (AR)' },
    { key: 'tagline',        label: 'الشعار (EN)' },
    { key: 'tagline_ar',     label: 'الشعار (AR)' },
    { key: 'description_ar', label: 'الوصف (AR)', textarea: true },
    { key: 'location_ar',    label: 'الموقع (AR)' },
    { key: 'start_date',     label: 'تاريخ البداية', type: 'date' },
    { key: 'end_date',       label: 'تاريخ النهاية', type: 'date' },
    { key: 'max_attendees',  label: 'الحد الأقصى للحضور', type: 'number' },
    { key: 'email',          label: 'البريد الإلكتروني', type: 'email' },
    { key: 'twitter',        label: 'تويتر' },
    { key: 'instagram',      label: 'انستغرام' },
    { key: 'linkedin',       label: 'لينكدإن' },
    { key: 'primary_color',  label: 'اللون الرئيسي', type: 'color' },
  ];
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white' }}>معلومات الحدث</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <label style={S.label}>حالة التسجيل</label>
            <select value={form.registration_open ? '1' : '0'} onChange={e => set('registration_open', e.target.value === '1')}
              style={{ ...S.inp, width: 'auto', padding: '0.4rem 0.7rem' }}>
              <option value="1">مفتوح ✅</option>
              <option value="0">مغلق 🔒</option>
            </select>
          </div>
          <div>
            <label style={S.label}>حالة الحدث</label>
            <select value={form.status || 'draft'} onChange={e => set('status', e.target.value)}
              style={{ ...S.inp, width: 'auto', padding: '0.4rem 0.7rem' }}>
              <option value="draft">مسودة</option>
              <option value="published">منشور</option>
              <option value="archived">مؤرشف</option>
            </select>
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <SaveBtn loading={saving} onClick={() => save(() => updateEvent(eventId, form, token))} />
          </div>
        </div>
      </div>
      <div style={{ ...S.card, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {fields.map(({ key, label, type, textarea }) => (
          <div key={key} style={textarea ? { gridColumn: '1/-1' } : {}}>
            <Field label={label}>
              {textarea
                ? <textarea value={form[key] || ''} onChange={e => set(key, e.target.value)} rows={3} style={{ ...S.inp, resize: 'vertical' }} />
                : <input type={type || 'text'} value={form[key] || ''} onChange={e => set(key, e.target.value)}
                    style={{ ...S.inp, ...(type === 'color' ? { padding: '0.2rem', height: 42, cursor: 'pointer' } : {}) }} />
              }
            </Field>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Registrations ─────────────────────────────────────────────────────────────
function RegistrationsTab({ eventId, token, router }: any) {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<any>(null);
  const limit = 20;

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (filterStatus) p.set('status', filterStatus);
      if (filterType)   p.set('type', filterType);
      if (search)       p.set('search', search);
      p.set('limit', String(limit));
      p.set('offset', String(page * limit));
      const res: any = await fetchRegistrations(eventId, token, p.toString());
      setRegistrations(res.data || []); setTotal(res.total || 0);
    } catch (e: any) {
      if (e.message?.includes('Unauthorized')) router.replace('/admin');
    }
    setLoading(false);
  }, [token, filterStatus, filterType, search, page]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (id: number, status: string) => {
    await updateRegistration(eventId, id, { status }, token);
    load();
    if (selected?.id === id) setSelected((s: any) => s ? { ...s, status } : null);
  };

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white' }}>التسجيلات <span style={{ color: '#94a3b8', fontSize: '1rem' }}>({total})</span></h1>
        </div>
        <div style={{ ...S.card, display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <input placeholder="بحث..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} style={{ ...S.inp, width: 180 }} />
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0); }} style={{ ...S.inp, width: 140 }}>
            <option value="">كل الحالات</option>
            {Object.entries(STATUS_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(0); }} style={{ ...S.inp, width: 140 }}>
            <option value="">كل الأنواع</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['الاسم','البريد','النوع','المدينة','الحالة','التاريخ','تغيير الحالة'].map(h => (
                    <th key={h} style={{ textAlign: 'right', padding: '0.65rem 0.85rem', color: '#94a3b8', fontWeight: 600, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>جار التحميل...</td></tr>
                ) : registrations.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>لا توجد تسجيلات</td></tr>
                ) : registrations.map(reg => {
                  const st = STATUS_STYLES[reg.status] || STATUS_STYLES.pending;
                  return (
                    <tr key={reg.id} onClick={() => setSelected(reg)}
                      style={{ borderTop: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', background: selected?.id === reg.id ? 'rgba(108,99,255,0.1)' : 'transparent' }}>
                      <td style={{ padding: '0.6rem 0.85rem', color: 'white', fontWeight: 500, whiteSpace: 'nowrap' }}>{reg.full_name}</td>
                      <td style={{ padding: '0.6rem 0.85rem', color: '#94a3b8', fontSize: '0.78rem' }}>{reg.email}</td>
                      <td style={{ padding: '0.6rem 0.85rem', fontSize: '0.75rem' }}>{TYPE_LABELS[reg.reg_type] || reg.reg_type}</td>
                      <td style={{ padding: '0.6rem 0.85rem', color: '#94a3b8', fontSize: '0.72rem' }}>{reg.city || '—'}</td>
                      <td style={{ padding: '0.6rem 0.85rem' }}>
                        <span style={{ background: st.bg + '25', color: st.bg, padding: '0.15rem 0.5rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600 }}>{st.label}</span>
                      </td>
                      <td style={{ padding: '0.6rem 0.85rem', color: '#94a3b8', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{new Date(reg.created_at).toLocaleDateString('ar')}</td>
                      <td style={{ padding: '0.6rem 0.85rem' }} onClick={e => e.stopPropagation()}>
                        <select value={reg.status} onChange={e => changeStatus(reg.id, e.target.value)}
                          style={{ ...S.inp, width: 'auto', padding: '0.25rem 0.4rem', fontSize: '0.72rem' }}>
                          {Object.entries(STATUS_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {total > limit && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{page * limit + 1}–{Math.min((page + 1) * limit, total)} من {total}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ ...S.btn('#1a1730'), opacity: page === 0 ? 0.4 : 1, border: '1px solid rgba(255,255,255,0.1)' }}>السابق</button>
                <button disabled={(page + 1) * limit >= total} onClick={() => setPage(p => p + 1)} style={{ ...S.btn('#1a1730'), opacity: (page + 1) * limit >= total ? 0.4 : 1, border: '1px solid rgba(255,255,255,0.1)' }}>التالي</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {selected && (
        <div style={{ ...S.card, width: 280, flexShrink: 0, alignSelf: 'flex-start', position: 'sticky', top: 62 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>التفاصيل</span>
            <button onClick={() => setSelected(null)} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
          {([['الاسم',selected.full_name],['البريد',selected.email],['الهاتف',selected.phone||'—'],['المدينة',selected.city||'—'],['المنظمة',selected.organization||'—'],['المسمى',selected.job_title||'—'],['الدوافع',selected.motivation||'—']] as [string,string][]).map(([k,v]) => (
            <div key={k} style={{ marginBottom: 6 }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{k}: </span>
              <span style={{ fontSize: '0.82rem', color: 'white' }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop: 10 }}>
            <label style={S.label}>تغيير الحالة</label>
            <select value={selected.status} onChange={e => { changeStatus(selected.id, e.target.value); setSelected((s: any) => ({ ...s, status: e.target.value })); }} style={S.inp}>
              {Object.entries(STATUS_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button onClick={() => changeStatus(selected.id, 'approved')} style={{ flex: 1, ...S.btn('#10b98130'), color: '#10b981', border: '1px solid #10b98140' }}>✅ قبول</button>
            <button onClick={() => changeStatus(selected.id, 'rejected')} style={{ flex: 1, ...S.btn('#ef444420'), color: '#ef4444', border: '1px solid #ef444440' }}>❌ رفض</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Speakers ──────────────────────────────────────────────────────────────────
function SpeakersTab({ eventId, token, save, saving, showToast }: any) {
  const [speakers, setSpeakers] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const blank = { name: '', name_ar: '', title_ar: '', company: '', bio_ar: '', photo_url: '', is_featured: false, is_surprise: false, sort_order: 0 };
  const [form, setForm] = useState<any>(blank);

  const load = () => { if (token) fetchSpeakers(eventId).then((r: any) => setSpeakers(r.data || [])).catch(() => {}); };
  useEffect(() => { load(); }, [token]);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const saveItem = () => save(async () => {
    if (editing) await updateSpeaker(eventId, editing.id, form, token);
    else         await createSpeaker(eventId, form, token);
    setEditing(null); setAdding(false); setForm(blank); load();
  });

  const del = async (id: number) => {
    if (!confirm('حذف المتحدث؟')) return;
    try { await deleteSpeaker(eventId, id, token); showToast('✅ تم الحذف'); load(); }
    catch (e: any) { showToast('❌ ' + e.message); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white' }}>المتحدثون ({speakers.length})</h1>
        {!adding && <button style={S.btn()} onClick={() => { setAdding(true); setEditing(null); setForm(blank); }}>+ إضافة متحدث</button>}
      </div>

      {adding && (
        <div style={{ ...S.card, marginBottom: 16 }}>
          <h3 style={{ color: 'white', marginBottom: 12 }}>{editing ? 'تعديل متحدث' : 'إضافة متحدث'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="الاسم (EN)"><input value={form.name} onChange={e => set('name', e.target.value)} style={S.inp} /></Field>
            <Field label="الاسم (AR)"><input value={form.name_ar||''} onChange={e => set('name_ar', e.target.value)} style={S.inp} /></Field>
            <Field label="المسمى (AR)"><input value={form.title_ar||''} onChange={e => set('title_ar', e.target.value)} style={S.inp} /></Field>
            <Field label="الشركة"><input value={form.company||''} onChange={e => set('company', e.target.value)} style={S.inp} /></Field>
            <Field label="رابط الصورة"><input value={form.photo_url||''} onChange={e => set('photo_url', e.target.value)} style={S.inp} /></Field>
            <Field label="الترتيب"><input type="number" value={form.sort_order||0} onChange={e => set('sort_order', +e.target.value)} style={S.inp} /></Field>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="النبذة (AR)"><textarea value={form.bio_ar||''} onChange={e => set('bio_ar', e.target.value)} rows={2} style={{ ...S.inp, resize: 'vertical' }} /></Field>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e2e8f0', cursor: 'pointer', fontSize: '0.88rem' }}>
              <input type="checkbox" checked={!!form.is_featured} onChange={e => set('is_featured', e.target.checked)} /> متحدث مميز
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e2e8f0', cursor: 'pointer', fontSize: '0.88rem' }}>
              <input type="checkbox" checked={!!form.is_surprise} onChange={e => set('is_surprise', e.target.checked)} /> مفاجأة
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <SaveBtn loading={saving} onClick={saveItem} />
            <button style={S.del} onClick={() => { setAdding(false); setEditing(null); setForm(blank); }}>إلغاء</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
        {speakers.map(sp => (
          <div key={sp.id} style={S.card}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
              {sp.photo_url
                ? <img src={sp.photo_url} alt={sp.name_ar} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(108,99,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>🎙️</div>
              }
              <div>
                <div style={{ color: 'white', fontWeight: 700, fontSize: '0.92rem' }}>{sp.name_ar || sp.name}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{sp.title_ar}</div>
                <div style={{ color: '#6C63FF', fontSize: '0.72rem' }}>{sp.company}</div>
                {sp.is_featured ? <span style={{ fontSize: '0.65rem', background: '#6C63FF30', color: '#6C63FF', padding: '0.1rem 0.35rem', borderRadius: 4 }}>⭐ مميز</span> : null}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={S.btn('#1a2744')} onClick={() => { setEditing(sp); setAdding(true); setForm({ ...sp, is_featured: !!sp.is_featured, is_surprise: !!sp.is_surprise }); }}>تعديل</button>
              <button style={S.del} onClick={() => del(sp.id)}>حذف</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Agenda ────────────────────────────────────────────────────────────────────
function AgendaTab({ eventId, token, save, saving, showToast }: any) {
  const [agenda, setAgenda] = useState<any[]>([]);
  const [speakers, setSpeakers] = useState<any[]>([]);
  const [addingDay, setAddingDay] = useState(false);
  const [dayForm, setDayForm] = useState({ day_number: 1, date: '', label: '', label_en: '' });
  const [sessionState, setSessionState] = useState<{ dayId: number | null; editing: any }>({ dayId: null, editing: null });
  const [sessionForm, setSessionForm] = useState<any>({});

  const load = () => {
    if (!token) return;
    fetchAgenda(eventId).then((r: any) => setAgenda(r.data || [])).catch(() => {});
    fetchSpeakers(eventId).then((r: any) => setSpeakers(r.data || [])).catch(() => {});
  };
  useEffect(() => { load(); }, [token]);

  const blankSession = (dayId: number) => ({ day_id: dayId, time_start: '', time_end: '', title_ar: '', description_ar: '', session_type: 'talk', speaker_id: '', sort_order: 0 });
  const set = (k: string, v: any) => setSessionForm((f: any) => ({ ...f, [k]: v }));

  const saveSession = () => save(async () => {
    const body = { ...sessionForm, speaker_id: sessionForm.speaker_id ? Number(sessionForm.speaker_id) : null };
    if (sessionState.editing) await updateAgendaSession(eventId, sessionState.editing.id, body, token);
    else                       await createAgendaSession(eventId, body, token);
    setSessionState({ dayId: null, editing: null }); load();
  });

  const delSession = async (id: number) => {
    if (!confirm('حذف الجلسة؟')) return;
    try { await deleteAgendaSession(eventId, id, token); showToast('✅ تم الحذف'); load(); }
    catch (e: any) { showToast('❌ ' + e.message); }
  };

  const saveDay = () => save(async () => {
    await createAgendaDay(eventId, dayForm, token);
    setAddingDay(false); setDayForm({ day_number: 1, date: '', label: '', label_en: '' }); load();
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white' }}>البرنامج</h1>
        <button style={S.btn()} onClick={() => setAddingDay(true)}>+ يوم جديد</button>
      </div>

      {addingDay && (
        <div style={{ ...S.card, marginBottom: 16 }}>
          <h3 style={{ color: 'white', marginBottom: 12 }}>إضافة يوم</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="رقم اليوم"><input type="number" value={dayForm.day_number} onChange={e => setDayForm(f => ({ ...f, day_number: +e.target.value }))} style={S.inp} /></Field>
            <Field label="التاريخ"><input type="date" value={dayForm.date} onChange={e => setDayForm(f => ({ ...f, date: e.target.value }))} style={S.inp} /></Field>
            <Field label="التسمية (AR)"><input value={dayForm.label} onChange={e => setDayForm(f => ({ ...f, label: e.target.value }))} style={S.inp} /></Field>
            <Field label="التسمية (EN)"><input value={dayForm.label_en} onChange={e => setDayForm(f => ({ ...f, label_en: e.target.value }))} style={S.inp} /></Field>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <SaveBtn loading={saving} onClick={saveDay} />
            <button style={S.del} onClick={() => setAddingDay(false)}>إلغاء</button>
          </div>
        </div>
      )}

      {agenda.map((day: any) => (
        <div key={day.id} style={{ ...S.card, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ color: 'white', fontWeight: 700 }}>{day.label} — {day.date}</span>
            <button style={S.btn()} onClick={() => { setSessionState({ dayId: day.id, editing: null }); setSessionForm(blankSession(day.id)); }}>+ جلسة</button>
          </div>

          {sessionState.dayId === day.id && (
            <div style={{ background: 'rgba(108,99,255,0.07)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 8, padding: 12, marginBottom: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="وقت البداية"><input type="time" value={sessionForm.time_start||''} onChange={e => set('time_start', e.target.value)} style={S.inp} /></Field>
                <Field label="وقت النهاية"><input type="time" value={sessionForm.time_end||''} onChange={e => set('time_end', e.target.value)} style={S.inp} /></Field>
                <Field label="العنوان (AR)"><input value={sessionForm.title_ar||''} onChange={e => set('title_ar', e.target.value)} style={S.inp} /></Field>
                <Field label="نوع الجلسة">
                  <select value={sessionForm.session_type||'talk'} onChange={e => set('session_type', e.target.value)} style={S.inp}>
                    {SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="المتحدث">
                  <select value={sessionForm.speaker_id||''} onChange={e => set('speaker_id', e.target.value)} style={S.inp}>
                    <option value="">— بدون متحدث —</option>
                    {speakers.map((sp: any) => <option key={sp.id} value={sp.id}>{sp.name_ar||sp.name}</option>)}
                  </select>
                </Field>
                <Field label="الترتيب"><input type="number" value={sessionForm.sort_order||0} onChange={e => set('sort_order', +e.target.value)} style={S.inp} /></Field>
                <div style={{ gridColumn: '1/-1' }}>
                  <Field label="الوصف (AR)"><textarea value={sessionForm.description_ar||''} onChange={e => set('description_ar', e.target.value)} rows={2} style={{ ...S.inp, resize: 'vertical' }} /></Field>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <SaveBtn loading={saving} onClick={saveSession} />
                <button style={S.del} onClick={() => setSessionState({ dayId: null, editing: null })}>إلغاء</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(day.sessions || []).map((s: any) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '0.45rem 0.7rem', flexWrap: 'wrap' }}>
                <span style={{ color: '#6C63FF', fontSize: '0.75rem', minWidth: 90 }}>{s.time_start}–{s.time_end}</span>
                <span style={{ background: 'rgba(108,99,255,0.2)', color: '#a78bfa', fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: 4 }}>{s.session_type}</span>
                <span style={{ color: 'white', flex: 1, fontSize: '0.83rem' }}>{s.title_ar}</span>
                {s.speaker_name && <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{s.speaker_name}</span>}
                <button style={S.btn('#1a2744')} onClick={() => { setSessionState({ dayId: day.id, editing: s }); setSessionForm({ ...s, speaker_id: s.speaker_id||'' }); }}>تعديل</button>
                <button style={S.del} onClick={() => delSession(s.id)}>حذف</button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Sponsors ──────────────────────────────────────────────────────────────────
function SponsorsTab({ eventId, token, save, saving, showToast }: any) {
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const blank = { name: '', logo_url: '', website: '', tier: 'silver', sort_order: 0 };
  const [form, setForm] = useState<any>(blank);

  const load = () => { if (token) fetchSponsors(eventId).then((r: any) => setSponsors(r.data || [])).catch(() => {}); };
  useEffect(() => { load(); }, [token]);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const saveItem = () => save(async () => {
    if (editing) await updateSponsor(eventId, editing.id, form, token);
    else         await createSponsor(eventId, form, token);
    setEditing(null); setAdding(false); setForm(blank); load();
  });

  const del = async (id: number) => {
    if (!confirm('حذف الراعي؟')) return;
    try { await deleteSponsor(eventId, id, token); showToast('✅ تم الحذف'); load(); }
    catch (e: any) { showToast('❌ ' + e.message); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white' }}>الرعاة ({sponsors.length})</h1>
        {!adding && <button style={S.btn()} onClick={() => { setAdding(true); setEditing(null); setForm(blank); }}>+ إضافة راعي</button>}
      </div>
      {adding && (
        <div style={{ ...S.card, marginBottom: 16 }}>
          <h3 style={{ color: 'white', marginBottom: 12 }}>{editing ? 'تعديل راعي' : 'إضافة راعي'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="الاسم"><input value={form.name} onChange={e => set('name', e.target.value)} style={S.inp} /></Field>
            <Field label="مستوى الرعاية">
              <select value={form.tier} onChange={e => set('tier', e.target.value)} style={S.inp}>
                {SPONSOR_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="رابط الشعار"><input value={form.logo_url||''} onChange={e => set('logo_url', e.target.value)} style={S.inp} /></Field>
            <Field label="الموقع الإلكتروني"><input value={form.website||''} onChange={e => set('website', e.target.value)} style={S.inp} /></Field>
            <Field label="الترتيب"><input type="number" value={form.sort_order||0} onChange={e => set('sort_order', +e.target.value)} style={S.inp} /></Field>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <SaveBtn loading={saving} onClick={saveItem} />
            <button style={S.del} onClick={() => { setAdding(false); setEditing(null); setForm(blank); }}>إلغاء</button>
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
        {sponsors.map(sp => (
          <div key={sp.id} style={S.card}>
            {sp.logo_url && <img src={sp.logo_url} alt={sp.name} style={{ height: 44, objectFit: 'contain', marginBottom: 8 }} />}
            <div style={{ color: 'white', fontWeight: 700 }}>{sp.name}</div>
            <div style={{ color: '#f59e0b', fontSize: '0.75rem', marginBottom: 4 }}>{sp.tier}</div>
            {sp.website && <a href={sp.website} target="_blank" style={{ color: '#6C63FF', fontSize: '0.72rem' }}>{sp.website}</a>}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button style={S.btn('#1a2744')} onClick={() => { setEditing(sp); setAdding(true); setForm({ ...sp }); }}>تعديل</button>
              <button style={S.del} onClick={() => del(sp.id)}>حذف</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── FAQs ──────────────────────────────────────────────────────────────────────
function FaqsTab({ eventId, token, save, saving, showToast }: any) {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ question_ar: '', answer_ar: '', sort_order: 0 });

  const load = () => { if (token) fetchFaqs(eventId).then((r: any) => setFaqs(r.data || [])).catch(() => {}); };
  useEffect(() => { load(); }, [token]);

  const saveItem = () => save(async () => {
    await createFaq(eventId, form, token);
    setAdding(false); setForm({ question_ar: '', answer_ar: '', sort_order: 0 }); load();
  });

  const del = async (id: number) => {
    if (!confirm('حذف السؤال؟')) return;
    try { await deleteFaq(eventId, id, token); showToast('✅ تم الحذف'); load(); }
    catch (e: any) { showToast('❌ ' + e.message); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white' }}>الأسئلة الشائعة ({faqs.length})</h1>
        {!adding && <button style={S.btn()} onClick={() => setAdding(true)}>+ إضافة سؤال</button>}
      </div>
      {adding && (
        <div style={{ ...S.card, marginBottom: 16 }}>
          <h3 style={{ color: 'white', marginBottom: 12 }}>إضافة سؤال</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Field label="السؤال"><input value={form.question_ar} onChange={e => setForm(f => ({ ...f, question_ar: e.target.value }))} style={S.inp} /></Field>
            <Field label="الجواب"><textarea value={form.answer_ar} onChange={e => setForm(f => ({ ...f, answer_ar: e.target.value }))} rows={3} style={{ ...S.inp, resize: 'vertical' }} /></Field>
            <Field label="الترتيب"><input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: +e.target.value }))} style={{ ...S.inp, width: 100 }} /></Field>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <SaveBtn loading={saving} onClick={saveItem} />
            <button style={S.del} onClick={() => setAdding(false)}>إلغاء</button>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {faqs.map((faq: any, i: number) => (
          <div key={faq.id} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'white', fontWeight: 600, marginBottom: 4 }}>{i + 1}. {faq.question_ar}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6 }}>{faq.answer_ar}</div>
            </div>
            <button style={S.del} onClick={() => del(faq.id)}>حذف</button>
          </div>
        ))}
      </div>
    </div>
  );
}


