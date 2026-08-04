'use client';
/**
 * AdminEventRegistrations — عرض التسجيلات الحقيقية للحدث مع CRM integration
 * يجلب من: /api/events/:id/registrations
 * يتيح: عرض، فلترة، تغيير الحالة، تحويل إلى جهة اتصال، إضافة مهمة
 */
import { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev';

const S = {
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem', colorScheme: 'dark' } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 } as React.CSSProperties),
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '1rem', padding: '1.25rem' } as React.CSSProperties,
  label: { fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block' } as React.CSSProperties,
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:    { label: '⏳ قيد الانتظار',  color: '#f59e0b' },
  approved:   { label: '✅ مقبول',          color: '#10b981' },
  paid:       { label: '� مدفوع',          color: '#06b6d4' },
  rejected:   { label: '❌ مرفوض',          color: '#ef4444' },
  waitlisted: { label: '🕐 قائمة انتظار',  color: '#8b5cf6' },
  cancelled:  { label: '🚫 ملغى',           color: '#6b7280' },
  checked_in: { label: '✔️ حضر',            color: '#10b981' },
};

const REG_TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  startup:  { label: 'شركة ناشئة',   color: '#6C63FF', icon: '🚀' },
  general:  { label: 'حضور عام',      color: '#8b5cf6', icon: '👤' },
  investor: { label: 'مستثمر',        color: '#10b981', icon: '💼' },
  speaker:  { label: 'متحدث',         color: '#ec4899', icon: '🎙️' },
  sponsor:  { label: 'راعي',           color: '#0ea5e9', icon: '🏅' },
  media:    { label: 'إعلام',          color: '#f59e0b', icon: '📹' },
  vip:      { label: 'VIP',            color: '#f59e0b', icon: '⭐' },
  partner:  { label: 'شريك',           color: '#14b8a6', icon: '🤝' },
};

interface Reg {
  id: number; name?: string; full_name?: string; email?: string; phone?: string;
  city?: string; reg_type?: string; type?: string; reg_types?: string; status: string;
  created_at: string; contact_id?: number;
  participation_reason?: string; work_field?: string;
}

interface AdminUser { id: number; name: string; email: string; google_picture?: string; }

interface Props {
  token: string;
  eventId: number;
  readOnly?: boolean;
}

export default function AdminEventRegistrations({ token, eventId, readOnly }: Props) {

  const roAlert = () => {
    if (readOnly) alert('أنت في وضع المشاهدة فقط. تواصل مع المسؤول الرئيسي لتفعيل صلاحياتك.');
    return readOnly;
  };
  const roStyle: React.CSSProperties = readOnly ? { opacity: 0.45, cursor: 'not-allowed', filter: 'grayscale(0.4)' } : {};
  const [regs, setRegs] = useState<Reg[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const LIMIT = 25;

  const [selected, setSelected] = useState<Reg | null>(null);
  const [converting, setConverting] = useState(false);
  const [converted, setConverted] = useState<Set<number>>(new Set());

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState<any>({ task_type: 'follow_up', priority: 'normal' });
  const [savingTask, setSavingTask] = useState(false);
  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [extraAssignees, setExtraAssignees] = useState<number[]>([]);

  // Multi-type editing
  const [showTypeEdit, setShowTypeEdit] = useState(false);
  const [pendingTypes, setPendingTypes] = useState<string[]>([]);

  // Interaction logging
  const [showInteraction, setShowInteraction] = useState(false);
  const [interactionForm, setInteractionForm] = useState({ channel: 'call', direction: 'outbound', subject: '', summary: '' });
  const [savingInteraction, setSavingInteraction] = useState(false);

  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('admin_user') || '{}') : {};
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // Load admins list
  useEffect(() => {
    fetch(`${API_BASE}/api/auth/admins-list`, { headers }).then(r => r.json()).then(d => {
      if (d.success) setAdminsList(d.data || []);
    }).catch(() => {});
  }, [token]);

  const load = useCallback(async () => {
    if (!token || !eventId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      params.set('limit', String(LIMIT));
      params.set('offset', String(page * LIMIT));
      const res = await fetch(`${API_BASE}/api/events/${eventId}/registrations?${params}`, { headers });
      const d = await res.json();
      if (d.success) { setRegs(d.data || []); setTotal(d.total || 0); }
    } finally { setLoading(false); }
  }, [token, eventId, statusFilter, search, page]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (id: number, status: string) => {
    setRegs(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    if (selected?.id === id) setSelected(s => s ? { ...s, status } : null);
    await fetch(`${API_BASE}/api/events/${eventId}/registrations/${id}`, {
      method: 'PUT', headers, body: JSON.stringify({ status }),
    });
  };

  const convertToContact = async (reg: Reg) => {
    setConverting(true);
    try {
      // First check if contact already exists by email
      const name = reg.full_name || reg.name || '';
      const body = {
        full_name: name,
        email: reg.email || '',
        phone: reg.phone || '',
        city: reg.city || '',
        source: 'registration',
        event_id: eventId, // ربط بالحدث الحالي
        notes: `تحويل من تسجيل الحدث #${eventId}. النوع: ${reg.reg_type || reg.type || 'عام'}.${reg.participation_reason ? ` سبب المشاركة: ${reg.participation_reason}` : ''}`,
        is_vip: 0,
      };

      const res = await fetch(`${API_BASE}/api/crm/contacts`, {
        method: 'POST', headers, body: JSON.stringify(body),
      });
      const d = await res.json();
      if (d.success || d.existing_id) {
        const contactId = d.id || d.existing_id;
        setConverted(prev => new Set([...prev, reg.id]));
        // Link registration to contact
        if (contactId) {
          await fetch(`${API_BASE}/api/events/${eventId}/registrations/${reg.id}`, {
            method: 'PUT', headers, body: JSON.stringify({ contact_id: contactId }),
          }).catch(() => {});
        }
        setSelected(s => s ? { ...s, contact_id: contactId } : null);
        if (d.existing_id) {
          alert(`ℹ️ "${name}" موجود مسبقاً في جهات الاتصال وتم الربط به`);
        } else {
          alert(`✅ تم إضافة "${name}" إلى جهات الاتصال`);
        }
      } else {
        alert(d.error || 'حدث خطأ');
      }
    } finally { setConverting(false); }
  };

  const saveTask = async () => {
    if (!selected || !taskForm.title) return;
    setSavingTask(true);
    try {
      const assignees = extraAssignees.map(id => {
        const a = adminsList.find(ad => ad.id === id);
        return { email: a?.email || '', name: a?.name || '' };
      });
      const res = await fetch(`${API_BASE}/api/crm/tasks`, {
        method: 'POST', headers,
        body: JSON.stringify({
          ...taskForm,
          registration_id: selected.id,
          contact_id: selected.contact_id,
          event_id: eventId,
          creator_email: currentUser.email || '',
          creator_name: currentUser.name || '',
          assignees,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setShowTaskForm(false);
        setTaskForm({ task_type: 'follow_up', priority: 'normal' });
        setExtraAssignees([]);
        setAssigneeSearch('');
        alert('✅ تم إنشاء المهمة');
      } else alert(d.error);
    } finally { setSavingTask(false); }
  };

  // Save additional types (reg_types field)
  const saveTypes = async () => {
    if (!selected) return;
    const typesStr = pendingTypes.join(',');
    await fetch(`${API_BASE}/api/events/${eventId}/registrations/${selected.id}`, {
      method: 'PUT', headers, body: JSON.stringify({ reg_types: typesStr }),
    });
    setRegs(prev => prev.map(r => r.id === selected.id ? { ...r, reg_types: typesStr } : r));
    setSelected(s => s ? { ...s, reg_types: typesStr } : null);
    setShowTypeEdit(false);
  };

  // Save interaction log
  const saveInteraction = async () => {
    if (!selected || !interactionForm.subject) return;
    setSavingInteraction(true);
    try {
      const res = await fetch(`${API_BASE}/api/crm/interactions`, {
        method: 'POST', headers,
        body: JSON.stringify({
          contact_id: selected.contact_id || null,
          registration_id: selected.id,
          event_id: eventId,
          channel: interactionForm.channel,
          direction: interactionForm.direction,
          subject: interactionForm.subject,
          summary: interactionForm.summary,
          logged_by: currentUser.name || currentUser.email || 'admin',
        }),
      });
      const d = await res.json();
      if (d.success) {
        setShowInteraction(false);
        setInteractionForm({ channel: 'call', direction: 'outbound', subject: '', summary: '' });
        alert('✅ تم تسجيل التواصل');
      } else alert(d.error || 'خطأ في التسجيل');
    } finally { setSavingInteraction(false); }
  };

  const filteredAdmins = adminsList.filter(a =>
    !assigneeSearch || a.name.toLowerCase().includes(assigneeSearch.toLowerCase()) || a.email.includes(assigneeSearch)
  );

  const getName = (r: Reg) => r.full_name || r.name || '—';
  const getTypeInfo = (r: Reg) => {
    const key = r.reg_type || r.type || 'general';
    return REG_TYPE_CONFIG[key] || { label: key, color: '#6b7280', icon: '👤' };
  };
  const getType = (r: Reg) => {
    const info = getTypeInfo(r);
    return `${info.icon} ${info.label}`;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 16, alignItems: 'start' }}>
      {/* ── List ── */}
      <div>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <input
            style={{ ...S.inp, flex: '1 1 200px' }}
            placeholder="🔍 بحث بالاسم أو البريد..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
          />
          <select style={{ ...S.inp, flex: '0 0 165px' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}>
            <option value="">كل الحالات</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button style={S.btn('#374151')} onClick={load}>🔄</button>
        </div>

        {/* Stats bar */}
        <div style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: 10 }}>
          {total} تسجيل إجمالي
          {converted.size > 0 && <span style={{ color: '#10b981', marginRight: 8 }}>· {converted.size} تم تحويلهم لجهات اتصال</span>}
        </div>

        {/* Table */}
        <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.18)' }}>
                  {[
                    { h: 'الاسم',   w: '' },
                    { h: 'البريد',  w: '' },
                    { h: 'النوع',   w: '90px' },
                    { h: 'المدينة', w: '80px' },
                    { h: 'الحالة',  w: '90px' },
                    { h: 'تغيير',   w: '110px' },
                    { h: '',         w: '50px' },
                  ].map(({ h, w }) => (
                    <th key={h} style={{ textAlign: 'right', padding: '0.55rem 0.85rem', color: '#64748b', fontWeight: 600, fontSize: '0.68rem', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.04em', width: w || undefined }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>جاري التحميل...</td></tr>
                ) : regs.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>لا توجد تسجيلات</td></tr>
                ) : regs.map(reg => {
                  const sc = STATUS_CONFIG[reg.status] || { label: reg.status, color: '#6b7280' };
                  const ti = getTypeInfo(reg);
                  const isSelected = selected?.id === reg.id;
                  const isConverted = converted.has(reg.id) || !!reg.contact_id;
                  return (
                    <tr
                      key={reg.id}
                      onClick={() => { setSelected(reg); setShowTaskForm(false); setShowTypeEdit(false); setShowInteraction(false); }}
                      style={{
                        borderTop: '1px solid rgba(255,255,255,0.04)',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(108,99,255,0.1)' : 'transparent',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget.style.background = 'rgba(255,255,255,0.025)'); }}
                      onMouseLeave={e => { if (!isSelected) (e.currentTarget.style.background = 'transparent'); }}
                    >
                      {/* الاسم */}
                      <td style={{ padding: '0.55rem 0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${ti.color}30`, border: `1px solid ${ti.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', flexShrink: 0, color: ti.color }}>
                            {ti.icon}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ color: 'white', fontWeight: 500, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getName(reg)}</div>
                            {isConverted && <div style={{ fontSize: '0.62rem', color: '#10b981' }}>✓ جهة اتصال</div>}
                          </div>
                        </div>
                      </td>
                      {/* البريد */}
                      <td style={{ padding: '0.55rem 0.85rem', color: '#64748b', fontSize: '0.75rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reg.email || '—'}</td>
                      {/* النوع - badge صغير نظيف */}
                      <td style={{ padding: '0.55rem 0.85rem' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          background: `${ti.color}18`, color: ti.color,
                          fontSize: '0.68rem', fontWeight: 600,
                          padding: '2px 7px', borderRadius: '999px',
                          border: `1px solid ${ti.color}30`,
                          whiteSpace: 'nowrap',
                        }}>{ti.icon} {ti.label}</span>
                      </td>
                      {/* المدينة */}
                      <td style={{ padding: '0.55rem 0.85rem', color: '#64748b', fontSize: '0.75rem' }}>{reg.city || '—'}</td>
                      {/* الحالة - dot بسيط */}
                      <td style={{ padding: '0.55rem 0.85rem' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: '0.72rem', color: sc.color,
                          fontWeight: 500, whiteSpace: 'nowrap',
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.color, flexShrink: 0, display: 'inline-block' }} />
                          {sc.label.replace(/^[^\u0600-\u06FF ]+/, '').trim()}
                        </span>
                      </td>
                      {/* تغيير الحالة */}
                      <td style={{ padding: '0.4rem 0.7rem' }} onClick={e => e.stopPropagation()}>
                        <select
                          value={reg.status}
                          onChange={e => { if (roAlert()) return; changeStatus(reg.id, e.target.value); }}
                          disabled={readOnly}
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.35rem', color: '#94a3b8', fontSize: '0.7rem', padding: '0.2rem 0.35rem', outline: 'none', cursor: readOnly ? 'not-allowed' : 'pointer', colorScheme: 'dark', ...(readOnly ? roStyle : {}) }}
                          title={readOnly ? 'وضع المشاهدة فقط' : ''}
                        >
                          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label.replace(/^[^\u0600-\u06FF ]+/, '').trim()}</option>)}
                        </select>
                      </td>
                      {/* جهة اتصال */}
                      <td style={{ padding: '0.4rem 0.7rem' }} onClick={e => e.stopPropagation()}>
                        {!isConverted ? (
                          <button
                            onClick={() => { if (roAlert()) return; convertToContact(reg); }}
                            disabled={readOnly || converting}
                            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', borderRadius: '0.35rem', padding: '0.2rem 0.6rem', cursor: (readOnly || converting) ? 'not-allowed' : 'pointer', fontSize: '0.68rem', fontWeight: 600, whiteSpace: 'nowrap', ...(readOnly ? roStyle : {}) }}
                            title={readOnly ? 'وضع المشاهدة فقط' : 'إضافة لجهات الاتصال'}
                          >👤 +</button>
                        ) : (
                          <span style={{ color: '#10b981', fontSize: '0.72rem' }}>✓</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > LIMIT && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} من {total}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ ...S.btn('#374151'), opacity: page === 0 ? 0.4 : 1 }}>السابق</button>
                <button disabled={(page + 1) * LIMIT >= total} onClick={() => setPage(p => p + 1)} style={{ ...S.btn('#374151'), opacity: (page + 1) * LIMIT >= total ? 0.4 : 1 }}>التالي</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Panel ── */}
      {selected && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Header card */}
          <div style={{ ...S.card, borderColor: 'rgba(108,99,255,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#6C63FF,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                  {getName(selected)[0] || '?'}
                </div>
                <div>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>{getName(selected)}</div>
                  <div style={{ color: '#64748b', fontSize: '0.78rem' }}>{selected.email || selected.phone}</div>
                </div>
              </div>
              <button style={{ ...S.btn('#374151'), padding: '0.3rem 0.6rem' }} onClick={() => { setSelected(null); setShowTaskForm(false); setShowTypeEdit(false); setShowInteraction(false); }}>✕</button>
            </div>

            {/* Info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                ['📱', selected.phone || '—'],
                ['🏙️', selected.city || '—'],
                ['📋', getType(selected)],
                ['📅', new Date(selected.created_at).toLocaleDateString('ar-SA')],
              ].map(([icon, val], i) => (
                <div key={i} style={{ color: '#cbd5e1', fontSize: '0.8rem' }}><span style={{ opacity: 0.6 }}>{icon} </span>{val}</div>
              ))}
            </div>

            {/* Additional types */}
            {selected.reg_types && (
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                <span style={{ color: '#64748b', fontSize: '0.72rem', alignSelf: 'center' }}>أنواع إضافية:</span>
                {selected.reg_types.split(',').filter(Boolean).map(t => {
                  const info = REG_TYPE_CONFIG[t] || { label: t, color: '#6b7280', icon: '👤' };
                  return (
                    <span key={t} style={{ fontSize: '0.7rem', background: `${info.color}20`, color: info.color, border: `1px solid ${info.color}40`, borderRadius: 99, padding: '2px 8px' }}>
                      {info.icon} {info.label}
                    </span>
                  );
                })}
              </div>
            )}

            {selected.participation_reason && (
              <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem', color: '#94a3b8', fontSize: '0.78rem' }}>
                <span style={{ color: '#64748b' }}>السبب: </span>{selected.participation_reason}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {/* Convert to contact button */}
              {!converted.has(selected.id) && !selected.contact_id ? (
                <button
                  onClick={() => { if (roAlert()) return; convertToContact(selected); }}
                  disabled={converting || readOnly}
                  title={readOnly ? 'وضع المشاهدة فقط' : ''}
                  style={{
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(16,185,129,0.15))',
                    border: '1px solid rgba(59,130,246,0.4)',
                    color: '#60a5fa',
                    borderRadius: '0.5rem',
                    padding: '0.5rem 1rem',
                    cursor: (converting || readOnly) ? 'not-allowed' : 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    ...(readOnly ? roStyle : {}),
                    gap: 6,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { if (!converting) (e.currentTarget.style.borderColor = '#3b82f6'); }}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)')}
                >
                  {converting ? '⏳ جاري الإضافة...' : '👤 إضافة لجهات الاتصال'}
                </button>
              ) : (
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.82rem' }}>
                  ✓ تم الإضافة لجهات الاتصال
                </div>
              )}

              <button
                onClick={() => setShowTaskForm(!showTaskForm)}
                style={{
                  background: showTaskForm ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.4)',
                  color: '#fcd34d',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                {showTaskForm ? '✕ إلغاء' : '✅ + مهمة'}
              </button>

              {/* Multi-type button */}
              <button
                onClick={() => {
                  const cur = selected.reg_types ? selected.reg_types.split(',').filter(Boolean) : [];
                  setPendingTypes(cur);
                  setShowTypeEdit(!showTypeEdit);
                }}
                style={{
                  background: showTypeEdit ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.4)',
                  color: '#34d399',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                {showTypeEdit ? '✕ إلغاء' : '🏷️ أنواع إضافية'}
              </button>

              {/* Interaction log button */}
              <button
                onClick={() => setShowInteraction(!showInteraction)}
                style={{
                  background: showInteraction ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.1)',
                  border: '1px solid rgba(139,92,246,0.4)',
                  color: '#a78bfa',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                {showInteraction ? '✕ إلغاء' : '💬 تواصل'}
              </button>

              {/* Status change */}
              <select
                value={selected.status}
                onChange={e => changeStatus(selected.id, e.target.value)}
                style={{ ...S.inp, flex: 1, minWidth: 120, fontSize: '0.8rem' }}
              >
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          {/* Multi-type edit panel */}
          {showTypeEdit && (
            <div style={{ ...S.card, borderColor: 'rgba(16,185,129,0.35)', background: 'rgba(16,185,129,0.05)' }}>
              <div style={{ color: '#34d399', fontWeight: 700, fontSize: '0.88rem', marginBottom: 12 }}>
                🏷️ الأنواع الإضافية — {getName(selected)}
              </div>
              <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: 10 }}>
                النوع الأساسي: <strong style={{ color: '#a5f3fc' }}>{getType(selected)}</strong><br/>
                أضف أنواعاً إضافية (مثل: راعٍ ومستثمر في نفس الوقت)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {Object.entries(REG_TYPE_CONFIG).map(([k, v]) => {
                  const isPrimary = (selected.reg_type || selected.type) === k;
                  const isSelected = pendingTypes.includes(k);
                  return (
                    <button key={k} disabled={isPrimary}
                      onClick={() => setPendingTypes(prev => prev.includes(k) ? prev.filter(x=>x!==k) : [...prev, k])}
                      style={{
                        padding: '0.35rem 0.85rem', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600,
                        cursor: isPrimary ? 'default' : 'pointer',
                        border: `1px solid ${isSelected ? v.color + '80' : 'rgba(255,255,255,0.12)'}`,
                        background: isPrimary ? v.color + '30' : isSelected ? v.color + '20' : 'transparent',
                        color: isPrimary ? v.color : isSelected ? v.color : '#64748b',
                        opacity: isPrimary ? 0.6 : 1,
                      }}>
                      {v.icon} {v.label} {isPrimary ? '(أساسي)' : ''}
                    </button>
                  );
                })}
              </div>
              <button onClick={saveTypes} style={{ ...S.btn('#10b981') }}>💾 حفظ الأنواع</button>
            </div>
          )}

          {/* Interaction form (item 8) */}
          {showInteraction && (
            <div style={{ ...S.card, borderColor: 'rgba(139,92,246,0.35)', background: 'rgba(139,92,246,0.05)' }}>
              <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.88rem', marginBottom: 12 }}>
                💬 تسجيل تواصل — {getName(selected)}
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={S.label}>قناة التواصل</label>
                    <select style={S.inp} value={interactionForm.channel} onChange={e => setInteractionForm(f => ({ ...f, channel: e.target.value }))}>
                      <option value="call">📞 مكالمة هاتفية</option>
                      <option value="whatsapp">💬 واتساب</option>
                      <option value="email">📧 بريد إلكتروني</option>
                      <option value="meeting">🤝 اجتماع</option>
                      <option value="sms">📱 رسالة نصية</option>
                      <option value="other">أخرى</option>
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>الاتجاه</label>
                    <select style={S.inp} value={interactionForm.direction} onChange={e => setInteractionForm(f => ({ ...f, direction: e.target.value }))}>
                      <option value="outbound">صادر (من عندنا)</option>
                      <option value="inbound">وارد (من العميل)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={S.label}>موضوع التواصل *</label>
                  <input style={S.inp} value={interactionForm.subject}
                    onChange={e => setInteractionForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder="مثل: متابعة طلب المشاركة، تأكيد الدفع..." />
                </div>
                <div>
                  <label style={S.label}>ملاحظات / ملخص المحادثة</label>
                  <textarea style={{ ...S.inp, minHeight: 70, resize: 'vertical' as const }}
                    value={interactionForm.summary}
                    onChange={e => setInteractionForm(f => ({ ...f, summary: e.target.value }))}
                    placeholder="ما الذي تم مناقشته؟ ما هو القرار أو الخطوة التالية؟" />
                </div>
                <div style={{ color: '#475569', fontSize: '0.72rem' }}>
                  💡 سيتم حفظ هذا التواصل في صفحة جهة الاتصال CRM وأرشفته هناك.
                </div>
                <button onClick={saveInteraction} disabled={savingInteraction || !interactionForm.subject}
                  style={{ ...S.btn('#8b5cf6') }}>
                  {savingInteraction ? '⏳ جاري الحفظ...' : '💾 حفظ التواصل'}
                </button>
              </div>
            </div>
          )}
          {showTaskForm && (
            <div style={{ ...S.card, borderColor: 'rgba(108,99,255,0.35)', background: 'rgba(108,99,255,0.06)' }}>
              <div style={{ color: '#818cf8', fontWeight: 700, fontSize: '0.88rem', marginBottom: 12 }}>
                ✅ مهمة جديدة — {getName(selected)}
              </div>

              {currentUser.name && (
                <div style={{ background: 'rgba(108,99,255,0.12)', borderRadius: '0.4rem', padding: '0.35rem 0.7rem', marginBottom: 10, fontSize: '0.75rem', color: '#818cf8' }}>
                  👑 المسؤول الرئيسي: <strong>{currentUser.name}</strong>
                </div>
              )}

              <div style={{ display: 'grid', gap: 8 }}>
                <div>
                  <label style={S.label}>عنوان المهمة *</label>
                  <input style={S.inp} value={taskForm.title || ''} onChange={e => setTaskForm((f: any) => ({ ...f, title: e.target.value }))} placeholder="وصف واضح للمهمة..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={S.label}>النوع</label>
                    <select style={S.inp} value={taskForm.task_type} onChange={e => setTaskForm((f: any) => ({ ...f, task_type: e.target.value }))}>
                      <option value="follow_up">متابعة</option>
                      <option value="call">مكالمة</option>
                      <option value="verify_payment">تحقق دفعة</option>
                      <option value="review_application">مراجعة طلب</option>
                      <option value="other">أخرى</option>
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>الأولوية</label>
                    <select style={S.inp} value={taskForm.priority} onChange={e => setTaskForm((f: any) => ({ ...f, priority: e.target.value }))}>
                      <option value="urgent">🔴 عاجل</option>
                      <option value="high">🟠 مرتفع</option>
                      <option value="normal">🟡 عادي</option>
                      <option value="low">⚪ منخفض</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label style={S.label}>إضافة مسؤولين (يستلمون إشعار بريدي)</label>
                  <input
                    style={S.inp}
                    placeholder="🔍 ابحث عن مسؤول..."
                    value={assigneeSearch}
                    onChange={e => setAssigneeSearch(e.target.value)}
                  />
                  {assigneeSearch && filteredAdmins.length > 0 && (
                    <div style={{ background: '#0d0b1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', maxHeight: 130, overflowY: 'auto', marginTop: 4 }}>
                      {filteredAdmins.filter(a => a.email !== currentUser.email).map(admin => (
                        <div key={admin.id}
                          onClick={() => { if (!extraAssignees.includes(admin.id)) setExtraAssignees(p => [...p, admin.id]); setAssigneeSearch(''); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.45rem 0.75rem', cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(108,99,255,0.15)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          {admin.google_picture ? (
                            <img src={admin.google_picture} style={{ width: 24, height: 24, borderRadius: '50%' }} alt="" />
                          ) : (
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#6C63FF40', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontSize: '0.75rem' }}>{admin.name[0]}</div>
                          )}
                          <div>
                            <div style={{ color: 'white', fontSize: '0.8rem' }}>{admin.name}</div>
                            <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{admin.email}</div>
                          </div>
                          {extraAssignees.includes(admin.id) && <span style={{ marginRight: 'auto', color: '#10b981', fontSize: '0.8rem' }}>✓</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {extraAssignees.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                      {extraAssignees.map(id => {
                        const a = adminsList.find(ad => ad.id === id);
                        return (
                          <span key={id} style={{ background: 'rgba(108,99,255,0.2)', color: '#818cf8', fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            📧 {a?.name}
                            <button onClick={() => setExtraAssignees(p => p.filter(x => x !== id))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, fontSize: '0.8rem' }}>×</button>
                          </span>
                        );
                      })}
                      <div style={{ color: '#64748b', fontSize: '0.68rem', alignSelf: 'center' }}>سيتلقى إشعاراً بريدياً</div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button style={S.btn()} onClick={saveTask} disabled={savingTask || !taskForm.title}>
                  {savingTask ? '⏳ جاري الإنشاء...' : '✅ إنشاء المهمة'}
                </button>
                <button style={S.btn('#374151')} onClick={() => setShowTaskForm(false)}>إلغاء</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
