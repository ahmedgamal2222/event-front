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
  city?: string; country?: string; reg_type?: string; type?: string; reg_types?: string; status: string;
  created_at: string; contact_id?: number;
  participation_reason?: string; work_field?: string;
}

// Returns location string: for non-Syria users shows "Country / City", for Syria shows city only
function cityDisplay(r: Reg): string {
  if (r.country && r.country !== 'Syria') {
    const parts = [r.country];
    if (r.city && r.city !== 'خارج سوريا') parts.push(r.city);
    return parts.join(' / ');
  }
  return r.city || '—';
}

interface AdminUser { id: number; name: string; email: string; google_picture?: string; }

interface Props {
  token: string;
  eventId: number;
  readOnly?: boolean;
  onInteractionSaved?: () => void;
}

// Contact Interaction Log Component
function ContactInteractionLog({ contactId, contactName, token, apiBase }: { contactId: number; contactName: string; token: string; apiBase: string }) {
  const [interactions, setInteractions] = useState<any[]>([]);
  const [filteredInteractions, setFilteredInteractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, calls: 0, meetings: 0, emails: 0, whatsapp: 0, other: 0 });
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!contactId) return;
    setLoading(true);
    fetch(`${apiBase}/api/crm/contacts/${contactId}/interactions`, { headers })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const data = d.data || [];
          setInteractions(data);
          setFilteredInteractions(data);
          
          // Calculate stats
          const stats = {
            total: data.length,
            calls: data.filter((i: any) => i.channel === 'call').length,
            meetings: data.filter((i: any) => i.channel === 'meeting').length,
            emails: data.filter((i: any) => i.channel === 'email').length,
            whatsapp: data.filter((i: any) => i.channel === 'whatsapp').length,
            other: data.filter((i: any) => !['call', 'meeting', 'email', 'whatsapp'].includes(i.channel)).length,
          };
          setStats(stats);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [contactId, apiBase, token]);

  // Apply filters
  useEffect(() => {
    let filtered = [...interactions];
    
    if (channelFilter !== 'all') {
      filtered = filtered.filter(i => i.channel === channelFilter);
    }
    
    if (directionFilter !== 'all') {
      filtered = filtered.filter(i => i.direction === directionFilter);
    }
    
    setFilteredInteractions(filtered);
  }, [channelFilter, directionFilter, interactions]);

  // Export interactions as CSV
  const exportToCSV = () => {
    const headers = ['التاريخ', 'القناة', 'الاتجاه', 'الموضوع', 'الملخص', 'المسؤول'];
    const rows = filteredInteractions.map(i => [
      new Date(i.created_at).toLocaleString('ar-SA'),
      channelIcons[i.channel] || i.channel,
      directionLabels[i.direction] || i.direction,
      i.subject,
      i.summary || '',
      i.logged_by || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `سجل_التواصل_${contactName}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const channelIcons: Record<string, string> = {
    call: '📞',
    whatsapp: '💬',
    email: '📧',
    meeting: '🤝',
    sms: '📱',
    other: '📝'
  };

  const directionLabels: Record<string, string> = {
    outbound: '↗️ صادر',
    inbound: '↙️ وارد'
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
        ⏳ جاري تحميل سجل التواصل...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(108,99,255,0.1))', 
          border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: 10, 
          padding: '12px 14px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          opacity: channelFilter === 'all' && directionFilter === 'all' ? 1 : 0.5
        }}
        onClick={() => { setChannelFilter('all'); setDirectionFilter('all'); }}
        >
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#a78bfa', marginBottom: 4 }}>{stats.total}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>إجمالي التواصلات</div>
        </div>
        <div style={{ 
          background: 'rgba(59,130,246,0.1)', 
          border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: 10, 
          padding: '12px 14px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          opacity: channelFilter === 'call' || channelFilter === 'all' ? 1 : 0.5
        }}
        onClick={() => setChannelFilter(channelFilter === 'call' ? 'all' : 'call')}
        >
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#60a5fa', marginBottom: 4 }}>📞 {stats.calls}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>مكالمات</div>
        </div>
        <div style={{ 
          background: 'rgba(16,185,129,0.1)', 
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 10, 
          padding: '12px 14px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          opacity: channelFilter === 'meeting' || channelFilter === 'all' ? 1 : 0.5
        }}
        onClick={() => setChannelFilter(channelFilter === 'meeting' ? 'all' : 'meeting')}
        >
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#34d399', marginBottom: 4 }}>🤝 {stats.meetings}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>اجتماعات</div>
        </div>
        <div style={{ 
          background: 'rgba(14,165,233,0.1)', 
          border: '1px solid rgba(14,165,233,0.3)',
          borderRadius: 10, 
          padding: '12px 14px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          opacity: channelFilter === 'email' || channelFilter === 'all' ? 1 : 0.5
        }}
        onClick={() => setChannelFilter(channelFilter === 'email' ? 'all' : 'email')}
        >
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#38bdf8', marginBottom: 4 }}>📧 {stats.emails}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>بريد إلكتروني</div>
        </div>
        <div style={{ 
          background: 'rgba(34,197,94,0.1)', 
          border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: 10, 
          padding: '12px 14px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          opacity: channelFilter === 'whatsapp' || channelFilter === 'all' ? 1 : 0.5
        }}
        onClick={() => setChannelFilter(channelFilter === 'whatsapp' ? 'all' : 'whatsapp')}
        >
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#4ade80', marginBottom: 4 }}>💬 {stats.whatsapp}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>واتساب</div>
        </div>
      </div>

      {/* Filters and Export */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
        padding: '12px 14px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>الاتجاه:</span>
          <button
            onClick={() => setDirectionFilter('all')}
            style={{
              background: directionFilter === 'all' ? 'rgba(108,99,255,0.2)' : 'transparent',
              border: `1px solid ${directionFilter === 'all' ? '#6C63FF' : 'rgba(255,255,255,0.1)'}`,
              color: directionFilter === 'all' ? '#a5b4fc' : '#94a3b8',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >الكل</button>
          <button
            onClick={() => setDirectionFilter('outbound')}
            style={{
              background: directionFilter === 'outbound' ? 'rgba(59,130,246,0.2)' : 'transparent',
              border: `1px solid ${directionFilter === 'outbound' ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
              color: directionFilter === 'outbound' ? '#60a5fa' : '#94a3b8',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >↗️ صادر</button>
          <button
            onClick={() => setDirectionFilter('inbound')}
            style={{
              background: directionFilter === 'inbound' ? 'rgba(16,185,129,0.2)' : 'transparent',
              border: `1px solid ${directionFilter === 'inbound' ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
              color: directionFilter === 'inbound' ? '#34d399' : '#94a3b8',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >↙️ وارد</button>
        </div>

        <button
          onClick={exportToCSV}
          disabled={filteredInteractions.length === 0}
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(108,99,255,0.1))',
            border: '1px solid rgba(139,92,246,0.3)',
            color: '#a78bfa',
            borderRadius: 6,
            padding: '6px 14px',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: filteredInteractions.length === 0 ? 'not-allowed' : 'pointer',
            opacity: filteredInteractions.length === 0 ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          📥 تصدير CSV
        </button>
      </div>

      {/* Interaction Timeline */}
      <div style={{ marginTop: 8 }}>
        <h4 style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 12, fontWeight: 600 }}>
          🕐 السجل الزمني {channelFilter !== 'all' || directionFilter !== 'all' ? '(مُصفّى)' : 'الكامل'} ({filteredInteractions.length} تواصل)
        </h4>
        
        {filteredInteractions.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem 1rem', 
            color: '#6b7280',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 10,
            border: '1px dashed rgba(255,255,255,0.1)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>💬</div>
            <div style={{ fontSize: '0.9rem', marginBottom: 4 }}>
              {interactions.length === 0 ? 'لا يوجد سجل تواصل بعد' : 'لا توجد نتائج للفلتر المحدد'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>
              {interactions.length === 0 
                ? `ابدأ بتسجيل أول تواصل مع ${contactName}`
                : 'جرب تغيير الفلتر لعرض نتائج مختلفة'
              }
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredInteractions.map((interaction, idx) => (
              <div 
                key={interaction.id || idx}
                style={{ 
                  background: 'rgba(255,255,255,0.04)', 
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRight: '3px solid #8b5cf6',
                  borderRadius: 8, 
                  padding: '12px 14px',
                  position: 'relative'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.3rem' }}>{channelIcons[interaction.channel] || '📝'}</span>
                    <div>
                      <div style={{ color: 'white', fontWeight: 600, fontSize: '0.88rem' }}>
                        {interaction.subject}
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          background: 'rgba(139,92,246,0.2)', 
                          color: '#a78bfa',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontWeight: 600
                        }}>
                          {directionLabels[interaction.direction] || interaction.direction}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          بواسطة: {interaction.logged_by || 'غير محدد'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textAlign: 'left' }}>
                    {new Date(interaction.created_at).toLocaleDateString('ar-SA', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                {/* Summary */}
                {interaction.summary && (
                  <div style={{ 
                    background: 'rgba(0,0,0,0.2)', 
                    borderRadius: 6, 
                    padding: '8px 10px',
                    color: '#cbd5e1',
                    fontSize: '0.8rem',
                    lineHeight: 1.5
                  }}>
                    {interaction.summary}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminEventRegistrations({ token, eventId, readOnly, onInteractionSaved }: Props) {

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
  const [formConfigTypes, setFormConfigTypes] = useState<string[]>([]);
  const [formConfigLabels, setFormConfigLabels] = useState<Record<string, string>>({});

  // Add new type feature
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeKey, setNewTypeKey] = useState('');
  const [newTypeLabel, setNewTypeLabel] = useState('');
  const [newTypeIcon, setNewTypeIcon] = useState('👤');
  const [savingNewType, setSavingNewType] = useState(false);

  // Interaction logging
  const [showInteraction, setShowInteraction] = useState(false);
  const [interactionForm, setInteractionForm] = useState({ channel: 'call', direction: 'outbound', subject: '', summary: '' });
  const [savingInteraction, setSavingInteraction] = useState(false);

  // Contact interaction log
  const [showContactLog, setShowContactLog] = useState(false);
  const [selectedContactForLog, setSelectedContactForLog] = useState<{ id: number; name: string } | null>(null);
  const [interactionStats, setInteractionStats] = useState<{ total: number; last: string | null }>({ total: 0, last: null });

  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('admin_user') || '{}') : {};
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // Load admins list
  useEffect(() => {
    fetch(`${API_BASE}/api/auth/admins-list`, { headers }).then(r => r.json()).then(d => {
      if (d.success) setAdminsList(d.data || []);
    }).catch(() => {});
  }, [token]);

  // Load form_config types for the type dropdown
  useEffect(() => {
    if (!eventId) return;
    fetch(`${API_BASE}/api/events/${eventId}`, { headers }).then(r => r.json()).then(d => {
      if (d.data?.form_config) {
        try {
          const fc = JSON.parse(d.data.form_config);
          setFormConfigTypes(fc.enabled_types || []);
          setFormConfigLabels(fc.type_labels || {});
        } catch {}
      }
    }).catch(() => {});
  }, [eventId, token]);

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

  const changeType = async (id: number, reg_type: string) => {
    // If new primary type was in additional types, remove it from there
    const reg = regs.find(r => r.id === id);
    const newRegTypes = reg?.reg_types
      ? reg.reg_types.split(',').filter(t => t && t !== reg_type).join(',')
      : null;

    setRegs(prev => prev.map(r => r.id === id ? { ...r, reg_type, type: reg_type, ...(newRegTypes !== null ? { reg_types: newRegTypes } : {}) } : r));
    if (selected?.id === id) setSelected(s => s ? { ...s, reg_type, type: reg_type, ...(newRegTypes !== null ? { reg_types: newRegTypes } : {}) } : null);

    await fetch(`${API_BASE}/api/events/${eventId}/registrations/${id}`, {
      method: 'PUT', headers,
      body: JSON.stringify({ reg_type, ...(newRegTypes !== null ? { reg_types: newRegTypes } : {}) }),
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
          // Load interaction stats
          loadInteractionStats(contactId);
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

  // Load interaction statistics for a contact
  const loadInteractionStats = async (contactId: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/crm/contacts/${contactId}/interactions`, { headers });
      const d = await res.json();
      if (d.success && d.data) {
        const interactions = d.data || [];
        setInteractionStats({
          total: interactions.length,
          last: interactions.length > 0 ? interactions[0].created_at : null
        });
      }
    } catch {}
  };

  // Load stats when selected changes and has contact_id
  useEffect(() => {
    if (selected?.contact_id) {
      loadInteractionStats(selected.contact_id);
    } else {
      setInteractionStats({ total: 0, last: null });
    }
  }, [selected?.contact_id]);

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
          admin_email: currentUser.email || '',
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

  // Add new registration type
  const addNewType = async () => {
    if (!newTypeKey || !newTypeLabel) {
      alert('يرجى ملء اسم المفتاح والتسمية');
      return;
    }
    
    // Validate key format (no spaces, lowercase)
    const cleanKey = newTypeKey.toLowerCase().replace(/\s+/g, '_');
    if (formConfigTypes.includes(cleanKey) || REG_TYPE_CONFIG[cleanKey]) {
      alert('هذا النوع موجود مسبقاً');
      return;
    }

    setSavingNewType(true);
    try {
      // Update form_config in event
      const newTypes = [...formConfigTypes, cleanKey];
      const newLabels = { ...formConfigLabels, [cleanKey]: newTypeLabel };
      
      // Add to local REG_TYPE_CONFIG
      (REG_TYPE_CONFIG as any)[cleanKey] = {
        label: newTypeLabel,
        color: '#6b7280',
        icon: newTypeIcon || '👤'
      };

      const res = await fetch(`${API_BASE}/api/events/${eventId}`, { headers });
      const eventData = await res.json();
      
      let formConfig: any = {};
      if (eventData.data?.form_config) {
        try {
          formConfig = JSON.parse(eventData.data.form_config);
        } catch {}
      }

      formConfig.enabled_types = newTypes;
      formConfig.type_labels = newLabels;

      await fetch(`${API_BASE}/api/events/${eventId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ form_config: JSON.stringify(formConfig) })
      });

      setFormConfigTypes(newTypes);
      setFormConfigLabels(newLabels);
      setShowAddType(false);
      setNewTypeKey('');
      setNewTypeLabel('');
      setNewTypeIcon('👤');
      alert('✅ تم إضافة النوع بنجاح');
    } catch (err) {
      alert('حدث خطأ في الإضافة');
    } finally {
      setSavingNewType(false);
    }
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
        if (onInteractionSaved) {
          onInteractionSaved();
        } else {
          alert('✅ تم تسجيل التواصل');
        }
      } else alert(d.error || 'خطأ في التسجيل');
    } finally { setSavingInteraction(false); }
  };

  const filteredAdmins = adminsList.filter(a =>
    !assigneeSearch || a.name.toLowerCase().includes(assigneeSearch.toLowerCase()) || a.email.includes(assigneeSearch)
  );

  const getName = (r: Reg) => r.full_name || r.name || '—';
  const getTypeInfo = (r: Reg) => {
    const key = r.reg_type || r.type || 'general';
    const base = REG_TYPE_CONFIG[key] || { label: key, color: '#6b7280', icon: '👤' };
    // Use formConfig label if available (respects admin's custom labels/deletions)
    if (formConfigLabels[key]) return { ...base, label: formConfigLabels[key] };
    return base;
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
                    { h: 'الاسم',       w: '' },
                    { h: 'البريد',      w: '' },
                    { h: 'النوع',       w: '120px' },
                    { h: 'المدينة',     w: '80px' },
                    { h: 'الحالة',      w: '90px' },
                    { h: 'تغيير الحالة', w: '110px' },
                    { h: '',             w: '50px' },
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
                      {/* النوع — compact chips + dropdown */}
                      <td style={{ padding: '0.4rem 0.7rem', minWidth: 110 }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {/* Primary type — dropdown filtered to exclude already-added extra types */}
                          <select
                            value={reg.reg_type || reg.type || 'general'}
                            onChange={e => { if (roAlert()) return; changeType(reg.id, e.target.value); }}
                            disabled={readOnly}
                            style={{
                              background: `${ti.color}15`, border: `1px solid ${ti.color}50`,
                              borderRadius: '0.4rem', color: ti.color, fontSize: '0.72rem',
                              padding: '0.25rem 0.5rem', outline: 'none', fontWeight: 700,
                              cursor: readOnly ? 'not-allowed' : 'pointer', maxWidth: 140,
                              ...(readOnly ? roStyle : {}),
                            }}
                            title={readOnly ? 'وضع المشاهدة فقط' : 'تغيير النوع الأساسي'}
                          >
                            {(formConfigTypes.length > 0 ? formConfigTypes : Object.keys(REG_TYPE_CONFIG))
                              .map(t => {
                                const info = REG_TYPE_CONFIG[t] || { label: formConfigLabels[t] || t, color: '#6b7280', icon: '👤' };
                                const inAdditional = (reg.reg_types || '').split(',').filter(Boolean).includes(t);
                                const isCurrent = (reg.reg_type || reg.type || 'general') === t;
                                return (
                                  <option key={t} value={t}>
                                    {info.icon} {formConfigLabels[t] || info.label}{inAdditional && !isCurrent ? ' ←إضافي' : ''}
                                  </option>
                                );
                              })
                            }
                          </select>
                          {/* Additional types — compact colored chips */}
                          {reg.reg_types && reg.reg_types.split(',').filter(Boolean).length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                              {reg.reg_types.split(',').filter(Boolean).map(t => {
                                const info = REG_TYPE_CONFIG[t] || { label: formConfigLabels[t] || t, color: '#6b7280', icon: '👤' };
                                return (
                                  <span key={t} style={{
                                    fontSize: '0.6rem', fontWeight: 600,
                                    background: `${info.color}18`, color: info.color,
                                    border: `1px solid ${info.color}40`, borderRadius: 99,
                                    padding: '2px 6px', whiteSpace: 'nowrap',
                                    display: 'inline-flex', alignItems: 'center', gap: 2,
                                  }}>
                                    {info.icon} {formConfigLabels[t] || info.label}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          {/* Quick add type button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (roAlert()) return;
                              setSelected(reg);
                              const cur = reg.reg_types ? reg.reg_types.split(',').filter(Boolean) : [];
                              setPendingTypes(cur);
                              setShowTypeEdit(true);
                            }}
                            disabled={readOnly}
                            style={{
                              background: 'rgba(16,185,129,0.12)',
                              border: '1px solid rgba(16,185,129,0.3)',
                              color: '#34d399',
                              borderRadius: 4,
                              padding: '2px 6px',
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              cursor: readOnly ? 'not-allowed' : 'pointer',
                              marginTop: 2,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 2,
                              ...(readOnly ? roStyle : {})
                            }}
                            title={readOnly ? 'وضع المشاهدة فقط' : 'إضافة نوع إضافي'}
                          >
                            ➕ نوع
                          </button>
                        </div>
                      </td>
                      {/* المدينة */}
                      <td style={{ padding: '0.55rem 0.85rem', color: '#64748b', fontSize: '0.75rem' }}>{cityDisplay(reg)}</td>
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
                ['🏙️', cityDisplay(selected)],
                ['📋', getType(selected)],
                ['📅', new Date(selected.created_at).toLocaleDateString('ar-SA')],
              ].map(([icon, val], i) => (
                <div key={i} style={{ color: '#cbd5e1', fontSize: '0.8rem' }}><span style={{ opacity: 0.6 }}>{icon} </span>{val}</div>
              ))}
            </div>

            {/* Additional types — chips with ✕ to remove */}
            {selected.reg_types && selected.reg_types.split(',').filter(Boolean).length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontSize: '0.72rem', alignSelf: 'center' }}>أنواع إضافية:</span>
                {selected.reg_types.split(',').filter(Boolean).map(t => {
                  const info = REG_TYPE_CONFIG[t] || { label: formConfigLabels[t] || t, color: '#6b7280', icon: '👤' };
                  const lbl = formConfigLabels[t] || info.label;
                  return (
                    <span key={t} style={{ fontSize: '0.72rem', background: `${info.color}20`, color: info.color, border: `1px solid ${info.color}40`, borderRadius: 99, padding: '2px 8px 2px 4px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {info.icon} {lbl}
                      {/* Remove this individual extra type */}
                      <button
                        onClick={async () => {
                          const newTypes = selected.reg_types!.split(',').filter(x => x && x !== t).join(',');
                          await fetch(`${API_BASE}/api/events/${eventId}/registrations/${selected.id}`, {
                            method: 'PUT', headers, body: JSON.stringify({ reg_types: newTypes }),
                          });
                          setRegs(prev => prev.map(r => r.id === selected.id ? { ...r, reg_types: newTypes } : r));
                          setSelected(s => s ? { ...s, reg_types: newTypes } : null);
                        }}
                        style={{ background: 'none', border: 'none', color: info.color, cursor: 'pointer', padding: 0, fontSize: '0.7rem', lineHeight: 1, opacity: 0.7 }}
                        title={`حذف "${lbl}"`}
                      >✕</button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Interaction quick stats */}
            {(converted.has(selected.id) || selected.contact_id) && interactionStats.total > 0 && (
              <div style={{ 
                marginTop: 10, 
                padding: '8px 12px', 
                background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(108,99,255,0.05))', 
                border: '1px solid rgba(139,92,246,0.2)',
                borderRadius: '0.5rem', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.1rem' }}>💬</span>
                  <div>
                    <div style={{ color: '#a78bfa', fontSize: '0.8rem', fontWeight: 600 }}>
                      {interactionStats.total} تواصل سابق
                    </div>
                    {interactionStats.last && (
                      <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: 2 }}>
                        آخر تواصل: {new Date(interactionStats.last).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!selected.contact_id) {
                      alert('⚠️ هذا التسجيل لا يحتوي على معرّف جهة اتصال (contact_id).\nيجب تحويل التسجيل إلى جهة اتصال أولاً.');
                      return;
                    }
                    setSelectedContactForLog({ id: selected.contact_id, name: getName(selected) });
                    setShowContactLog(true);
                  }}
                  style={{
                    background: 'rgba(139,92,246,0.2)',
                    border: '1px solid rgba(139,92,246,0.4)',
                    color: '#a78bfa',
                    borderRadius: 6,
                    padding: '4px 10px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  عرض الكل →
                </button>
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

              {/* Contact interaction log button */}
              {(converted.has(selected.id) || selected.contact_id) && (
                <button
                  onClick={() => {
                    if (!selected.contact_id) {
                      alert('⚠️ هذا التسجيل لا يحتوي على معرّف جهة اتصال (contact_id).\nيجب تحويل التسجيل إلى جهة اتصال أولاً.');
                      return;
                    }
                    setSelectedContactForLog({
                      id: selected.contact_id,
                      name: getName(selected)
                    });
                    setShowContactLog(true);
                  }}
                  style={{
                    background: 'rgba(139,92,246,0.1)',
                    border: '1px solid rgba(139,92,246,0.4)',
                    color: '#a78bfa',
                    borderRadius: '0.5rem',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                  }}
                >
                  📊 سجل التواصل
                </button>
              )}

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
                {(formConfigTypes.length > 0 ? formConfigTypes : Object.keys(REG_TYPE_CONFIG)).map(k => {
                  const v = REG_TYPE_CONFIG[k] || { label: formConfigLabels[k] || k, color: '#6b7280', icon: '\uD83D\uDC64' };
                  const lbl = formConfigLabels[k] || v.label;
                  const isPrimary = (selected.reg_type || selected.type) === k;
                  const isChosen = pendingTypes.includes(k);
                  return (
                    <button key={k}
                      onClick={() => {
                        if (isPrimary) return;
                        // Toggle: add if not present, remove if already added
                        setPendingTypes(prev => prev.includes(k) ? prev.filter(x=>x!==k) : [...prev, k]);
                      }}
                      style={{
                        padding: '0.4rem 0.9rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600,
                        cursor: isPrimary ? 'default' : 'pointer',
                        border: `1px solid ${isPrimary ? v.color + '80' : isChosen ? v.color + '80' : 'rgba(255,255,255,0.12)'}`,
                        background: isPrimary ? v.color + '30' : isChosen ? v.color + '20' : 'transparent',
                        color: isPrimary ? v.color : isChosen ? v.color : '#64748b',
                        opacity: isPrimary ? 0.7 : 1,
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}>
                      {v.icon} {lbl}
                      {isPrimary && <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>(أساسي)</span>}
                      {isChosen && !isPrimary && <span style={{ fontSize: '0.7rem' }}>✓</span>}
                    </button>
                  );
                })}
                {/* Add new type button */}
                <button
                  onClick={() => setShowAddType(true)}
                  style={{
                    padding: '0.4rem 0.9rem', borderRadius: 6, fontSize: '0.8rem', fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px dashed rgba(108,99,255,0.5)',
                    background: 'rgba(108,99,255,0.1)',
                    color: '#a5b4fc',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                  title="إضافة نوع جديد"
                >
                  ➕ نوع جديد
                </button>
              </div>
              <button onClick={saveTypes} style={{ ...S.btn('#10b981') }}>💾 حفظ الأنواع</button>
            </div>
          )}

          {/* Add New Type Modal */}
          {showAddType && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              zIndex: 999, padding: '1rem'
            }}>
              <div style={{ 
                ...S.card, 
                maxWidth: 480, 
                width: '100%',
                borderColor: 'rgba(108,99,255,0.4)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>➕ إضافة نوع تسجيل جديد</h3>
                  <button 
                    onClick={() => setShowAddType(false)} 
                    style={{ ...S.btn('#374151'), padding: '0.3rem 0.6rem' }}
                  >✕</button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={S.label}>🔑 مفتاح النوع (بالإنجليزي)</label>
                    <input 
                      value={newTypeKey}
                      onChange={e => setNewTypeKey(e.target.value)}
                      placeholder="مثال: investor_angel"
                      style={{ ...S.inp, textTransform: 'lowercase' }}
                      dir="ltr"
                    />
                    <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: 4 }}>استخدم حروف إنجليزية صغيرة وشرطة سفلية (_)</div>
                  </div>
                  
                  <div>
                    <label style={S.label}>🏷️ التسمية (بالعربي)</label>
                    <input 
                      value={newTypeLabel}
                      onChange={e => setNewTypeLabel(e.target.value)}
                      placeholder="مثال: مستثمر ملائكي"
                      style={S.inp}
                      dir="rtl"
                    />
                  </div>
                  
                  <div>
                    <label style={S.label}>😀 أيقونة</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input 
                        value={newTypeIcon}
                        onChange={e => setNewTypeIcon(e.target.value)}
                        placeholder="👤"
                        style={{ ...S.inp, width: 80, textAlign: 'center', fontSize: '1.2rem' }}
                        maxLength={2}
                      />
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1 }}>
                        {['👤','🚀','💼','🎙️','🏅','📹','⭐','🤝','💰','🔬','🎨','📚','⚙️','🌐','🏢'].map(icon => (
                          <button
                            key={icon}
                            onClick={() => setNewTypeIcon(icon)}
                            style={{
                              background: newTypeIcon === icon ? 'rgba(108,99,255,0.3)' : 'rgba(255,255,255,0.05)',
                              border: `1px solid ${newTypeIcon === icon ? '#6C63FF' : 'rgba(255,255,255,0.1)'}`,
                              borderRadius: 6,
                              padding: '0.4rem',
                              cursor: 'pointer',
                              fontSize: '1.1rem',
                              lineHeight: 1
                            }}
                          >{icon}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ 
                    background: 'rgba(108,99,255,0.1)', 
                    borderRadius: 8, 
                    padding: '0.75rem 1rem',
                    border: '1px solid rgba(108,99,255,0.2)'
                  }}>
                    <div style={{ color: '#a5b4fc', fontSize: '0.75rem', fontWeight: 600, marginBottom: 6 }}>معاينة:</div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(108,99,255,0.2)',
                      color: '#a5b4fc',
                      padding: '0.5rem 0.9rem',
                      borderRadius: 8,
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}>
                      <span style={{ fontSize: '1.1rem' }}>{newTypeIcon || '👤'}</span>
                      {newTypeLabel || 'اسم النوع'}
                    </span>
                  </div>
                  
                  <button 
                    onClick={addNewType}
                    disabled={savingNewType || !newTypeKey || !newTypeLabel}
                    style={{
                      ...S.btn('#10b981'),
                      opacity: (!newTypeKey || !newTypeLabel) ? 0.5 : 1,
                      cursor: (!newTypeKey || !newTypeLabel) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {savingNewType ? '⏳ جاري الإضافة...' : '✅ إضافة النوع'}
                  </button>
                </div>
              </div>
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

          {/* Contact Log Modal */}
          {showContactLog && selectedContactForLog && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              zIndex: 999, padding: '1rem', overflow: 'auto'
            }}>
              <div style={{ 
                ...S.card, 
                maxWidth: 700, 
                width: '100%',
                maxHeight: '85vh',
                overflowY: 'auto',
                borderColor: 'rgba(139,92,246,0.4)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, position: 'sticky', top: 0, background: '#13102a', paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <h3 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                    📊 سجل التواصل الكامل — {selectedContactForLog.name}
                  </h3>
                  <button 
                    onClick={() => { setShowContactLog(false); setSelectedContactForLog(null); }} 
                    style={{ ...S.btn('#374151'), padding: '0.3rem 0.6rem' }}
                  >✕</button>
                </div>
                
                <ContactInteractionLog 
                  contactId={selectedContactForLog.id}
                  contactName={selectedContactForLog.name}
                  token={token}
                  apiBase={API_BASE}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
