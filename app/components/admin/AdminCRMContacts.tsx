'use client';
import { useState, useEffect, useCallback } from 'react';

const S = {
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem', colorScheme: 'dark' } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 } as React.CSSProperties),
  del: { background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440', borderRadius: '0.4rem', padding: '0.35rem 0.7rem', cursor: 'pointer', fontSize: '0.8rem' } as React.CSSProperties,
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '1rem', padding: '1.25rem' } as React.CSSProperties,
  label: { fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block' } as React.CSSProperties,
};

interface Contact {
  id: number; full_name: string; email?: string; phone?: string; city?: string;
  org_name?: string; org_type?: string; is_vip: number; source: string;
  reg_count?: number; payment_count?: number; created_at: string;
}

interface ContactDetail extends Contact {
  whatsapp?: string; role_in_org?: string; notes?: string;
  org_id?: number; org_name_en?: string; org_type?: string;
  sector?: string; stage?: string; team_size?: string; website?: string;
  problem_statement?: string; execution_stage?: string; revenue_model?: string;
  scalability_note?: string; local_fit_note?: string; open_notes?: string;
}

interface TimelineEntry {
  record_type: string; detail: string; status: string; at_time: string; record_id: number;
}

interface Props {
  token: string;
  apiBase: string;
}

export default function AdminCRMContacts({ token, apiBase }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ContactDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<ContactDetail>>({});
  const [saving, setSaving] = useState(false);
  const [showInteraction, setShowInteraction] = useState(false);
  const [interaction, setInteraction] = useState({ channel: 'call', direction: 'outbound', subject: '', summary: '', logged_by: '' });

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/crm/contacts?page=${page}&search=${encodeURIComponent(search)}&limit=30`, { headers });
      const data = await res.json();
      if (data.success) { setContacts(data.data); setTotal(data.total); }
    } finally { setLoading(false); }
  }, [page, search, apiBase, token]);

  useEffect(() => { load(); }, [load]);

  const openContact = async (id: number) => {
    const res = await fetch(`${apiBase}/api/crm/contacts/${id}`, { headers });
    const data = await res.json();
    if (data.success) {
      setSelected(data.data);
      setTimeline(data.timeline || []);
      setAiSummary(data.ai_summary || null);
      setShowForm(false);
    }
  };

  const saveContact = async () => {
    setSaving(true);
    try {
      const method = form.id ? 'PUT' : 'POST';
      const url = form.id ? `${apiBase}/api/crm/contacts/${form.id}` : `${apiBase}/api/crm/contacts`;
      const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { setShowForm(false); load(); }
      else alert(data.error);
    } finally { setSaving(false); }
  };

  const logInteraction = async () => {
    if (!selected || !interaction.logged_by) return alert('أدخل اسمك أولاً');
    const res = await fetch(`${apiBase}/api/crm/interactions`, {
      method: 'POST', headers,
      body: JSON.stringify({ ...interaction, contact_id: selected.id }),
    });
    const data = await res.json();
    if (data.success) { setShowInteraction(false); openContact(selected.id); }
    else alert(data.error);
  };

  const statusColors: Record<string, string> = {
    pending: '#f59e0b', accepted: '#10b981', rejected: '#ef4444',
    screening_call: '#8b5cf6', cancelled: '#6b7280',
    verified: '#10b981', received: '#f59e0b', open: '#3b82f6', done: '#10b981',
  };

  const typeLabel: Record<string, string> = {
    registration: '📋 تسجيل', payment: '💳 دفعة',
    interaction: '💬 تواصل', task: '✅ مهمة',
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.5fr' : '1fr', gap: '1.25rem' }}>
      {/* Left: Contacts List */}
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            style={{ ...S.inp, flex: 1 }}
            placeholder="🔍 بحث بالاسم أو البريد أو الهاتف..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <button style={S.btn()} onClick={() => { setForm({}); setShowForm(true); setSelected(null); }}>+ جهة اتصال</button>
        </div>

        {loading ? <p style={{ color: '#94a3b8', textAlign: 'center' }}>جاري التحميل...</p> : (
          <>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 8 }}>
              {total} جهة اتصال
            </div>
            {contacts.map(c => (
              <div
                key={c.id}
                onClick={() => openContact(c.id)}
                style={{
                  ...S.card, marginBottom: 8, cursor: 'pointer',
                  borderColor: selected?.id === c.id ? '#6C63FF' : 'rgba(108,99,255,0.15)',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6C63FF, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', flexShrink: 0,
                }}>
                  {c.full_name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'white', fontSize: '0.9rem' }}>
                    {c.full_name} {c.is_vip ? '⭐' : ''}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.org_name ? `🏢 ${c.org_name}` : c.email || c.phone || ''}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    {c.reg_count ? <span style={{ fontSize: '0.7rem', background: 'rgba(108,99,255,0.2)', color: '#818cf8', padding: '1px 6px', borderRadius: 4 }}>{c.reg_count} تسجيل</span> : null}
                    {c.payment_count ? <span style={{ fontSize: '0.7rem', background: 'rgba(16,185,129,0.2)', color: '#34d399', padding: '1px 6px', borderRadius: 4 }}>دفع ✓</span> : null}
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
              <button style={S.btn('#374151')} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>السابق</button>
              <span style={{ color: '#94a3b8', alignSelf: 'center', fontSize: '0.85rem' }}>صفحة {page}</span>
              <button style={S.btn('#374151')} disabled={contacts.length < 30} onClick={() => setPage(p => p + 1)}>التالي</button>
            </div>
          </>
        )}
      </div>

      {/* Right: Contact Detail / Form */}
      {showForm ? (
        <div style={S.card}>
          <h3 style={{ color: 'white', marginBottom: 16 }}>{form.id ? 'تعديل جهة الاتصال' : 'جهة اتصال جديدة'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['الاسم الكامل *', 'full_name', 'text'],
              ['البريد الإلكتروني', 'email', 'email'],
              ['رقم الهاتف (+963...)', 'phone', 'tel'],
              ['واتساب', 'whatsapp', 'tel'],
              ['المدينة', 'city', 'text'],
              ['صفة في المنظمة', 'role_in_org', 'text'],
            ].map(([label, field, type]) => (
              <div key={field}>
                <label style={S.label}>{label}</label>
                <input
                  style={S.inp} type={type as string}
                  value={(form as any)[field] || ''}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                />
              </div>
            ))}
            <div>
              <label style={S.label}>VIP؟</label>
              <select style={S.inp} value={form.is_vip ? '1' : '0'} onChange={e => setForm(f => ({ ...f, is_vip: parseInt(e.target.value) }))}>
                <option value="0">لا</option>
                <option value="1">نعم ⭐</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={S.label}>ملاحظات</label>
            <textarea style={{ ...S.inp, height: 80, resize: 'vertical' }}
              value={form.notes || ''}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button style={S.btn()} onClick={saveContact} disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ'}</button>
            <button style={S.btn('#374151')} onClick={() => setShowForm(false)}>إلغاء</button>
          </div>
        </div>
      ) : selected ? (
        <div style={S.card}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6C63FF, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem',
              }}>
                {selected.full_name[0]}
              </div>
              <div>
                <h3 style={{ color: 'white', margin: 0 }}>{selected.full_name} {selected.is_vip ? '⭐' : ''}</h3>
                <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.8rem' }}>{selected.org_name || selected.email || selected.phone}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={S.btn('#374151')} onClick={() => { setForm({ ...selected }); setShowForm(true); }}>✏️</button>
              <button style={S.btn()} onClick={() => setShowInteraction(true)}>+ تواصل</button>
              <button style={S.btn('#374151')} onClick={() => setSelected(null)}>✕</button>
            </div>
          </div>

          {/* AI Summary */}
          {aiSummary && (
            <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '0.75rem', padding: '0.75rem', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#a78bfa', fontSize: '0.8rem', fontWeight: 600 }}>🤖 ملخص AI</span>
                {aiSummary.score && <span style={{ color: '#a78bfa', fontSize: '0.8rem' }}>درجة: {aiSummary.score}/100 — {aiSummary.verdict}</span>}
              </div>
              <p style={{ color: '#e2e8f0', fontSize: '0.85rem', margin: 0 }}>{aiSummary.summary}</p>
            </div>
          )}

          {/* Contact Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              ['📧', selected.email], ['📱', selected.phone], ['💬', selected.whatsapp],
              ['📍', selected.city], ['🏢', selected.org_name], ['👤', selected.role_in_org],
            ].filter(([, v]) => v).map(([icon, value], i) => (
              <div key={i} style={{ color: '#cbd5e1', fontSize: '0.82rem' }}><span style={{ opacity: 0.6 }}>{icon} </span>{value}</div>
            ))}
          </div>

          {/* Org Details (startup) */}
          {selected.problem_statement && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>معلومات الشركة</div>
              <div style={{ display: 'grid', gap: 6 }}>
                {[
                  ['المشكلة', selected.problem_statement],
                  ['مرحلة التنفيذ', selected.execution_stage],
                  ['نموذج الإيراد', selected.revenue_model],
                  ['قابلية التوسع', selected.scalability_note],
                  ['ملاءمة السوق', selected.local_fit_note],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label as string} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '0.4rem', padding: '6px 10px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{label}: </span>
                    <span style={{ color: '#e2e8f0', fontSize: '0.82rem' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline 360° */}
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              الخط الزمني 360°
            </div>
            {timeline.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '0.85rem', textAlign: 'center' }}>لا توجد سجلات بعد</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
                {timeline.map((entry, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 10, padding: '8px 10px',
                    background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem',
                    borderRight: `3px solid ${statusColors[entry.status] || '#374151'}`,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#e2e8f0', fontSize: '0.82rem' }}>
                        {typeLabel[entry.record_type] || entry.record_type}: {entry.detail}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '0.72rem', marginTop: 2 }}>
                        {entry.status} · {new Date(entry.at_time).toLocaleDateString('ar-SY')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Log Interaction Modal */}
          {showInteraction && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            }}>
              <div style={{ ...S.card, width: 480, maxWidth: '95vw' }}>
                <h3 style={{ color: 'white', marginBottom: 16 }}>📝 تسجيل تواصل</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={S.label}>قناة التواصل</label>
                    <select style={S.inp} value={interaction.channel} onChange={e => setInteraction(i => ({ ...i, channel: e.target.value }))}>
                      <option value="call">📞 مكالمة</option>
                      <option value="whatsapp">💬 واتساب</option>
                      <option value="email">📧 بريد</option>
                      <option value="meeting">🤝 اجتماع</option>
                      <option value="linkedin">🔗 LinkedIn</option>
                      <option value="other">أخرى</option>
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>الاتجاه</label>
                    <select style={S.inp} value={interaction.direction} onChange={e => setInteraction(i => ({ ...i, direction: e.target.value }))}>
                      <option value="outbound">صادر (نحن اتصلنا)</option>
                      <option value="inbound">وارد (اتصل بنا)</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={S.label}>الموضوع</label>
                    <input style={S.inp} value={interaction.subject} onChange={e => setInteraction(i => ({ ...i, subject: e.target.value }))} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={S.label}>الملخص</label>
                    <textarea style={{ ...S.inp, height: 80, resize: 'vertical' }}
                      value={interaction.summary} onChange={e => setInteraction(i => ({ ...i, summary: e.target.value }))} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={S.label}>سجّله (اسمك) *</label>
                    <input style={S.inp} value={interaction.logged_by} onChange={e => setInteraction(i => ({ ...i, logged_by: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button style={S.btn()} onClick={logInteraction}>حفظ التواصل</button>
                  <button style={S.btn('#374151')} onClick={() => setShowInteraction(false)}>إلغاء</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
