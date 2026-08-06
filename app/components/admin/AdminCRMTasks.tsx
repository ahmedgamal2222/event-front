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
  readOnly?: boolean;
}

const PRIORITY = { urgent: { label: 'عاجل', color: '#ef4444' }, high: { label: 'مرتفع', color: '#f97316' }, normal: { label: 'عادي', color: '#6b7280' }, low: { label: 'منخفض', color: '#374151' } };
const STATUS = { open: '📂 مفتوح', in_progress: '⚡ جاري', escalated: '🔺 مصعّد', done: '✅ منجز', cancelled: '❌ ملغى' };

export default function AdminCRMTasks({ token, apiBase, eventId, mode = 'all', readOnly }: Props) {

  const roAlert = () => {
    if (readOnly) alert('أنت في وضع المشاهدة فقط. تواصل مع المسؤول الرئيسي لتفعيل صلاحياتك.');
    return readOnly;
  };
  const roStyle: React.CSSProperties = readOnly ? { opacity: 0.45, cursor: 'not-allowed', filter: 'grayscale(0.4)' } : {};
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
        // Use admin_email as creator for new tasks
        if (!body.assigned_to && currentAdmin.email) {
          body.assigned_to = currentAdmin.email;
        }
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
        {mode !== 'escalated' && !readOnly && (
          <button style={S.btn()} onClick={() => { setForm({ event_id: eventId } as any); setExtraAssignees([]); setAssigneeSearch(''); setShowForm(true); }}>+ مهمة جديدة</button>
        )}
        {mode !== 'escalated' && readOnly && (
          <button style={{ ...S.btn('#374151'), ...roStyle }} onClick={() => roAlert()} title="وضع المشاهدة فقط">+ مهمة جديدة 🔒</button>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: 'white', margin: '0 0 8px', fontSize: '1.05rem', fontWeight: 700 }}>{selected.title}</h3>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    background: STATUS[selected.status as keyof typeof STATUS] ? 
                      (selected.status === 'done' ? 'rgba(16,185,129,0.15)' : 
                       selected.status === 'escalated' ? 'rgba(239,68,68,0.15)' : 
                       selected.status === 'in_progress' ? 'rgba(59,130,246,0.15)' : 
                       'rgba(107,114,128,0.15)') 
                      : 'rgba(107,114,128,0.15)', 
                    color: selected.status === 'done' ? '#34d399' : 
                           selected.status === 'escalated' ? '#fca5a5' : 
                           selected.status === 'in_progress' ? '#60a5fa' : '#94a3b8',
                    border: '1px solid ' + (selected.status === 'done' ? 'rgba(16,185,129,0.3)' : 
                           selected.status === 'escalated' ? 'rgba(239,68,68,0.3)' : 
                           selected.status === 'in_progress' ? 'rgba(59,130,246,0.3)' : 
                           'rgba(107,114,128,0.2)'),
                    padding: '3px 10px', 
                    borderRadius: 999, 
                    fontWeight: 600 
                  }}>
                    {STATUS[selected.status as keyof typeof STATUS] || selected.status}
                  </span>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    background: PRIORITY[selected.priority as keyof typeof PRIORITY]?.color + '20' || 'rgba(107,114,128,0.15)', 
                    color: PRIORITY[selected.priority as keyof typeof PRIORITY]?.color || '#94a3b8',
                    border: '1px solid ' + (PRIORITY[selected.priority as keyof typeof PRIORITY]?.color + '30' || 'rgba(107,114,128,0.2)'),
                    padding: '3px 10px', 
                    borderRadius: 999, 
                    fontWeight: 600 
                  }}>
                    {PRIORITY[selected.priority as keyof typeof PRIORITY]?.label || selected.priority}
                  </span>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    background: 'rgba(59,130,246,0.1)', 
                    color: '#60a5fa',
                    padding: '3px 8px', 
                    borderRadius: 999,
                  }}>
                    {selected.task_type === 'follow_up' ? '📞 متابعة' :
                     selected.task_type === 'call' ? '☎️ مكالمة' :
                     selected.task_type === 'verify_payment' ? '💳 تحقق دفعة' :
                     selected.task_type === 'review_application' ? '📋 مراجعة' :
                     selected.task_type === 'send_proposal' ? '📨 عرض' :
                     selected.task_type === 'collect_payment' ? '💰 تحصيل' :
                     selected.task_type || 'أخرى'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {mode !== 'escalated' && !readOnly && <button style={S.btn('#374151')} onClick={() => { setForm({ ...selected }); setExtraAssignees([]); setShowForm(true); }}>✏️</button>}
                <button style={S.btn('#374151')} onClick={() => setSelected(null)}>✕</button>
              </div>
            </div>

            {/* Task Details Grid */}
            <div style={{ 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid rgba(255,255,255,0.08)', 
              borderRadius: '0.75rem', 
              padding: '1rem', 
              marginBottom: 16 
            }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '12px' 
              }}>
                {/* Due Date */}
                {selected.due_date && (
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.7rem', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>الموعد النهائي</div>
                    <div style={{ 
                      color: new Date(selected.due_date) < new Date() && selected.status !== 'done' ? '#ef4444' : '#e2e8f0', 
                      fontSize: '0.85rem', 
                      fontWeight: 600 
                    }}>
                      📅 {new Date(selected.due_date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
                      {new Date(selected.due_date) < new Date() && selected.status !== 'done' && (
                        <span style={{ color: '#ef4444', fontSize: '0.75rem', marginRight: 6 }}>⏰ متأخر</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Created At */}
                {selected.created_at && (
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.7rem', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>تاريخ الإنشاء</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
                      🕐 {new Date(selected.created_at).toLocaleString('ar-SA', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                {selected.contact_name && (
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.7rem', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>جهة الاتصال</div>
                    <div style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600 }}>
                      👤 {selected.contact_name}
                      {selected.contact_phone && (
                        <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: 2 }}>📱 {selected.contact_phone}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Organization */}
                {selected.org_name && (
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.7rem', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>المنظمة</div>
                    <div style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>🏢 {selected.org_name}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Assignees Section */}
            {selected.assignees && selected.assignees.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: 8, textTransform: 'uppercase', fontWeight: 600 }}>👥 المسؤولون عن المهمة</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {selected.assignees.map((a, i) => (
                    <div key={i} style={{
                      fontSize: '0.82rem',
                      background: a.is_creator ? 'linear-gradient(135deg, rgba(108,99,255,0.2), rgba(139,92,246,0.15))' : 'rgba(255,255,255,0.05)',
                      color: a.is_creator ? '#a5b4fc' : '#cbd5e1',
                      border: a.is_creator ? '1px solid rgba(108,99,255,0.4)' : '1px solid rgba(255,255,255,0.1)',
                      padding: '8px 12px', 
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <span style={{ fontSize: '1.1rem' }}>{a.is_creator ? '👑' : '👤'}</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{a.admin_name || a.admin_email.split('@')[0]}</div>
                        {a.is_creator && (
                          <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>المسؤول الرئيسي</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!selected.assignees?.length && selected.assigned_to && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: 6, textTransform: 'uppercase', fontWeight: 600 }}>المسؤول</div>
                <div style={{ 
                  background: 'rgba(108,99,255,0.1)', 
                  border: '1px solid rgba(108,99,255,0.3)', 
                  borderRadius: 8, 
                  padding: '8px 12px',
                  color: '#a5b4fc',
                  fontSize: '0.85rem',
                  display: 'inline-block'
                }}>
                  📌 {selected.assigned_to}
                </div>
              </div>
            )}

            {/* Escalation Note */}
            {selected.escalation_note && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: 16 }}>
                <div style={{ color: '#fca5a5', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  🔺 سبب التصعيد
                </div>
                <p style={{ color: '#fca5a5', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>{selected.escalation_note}</p>
              </div>
            )}

            {/* Management Decision */}
            {selected.management_decision && (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: 16 }}>
                <div style={{ color: '#34d399', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  ✅ قرار الإدارة: 
                  <span style={{ fontWeight: 600 }}>
                    {selected.management_decision === 'approved' ? 'موافق' :
                     selected.management_decision === 'rejected' ? 'مرفوض' :
                     selected.management_decision === 'needs_info' ? 'يحتاج معلومات' :
                     selected.management_decision}
                  </span>
                </div>
              </div>
            )}

            {/* Outcome */}
            {selected.outcome && (
              <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: 16 }}>
                <div style={{ color: '#60a5fa', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>📝 نتيجة الإغلاق</div>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>{selected.outcome}</p>
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
                <button style={{ ...S.btn('#10b981'), ...(readOnly ? roStyle : {}) }} onClick={() => { if (roAlert()) return; save({ ...selected, status: 'done' }); }}>✅ إغلاق</button>
                <button style={{ ...S.btn('#8b5cf6'), ...(readOnly ? roStyle : {}) }} onClick={() => { if (roAlert()) return; setForm({ ...selected, status: 'escalated', escalated_to: 'management' }); setShowForm(true); }}>🔺 تصعيد</button>
                <button style={{ ...S.btn('#374151'), ...(readOnly ? roStyle : {}) }} onClick={() => { if (roAlert()) return; save({ ...selected, status: 'in_progress' }); }}>⚡ بدأت</button>
                <button
                  onClick={async () => {
                    if (roAlert()) return;
                    if (!confirm(`حذف المهمة "${selected.title}"؟`)) return;
                    const res = await fetch(`${apiBase}/api/crm/tasks/${selected.id}`, { method: 'DELETE', headers });
                    const d = await res.json();
                    if (d.success) { setSelected(null); load(); }
                    else alert(d.error || 'فشل الحذف');
                  }}
                  style={{ background: 'rgba(239,68,68,0.12)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '0.4rem', padding: '0.45rem 0.7rem', cursor: readOnly ? 'not-allowed' : 'pointer', fontSize: '0.82rem', fontWeight: 600, ...(readOnly ? roStyle : {}) }}
                  title={readOnly ? 'وضع المشاهدة فقط' : 'حذف'}
                >🗑️ حذف</button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}