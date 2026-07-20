'use client';
import { useState, useEffect, useCallback } from 'react';

const S = {
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem', colorScheme: 'dark' } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 } as React.CSSProperties),
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '1rem', padding: '1.25rem' } as React.CSSProperties,
  label: { fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block' } as React.CSSProperties,
};

interface Payment {
  id: number; amount: number; currency: string; method: string;
  sender_name?: string; sender_phone?: string; reference_no?: string;
  match_status: string; status: string; paid_at: string;
  contact_name?: string; contact_phone?: string;
  event_name?: string; seats: number; notes?: string;
}

interface Candidate {
  id: number; full_name: string; phone?: string; email?: string; reg_type: string;
}

interface Props {
  token: string; apiBase: string; eventId?: number;
}

const MATCH_COLORS: Record<string, string> = {
  auto_matched: '#10b981', manual_matched: '#06b6d4',
  unmatched: '#f59e0b', disputed: '#ef4444',
};
const MATCH_LABELS: Record<string, string> = {
  auto_matched: '✅ تلقائي', manual_matched: '🔗 يدوي',
  unmatched: '⏳ معلق', disputed: '⚠️ خلاف',
};

export default function AdminCRMPayments({ token, apiBase, eventId }: Props) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [matchFilter, setMatchFilter] = useState('');
  const [selected, setSelected] = useState<Payment | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ amount: '', currency: 'USD', method: 'sham_cash', sender_name: '', sender_phone: '', reference_no: '', notes: '', seats: '1' });
  const [saving, setSaving] = useState(false);
  const [matching, setMatching] = useState(false);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (eventId) params.set('event_id', String(eventId));
      if (matchFilter) params.set('match_status', matchFilter);
      const res = await fetch(`${apiBase}/api/crm/payments?${params}`, { headers });
      const data = await res.json();
      if (data.success) { setPayments(data.data); setTotal(data.total); }
    } finally { setLoading(false); }
  }, [apiBase, eventId, matchFilter, token]);

  useEffect(() => { load(); }, [load]);

  const loadCandidates = async (id: number) => {
    const res = await fetch(`${apiBase}/api/crm/payments/candidates/${id}`, { headers });
    const data = await res.json();
    if (data.success) setCandidates(data.candidates);
  };

  const openPayment = async (p: Payment) => {
    setSelected(p);
    if (p.match_status === 'unmatched') loadCandidates(p.id);
    else setCandidates([]);
  };

  const addPayment = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/crm/payments`, {
        method: 'POST', headers,
        body: JSON.stringify({ ...form, event_id: eventId, amount: parseFloat(form.amount), seats: parseInt(form.seats) }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAdd(false);
        load();
        alert(data.match_status === 'auto_matched'
          ? `✅ تم التطابق التلقائي مع جهة الاتصال #${data.contact_id}`
          : '⚠️ لم يُطابَق — ستظهر في قائمة المعلقة');
      } else alert(data.error);
    } finally { setSaving(false); }
  };

  const manualMatch = async (contactId: number) => {
    if (!selected) return;
    setMatching(true);
    try {
      const res = await fetch(`${apiBase}/api/crm/payments/${selected.id}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ ...selected, contact_id: contactId, match_status: 'manual_matched', matched_by: 'admin' }),
      });
      const data = await res.json();
      if (data.success) { setSelected(null); load(); }
      else alert(data.error);
    } finally { setMatching(false); }
  };

  const verify = async (id: number) => {
    const p = payments.find(p => p.id === id);
    if (!p) return;
    const res = await fetch(`${apiBase}/api/crm/payments/${id}`, {
      method: 'PUT', headers,
      body: JSON.stringify({ ...p, status: 'verified' }),
    });
    const data = await res.json();
    if (data.success) { setSelected(null); load(); alert('✅ تم التأكيد وتوليد التذاكر'); }
    else alert(data.error);
  };

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <select style={{ ...S.inp, flex: '0 0 160px' }} value={matchFilter} onChange={e => setMatchFilter(e.target.value)}>
          <option value="">كل الدفعات</option>
          <option value="unmatched">⏳ معلقة</option>
          <option value="auto_matched">✅ تلقائية</option>
          <option value="manual_matched">🔗 يدوية</option>
          <option value="disputed">⚠️ خلاف</option>
        </select>
        <button style={S.btn()} onClick={() => { setShowAdd(true); setSelected(null); }}>+ إدخال دفعة</button>
        <div style={{ flex: 1, textAlign: 'right', color: '#94a3b8', fontSize: '0.85rem', alignSelf: 'center' }}>{total} دفعة</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected || showAdd ? '1fr 1.2fr' : '1fr', gap: 16 }}>
        {/* List */}
        <div>
          {loading ? <p style={{ color: '#94a3b8', textAlign: 'center' }}>جاري التحميل...</p> : payments.map(p => (
            <div
              key={p.id}
              onClick={() => openPayment(p)}
              style={{
                ...S.card, marginBottom: 8, cursor: 'pointer',
                borderColor: selected?.id === p.id ? '#6C63FF' : 'rgba(108,99,255,0.15)',
                borderRight: `4px solid ${MATCH_COLORS[p.match_status] || '#374151'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
                    {p.amount} {p.currency} · {p.method === 'sham_cash' ? '📱 شام كاش' : p.method}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                    {p.sender_name || p.contact_name || '—'} {p.sender_phone ? `(${p.sender_phone})` : ''}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '0.72rem' }}>
                    {new Date(p.paid_at).toLocaleDateString('ar-SY')} · {p.seats > 1 ? `${p.seats} مقاعد` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ background: MATCH_COLORS[p.match_status] + '20', color: MATCH_COLORS[p.match_status], fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4 }}>
                    {MATCH_LABELS[p.match_status]}
                  </span>
                  <span style={{ color: p.status === 'verified' ? '#10b981' : '#f59e0b', fontSize: '0.7rem' }}>
                    {p.status === 'verified' ? '✅ مؤكدة' : '⏳ مستلمة'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Payment Form */}
        {showAdd && (
          <div style={S.card}>
            <h3 style={{ color: 'white', marginBottom: 16 }}>💳 إدخال دفعة جديدة</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                ['المبلغ *', 'amount', 'number'], ['عدد المقاعد', 'seats', 'number'],
                ['اسم المرسل', 'sender_name', 'text'], ['هاتف المرسل', 'sender_phone', 'tel'],
                ['رقم العملية', 'reference_no', 'text'],
              ].map(([label, field, type]) => (
                <div key={field as string}>
                  <label style={S.label}>{label}</label>
                  <input style={S.inp} type={type as string}
                    value={(form as any)[field]} onChange={e => setForm(f => ({ ...f, [field as string]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label style={S.label}>وسيلة الدفع</label>
                <select style={S.inp} value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
                  <option value="sham_cash">📱 شام كاش</option>
                  <option value="bank_transfer">🏦 حوالة بنكية</option>
                  <option value="cash">💵 نقداً</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
              <div>
                <label style={S.label}>العملة</label>
                <select style={S.inp} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                  <option value="USD">USD $</option>
                  <option value="SYP">SYP ل.س</option>
                  <option value="TRY">TRY ₺</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={S.label}>ملاحظات</label>
              <input style={S.inp} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button style={S.btn()} onClick={addPayment} disabled={saving || !form.amount}>{saving ? 'جاري...' : 'إدخال الدفعة'}</button>
              <button style={S.btn('#374151')} onClick={() => setShowAdd(false)}>إلغاء</button>
            </div>
          </div>
        )}

        {/* Payment Detail */}
        {selected && !showAdd && (
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ color: 'white', margin: 0 }}>تفاصيل الدفعة #{selected.id}</h3>
              <button style={S.btn('#374151')} onClick={() => setSelected(null)}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                ['المبلغ', `${selected.amount} ${selected.currency}`],
                ['وسيلة الدفع', selected.method],
                ['اسم المرسل', selected.sender_name],
                ['هاتف المرسل', selected.sender_phone],
                ['رقم العملية', selected.reference_no],
                ['مطابق لـ', selected.contact_name || '—'],
                ['المقاعد', selected.seats],
                ['التاريخ', new Date(selected.paid_at).toLocaleDateString('ar-SY')],
              ].filter(([, v]) => v != null).map(([k, v]) => (
                <div key={k as string}>
                  <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{k}</div>
                  <div style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Manual matching */}
            {selected.match_status === 'unmatched' && candidates.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>
                  مرشحون للمطابقة اليدوية
                </div>
                {candidates.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem', marginBottom: 6 }}>
                    <div>
                      <div style={{ color: 'white', fontSize: '0.85rem' }}>{c.full_name}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{c.phone || c.email}</div>
                    </div>
                    <button style={S.btn('#06b6d4')} onClick={() => manualMatch(c.id)} disabled={matching}>ربط</button>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {selected.status !== 'verified' && selected.match_status !== 'unmatched' && (
                <button style={S.btn('#10b981')} onClick={() => verify(selected.id)}>✅ تأكيد وتوليد تذاكر</button>
              )}
              {selected.match_status === 'unmatched' && candidates.length === 0 && (
                <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>لا مرشحين — تحقق يدوياً أو ابحث بالاسم</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
