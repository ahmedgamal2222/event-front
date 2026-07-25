'use client';
import { useState, useEffect, useCallback } from 'react';

const S = {
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem', colorScheme: 'dark' } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 } as React.CSSProperties),
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '1rem', padding: '1.25rem' } as React.CSSProperties,
  label: { fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block' } as React.CSSProperties,
};

interface Contact {
  id: number; full_name: string; email?: string; phone?: string; city?: string;
  org_name?: string; is_vip: number; source: string;
  reg_count?: number; tasks_count?: number; payment_count?: number; created_at: string;
}

interface ContactDetail extends Contact {
  whatsapp?: string; role_in_org?: string; notes?: string;
  country_id?: number; city_id?: number;
  problem_statement?: string; execution_stage?: string; revenue_model?: string;
}

interface Registration {
  id: number; event_name?: string; event_name_ar?: string;
  reg_type?: string; status?: string; created_at: string;
}

interface Task {
  id: number; title: string; task_type: string; status: string;
  priority: string; due_date?: string; event_name?: string; assigned_to?: string;
}

interface Timeline {
  record_type: string; detail: string; status: string; at_time: string;
}

interface AdminUser {
  id: number; name: string; email: string; google_picture?: string;
}

interface Country {
  id: number; name_ar: string; name: string;
}

interface Props {
  token: string;
  apiBase: string;
  eventId?: number;
  readOnly?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444',
  open: '#3b82f6', done: '#10b981', cancelled: '#6b7280',
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#ef4444', high: '#f97316', normal: '#6b7280', low: '#374151',
};
const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'عاجل', high: 'مرتفع', normal: 'عادي', low: 'منخفض',
};

export default function AdminCRMUnified({ token, apiBase, eventId, readOnly }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<ContactDetail | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeline, setTimeline] = useState<Timeline[]>([]);
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [detailTab, setDetailTab] = useState<'info' | 'registrations' | 'tasks' | 'timeline'>('info');

  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState<Partial<ContactDetail>>({});
  const [saving, setSaving] = useState(false);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState<any>({ task_type: 'follow_up', priority: 'normal', status: 'open' });
  const [savingTask, setSavingTask] = useState(false);
  const [extraAssignees, setExtraAssignees] = useState<number[]>([]);
  const [assigneeSearch, setAssigneeSearch] = useState('');

  const [showInteraction, setShowInteraction] = useState(false);
  const [interaction, setInteraction] = useState({ channel: 'call', direction: 'outbound', subject: '', summary: '', logged_by: '' });

  const [adminsList, setAdminsList] = useState<AdminUser[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);

  // Syrian cities by country name — predefined for fast UI
  const CITIES_BY_COUNTRY: Record<string, string[]> = {
    'Syria': ['دمشق', 'حلب', 'حمص', 'اللاذقية', 'حماة', 'دير الزور', 'الرقة', 'درعا', 'السويداء', 'القنيطرة', 'إدلب', 'طرطوس', 'الحسكة'],
    'سوريا': ['دمشق', 'حلب', 'حمص', 'اللاذقية', 'حماة', 'دير الزور', 'الرقة', 'درعا', 'السويداء', 'القنيطرة', 'إدلب', 'طرطوس', 'الحسكة'],
    'Saudi Arabia': ['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'أبها'],
    'المملكة العربية السعودية': ['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'أبها'],
    'UAE': ['دبي', 'أبوظبي', 'الشارقة', 'عجمان', 'رأس الخيمة', 'الفجيرة', 'أم القيوين'],
    'الإمارات': ['دبي', 'أبوظبي', 'الشارقة', 'عجمان', 'رأس الخيمة', 'الفجيرة', 'أم القيوين'],
    'Jordan': ['عمّان', 'الزرقاء', 'إربد', 'العقبة', 'السلط', 'مادبا'],
    'الأردن': ['عمّان', 'الزرقاء', 'إربد', 'العقبة', 'السلط', 'مادبا'],
    'Lebanon': ['بيروت', 'طرابلس', 'صيدا', 'صور', 'زحلة'],
    'لبنان': ['بيروت', 'طرابلس', 'صيدا', 'صور', 'زحلة'],
    'Turkey': ['إسطنبول', 'أنقرة', 'إزمير', 'غازي عينتاب'],
    'تركيا': ['إسطنبول', 'أنقرة', 'إزمير', 'غازي عينتاب'],
    'Germany': ['برلين', 'ميونيخ', 'هامبورغ', 'فرانكفورت', 'شتوتغارت'],
    'ألمانيا': ['برلين', 'ميونيخ', 'هامبورغ', 'فرانكفورت', 'شتوتغارت'],
  };

  const selectedCountryName = countries.find(c => c.id === contactForm.country_id)?.name || countries.find(c => c.id === contactForm.country_id)?.name_ar || '';
  const availableCities = CITIES_BY_COUNTRY[selectedCountryName] || [];

  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('admin_user') || '{}') : {};
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // Load admins list for task assignment
  useEffect(() => {
    fetch(`${apiBase}/api/auth/admins-list`, { headers }).then(r => r.json()).then(d => {
      if (d.success) setAdminsList(d.data || []);
    }).catch(() => {});
    // Load countries for dropdown
    if (eventId) {
      fetch(`${apiBase}/api/events/${eventId}/countries`, { headers }).then(r => r.json()).then(d => {
        if (d.success) setCountries(d.data || []);
      }).catch(() => {});
    }
  }, [apiBase, token, eventId]);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (search) params.set('search', search);
      if (eventId) params.set('event_id', String(eventId)); // فلترة per-event
      const res = await fetch(`${apiBase}/api/crm/contacts?${params}`, { headers });
      const d = await res.json();
      if (d.success) { setContacts(d.data); setTotal(d.total); }
    } finally { setLoading(false); }
  }, [page, search, apiBase, token, eventId]);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  const openContact = async (id: number) => {
    const res = await fetch(`${apiBase}/api/crm/contacts/${id}`, { headers });
    const d = await res.json();
    if (d.success) {
      setSelected(d.data);
      setRegistrations(d.registrations || []);
      setTasks(d.tasks || []);
      setTimeline(d.timeline || []);
      setAiSummary(d.ai_summary || null);
      setShowContactForm(false);
      setShowTaskForm(false);
      setDetailTab('info');
    }
    return d;
  };

  const saveContact = async () => {
    setSaving(true);
    try {
      const method = contactForm.id ? 'PUT' : 'POST';
      const url = contactForm.id ? `${apiBase}/api/crm/contacts/${contactForm.id}` : `${apiBase}/api/crm/contacts`;
      const res = await fetch(url, { method, headers, body: JSON.stringify({
        ...contactForm,
        event_id: eventId || null,
      }) });
      const d = await res.json();
      if (d.success) { setShowContactForm(false); loadContacts(); if (selected) openContact(selected.id); }
      else if (d.existing_id) { openContact(d.existing_id); setShowContactForm(false); alert('جهة الاتصال موجودة مسبقاً، تم فتح ملفها.'); }
      else alert(d.error);
    } finally { setSaving(false); }
  };

  const deleteContact = async (id: number, name: string) => {
    if (!confirm(`🗑️ حذف جهة الاتصال "${name}"؟\nسيتم حذف مهامها أيضاً.`)) return;
    const res = await fetch(`${apiBase}/api/crm/contacts/${id}`, { method: 'DELETE', headers });
    const d = await res.json();
    if (d.success) { setSelected(null); loadContacts(); }
    else alert(d.error || 'فشل الحذف');
  };

  const saveTask = async () => {
    if (!selected) return;
    setSavingTask(true);
    try {
      const assignees = extraAssignees.map(id => {
        const a = adminsList.find(ad => ad.id === id);
        return { email: a?.email || '', name: a?.name || '' };
      });
      const res = await fetch(`${apiBase}/api/crm/tasks`, {
        method: 'POST', headers,
        body: JSON.stringify({
          ...taskForm,
          contact_id: selected.id,
          event_id: eventId,
          creator_email: currentUser.email || '',
          creator_name: currentUser.name || '',
          assignees,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setShowTaskForm(false);
        setExtraAssignees([]);
        setTaskForm({ task_type: 'follow_up', priority: 'normal', status: 'open' });
        openContact(selected.id);
      } else alert(d.error);
    } finally { setSavingTask(false); }
  };

  const logInteraction = async () => {
    if (!selected || !interaction.logged_by) return alert('أدخل اسمك أولاً');
    const res = await fetch(`${apiBase}/api/crm/interactions`, {
      method: 'POST', headers,
      body: JSON.stringify({ ...interaction, contact_id: selected.id }),
    });
    const d = await res.json();
    if (d.success) { setShowInteraction(false); openContact(selected.id); }
    else alert(d.error);
  };

  const filteredAdmins = adminsList.filter(a =>
    !assigneeSearch || a.name.toLowerCase().includes(assigneeSearch.toLowerCase()) || a.email.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected || showContactForm ? '350px 1fr' : '1fr', gap: '1.25rem', alignItems: 'start' }}>
      {/* ── LEFT: Contact List ── */}
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            style={{ ...S.inp, flex: 1 }}
            placeholder="🔍 بحث بالاسم أو البريد أو الهاتف..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          {!readOnly && <button style={S.btn()} onClick={() => { setContactForm({}); setShowContactForm(true); setSelected(null); }}>+ جديد</button>}
        </div>

        {loading ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>جاري التحميل...</p>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{total} جهة اتصال / تسجيل</span>
            </div>
            {contacts.map(c => (
              <div key={c.id} onClick={() => openContact(c.id)} style={{
                ...S.card, marginBottom: 8, cursor: 'pointer',
                borderColor: selected?.id === c.id ? '#6C63FF' : 'rgba(108,99,255,0.15)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#6C63FF,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, position: 'relative' }}>
                  {c.full_name?.[0] || '?'}
                  {!!c.tasks_count && (
                    <span style={{ position: 'absolute', top: -4, left: -4, background: '#f59e0b', color: '#0d0b1a', fontSize: '0.6rem', fontWeight: 700, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {c.tasks_count}
                    </span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'white', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.full_name} {c.is_vip ? '⭐' : ''}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.76rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.org_name ? `🏢 ${c.org_name}` : c.email || c.phone || ''}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                    {!!c.reg_count && <span style={{ fontSize: '0.68rem', background: 'rgba(108,99,255,0.2)', color: '#818cf8', padding: '1px 5px', borderRadius: 3 }}>📋 {c.reg_count} تسجيل</span>}
                    {!!c.tasks_count && <span style={{ fontSize: '0.68rem', background: 'rgba(245,158,11,0.2)', color: '#fcd34d', padding: '1px 5px', borderRadius: 3 }}>✅ {c.tasks_count} مهمة</span>}
                    {!!c.payment_count && <span style={{ fontSize: '0.68rem', background: 'rgba(16,185,129,0.2)', color: '#34d399', padding: '1px 5px', borderRadius: 3 }}>💳 دفع</span>}
                  </div>
                </div>
                {/* Quick add task button */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    openContact(c.id).then(() => {
                      setDetailTab('tasks');
                      setShowTaskForm(true);
                    });
                  }}
                  title="إضافة مهمة"
                  style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#fcd34d', borderRadius: '0.35rem', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem', flexShrink: 0 }}
                >
                  + مهمة
                </button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10 }}>
              <button style={S.btn('#374151')} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>السابق</button>
              <span style={{ color: '#94a3b8', alignSelf: 'center', fontSize: '0.82rem' }}>صفحة {page}</span>
              <button style={S.btn('#374151')} disabled={contacts.length < 30} onClick={() => setPage(p => p + 1)}>التالي</button>
            </div>
          </>
        )}
      </div>

      {/* ── RIGHT: Contact Form or Detail ── */}
      {showContactForm ? (
        <div style={S.card}>
          <h3 style={{ color: 'white', marginBottom: 16, fontSize: '1rem' }}>{contactForm.id ? 'تعديل جهة الاتصال' : 'إضافة جهة اتصال'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={S.label}>الاسم الكامل *</label>
              <input style={S.inp} value={contactForm.full_name || ''} onChange={e => setContactForm(f => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div>
              <label style={S.label}>البريد الإلكتروني</label>
              <input style={S.inp} type="email" value={contactForm.email || ''} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label style={S.label}>رقم الهاتف</label>
              <input style={S.inp} value={contactForm.phone || ''} onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label style={S.label}>واتساب</label>
              <input style={S.inp} value={contactForm.whatsapp || ''} onChange={e => setContactForm(f => ({ ...f, whatsapp: e.target.value }))} />
            </div>
            <div>
              <label style={S.label}>الدولة</label>
              {countries.length > 0 ? (
                <select style={S.inp} value={contactForm.country_id ?? ''} onChange={e => setContactForm(f => ({ ...f, country_id: parseInt(e.target.value) || undefined, city: '' }))}>
                  <option value="">-- اختر الدولة --</option>
                  {countries.map(c => <option key={c.id} value={c.id}>{c.name_ar || c.name}</option>)}
                </select>
              ) : (
                <input style={S.inp} placeholder="الدولة" value={contactForm.city || ''} onChange={e => setContactForm(f => ({ ...f, city: e.target.value }))} />
              )}
            </div>
            <div>
              <label style={S.label}>المدينة</label>
              {availableCities.length > 0 ? (
                <select style={S.inp} value={contactForm.city || ''} onChange={e => setContactForm(f => ({ ...f, city: e.target.value }))}>
                  <option value="">-- اختر المدينة --</option>
                  {availableCities.map(city => <option key={city} value={city}>{city}</option>)}
                  <option value="أخرى">أخرى...</option>
                </select>
              ) : (
                <input style={S.inp} placeholder="المدينة" value={contactForm.city || ''} onChange={e => setContactForm(f => ({ ...f, city: e.target.value }))} />
              )}
            </div>
            <div>
              <label style={S.label}>الصفة في المنظمة</label>
              <input style={S.inp} value={contactForm.role_in_org || ''} onChange={e => setContactForm(f => ({ ...f, role_in_org: e.target.value }))} />
            </div>
            <div>
              <label style={S.label}>VIP؟</label>
              <select style={S.inp} value={contactForm.is_vip ? '1' : '0'} onChange={e => setContactForm(f => ({ ...f, is_vip: parseInt(e.target.value) }))}>
                <option value="0">لا</option>
                <option value="1">نعم ⭐</option>
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={S.label}>ملاحظات</label>
              <textarea style={{ ...S.inp, height: 72, resize: 'vertical' }} value={contactForm.notes || ''} onChange={e => setContactForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button style={S.btn()} onClick={saveContact} disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ'}</button>
            <button style={S.btn('#374151')} onClick={() => setShowContactForm(false)}>إلغاء</button>
          </div>
        </div>
      ) : selected ? (
        <div>
          {/* Contact Header */}
          <div style={{ ...S.card, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg,#6C63FF,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                  {selected.full_name?.[0] || '?'}
                </div>
                <div>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>{selected.full_name} {selected.is_vip ? '⭐' : ''}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{selected.org_name || selected.email || selected.phone}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {!readOnly && <button style={S.btn('#374151')} onClick={() => { setContactForm({ ...selected }); setShowContactForm(true); }}>✏️ تعديل</button>}
                {!readOnly && <button style={S.btn()} onClick={() => { setShowTaskForm(true); setDetailTab('tasks'); }}>+ مهمة</button>}
                <button style={S.btn('#1e293b')} onClick={() => setShowInteraction(true)}>💬</button>
                {!readOnly && (
                  <button
                    onClick={() => deleteContact(selected.id, selected.full_name)}
                    style={{ background: 'rgba(239,68,68,0.12)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '0.4rem', padding: '0.45rem 0.7rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
                  >🗑️</button>
                )}
                <button style={{ ...S.btn('#374151'), padding: '0.45rem 0.6rem' }} onClick={() => { setSelected(null); setShowTaskForm(false); }}>✕</button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            {[
              { key: 'info', label: '👤 معلومات' },
              { key: 'registrations', label: `📋 التسجيلات (${registrations.length})` },
              { key: 'tasks', label: `✅ المهام (${tasks.length})` },
              { key: 'timeline', label: '🕐 الخط الزمني' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setDetailTab(tab.key as any)} style={{
                background: detailTab === tab.key ? 'rgba(108,99,255,0.25)' : 'transparent',
                color: detailTab === tab.key ? '#818cf8' : '#64748b',
                border: detailTab === tab.key ? '1px solid rgba(108,99,255,0.4)' : '1px solid transparent',
                borderRadius: '0.4rem', padding: '0.3rem 0.7rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: detailTab === tab.key ? 600 : 400,
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={S.card}>
            {/* ── Info Tab ── */}
            {detailTab === 'info' && (
              <>
                {aiSummary && (
                  <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '0.75rem', padding: '0.75rem', marginBottom: 14 }}>
                    <span style={{ color: '#a78bfa', fontSize: '0.8rem', fontWeight: 600 }}>🤖 ملخص AI</span>
                    <p style={{ color: '#e2e8f0', fontSize: '0.85rem', margin: '4px 0 0' }}>{aiSummary.summary}</p>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[['📧', selected.email], ['📱', selected.phone], ['💬', selected.whatsapp], ['📍', selected.city], ['🏢', selected.org_name], ['👤', selected.role_in_org]].filter(([, v]) => v).map(([icon, val], i) => (
                    <div key={i} style={{ color: '#cbd5e1', fontSize: '0.83rem' }}><span style={{ opacity: 0.6 }}>{icon} </span>{val}</div>
                  ))}
                </div>
                {selected.notes && <div style={{ marginTop: 10, background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem', padding: '8px 12px', color: '#cbd5e1', fontSize: '0.82rem' }}>📝 {selected.notes}</div>}
              </>
            )}

            {/* ── Registrations Tab ── */}
            {detailTab === 'registrations' && (
              <div>
                {registrations.length === 0 ? (
                  <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem 0', margin: 0 }}>لا توجد تسجيلات</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {registrations.map(reg => {
                      // Find tasks linked to this registration
                      const regTasks = tasks.filter((t: any) => t.registration_id === reg.id);
                      return (
                        <div key={reg.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem', padding: '10px 12px', borderRight: '3px solid #6C63FF' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ color: 'white', fontWeight: 600, fontSize: '0.88rem' }}>{reg.event_name_ar || reg.event_name || `تسجيل #${reg.id}`}</div>
                              <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                                {reg.reg_type && <span style={{ fontSize: '0.72rem', background: 'rgba(108,99,255,0.2)', color: '#818cf8', padding: '2px 8px', borderRadius: 4 }}>{reg.reg_type}</span>}
                                {reg.status && <span style={{ fontSize: '0.72rem', background: `${STATUS_COLORS[reg.status] || '#374151'}20`, color: STATUS_COLORS[reg.status] || '#94a3b8', padding: '2px 8px', borderRadius: 4 }}>{reg.status}</span>}
                                <span style={{ fontSize: '0.7rem', color: '#4b5563' }}>{new Date(reg.created_at).toLocaleDateString('ar-SA')}</span>
                              </div>
                            </div>
                          </div>
                          {/* Tasks linked to this registration */}
                          {regTasks.length > 0 && (
                            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                              <div style={{ color: '#64748b', fontSize: '0.72rem', marginBottom: 4 }}>مهام مرتبطة:</div>
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {regTasks.map((t: any) => (
                                  <span key={t.id} style={{ fontSize: '0.7rem', background: `${PRIORITY_COLORS[t.priority] || '#374151'}20`, color: PRIORITY_COLORS[t.priority] || '#94a3b8', padding: '2px 8px', borderRadius: 4 }}>
                                    ✅ {t.title}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Tasks Tab ── */}
            {detailTab === 'tasks' && (
              <div>
                {/* Quick Add Task Form */}
                {showTaskForm && (
                  <div style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.25)', borderRadius: '0.75rem', padding: '1rem', marginBottom: 14 }}>
                    <div style={{ color: '#818cf8', fontWeight: 600, fontSize: '0.88rem', marginBottom: 12 }}>➕ مهمة جديدة لـ {selected.full_name}</div>
                    
                    {currentUser.email && (
                      <div style={{ background: 'rgba(108,99,255,0.1)', borderRadius: '0.4rem', padding: '0.4rem 0.75rem', marginBottom: 10, fontSize: '0.78rem', color: '#818cf8' }}>
                        👑 المسؤول الرئيسي: <strong>{currentUser.name || currentUser.email}</strong>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div style={{ gridColumn: '1/-1' }}>
                        <label style={S.label}>العنوان *</label>
                        <input style={S.inp} value={taskForm.title || ''} onChange={e => setTaskForm((f: any) => ({ ...f, title: e.target.value }))} placeholder="وصف المهمة..." />
                      </div>
                      <div>
                        <label style={S.label}>النوع</label>
                        <select style={S.inp} value={taskForm.task_type} onChange={e => setTaskForm((f: any) => ({ ...f, task_type: e.target.value }))}>
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
                        <select style={S.inp} value={taskForm.priority} onChange={e => setTaskForm((f: any) => ({ ...f, priority: e.target.value }))}>
                          <option value="urgent">🔴 عاجل</option>
                          <option value="high">🟠 مرتفع</option>
                          <option value="normal">🟡 عادي</option>
                          <option value="low">⚪ منخفض</option>
                        </select>
                      </div>
                      <div>
                        <label style={S.label}>الموعد النهائي</label>
                        <input style={{ ...S.inp, colorScheme: 'dark' }} type="date" value={taskForm.due_date || ''} onChange={e => setTaskForm((f: any) => ({ ...f, due_date: e.target.value }))} />
                      </div>
                      {/* Admin dropdown for extra assignees */}
                      <div style={{ gridColumn: '1/-1' }}>
                        <label style={S.label}>إضافة مسؤولين إضافيين (اختياري)</label>
                        <input style={{ ...S.inp, marginBottom: 6 }} placeholder="🔍 ابحث عن مسؤول..." value={assigneeSearch} onChange={e => setAssigneeSearch(e.target.value)} />
                        {assigneeSearch && (
                          <div style={{ background: '#0d0b1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', maxHeight: 150, overflowY: 'auto', marginBottom: 8 }}>
                            {filteredAdmins.filter(a => a.email !== currentUser.email).map(admin => (
                              <div key={admin.id} onClick={() => {
                                if (!extraAssignees.includes(admin.id)) setExtraAssignees(prev => [...prev, admin.id]);
                                setAssigneeSearch('');
                              }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(108,99,255,0.15)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                {admin.google_picture ? <img src={admin.google_picture} style={{ width: 26, height: 26, borderRadius: '50%' }} alt="" /> : <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#6C63FF30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#818cf8' }}>{admin.name?.[0]}</div>}
                                <div>
                                  <div style={{ color: 'white', fontSize: '0.82rem' }}>{admin.name}</div>
                                  <div style={{ color: '#64748b', fontSize: '0.72rem' }}>{admin.email}</div>
                                </div>
                                {extraAssignees.includes(admin.id) && <span style={{ marginRight: 'auto', color: '#10b981', fontSize: '0.8rem' }}>✓</span>}
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
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button style={S.btn()} onClick={saveTask} disabled={savingTask || !taskForm.title}>{savingTask ? 'جاري الحفظ...' : '✅ إنشاء المهمة'}</button>
                      <button style={S.btn('#374151')} onClick={() => setShowTaskForm(false)}>إلغاء</button>
                    </div>
                  </div>
                )}

                {!showTaskForm && (
                  <button style={{ ...S.btn(), width: '100%', marginBottom: 12, justifyContent: 'center', display: 'flex' }} onClick={() => setShowTaskForm(true)}>
                    + إضافة مهمة لـ {selected.full_name}
                  </button>
                )}

                {tasks.length === 0 ? (
                  <p style={{ color: '#6b7280', textAlign: 'center', padding: '1.5rem 0', margin: 0 }}>لا توجد مهام مرتبطة</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {tasks.map(task => {
                      const pc = PRIORITY_COLORS[task.priority] || '#6b7280';
                      const overdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
                      return (
                        <div key={task.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem', padding: '10px 12px', borderRight: `3px solid ${pc}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ color: overdue ? '#fca5a5' : 'white', fontWeight: 600, fontSize: '0.88rem', flex: 1 }}>{task.title}</div>
                            <button
                              onClick={async () => {
                                if (!confirm(`حذف المهمة "${task.title}"؟`)) return;
                                const res = await fetch(`${apiBase}/api/crm/tasks/${task.id}`, { method: 'DELETE', headers });
                                const d = await res.json();
                                if (d.success) openContact(selected!.id);
                                else alert(d.error || 'فشل الحذف');
                              }}
                              style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.8rem', padding: '0 0 0 6px', flexShrink: 0 }}
                              title="حذف المهمة"
                            >🗑️</button>
                          </div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.7rem', background: `${pc}20`, color: pc, padding: '1px 6px', borderRadius: 3 }}>{PRIORITY_LABELS[task.priority]}</span>
                            <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.06)', color: '#94a3b8', padding: '1px 6px', borderRadius: 3 }}>{task.status}</span>
                            {task.due_date && <span style={{ fontSize: '0.7rem', color: overdue ? '#ef4444' : '#4b5563' }}>{overdue ? '⏰ ' : '📅 '}{task.due_date}</span>}
                            {task.assigned_to && <span style={{ fontSize: '0.7rem', color: '#4b5563' }}>📌 {task.assigned_to}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Timeline Tab ── */}
            {detailTab === 'timeline' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
                {timeline.length === 0 ? (
                  <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem 0', margin: 0 }}>لا توجد سجلات</p>
                ) : timeline.map((entry, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem', padding: '8px 10px', borderRight: `3px solid ${STATUS_COLORS[entry.status] || '#374151'}` }}>
                    <div style={{ color: '#e2e8f0', fontSize: '0.82rem' }}>{entry.record_type}: {entry.detail}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.72rem', marginTop: 2 }}>{entry.status} · {new Date(entry.at_time).toLocaleDateString('ar-SA')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interaction Modal */}
          {showInteraction && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ ...S.card, width: 480, maxWidth: '95vw' }}>
                <h3 style={{ color: 'white', marginBottom: 16 }}>📝 تسجيل تواصل مع {selected.full_name}</h3>
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
                      <option value="outbound">صادر</option>
                      <option value="inbound">وارد</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={S.label}>الموضوع</label>
                    <input style={S.inp} value={interaction.subject} onChange={e => setInteraction(i => ({ ...i, subject: e.target.value }))} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={S.label}>الملخص</label>
                    <textarea style={{ ...S.inp, height: 70, resize: 'vertical' }} value={interaction.summary} onChange={e => setInteraction(i => ({ ...i, summary: e.target.value }))} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={S.label}>سجّله (اسمك) *</label>
                    <select style={S.inp} value={interaction.logged_by} onChange={e => setInteraction(i => ({ ...i, logged_by: e.target.value }))}>
                      <option value="">-- اختر المسؤول --</option>
                      {adminsList.map(a => <option key={a.id} value={a.name || a.email}>{a.name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button style={S.btn()} onClick={logInteraction}>حفظ</button>
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
