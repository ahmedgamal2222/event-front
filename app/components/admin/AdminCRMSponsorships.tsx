'use client';
import { useState, useEffect, useCallback } from 'react';

const S = {
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem', colorScheme: 'dark' } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 } as React.CSSProperties),
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '1rem', padding: '1.25rem' } as React.CSSProperties,
  label: { fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block' } as React.CSSProperties,
};

interface Sponsorship {
  id: number; org_id: number; event_id: number; org_name: string; org_type: string;
  tier?: string; amount?: number; currency: string; status: string; owner?: string;
  notes?: string; event_name: string; website?: string;
}

interface Props { token: string; apiBase: string; eventId?: number; }

const TIER_COLORS: Record<string, string> = {
  platinum: '#e2e8f0', gold: '#f59e0b', silver: '#94a3b8',
  bronze: '#b45309', in_kind: '#8b5cf6', media_partner: '#06b6d4',
};

const STATUS_PIPELINE = [
  { key: 'lead', label: 'عميل محتمل', color: '#6b7280' },
  { key: 'contacted', label: 'تم التواصل', color: '#8b5cf6' },
  { key: 'proposal_sent', label: 'أُرسل العرض', color: '#3b82f6' },
  { key: 'negotiation', label: 'تفاوض', color: '#f59e0b' },
  { key: 'committed', label: 'ملتزم', color: '#06b6d4' },
  { key: 'contract_signed', label: 'عقد موقّع', color: '#10b981' },
  { key: 'paid', label: 'دفع ✓', color: '#10b981' },
  { key: 'declined', label: 'رفض', color: '#ef4444' },
];

export default function AdminCRMSponsorships({ token, apiBase, eventId }: Props) {
  const [items, setItems] = useState<Sponsorship[]>([]);
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Sponsorship | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Sponsorship & { org_name_new: string }>>({});
  const [saving, setSaving] = useState(false);
  const [orgs, setOrgs] = useState<{ id: number; name_ar: string }[]>([]);
  const [statusFilter, setStatusFilter] = useState('');

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const loadOrgs = useCallback(async () => {
    const res = await fetch(`${apiBase}/api/crm/organizations?type=sponsor&limit=200`, { headers });
    const data = await res.json();
    if (data.success) setOrgs(data.data);
  }, [apiBase, token]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (eventId) params.set('event_id', String(eventId));
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`${apiBase}/api/crm/sponsorships?${params}`, { headers });
      const data = await res.json();
      if (data.success) { setItems(data.data); setPipeline(data.pipeline || []); }
    } finally { setLoading(false); }
  }, [apiBase, eventId, statusFilter, token]);

  useEffect(() => { load(); loadOrgs(); }, [load, loadOrgs]);

  const save = async () => {
    setSaving(true);
    try {
      const method = form.id ? 'PUT' : 'POST';
      const url = form.id ? `${apiBase}/api/crm/sponsorships/${form.id}` : `${apiBase}/api/crm/sponsorships`;
      const body = { ...form, event_id: form.event_id || eventId };
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) { setShowForm(false); load(); }
      else alert(data.error);
    } finally { setSaving(false); }
  };

  // Total pipeline value
  const totalValue = pipeline.filter(p => ['committed','contract_signed','paid'].includes(p.status))
    .reduce((acc, p) => acc + (p.total || 0), 0);

  return (
    <div>
      {/* Pipeline Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, marginBottom: 20 }}>
        {STATUS_PIPELINE.map(s => {
          const p = pipeline.find(p => p.status === s.key);
          return (
            <div key={s.key} style={{
              background: '#13102a', borderRadius: '0.75rem', padding: '0.6rem',
              border: `1px solid ${s.color}30`, textAlign: 'center', cursor: 'pointer',
              opacity: statusFilter && statusFilter !== s.key ? 0.5 : 1,
            }} onClick={() => setStatusFilter(statusFilter === s.key ? '' : s.key)}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: s.color }}>{p?.deals || 0}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.65rem', marginBottom: 2 }}>{s.label}</div>
              {p?.total ? <div style={{ color: s.color, fontSize: '0.7rem' }}>${p.total.toFixed(0)}</div> : null}
            </div>
          );
        })}
        <div style={{ background: '#13102a', borderRadius: '0.75rem', padding: '0.6rem', border: '1px solid rgba(16,185,129,0.3)', textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>${totalValue.toFixed(0)}</div>
          <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>محتمل كلي</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button style={S.btn()} onClick={() => { setForm({ event_id: eventId, currency: 'USD', status: 'lead' }); setShowForm(true); setSelected(null); }}>+ رعاية جديدة</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected || showForm ? '1fr 1.2fr' : '1fr', gap: 16 }}>
        {/* List */}
        <div>
          {loading ? <p style={{ color: '#94a3b8', textAlign: 'center' }}>جاري التحميل...</p> : items.map(item => {
            const st = STATUS_PIPELINE.find(s => s.key === item.status) || { label: item.status, color: '#6b7280' };
            return (
              <div
                key={item.id}
                onClick={() => { setSelected(item); setShowForm(false); setForm({ ...item }); }}
                style={{ ...S.card, marginBottom: 8, cursor: 'pointer', borderColor: selected?.id === item.id ? '#6C63FF' : 'rgba(108,99,255,0.15)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ color: 'white', fontWeight: 600 }}>
                      {item.tier && <span style={{ color: TIER_COLORS[item.tier], marginLeft: 6 }}>{item.tier}</span>}
                      {item.org_name}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                      {item.amount ? `$${item.amount}` : 'غير محدد'} · {item.owner || 'غير مسند'}
                    </div>
                  </div>
                  <span style={{ background: st.color + '20', color: st.color, fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, height: 'fit-content' }}>{st.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Form */}
        {showForm && (
          <div style={S.card}>
            <h3 style={{ color: 'white', marginBottom: 16 }}>{form.id ? 'تعديل رعاية' : 'رعاية جديدة'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={S.label}>المنظمة (راعي)</label>
                <select style={S.inp} value={form.org_id || ''} onChange={e => setForm(f => ({ ...f, org_id: parseInt(e.target.value) }))}>
                  <option value="">اختر...</option>
                  {orgs.map(o => <option key={o.id} value={o.id}>{o.name_ar}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>المستوى</label>
                <select style={S.inp} value={form.tier || ''} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}>
                  <option value="">—</option>
                  <option value="platinum">Platinum 💎</option>
                  <option value="gold">Gold 🥇</option>
                  <option value="silver">Silver 🥈</option>
                  <option value="bronze">Bronze 🥉</option>
                  <option value="in_kind">عيني</option>
                  <option value="media_partner">شريك إعلامي</option>
                </select>
              </div>
              <div>
                <label style={S.label}>المبلغ</label>
                <input style={S.inp} type="number" value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) }))} />
              </div>
              <div>
                <label style={S.label}>الحالة</label>
                <select style={S.inp} value={form.status || 'lead'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUS_PIPELINE.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>المسؤول</label>
                <input style={S.inp} value={form.owner || ''} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} />
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={S.label}>ملاحظات</label>
              <textarea style={{ ...S.inp, height: 60, resize: 'vertical' }} value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button style={S.btn()} onClick={save} disabled={saving}>{saving ? 'جاري...' : 'حفظ'}</button>
              <button style={S.btn('#374151')} onClick={() => setShowForm(false)}>إلغاء</button>
            </div>
          </div>
        )}

        {/* Detail */}
        {selected && !showForm && (
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ color: 'white', margin: 0 }}>{selected.org_name}</h3>
                {selected.tier && <span style={{ color: TIER_COLORS[selected.tier], fontSize: '0.85rem' }}>{selected.tier}</span>}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={S.btn('#374151')} onClick={() => { setForm({ ...selected }); setShowForm(true); }}>✏️</button>
                <button style={S.btn('#374151')} onClick={() => setSelected(null)}>✕</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[['المبلغ', selected.amount ? `$${selected.amount}` : '—'], ['المسؤول', selected.owner || '—'], ['الحدث', selected.event_name], ['الحالة', STATUS_PIPELINE.find(s => s.key === selected.status)?.label || selected.status]].map(([k, v]) => (
                <div key={k as string}><div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{k}</div><div style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>{v}</div></div>
              ))}
            </div>
            {selected.notes && <p style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>{selected.notes}</p>}

            {/* Move pipeline */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STATUS_PIPELINE.filter(s => s.key !== selected.status).slice(0, 4).map(s => (
                <button key={s.key} style={{ ...S.btn('#374151'), fontSize: '0.75rem', padding: '4px 8px' }}
                  onClick={async () => {
                    await fetch(`${apiBase}/api/crm/sponsorships/${selected.id}`, { method: 'PUT', headers, body: JSON.stringify({ ...selected, status: s.key }) });
                    setSelected(null); load();
                  }}>→ {s.label}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
