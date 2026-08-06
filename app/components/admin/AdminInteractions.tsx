'use client';
/**
 * AdminInteractions — سجل احترافي مجمّع حسب الأشخاص
 * كل شخص له بطاقة واحدة تعرض جميع تواصلاته
 */
import { useState, useEffect, useCallback } from 'react';

const S = {
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem', colorScheme: 'dark' } as React.CSSProperties,
  ta: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.85rem', colorScheme: 'dark', resize: 'vertical' as const, minHeight: 80 } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s' } as React.CSSProperties),
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '1rem', padding: '1.25rem' } as React.CSSProperties,
  label: { fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block' } as React.CSSProperties,
};

const CHANNEL_ICONS: Record<string, string> = {
  call: '📞', whatsapp: '💬', email: '📧', meeting: '🤝', sms: '📱', other: '🔔',
};
const CHANNEL_LABELS: Record<string, string> = {
  call: 'مكالمة', whatsapp: 'واتساب', email: 'بريد', meeting: 'اجتماع', sms: 'رسالة نصية', other: 'أخرى',
};
const DIR_COLOR: Record<string, string> = { outbound: '#10b981', inbound: '#3b82f6' };
const DIR_LABEL: Record<string, string> = { outbound: '↗ صادر', inbound: '↙ وارد' };

interface Interaction {
  id: number; contact_id?: number; contact_name?: string; contact_email?: string;
  contact_phone?: string; contact_org?: string;
  registration_id?: number; reg_type?: string; reg_status?: string;
  event_id?: number; event_name_ar?: string;
  channel: string; direction: string; subject: string; summary?: string;
  logged_by?: string; created_at: string;
}

interface PersonGroup {
  key: string;
  name: string;
  email?: string;
  phone?: string;
  org?: string;
  contact_id?: number;
  interactions: Interaction[];
  stats: {
    total: number;
    calls: number;
    meetings: number;
    emails: number;
    whatsapp: number;
    outbound: number;
    inbound: number;
  };
  lastInteraction: Interaction;
}

interface Props { token: string; apiBase: string; eventId: number; readOnly?: boolean; }

const BLANK = { channel: 'call', direction: 'outbound', subject: '', summary: '', contact_name_hint: '' };

export default function AdminInteractions({ token, apiBase, eventId, readOnly }: Props) {
  const [items, setItems] = useState<Interaction[]>([]);
  const [groupedPeople, setGroupedPeople] = useState<PersonGroup[]>([]);
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grouped' | 'chronological'>('grouped');

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/crm/interactions?event_id=${eventId}&limit=500`, { headers });
      const d = await res.json();
      if (d.success) { 
        setItems(d.data || []); 
        setTotal(d.total || 0);
        groupInteractionsByPerson(d.data || []);
      }
    } finally { setLoading(false); }
  }, [eventId, token]);

  useEffect(() => { load(); }, [load]);

  const groupInteractionsByPerson = (interactions: Interaction[]) => {
    const groups: Record<string, PersonGroup> = {};
    
    interactions.forEach(item => {
      const key = item.contact_id 
        ? `contact_${item.contact_id}` 
        : item.contact_email 
          ? `email_${item.contact_email.toLowerCase()}` 
          : item.contact_name 
            ? `name_${item.contact_name.toLowerCase()}` 
            : `unknown_${item.id}`;
      
      if (!groups[key]) {
        groups[key] = {
          key,
          name: item.contact_name || item.contact_email || 'غير محدد',
          email: item.contact_email,
          phone: item.contact_phone,
          org: item.contact_org,
          contact_id: item.contact_id,
          interactions: [],
          stats: { total: 0, calls: 0, meetings: 0, emails: 0, whatsapp: 0, outbound: 0, inbound: 0 },
          lastInteraction: item,
        };
      }
      
      groups[key].interactions.push(item);
      groups[key].stats.total++;
      
      if (item.channel === 'call') groups[key].stats.calls++;
      else if (item.channel === 'meeting') groups[key].stats.meetings++;
      else if (item.channel === 'email') groups[key].stats.emails++;
      else if (item.channel === 'whatsapp') groups[key].stats.whatsapp++;
      
      if (item.direction === 'outbound') groups[key].stats.outbound++;
      else if (item.direction === 'inbound') groups[key].stats.inbound++;
      
      if (new Date(item.created_at) > new Date(groups[key].lastInteraction.created_at)) {
        groups[key].lastInteraction = item;
      }
    });
    
    Object.values(groups).forEach(group => {
      group.interactions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
    
    const peopleArray = Object.values(groups).sort((a, b) => 
      new Date(b.lastInteraction.created_at).getTime() - new Date(a.lastInteraction.created_at).getTime()
    );
    
    setGroupedPeople(peopleArray);
  };

  const save = async () => {
    if (!form.subject.trim()) return alert('يرجى كتابة موضوع التواصل');
    const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('admin_user') || '{}') : {};
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/crm/interactions`, {
        method: 'POST', headers,
        body: JSON.stringify({ ...form, event_id: eventId, logged_by: currentUser.name || currentUser.email || 'admin' }),
      });
      const d = await res.json();
      if (d.success) { setShowForm(false); setForm({ ...BLANK }); load(); }
      else alert(d.error || 'خطأ في الحفظ');
    } finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm('حذف هذا التواصل؟')) return;
    setDeleting(id);
    try {
      await fetch(`${apiBase}/api/crm/interactions/${id}`, { method: 'DELETE', headers });
      load();
    } finally { setDeleting(null); }
  };

  const fmt = (d: string) => new Date(d).toLocaleString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const fmtShort = (d: string) => new Date(d).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });

  const toggleExpand = (key: string) => {
    setExpandedPerson(expandedPerson === key ? null : key);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ color: 'white', fontWeight: 700, fontSize: '1.2rem', margin: 0 }}>💬 سجل التواصل</h2>
          <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '4px 0 0' }}>
            {viewMode === 'grouped' 
              ? `${groupedPeople.length} شخص • ${total} تواصل` 
              : `${total} تواصل مسجل`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', padding: 4 }}>
            <button 
              onClick={() => setViewMode('grouped')}
              style={{
                ...S.btn(),
                background: viewMode === 'grouped' ? 'rgba(108,99,255,0.3)' : 'transparent',
                color: viewMode === 'grouped' ? '#a5b4fc' : '#64748b',
                padding: '0.35rem 0.8rem',
                fontSize: '0.8rem',
              }}
            >
              👥 حسب الأشخاص
            </button>
            <button 
              onClick={() => setViewMode('chronological')}
              style={{
                ...S.btn(),
                background: viewMode === 'chronological' ? 'rgba(108,99,255,0.3)' : 'transparent',
                color: viewMode === 'chronological' ? '#a5b4fc' : '#64748b',
                padding: '0.35rem 0.8rem',
                fontSize: '0.8rem',
              }}
            >
              🕐 زمني
            </button>
          </div>
          {!readOnly && (
            <button style={S.btn()} onClick={() => setShowForm(!showForm)}>
              {showForm ? '✕ إلغاء' : '+ تسجيل تواصل'}
            </button>
          )}
        </div>
      </div>

      {/* New interaction form */}
      {showForm && !readOnly && (
        <div style={{ ...S.card, borderColor: 'rgba(139,92,246,0.4)', background: 'rgba(139,92,246,0.05)' }}>
          <h3 style={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.95rem', margin: '0 0 14px' }}>💬 تسجيل تواصل جديد</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={S.label}>قناة التواصل</label>
              <select style={S.inp} value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}>
                {Object.entries(CHANNEL_LABELS).map(([k, v]) => <option key={k} value={k}>{CHANNEL_ICONS[k]} {v}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>الاتجاه</label>
              <select style={S.inp} value={form.direction} onChange={e => setForm(f => ({ ...f, direction: e.target.value }))}>
                <option value="outbound">↗ صادر (من عندنا)</option>
                <option value="inbound">↙ وارد (من العميل)</option>
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={S.label}>موضوع التواصل *</label>
              <input style={S.inp} value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="مثل: متابعة طلب المشاركة، تأكيد الدفع..." />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={S.label}>ملاحظات / ملخص المحادثة</label>
              <textarea style={S.ta} value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                placeholder="ما الذي تم مناقشته؟ ما هو القرار أو الخطوة التالية؟" rows={3} />
            </div>
            <div>
              <label style={S.label}>اسم العميل / جهة الاتصال (اختياري)</label>
              <input style={S.inp} value={form.contact_name_hint} onChange={e => setForm(f => ({ ...f, contact_name_hint: e.target.value }))}
                placeholder="اسم العميل للمرجعية..." />
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button style={S.btn('#8b5cf6')} onClick={save} disabled={saving}>
              {saving ? '⏳ جاري الحفظ...' : '💾 حفظ'}
            </button>
            <button style={S.btn('#374151')} onClick={() => setShowForm(false)}>إلغاء</button>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>جاري التحميل...</p>
      ) : viewMode === 'grouped' ? (
        groupedPeople.length === 0 ? (
          <div style={{ ...S.card, textAlign: 'center', padding: '3rem', color: '#475569' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>💬</div>
            <p style={{ margin: 0, fontWeight: 600 }}>لا يوجد سجل تواصل حتى الآن</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.78rem' }}>سجّل أول تواصل مع عميل من الزر أعلاه</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {groupedPeople.map(person => (
              <div key={person.key} style={{ 
                ...S.card, 
                borderColor: expandedPerson === person.key ? 'rgba(139,92,246,0.4)' : 'rgba(108,99,255,0.15)',
                background: expandedPerson === person.key ? 'rgba(139,92,246,0.05)' : '#13102a',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: expandedPerson === person.key ? 16 : 0 }}>
                  <div style={{ 
                    width: 56, height: 56, borderRadius: '50%', 
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(108,99,255,0.15))', 
                    border: '2px solid rgba(139,92,246,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontSize: '1.5rem', flexShrink: 0
                  }}>👤</div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>{person.name}</h3>
                      <span style={{ fontSize: '0.7rem', background: 'rgba(139,92,246,0.2)', color: '#a78bfa', padding: '3px 10px', borderRadius: 999, fontWeight: 600 }}>
                        {person.stats.total} تواصل
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                      {person.email && <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>✉️ {person.email}</span>}
                      {person.phone && <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>📱 {person.phone}</span>}
                      {person.org && <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>🏢 {person.org}</span>}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8, marginBottom: 10 }}>
                      {person.stats.calls > 0 && (
                        <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#60a5fa' }}>📞 {person.stats.calls}</div>
                          <div style={{ fontSize: '0.68rem', color: '#64748b' }}>مكالمة</div>
                        </div>
                      )}
                      {person.stats.meetings > 0 && (
                        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#34d399' }}>🤝 {person.stats.meetings}</div>
                          <div style={{ fontSize: '0.68rem', color: '#64748b' }}>اجتماع</div>
                        </div>
                      )}
                      {person.stats.emails > 0 && (
                        <div style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#38bdf8' }}>📧 {person.stats.emails}</div>
                          <div style={{ fontSize: '0.68rem', color: '#64748b' }}>بريد</div>
                        </div>
                      )}
                      {person.stats.whatsapp > 0 && (
                        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#4ade80' }}>💬 {person.stats.whatsapp}</div>
                          <div style={{ fontSize: '0.68rem', color: '#64748b' }}>واتساب</div>
                        </div>
                      )}
                    </div>
                    
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 12px', borderRight: `3px solid ${DIR_COLOR[person.lastInteraction.direction]}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600 }}>
                          {CHANNEL_ICONS[person.lastInteraction.channel]} {person.lastInteraction.subject}
                        </span>
                        <span style={{ fontSize: '0.68rem', background: `${DIR_COLOR[person.lastInteraction.direction]}20`, color: DIR_COLOR[person.lastInteraction.direction], padding: '2px 6px', borderRadius: 99, fontWeight: 600 }}>
                          {DIR_LABEL[person.lastInteraction.direction]}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>🕐 آخر تواصل: {fmtShort(person.lastInteraction.created_at)}</div>
                    </div>
                  </div>
                  
                  <button onClick={() => toggleExpand(person.key)}
                    style={{ 
                      background: expandedPerson === person.key ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)', 
                      border: `1px solid ${expandedPerson === person.key ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.1)'}`,
                      color: expandedPerson === person.key ? '#a78bfa' : '#94a3b8',
                      borderRadius: '0.5rem', padding: '0.5rem 0.8rem', cursor: 'pointer', 
                      fontSize: '0.8rem', fontWeight: 600, flexShrink: 0, transition: 'all 0.2s'
                    }}
                  >
                    {expandedPerson === person.key ? '▲ إخفاء' : '▼ التفاصيل'}
                  </button>
                </div>
                
                {expandedPerson === person.key && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
                    <h4 style={{ color: '#a78bfa', fontSize: '0.9rem', fontWeight: 700, margin: '0 0 12px' }}>
                      🕐 السجل الزمني الكامل ({person.interactions.length} تواصل)
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {person.interactions.map(item => (
                        <div key={item.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '12px 14px', borderRight: `3px solid ${DIR_COLOR[item.direction]}` }}>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${DIR_COLOR[item.direction]}20`, border: `1px solid ${DIR_COLOR[item.direction]}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                              {CHANNEL_ICONS[item.channel]}
                            </div>
                            
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                                <span style={{ color: 'white', fontWeight: 600, fontSize: '0.85rem' }}>{item.subject}</span>
                                <span style={{ fontSize: '0.68rem', background: `${DIR_COLOR[item.direction]}20`, color: DIR_COLOR[item.direction], padding: '2px 7px', borderRadius: 99, fontWeight: 600 }}>
                                  {DIR_LABEL[item.direction]}
                                </span>
                                <span style={{ fontSize: '0.68rem', color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '2px 7px', borderRadius: 99 }}>
                                  {CHANNEL_LABELS[item.channel]}
                                </span>
                              </div>
                              {item.summary && <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '0 0 6px', lineHeight: 1.5 }}>{item.summary}</p>}
                              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: '0.7rem', color: '#64748b' }}>
                                <span>🕐 {fmt(item.created_at)}</span>
                                {item.logged_by && <span>✍️ {item.logged_by}</span>}
                              </div>
                            </div>
                            
                            {!readOnly && (
                              <button onClick={() => del(item.id)} disabled={deleting === item.id}
                                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '0.35rem', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.7rem', flexShrink: 0 }}>
                                {deleting === item.id ? '...' : '✕'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        items.length === 0 ? (
          <div style={{ ...S.card, textAlign: 'center', padding: '3rem', color: '#475569' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>💬</div>
            <p style={{ margin: 0 }}>لا يوجد سجل تواصل</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map(item => (
              <div key={item.id} style={{ ...S.card, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: `${DIR_COLOR[item.direction]}20`, border: `1px solid ${DIR_COLOR[item.direction]}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                  {CHANNEL_ICONS[item.channel]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>{item.subject}</span>
                    <span style={{ fontSize: '0.68rem', background: `${DIR_COLOR[item.direction]}20`, color: DIR_COLOR[item.direction], padding: '2px 7px', borderRadius: 99, fontWeight: 600 }}>
                      {DIR_LABEL[item.direction]}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '2px 7px', borderRadius: 99 }}>
                      {CHANNEL_LABELS[item.channel]}
                    </span>
                  </div>
                  {item.summary && <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 6px', lineHeight: 1.6 }}>{item.summary}</p>}
                  {(item.contact_name || item.contact_email || item.contact_phone) && (
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '0.4rem', padding: '6px 10px', marginBottom: 4, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {item.contact_name && <span style={{ color: '#e2e8f0', fontSize: '0.78rem', fontWeight: 600 }}>👤 {item.contact_name}</span>}
                      {item.contact_email && <span style={{ color: '#64748b', fontSize: '0.72rem' }}>✉️ {item.contact_email}</span>}
                      {item.contact_phone && <span style={{ color: '#64748b', fontSize: '0.72rem' }}>📱 {item.contact_phone}</span>}
                      {item.contact_org && <span style={{ color: '#64748b', fontSize: '0.72rem' }}>🏢 {item.contact_org}</span>}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    {item.logged_by && <span style={{ color: '#64748b', fontSize: '0.72rem' }}>✍️ {item.logged_by}</span>}
                    <span style={{ color: '#475569', fontSize: '0.72rem' }}>🕐 {fmt(item.created_at)}</span>
                  </div>
                </div>
                {!readOnly && (
                  <button onClick={() => del(item.id)} disabled={deleting === item.id}
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '0.35rem', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.72rem', flexShrink: 0 }}>
                    {deleting === item.id ? '...' : '✕'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
