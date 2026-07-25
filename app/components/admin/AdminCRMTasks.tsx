'use client';
import { useState, useEffect, useCallback } from 'react';

const S = {
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem', colorScheme: 'dark' } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 } as React.CSSProperties),
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '1rem', padding: '1.25rem' } as React.CSSProperties,
  label: { fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block' } as React.CSSProperties,
};

interface Assignee {
  admin_email: string;
  admin_name?: string;
  is_creator: number;
}

interface AdminUser {
  id: number; name: string; email: string; google_picture?: string;
}

interface Task {
  id: number; title: string; task_type: string; assigned_to?: string;
  priority: string; status: string; due_date?: string;
  contact_name?: string; contact_phone?: string; org_name?: string;
  escalated_to?: string; escalation_note?: string;
  management_decision?: string; outcome?: string;
  created_at: string; assignees?: Assignee[];
}

interface Props {
  token: string; apiBase: string; eventId?: number;
  mode?: 'all' | 'escalated';
}

const PRIORITY = { urgent: { label: 'عاجل', color: '#ef4444' }, high: { label: 'مرتفع', color: '#f97316' }, normal: { label: 'عادي', color: '#6b7280' }, low: { label: 'منخفض', color: '#374151' } };
const STATUS = { open: '📂 مفتوح', in_progress: '⚡ جاري', escalated: '🔺 مصعّد', done: '✅ منجز', cancelled: '❌ ملغى' };

export default function AdminCRMTasks({ token, apiBase, eventId, mode = 'all' }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Task | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Task>>({});
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  // Admin dropdown for assignees
  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);
  const [extraAssignees, setExtraAssignees] = useState<number[]>([]);
  const [assigneeSearch, setAssigneeSearch] = useState('');

  const currentAdmin = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('admin_user') || '{}') : {};

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // Load admins for dropdown
  useEffect(() => {
    fetch(`${apiBase}/api/auth/admins-list`, { headers }).then(r => r.json()).then(d => {
      if (d.success) setAdminsList(d.data || []);
    }).catch(() => {});
  }, [apiBase, token]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (eventId) params.set('event_id', String(eventId));
      if (mode === 'escalated') params.set('escalated', 'true');
      if (statusFilter) params.set('status', statusFilter);
      if (assignedTo) params.set('assigned_to', assignedTo);

      const res = await fetch(`${apiBase}/api/crm/tasks?${params}`, { headers });
      const data = await res.json();
      if (data.success) { setTasks(data.data); setTotal(data.total || data.data.length); }
    } finally { setLoading(false); }
  }, [apiBase, eventId, mode, statusFilter, assignedTo, token]);

  useEffect(() => { load(); }, [load]);

  const save = async (taskData: Partial<Task> & { assignees?: { email: string; name?: string }[] }) => {
    setSaving(true);
    try {
      const method = taskData.id ? 'PUT' : 'POST';
      const url = taskData.id ? `${apiBase}/api/crm/tasks/${taskData.id}` : `${apiBase}/api/crm/tasks`;
      const body = { ...taskData, event_id: eventId };
      if (!taskData.id) {
        (body as any).creator_email = currentAdmin.email || '';
        (body as any).creator_name = currentAdmin.name || '';
      }
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) { setShowForm(false); setSelected(null); setExtraAssignees([]); setAssigneeSearch(''); load(); }
      else alert(data.error);
    } finally { setSaving(false); }
  };

  const escalate = async (task: Task, decision?: string) => {
    const body = decision
      ? { ...task, management_decision: decision, status: 'in_progress' }
      : { ...task, status: 'escalated', escalated_to: 'management' };
    await save(body);
  };

  const filteredAdmins = adminsList.filter(a =>
    !assigneeSearch || a.name.toLowerCase().includes(assigneeSearch.toLowerCase()) || a.email.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  return (
    <div>
      {mode === 'escalated' && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: 16, color: '#fca5a5', fontSize: '0.85rem' }}>
          🔺 شاشة الإدارة — الحالات المصعّدة التي تتطلب قراراً منك
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {mode !== 'escalated' && (
          <select style={{ ...S.inp, flex: '0 0 140px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">كل الحالات</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        )}
        <input style={{ ...S.inp, flex: '1 1 180px' }} placeholder="🔍 فلتر بالمسؤول..." value={assignedTo} onChange={e => setAssignedTo(e.target.value)} />
        {mode !== 'escalated' && (
          <button style={S.btn()} onClick={() => { setForm({ event_id: eventId } as any); setExtraAssignees([]); setAssigneeInput(''); setShowForm(true); }}>+ مهمة جديدة</button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected || showForm ? '1fr 1.2fr' : '1fr', gap: 16 }}>
        {/* List */}
        <div>
          {loading ? <p style={{ color: '#94a3b8', textAlign: 'center' }}>جاري التحميل...</p> : (
            <>
              <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 8 }}>{total} مهمة</div>
              {tasks.map(t => {
                const p = PRIORITY[t.priority as keyof typeof PRIORITY] || { label: t.priority, color: '#6b7280' };
                const overdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done';
                return (
                  <div
                    key={t.id}
                    onClick={() => { setSelected(t); setShowForm(false); setForm({ ...t }); }}
                    style={{
                      ...S.card, marginBottom: 8, cursor: 'pointer',
                      borderColor: selected?.id === t.id ? '#6C63FF'
                        : t.status === 'escalated' ? 'rgba(239,68,68,0.4)'
                        : overdue ? 'rgba(249,115,22,0.3)'
                        : 'rgba(108,99,255,0.15)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: overdue ? '#fca5a5' : 'white', fontWeight: 600, fontSize: '0.88rem' }}>
                          {STATUS[t.status as keyof typeof STATUS]?.split(' ')[0]} {t.title}
                        </div>
                        {t.contact_name && <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>👤 {t.contact_name}</div>}
                        {t.org_name && <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>🏢 {t.org_name}</div>}
                        {t.assigned_to && <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>📌 {t.assigned_to}</div>}
                        {t.due_date && <div style={{ color: overdue ? '#ef4444' : '#6b7280', fontSize: '0.72rem' }}>
                          {overdue ? '⏰ ' : '📅 '}{t.due_date}
                        </div>}
                      </div>
                      <span style={{ background: p.color + '20', color: p.color, fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, flexShrink: 0 }}>{p.label}</span>
                    </div>
                    {t.escalation_note && (
                      <div style={{ marginTop: 6, padding: '4px 8px', background: 'rgba(239,68,68,0.1)', borderRadius: '0.3rem', color: '#fca5a5', fontSize: '0.75rem' }}>
                        🔺 {t.escalation_note}
                      </div>
                    )}
                    {/* Assignees badges */}
                    {t.assignees && t.assignees.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                        {t.assignees.map((a, i) => (
                          <span key={i} style={{ fontSize: '0.68rem', background: a.is_creator ? 'rgba(108,99,255,0.25)' : 'rgba(255,255,255,0.07)', color: a.is_creator ? '#818cf8' : '#94a3b8', padding: '1px 6px', borderRadius: 4 }}>
                            {a.is_creator ? '👑 ' : ''}{a.admin_name || a.admin_email.split('@')[0]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Detail / Form */}
        {showForm ? (
          <div style={S.card}>
            <h3 style={{ color: 'white', marginBottom: 16 }}>{form.id ? 'تعديل المهمة' : 'مهمة جديدة'}</h3>

            {/* Creator info for new tasks */}
            {!form.id && currentAdmin.email && (
              <div style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', marginBottom: 12, fontSize: '0.8rem', color: '#818cf8' }}>
                👑 أنت المسؤول الرئيسي تلقائياً: <strong>{currentAdmin.name || currentAdmin.email}</strong>
              </div>
            )}

            <div style={{ display: 'grid', gap: 10 }}>
              <div>
                <label style={S.label}>العنوان *</label>
                <input style={S.inp} value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={S.label}>النوع</label>
                  <select style={S.inp} value={form.task_type || 'follow_up'} onChange={e => setForm(f => ({ ...f, task_type: e.target.value }))}>
                    <option value="follow_up">متابعة</option>
                    <option value="call">مكالمة</option>
                    <option value="verify_payment">تحقق دفعة</option>
                    <option value="review_application">مراجعة طلب</option>
                    <option value="send_proposal">إرسال عرض</option>
                    <option value="collect_payment">تحصيل</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
                <div>
                  <label style={S.label}>الأولوية</label>
                  <select style={S.inp} value={form.priority || 'normal'} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="urgent">🔴 عاجل</option>
                    <option value="high">🟠 مرتفع</option>
                    <option value="normal">🟡 عادي</option>
                    <option value="low">⚪ منخفض</option>
                  </select>
                </div>
                <div>
                  <label style={S.label}>المسؤول الرئيسي</label>
                  {form.id ? (
                    // Edit mode: dropdown
                    <select style={S.inp} value={form.assigned_to || ''} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}>
                      <option value="">-- اختر المسؤول --</option>
                      {adminsList.map(a => <option key={a.id} value={a.email}>{a.name} ({a.email})</option>)}
                    </select>
                  ) : (
                    <input style={{ ...S.inp, opacity: 0.6 }} value={currentAdmin.email || ''} readOnly />
                  )}
                </div>
                <div>
                  <label style={S.label}>الموعد النهائي</label>
                  <input style={{ ...S.inp, colorScheme: 'dark' }} type="date" value={form.due_date || ''} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
              </div>

              {/* Multi-assignee from dropdown (new tasks only) */}
              {!form.id && (
                <div>
                  <label style={S.label}>مسؤولون إضافيون (اختياري)</label>
                  <input style={{ ...S.inp, marginBottom: 6 }} placeholder="🔍 ابحث عن مسؤول..." value={assigneeSearch} onChange={e => setAssigneeSearch(e.target.value)} />
                  {assigneeSearch && (
                    <div style={{ background: '#0d0b1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', maxHeight: 150, overflowY: 'auto', marginBottom: 8 }}>
                      {filteredAdmins.filter(a => a.email !== currentAdmin.email).map(admin => (
                        <div key={admin.id} onClick={() => {
                          if (!extraAssignees.includes(admin.id)) setExtraAssignees(prev => [...prev, admin.id]);
                          setAssigneeSearch('');
                        }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(108,99,255,0.15)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          {admin.google_picture ? <img src={admin.google_picture} style={{ width: 24, height: 24, borderRadius: '50%' }} alt="" /> : <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#6C63FF30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#818cf8' }}>{admin.name?.[0]}</div>}
                          <span style={{ color: 'white', fontSize: '0.82rem' }}>{admin.name}</span>
                          {extraAssignees.includes(admin.id) && <span style={{ marginRight: 'auto', color: '#10b981' }}>✓</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {extraAssignees.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {extraAssignees.map(id => {
                        const a = adminsList.find(ad => ad.id === id);
                        return (
                          <span key={id} style={{ background: 'rgba(108,99,255,0.2)', color: '#818cf8', fontSize: '0.75rem', padding: '3px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            {a?.name || a?.email}
                            <button onClick={() => setExtraAssignees(prev => prev.filter(x => x !== id))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, fontSize: '0.9rem' }}>×</button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {form.status === 'done' && (
                <div>
                  <label style={S.label}>نتيجة الإغلاق</label>
                  <textarea style={{ ...S.inp, height: 60, resize: 'vertical' }} value={form.outcome || ''} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))} />
                </div>
              )}
              <div>
                <label style={S.label}>الحالة</label>
                <select style={S.inp} value={form.status || 'open'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button style={S.btn()} onClick={() => save({
                ...form,
                assignees: extraAssignees.map(id => {
                  const a = adminsList.find(ad => ad.id === id);
                  return { email: a?.email || '', name: a?.name || '' };
                }),
              })} disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ'}</button>
              <button style={S.btn('#374151')} onClick={() => setShowForm(false)}>إلغاء</button>
            </div>
          </div>
        ) : selected ? (
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ color: 'white', margin: 0, fontSize: '0.95rem' }}>{selected.title}</h3>
              <div style={{ display: 'flex', gap: 6 }}>
                {mode !== 'escalated' && <button style={S.btn('#374151')} onClick={() => { setForm({ ...selected }); setExtraAssignees([]); setShowForm(true); }}>✏️</button>}
                <button style={S.btn('#374151')} onClick={() => setSelected(null)}>✕</button>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
              {selected.contact_name && <div style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>👤 {selected.contact_name} {selected.contact_phone ? `· ${selected.contact_phone}` : ''}</div>}
              {selected.org_name && <div style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>🏢 {selected.org_name}</div>}
              {selected.due_date && <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>📅 {selected.due_date}</div>}

              {/* Assignees */}
              {selected.assignees && selected.assignees.length > 0 && (
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: 6 }}>المسؤولون:</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {selected.assignees.map((a, i) => (
                      <span key={i} style={{
                        fontSize: '0.78rem',
                        background: a.is_creator ? 'rgba(108,99,255,0.2)' : 'rgba(255,255,255,0.07)',
                        color: a.is_creator ? '#818cf8' : '#94a3b8',
                        border: a.is_creator ? '1px solid rgba(108,99,255,0.4)' : '1px solid rgba(255,255,255,0.1)',
                        padding: '3px 10px', borderRadius: 4,
                      }}>
                        {a.is_creator ? '👑 ' : '👤 '}{a.admin_name || a.admin_email}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!selected.assignees?.length && selected.assigned_to && (
                <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>📌 {selected.assigned_to}</div>
              )}
            </div>

            {selected.escalation_note && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: 16 }}>
                <div style={{ color: '#fca5a5', fontSize: '0.8rem', fontWeight: 600 }}>🔺 سبب التصعيد:</div>
                <p style={{ color: '#fca5a5', fontSize: '0.85rem', margin: '4px 0 0' }}>{selected.escalation_note}</p>
              </div>
            )}

            {selected.management_decision && (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: 16 }}>
                <div style={{ color: '#34d399', fontSize: '0.8rem', fontWeight: 600 }}>قرار الإدارة: {selected.management_decision}</div>
              </div>
            )}

            {/* Management Decision */}
            {mode === 'escalated' && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase' }}>قرار الإدارة</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={S.btn('#10b981')} onClick={() => escalate(selected, 'approved')}>✅ موافقة</button>
                  <button style={S.btn('#ef4444')} onClick={() => escalate(selected, 'rejected')}>❌ رفض</button>
                  <button style={S.btn('#f59e0b')} onClick={() => escalate(selected, 'needs_info')}>❓ يحتاج معلومات</button>
                </div>
              </div>
            )}

            {/* Quick actions for non-management */}
            {mode !== 'escalated' && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button style={S.btn('#10b981')} onClick={() => save({ ...selected, status: 'done' })}>✅ إغلاق</button>
                <button style={S.btn('#8b5cf6')} onClick={() => { setForm({ ...selected, status: 'escalated', escalated_to: 'management' }); setShowForm(true); }}>🔺 تصعيد للإدارة</button>
                <button style={S.btn('#374151')} onClick={() => save({ ...selected, status: 'in_progress' })}>⚡ بدأت العمل</button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}