'use client';
// app/components/admin/AdminCRMClassifications.tsx
// تصنيف جميع التسجيلات والمشاركين + إحصاءات احترافية
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchRegistrations } from '@/lib/api';

const REG_TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  startup:  { label: 'شركة ناشئة',  icon: '🚀', color: '#818cf8' },
  general:  { label: 'حضور عام',    icon: '👤', color: '#60a5fa' },
  investor: { label: 'مستثمر',      icon: '💼', color: '#34d399' },
  speaker:  { label: 'متحدث',       icon: '🎙️', color: '#f59e0b' },
  sponsor:  { label: 'راعي',        icon: '🏅', color: '#a78bfa' },
  media:    { label: 'إعلام',       icon: '📹', color: '#f472b6' },
};

const statusMeta: Record<string, { label: string; color: string; icon: string }> = {
  approved:   { label: 'مقبول',          color: '#10b981', icon: '✅' },
  pending:    { label: 'قيد المراجعة',   color: '#f59e0b', icon: '⏳' },
  rejected:   { label: 'مرفوض',          color: '#ef4444', icon: '❌' },
  waitlisted: { label: 'قائمة الانتظار', color: '#3b82f6', icon: '🕒' },
  cancelled:  { label: 'ملغى',           color: '#6b7280', icon: '🚫' },
};

const typeMeta = (key: string) =>
  REG_TYPE_META[key] || { label: key || 'غير محدد', icon: '🏷️', color: '#94a3b8' };

const S = {
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.16)', borderRadius: '0.9rem', padding: '1.1rem' } as React.CSSProperties,
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(108,99,255,0.25)', borderRadius: '0.5rem', padding: '0.5rem 0.8rem', color: 'white', outline: 'none', fontSize: '0.85rem', colorScheme: 'dark' } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.45rem', padding: '0.45rem 0.9rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 } as React.CSSProperties),
  muted: { color: '#94a3b8', fontSize: '0.78rem' } as React.CSSProperties,
};

interface Reg {
  id: number; reg_type?: string; reg_types?: string; status?: string;
  full_name?: string; name?: string; email?: string; phone?: string;
  company_name?: string; sector?: string; city?: string; country?: string;
  created_at?: string;
}

export default function AdminCRMClassifications({ token, eventId }: { token: string; eventId: number }) {
  const [regs, setRegs] = useState<Reg[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openType, setOpenType] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(async () => {
    if (!token || !eventId) return;
    setLoading(true); setError('');
    try {
      const PAGE = 200;
      let offset = 0;
      let all: Reg[] = [];
      let serverTotal = 0;
      for (let i = 0; i < 30; i++) {
        const res = await fetchRegistrations(eventId, token, `limit=${PAGE}&offset=${offset}`);
        const batch: Reg[] = res?.data || [];
        all = all.concat(batch);
        serverTotal = Number(res?.total || 0);
        if (batch.length < PAGE || all.length >= serverTotal) break;
        offset += PAGE;
      }
      setRegs(all);
      setTotal(serverTotal || all.length);
    } catch (e: any) {
      setError(e?.message || 'تعذّر تحميل التسجيلات');
    }
    setLoading(false);
  }, [token, eventId]);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const buckets = new Map<string, {
      key: string; total: number; primary: number; secondary: number;
      approved: number; pending: number; rejected: number; list: Reg[];
    }>();
    const statusCounts: Record<string, number> = {};
    const cities = new Map<string, number>();
    const sectors = new Map<string, number>();
    const orgs = new Set<string>();
    let startups = 0;
    let last7 = 0;
    const now = Date.now();

    for (const r of regs) {
      const primary = (r.reg_type || 'general').trim() || 'general';
      const additional = String(r.reg_types || '').split(',').map(t => t.trim()).filter(Boolean);
      const keys = Array.from(new Set([primary, ...additional]));

      for (const key of keys) {
        if (!buckets.has(key)) buckets.set(key, { key, total: 0, primary: 0, secondary: 0, approved: 0, pending: 0, rejected: 0, list: [] });
        const b = buckets.get(key)!;
        b.total++;
        if (key === primary) b.primary++; else b.secondary++;
        if (r.status === 'approved') b.approved++;
        if (r.status === 'pending') b.pending++;
        if (r.status === 'rejected') b.rejected++;
        b.list.push(r);
      }

      statusCounts[r.status || 'pending'] = (statusCounts[r.status || 'pending'] || 0) + 1;
      if (primary === 'startup') startups++;
      if (r.city) cities.set(r.city, (cities.get(r.city) || 0) + 1);
      if (r.sector) sectors.set(r.sector, (sectors.get(r.sector) || 0) + 1);
      if (r.company_name) orgs.add(r.company_name.trim());
      if (r.created_at) {
        const t = new Date(r.created_at).getTime();
        if (!isNaN(t) && now - t <= 7 * 24 * 3600 * 1000) last7++;
      }
    }

    return {
      buckets: Array.from(buckets.values()).sort((a, b) => b.total - a.total),
      statusCounts,
      approved: statusCounts.approved || 0,
      pending: statusCounts.pending || 0,
      startups,
      last7,
      orgs: orgs.size,
      topCities: Array.from(cities.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6),
      topSectors: Array.from(sectors.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6),
    };
  }, [regs]);

  const filteredForType = (key: string) => {
    const bucket = stats.buckets.find(b => b.key === key);
    if (!bucket) return [];
    const needle = q.trim().toLowerCase();
    return bucket.list.filter(r => {
      if (statusFilter && (r.status || 'pending') !== statusFilter) return false;
      if (!needle) return true;
      return [r.full_name, r.name, r.email, r.company_name, r.city].some(v => String(v || '').toLowerCase().includes(needle));
    });
  };

  const exportCsv = () => {
    const header = ['الاسم', 'البريد', 'الهاتف', 'المؤسسة', 'القطاع', 'المدينة', 'نوع المشاركة', 'أنواع إضافية', 'الحالة', 'تاريخ التسجيل'];
    const rows = regs.map(r => [
      r.full_name || r.name || '', r.email || '', r.phone || '', r.company_name || '',
      r.sector || '', r.city || '', r.reg_type || '', r.reg_types || '',
      statusMeta[r.status || 'pending']?.label || r.status || '',
      r.created_at ? new Date(r.created_at).toLocaleString('ar-EG') : '',
    ]);
    const csv = '\ufeff' + [header, ...rows].map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `registrations-classification-${eventId}.csv`;
    a.click();
  };

  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  const cards = [
    { label: 'إجمالي المسجلين', value: total, icon: '👥', color: '#818cf8' },
    { label: 'الشركات الناشئة', value: stats.startups, icon: '🚀', color: '#a78bfa' },
    { label: 'مقبولون', value: stats.approved, icon: '✅', color: '#10b981' },
    { label: 'قيد المراجعة', value: stats.pending, icon: '⏳', color: '#f59e0b' },
    { label: 'مؤسسات فريدة', value: stats.orgs, icon: '🏢', color: '#60a5fa' },
    { label: 'آخر 7 أيام', value: stats.last7, icon: '📈', color: '#34d399' },
  ];

  return (
    <div style={{ direction: 'rtl', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, color: 'white', fontSize: '1.15rem', fontWeight: 800 }}>📊 تصنيف التسجيلات والمشاركين</h2>
          <p style={{ ...S.muted, margin: '4px 0 0' }}>
            {total} تسجيل — تصنيف تلقائي حسب نوع المشاركة (شركة ناشئة أو أي تصنيف) والحالة
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={S.btn()} onClick={load} disabled={loading}>{loading ? '⏳ جارٍ التحميل...' : '🔄 تحديث'}</button>
          <button style={S.btn('#0f766e')} onClick={exportCsv} disabled={!regs.length}>⬇️ تصدير CSV</button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '0.6rem', padding: '0.75rem', color: '#fca5a5', fontSize: '0.85rem' }}>❌ {error}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(165px,1fr))', gap: '0.75rem' }}>
        {cards.map(c => (
          <div key={c.label} style={{ ...S.card, borderTop: `3px solid ${c.color}`, padding: '0.95rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ ...S.muted, fontSize: '0.76rem' }}>{c.label}</span>
              <span style={{ fontSize: '1.15rem' }}>{c.icon}</span>
            </div>
            <div style={{ color: c.color, fontSize: '1.75rem', fontWeight: 900, lineHeight: 1.3 }}>{c.value}</div>
            <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.07)', marginTop: 4 }}>
              <div style={{ width: `${pct(c.value)}%`, height: '100%', borderRadius: 99, background: c.color, opacity: 0.75 }} />
            </div>
            <div style={{ ...S.muted, fontSize: '0.68rem', marginTop: 3 }}>{pct(c.value)}% من الإجمالي</div>
          </div>
        ))}
      </div>
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ margin: 0, color: '#c7d2fe', fontSize: '0.95rem' }}>🧩 التصنيف حسب نوع المشاركة</h3>
          <span style={S.muted}>اضغط أي تصنيف لعرض المشاركين فيه</span>
        </div>

        {loading ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '1.5rem' }}>جارٍ تحميل التسجيلات...</p>
        ) : stats.buckets.length === 0 ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '1.5rem' }}>لا توجد تسجيلات بعد.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(255px,1fr))', gap: '0.7rem' }}>
            {stats.buckets.map(b => {
              const m = typeMeta(b.key);
              const share = total ? Math.round((b.total / total) * 100) : 0;
              const approvedPct = b.total ? Math.round((b.approved / b.total) * 100) : 0;
              const isOpen = openType === b.key;
              return (
                <button
                  key={b.key}
                  onClick={() => setOpenType(isOpen ? null : b.key)}
                  style={{
                    textAlign: 'right', cursor: 'pointer', fontFamily: 'inherit',
                    background: isOpen ? 'rgba(108,99,255,0.14)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isOpen ? 'rgba(108,99,255,0.55)' : 'rgba(255,255,255,0.09)'}`,
                    borderRadius: '0.7rem', padding: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>
                      <span style={{ marginLeft: 6 }}>{m.icon}</span>{m.label}
                    </span>
                    <span style={{ background: `${m.color}22`, color: m.color, border: `1px solid ${m.color}55`, borderRadius: 99, padding: '1px 10px', fontSize: '0.85rem', fontWeight: 800 }}>{b.total}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 5, flexWrap: 'wrap' }}>
                    <span style={{ ...S.muted, fontSize: '0.7rem' }}>أساسي: {b.primary}</span>
                    {b.secondary > 0 && <span style={{ ...S.muted, fontSize: '0.7rem' }}>إضافي: {b.secondary}</span>}
                    <span style={{ ...S.muted, fontSize: '0.7rem' }}>مقبول: {b.approved}</span>
                    {b.pending > 0 && <span style={{ color: '#fcd34d', fontSize: '0.7rem' }}>معلّق: {b.pending}</span>}
                  </div>

                  <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.07)', marginTop: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${share}%`, height: '100%', background: m.color, borderRadius: 99 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ ...S.muted, fontSize: '0.68rem' }}>{share}% من التسجيلات</span>
                    <span style={{ color: '#34d399', fontSize: '0.68rem' }}>نسبة القبول {approvedPct}%</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '0.75rem' }}>
        <div style={S.card}>
          <h3 style={{ margin: '0 0 0.75rem', color: '#c7d2fe', fontSize: '0.95rem' }}>🚦 توزيع الحالات</h3>
          {Object.entries(statusMeta).map(([key, m]) => {
            const n = stats.statusCounts[key] || 0;
            const share = total ? Math.round((n / total) * 100) : 0;
            return (
              <div key={key} style={{ marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 3 }}>
                  <span style={{ color: '#cbd5e1' }}>{m.icon} {m.label}</span>
                  <span style={{ color: m.color, fontWeight: 700 }}>{n} <span style={{ color: '#64748b', fontWeight: 400 }}>({share}%)</span></span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.07)' }}>
                  <div style={{ width: `${share}%`, height: '100%', borderRadius: 99, background: m.color }} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={S.card}>
          <h3 style={{ margin: '0 0 0.75rem', color: '#c7d2fe', fontSize: '0.95rem' }}>🏙️ أعلى المدن</h3>
          {stats.topCities.length === 0 ? (
            <p style={{ ...S.muted, margin: 0 }}>لا توجد بيانات مدن.</p>
          ) : stats.topCities.map(([city, n]) => {
            const share = total ? Math.round((n / total) * 100) : 0;
            return (
              <div key={city} style={{ marginBottom: '0.55rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 3 }}>
                  <span style={{ color: '#cbd5e1' }}>{city}</span>
                  <span style={{ color: '#60a5fa', fontWeight: 700 }}>{n}</span>
                </div>
                <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.07)' }}>
                  <div style={{ width: `${share}%`, height: '100%', borderRadius: 99, background: '#60a5fa' }} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={S.card}>
          <h3 style={{ margin: '0 0 0.75rem', color: '#c7d2fe', fontSize: '0.95rem' }}>🏭 أعلى القطاعات</h3>
          {stats.topSectors.length === 0 ? (
            <p style={{ ...S.muted, margin: 0 }}>لا توجد بيانات قطاعات.</p>
          ) : stats.topSectors.map(([sector, n]) => {
            const share = total ? Math.round((n / total) * 100) : 0;
            return (
              <div key={sector} style={{ marginBottom: '0.55rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 3 }}>
                  <span style={{ color: '#cbd5e1' }}>{sector}</span>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>{n}</span>
                </div>
                <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.07)' }}>
                  <div style={{ width: `${share}%`, height: '100%', borderRadius: 99, background: '#34d399' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {openType && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, color: 'white', fontSize: '0.98rem' }}>
              {typeMeta(openType).icon} مشاركو «{typeMeta(openType).label}»
              <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: '0.8rem', marginRight: 8 }}>
                ({filteredForType(openType).length} من {stats.buckets.find(b => b.key === openType)?.total || 0})
              </span>
            </h3>
            <button style={S.btn('#374151')} onClick={() => setOpenType(null)}>إغلاق</button>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <input style={{ ...S.inp, minWidth: 220, flex: 1 }} placeholder="🔍 بحث بالاسم / البريد / المؤسسة / المدينة" value={q} onChange={e => setQ(e.target.value)} />
            <select style={S.inp} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">كل الحالات</option>
              {Object.entries(statusMeta).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
            </select>
          </div>

          {filteredForType(openType).length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '1.25rem' }}>لا يوجد مشاركون مطابقون.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ color: '#a5b4fc', textAlign: 'right' }}>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>الاسم</th>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>البريد</th>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>المؤسسة</th>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>المدينة</th>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>النوع</th>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>الحالة</th>
                    <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredForType(openType).map(r => {
                    const st = statusMeta[r.status || 'pending'] || statusMeta.pending;
                    const tm = typeMeta(r.reg_type || 'general');
                    return (
                      <tr key={r.id}>
                        <td style={{ padding: '0.5rem', color: '#e2e8f0', borderBottom: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap' }}>{r.full_name || r.name || '—'}</td>
                        <td style={{ padding: '0.5rem', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.05)', direction: 'ltr', textAlign: 'right' }}>{r.email || '—'}</td>
                        <td style={{ padding: '0.5rem', color: '#cbd5e1', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{r.company_name || '—'}</td>
                        <td style={{ padding: '0.5rem', color: '#cbd5e1', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{r.city || '—'}</td>
                        <td style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap' }}>
                          <span style={{ background: `${tm.color}22`, color: tm.color, border: `1px solid ${tm.color}55`, borderRadius: 99, padding: '1px 8px', fontSize: '0.7rem' }}>
                            {tm.icon} {tm.label}
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap' }}>
                          <span style={{ color: st.color, fontWeight: 700, fontSize: '0.75rem' }}>{st.icon} {st.label}</span>
                        </td>
                        <td style={{ padding: '0.5rem', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap' }}>
                          {r.created_at ? new Date(r.created_at).toLocaleDateString('ar-EG') : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}



    </div>
  );
}

