'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchRegistrations, updateRegistration, fetchStats } from '../../../lib/api';
import { Registration, Stats } from '../../../lib/types';

function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : ''; }

const STATUS_STYLES: Record<string, { bg: string; label: string }> = {
  pending:    { bg: '#f59e0b', label: 'قيد الانتظار' },
  approved:   { bg: '#10b981', label: 'مقبول' },
  rejected:   { bg: '#ef4444', label: 'مرفوض' },
  waitlisted: { bg: '#8b5cf6', label: 'قائمة الانتظار' },
  cancelled:  { bg: '#6b7280', label: 'ملغى' },
};

const TYPE_LABELS: Record<string, string> = {
  startup: '🚀 ناشئة',
  general: '👤 عام',
  investor: '💼 مستثمر',
  speaker: '🎙️ متحدث',
  sponsor: '🏅 راعي',
  media: '📹 إعلام',
};

export default function AdminDashboard() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [eventId, setEventId] = useState(1);
  const [stats, setStats] = useState<Stats | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Registration | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'registrations'>('overview');
  const limit = 20;

  useEffect(() => {
    const t = getToken();
    if (!t) { router.replace('/admin'); return; }
    setToken(t);
  }, []);

  const loadStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetchStats(eventId);
      setStats(res.data);
    } catch {}
  }, [token, eventId]);

  const loadRegistrations = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterType) params.set('type', filterType);
      if (search) params.set('search', search);
      params.set('limit', String(limit));
      params.set('offset', String(page * limit));

      const res = await fetchRegistrations(eventId, token, params.toString());
      setRegistrations(res.data || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      if (err.message?.includes('Unauthorized')) { router.replace('/admin'); }
    }
    setLoading(false);
  }, [token, eventId, filterStatus, filterType, search, page]);

  useEffect(() => { if (token) { loadStats(); loadRegistrations(); } }, [token, loadStats, loadRegistrations]);

  const handleStatusChange = async (regId: number, status: string) => {
    try {
      await updateRegistration(eventId, regId, { status }, token);
      loadRegistrations();
      loadStats();
      if (selected?.id === regId) setSelected(s => s ? { ...s, status } : null);
    } catch {}
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    router.replace('/admin');
  };

  return (
    <div className="min-h-screen" style={{ background: '#0d0b1a' }}>
      {/* Top bar */}
      <nav className="glass sticky top-0 z-40" style={{ borderBottom: '1px solid rgba(108,99,255,0.2)' }}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-black text-white"><span style={{ color: '#6C63FF' }}>S3</span> Admin</span>
            <div className="flex gap-1">
              {(['overview', 'registrations'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab ? 'text-white' : 'text-[var(--text-muted)]'}`}
                  style={{ background: activeTab === tab ? 'rgba(108,99,255,0.3)' : 'transparent' }}>
                  {tab === 'overview' ? 'نظرة عامة' : 'التسجيلات'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/s3-summit-2026" target="_blank" className="text-xs text-[var(--text-muted)] hover:text-white transition-colors">عرض الموقع ↗</a>
            <button onClick={logout} className="text-xs text-red-400 hover:text-red-300 transition-colors">خروج</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ── Overview Tab ────────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-white">لوحة التحكم</h1>

            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: stats?.total_registrations || 0, label: 'إجمالي التسجيلات', color: '#6C63FF', icon: '📋' },
                { value: stats?.approved_count || 0, label: 'المقبولون', color: '#10b981', icon: '✅' },
                { value: stats?.startup_count || 0, label: 'شركات ناشئة', color: '#f59e0b', icon: '🚀' },
                { value: stats?.speaker_count || 0, label: 'المتحدثون', color: '#8b5cf6', icon: '🎙️' },
              ].map(({ value, label, color, icon }) => (
                <div key={label} className="card">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-2xl">{icon}</span>
                    <span className="text-xs text-[var(--text-muted)]">إجمالي</span>
                  </div>
                  <div className="text-3xl font-black mb-1" style={{ color }}>{value}</div>
                  <div className="text-sm text-[var(--text-muted)]">{label}</div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="card">
              <h3 className="text-white font-semibold mb-4">إجراءات سريعة</h3>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => setActiveTab('registrations')} className="btn-primary text-sm py-2 px-4">
                  عرض التسجيلات
                </button>
                <a href="/s3-summit-2026" target="_blank" className="btn-outline text-sm py-2 px-4">
                  معاينة الموقع
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── Registrations Tab ───────────────────────────────────────────────── */}
        {activeTab === 'registrations' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-2xl font-bold text-white">التسجيلات <span className="text-[var(--text-muted)] text-lg font-normal">({total})</span></h1>
            </div>

            {/* Filters */}
            <div className="card flex flex-wrap gap-3">
              <input className="input-field max-w-xs" placeholder="بحث بالاسم أو البريد..." value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }} />
              <select className="input-field max-w-xs" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0); }}>
                <option value="">جميع الحالات</option>
                {Object.entries(STATUS_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select className="input-field max-w-xs" value={filterType} onChange={e => { setFilterType(e.target.value); setPage(0); }}>
                <option value="">جميع الأنواع</option>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            {/* Table */}
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {['الاسم', 'البريد', 'النوع', 'المدينة', 'الحالة', 'التاريخ', 'إجراء'].map(h => (
                        <th key={h} className="text-right px-4 py-3 text-xs text-[var(--text-muted)] font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} className="text-center py-8 text-[var(--text-muted)]">جار التحميل...</td></tr>
                    ) : registrations.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-8 text-[var(--text-muted)]">لا توجد تسجيلات</td></tr>
                    ) : registrations.map(reg => {
                      const statusStyle = STATUS_STYLES[reg.status] || STATUS_STYLES.pending;
                      return (
                        <tr key={reg.id} className="border-t cursor-pointer hover:bg-white/5 transition-colors"
                            style={{ borderColor: 'rgba(255,255,255,0.03)' }}
                            onClick={() => setSelected(reg)}>
                          <td className="px-4 py-3 text-white font-medium">{reg.full_name}</td>
                          <td className="px-4 py-3 text-[var(--text-muted)]">{reg.email}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs">{TYPE_LABELS[reg.reg_type] || reg.reg_type}</span>
                          </td>
                          <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{reg.city || '—'}</td>
                          <td className="px-4 py-3">
                            <span className="tag text-xs" style={{ background: statusStyle.bg + '20', color: statusStyle.bg }}>
                              {statusStyle.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[var(--text-muted)] text-xs">
                            {new Date(reg.created_at).toLocaleDateString('ar')}
                          </td>
                          <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                            <select className="text-xs rounded px-2 py-1 outline-none cursor-pointer"
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                              value={reg.status}
                              onChange={e => handleStatusChange(reg.id, e.target.value)}>
                              {Object.entries(STATUS_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {total > limit && (
                <div className="flex justify-between items-center px-4 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <span className="text-xs text-[var(--text-muted)]">
                    عرض {page * limit + 1} – {Math.min((page + 1) * limit, total)} من {total}
                  </span>
                  <div className="flex gap-2">
                    <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                      className="px-3 py-1 text-xs rounded disabled:opacity-40"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                      السابق
                    </button>
                    <button disabled={(page + 1) * limit >= total} onClick={() => setPage(p => p + 1)}
                      className="px-3 py-1 text-xs rounded disabled:opacity-40"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                      التالي
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Detail modal ──────────────────────────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6 space-y-4"
               style={{ background: '#13102a', border: '1px solid rgba(108,99,255,0.3)' }}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-white">{selected.full_name}</h3>
                <p className="text-sm text-[var(--text-muted)]">{selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-[var(--text-muted)] hover:text-white text-2xl leading-none">×</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['النوع', TYPE_LABELS[selected.reg_type] || selected.reg_type],
                ['الهاتف', selected.phone || '—'],
                ['المدينة', selected.city || '—'],
                ['كود التذكرة', selected.ticket_code],
                ['الشركة', selected.company_name || '—'],
                ['القطاع', selected.sector || '—'],
                ['المرحلة', selected.stage || '—'],
                ['حجم الفريق', selected.team_size || '—'],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-xs text-[var(--text-muted)]">{k}</div>
                  <div className="text-white">{v}</div>
                </div>
              ))}
            </div>

            {selected.description && (
              <div className="p-3 rounded-lg text-sm text-[var(--text-muted)]" style={{ background: 'rgba(255,255,255,0.03)' }}>
                {selected.description}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => handleStatusChange(selected.id, 'approved')}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{ background: '#10b98120', color: '#10b981', border: '1px solid #10b98140' }}>
                ✅ قبول
              </button>
              <button onClick={() => handleStatusChange(selected.id, 'rejected')}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{ background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440' }}>
                ❌ رفض
              </button>
              <button onClick={() => handleStatusChange(selected.id, 'waitlisted')}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{ background: '#8b5cf620', color: '#8b5cf6', border: '1px solid #8b5cf640' }}>
                🔁 انتظار
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
