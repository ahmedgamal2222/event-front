'use client';
import { useState, useEffect, useCallback } from 'react';

const S = {
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem', colorScheme: 'dark' } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 } as React.CSSProperties),
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '1rem', padding: '1.25rem' } as React.CSSProperties,
  label: { fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block' } as React.CSSProperties,
};

interface Registration {
  id: number; event_id: number; contact_id: number; reg_type: string; status: string;
  full_name: string; email?: string; phone?: string; city?: string;
  org_name?: string; sector?: string; stage?: string;
  ai_score?: number; ai_verdict?: string; ai_summary?: string;
  screening_notes?: string; screening_attempts: number;
  registered_at: string; reviewed_by?: string;
  motivation?: string; interest_field?: string;
}

interface Props {
  token: string;
  apiBase: string;
  eventId: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:        { label: 'قيد الانتظار',      color: '#f59e0b' },
  screening_call: { label: 'قيد الاستعلام',    color: '#8b5cf6' },
  accepted:       { label: 'مقبول',             color: '#10b981' },
  rejected:       { label: 'مرفوض',             color: '#ef4444' },
  cancelled:      { label: 'ملغى',              color: '#6b7280' },
  checked_in:     { label: 'حضر فعلاً',         color: '#06b6d4' },
  no_show:        { label: 'لم يحضر',           color: '#f97316' },
};

const VERDICT_CONFIG: Record<string, { label: string; color: string }> = {
  promising:    { label: '🌟 واعد',      color: '#10b981' },
  average:      { label: '📊 متوسط',     color: '#f59e0b' },
  weak:         { label: '⚠️ ضعيف',     color: '#ef4444' },
  out_of_scope: { label: '❌ خارج النطاق', color: '#6b7280' },
};

export default function AdminCRMRegistrations({ token, apiBase, eventId }: Props) {
  const [regs, setRegs] = useState<Registration[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Registration | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  const [decision, setDecision] = useState({ status: '', screening_notes: '', reviewed_by: '', status_reason: '' });

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const loadStats = useCallback(async () => {
    const res = await fetch(`${apiBase}/api/crm/registrations/stats/${eventId}`, { headers });
    const data = await res.json();
    if (data.success) setStats(data.data);
  }, [apiBase, eventId, token]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        event_id: String(eventId), page: String(page),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
      });
      const res = await fetch(`${apiBase}/api/crm/registrations?${params}`, { headers });
      const data = await res.json();
      if (data.success) { setRegs(data.data); setTotal(data.total); }
    } finally { setLoading(false); }
  }, [apiBase, eventId, page, search, statusFilter, typeFilter, token]);

  useEffect(() => { load(); loadStats(); }, [load, loadStats]);

  const update = async () => {
    if (!selected) return;
    setUpdating(true);
    try {
      const body = {
        status: decision.status || selected.status,
        screening_notes: decision.screening_notes || selected.screening_notes,
        reviewed_by: decision.reviewed_by || selected.reviewed_by,
        status_reason: decision.status_reason,
        screening_attempts: selected.screening_attempts,
      };
      const res = await fetch(`${apiBase}/api/crm/registrations/${selected.id}`, {
        method: 'PUT', headers, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) { setSelected(null); load(); loadStats(); }
      else alert(data.error);
    } finally { setUpdating(false); }
  };

  const incrementAttempts = async () => {
    if (!selected) return;
    const body = { screening_attempts: selected.screening_attempts + 1, status: 'screening_call' };
    await fetch(`${apiBase}/api/crm/registrations/${selected.id}`, { method: 'PUT', headers, body: JSON.stringify(body) });
    setSelected({ ...selected, screening_attempts: selected.screening_attempts + 1 });
    load();
  };

  return (
    <div>
      {/* Stats Bar */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'قيد الانتظار', value: stats.pending, color: '#f59e0b' },
            { label: 'قيد الاستعلام', value: stats.screening, color: '#8b5cf6' },
            { label: 'مقبولون', value: stats.accepted, color: '#10b981' },
            { label: 'شركات ناشئة', value: stats.startups, color: '#06b6d4' },
            { label: 'دفعات معلقة', value: stats.unmatched_payments, color: '#f97316' },
            { label: 'إيرادات $', value: `$${stats.revenue_usd?.toFixed(0) || 0}`, color: '#10b981' },
            { label: 'مصعّدات', value: stats.escalated, color: '#ef4444' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '0.75rem', padding: '0.75rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          style={{ ...S.inp, flex: '1 1 200px' }}
          placeholder="🔍 بحث..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <select style={{ ...S.inp, flex: '0 0 140px' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">كل الحالات</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select style={{ ...S.inp, flex: '0 0 130px' }} value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="">كل الأنواع</option>
          <option value="general">عام</option>
          <option value="startup">شركة ناشئة</option>
          <option value="speaker">متحدث</option>
          <option value="vip">VIP</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 16 }}>
        {/* List */}
        <div>
          {loading ? <p style={{ color: '#94a3b8', textAlign: 'center' }}>جاري التحميل...</p> : (
            <>
              <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 8 }}>{total} طلب</div>
              {regs.map(r => {
                const sc = STATUS_CONFIG[r.status] || { label: r.status, color: '#6b7280' };
                const vc = r.ai_verdict ? VERDICT_CONFIG[r.ai_verdict] : null;
                return (
                  <div
                    key={r.id}
                    onClick={() => { setSelected(r); setDecision({ status: r.status, screening_notes: r.screening_notes || '', reviewed_by: '', status_reason: '' }); }}
                    style={{
                      ...S.card, marginBottom: 8, cursor: 'pointer',
                      borderColor: selected?.id === r.id ? '#6C63FF' : 'rgba(108,99,255,0.15)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>{r.full_name}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{r.org_name || r.email || r.phone}</div>
                        {r.city && <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>📍 {r.city}</div>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <span style={{ background: sc.color + '20', color: sc.color, fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4 }}>{sc.label}</span>
                        {vc && <span style={{ background: vc.color + '20', color: vc.color, fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4 }}>{vc.label}</span>}
                        {r.ai_score != null && <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>AI: {r.ai_score}/100</span>}
                      </div>
                    </div>
                    {r.ai_summary && (
                      <div style={{ marginTop: 6, color: '#94a3b8', fontSize: '0.78rem', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6 }}>
                        {r.ai_summary}
                      </div>
                    )}
                  </div>
                );
              })}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
                <button style={S.btn('#374151')} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>السابق</button>
                <span style={{ color: '#94a3b8', alignSelf: 'center' }}>صفحة {page}</span>
                <button style={S.btn('#374151')} disabled={regs.length < 50} onClick={() => setPage(p => p + 1)}>التالي</button>
              </div>
            </>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ color: 'white', margin: 0 }}>{selected.full_name}</h3>
              <button style={S.btn('#374151')} onClick={() => setSelected(null)}>✕</button>
            </div>

            {/* Info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {[
                ['📧', selected.email], ['📱', selected.phone], ['📍', selected.city],
                ['🏢', selected.org_name], ['🏭', selected.sector], ['📈', selected.stage],
              ].filter(([, v]) => v).map(([icon, value], i) => (
                <div key={i} style={{ color: '#cbd5e1', fontSize: '0.82rem' }}><span style={{ opacity: 0.6 }}>{icon} </span>{value}</div>
              ))}
            </div>

            {/* Startup fields */}
            {selected.reg_type === 'startup' && (selected as any).problem_statement && (
              <div style={{ marginBottom: 16, background: 'rgba(108,99,255,0.08)', borderRadius: '0.5rem', padding: '0.75rem' }}>
                <div style={{ color: '#818cf8', fontSize: '0.75rem', fontWeight: 600, marginBottom: 8 }}>📊 تقييم الشركة</div>
                {[
                  ['المشكلة', (selected as any).problem_statement],
                  ['نموذج الإيراد', (selected as any).revenue_model],
                  ['التوسع', (selected as any).scalability_note],
                  ['ملاءمة السوق', (selected as any).local_fit_note],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k as string} style={{ marginBottom: 6 }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{k}: </span>
                    <span style={{ color: '#e2e8f0', fontSize: '0.82rem' }}>{v}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Motivation */}
            {selected.motivation && (
              <div style={{ marginBottom: 16, color: '#cbd5e1', fontSize: '0.82rem' }}>
                <span style={{ color: '#94a3b8' }}>الدافع: </span>{selected.motivation}
              </div>
            )}

            {/* Decision Panel */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase' }}>قرار المراجعة</div>

              <div style={{ display: 'grid', gap: 10 }}>
                <div>
                  <label style={S.label}>تغيير الحالة</label>
                  <select style={S.inp} value={decision.status} onChange={e => setDecision(d => ({ ...d, status: e.target.value }))}>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>ملاحظات الاستعلام الهاتفي</label>
                  <textarea style={{ ...S.inp, height: 80, resize: 'vertical' }}
                    value={decision.screening_notes}
                    onChange={e => setDecision(d => ({ ...d, screening_notes: e.target.value }))}
                    placeholder="خلاصة المكالمة..."
                  />
                </div>
                <div>
                  <label style={S.label}>سبب القرار (اختياري)</label>
                  <input style={S.inp} value={decision.status_reason}
                    onChange={e => setDecision(d => ({ ...d, status_reason: e.target.value }))} />
                </div>
                <div>
                  <label style={S.label}>راجعه (اسمك)</label>
                  <input style={S.inp} value={decision.reviewed_by}
                    onChange={e => setDecision(d => ({ ...d, reviewed_by: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <button style={S.btn('#10b981')} onClick={() => { setDecision(d => ({ ...d, status: 'accepted' })); setTimeout(update, 100); }}>✅ قبول</button>
                <button style={S.btn('#8b5cf6')} onClick={() => { setDecision(d => ({ ...d, status: 'screening_call' })); setTimeout(update, 100); }}>📞 استعلام</button>
                <button style={S.btn('#ef4444')} onClick={() => { setDecision(d => ({ ...d, status: 'rejected' })); setTimeout(update, 100); }}>❌ رفض</button>
                {selected.status === 'screening_call' && (
                  <button style={S.btn('#f97316')} onClick={incrementAttempts}>
                    محاولة لا رد ({selected.screening_attempts})
                  </button>
                )}
                <button style={S.btn()} onClick={update} disabled={updating}>{updating ? 'جاري الحفظ...' : 'حفظ التغيير'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
