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

  // Type config (read-only now - for display purposes only)
  const [formConfigTypes, setFormConfigTypes] = useState<string[]>([]);
  const [formConfigLabels, setFormConfigLabels] = useState<Record<string, string>>({});

  // [Removed] Type editing states - moved to contacts tab

  // Interaction logging
  const [showInteraction, setShowInteraction] = useState(false);
  const [interactionForm, setInteractionForm] = useState({ channel: 'call', direction: 'outbound', subject: '', summary: '' });
  const [savingInteraction, setSavingInteraction] = useState(false);

  // Contact interaction log
  const [showContactLog, setShowContactLog] = useState(false);
  const [selectedContactForLog, setSelectedContactForLog] = useState<{ id: number; name: string } | null>(null);
  const [interactionStats, setInteractionStats] = useState<{ total: number; last: string | null }>({ total: 0, last: null });

  // Manual registration form
  const [showManualRegForm, setShowManualRegForm] = useState(false);
  const [manualRegForm, setManualRegForm] = useState<any>({
    full_name: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    reg_type: 'general',
    status: 'pending',
    communication_channel: '',
    motivation: '',
    company_name: '',
    sector: '',
    stage: '',
    team_size: '',
    website: '',
    description: ''
  });
  const [savingManualReg, setSavingManualReg] = useState(false);

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

  // [Removed] saveTypes and addNewType functions - registrations now read-only
  // All type management moved to contacts tab

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
        {/* Header with Add Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>📋 التسجيلات</h3>
          {!readOnly && (
            <button
              onClick={() => setShowManualRegForm(true)}
              style={{
                ...S.btn('#10b981'),
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 1.1rem'
              }}
            >
              ➕ إضافة تسجيل يدوياً
            </button>
          )}
        </div>

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
                      {/* النوع — display only */}
                      <td style={{ padding: '0.4rem 0.7rem', minWidth: 110 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {/* Primary type — read-only display */}
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: `${ti.color}15`,
                            border: `1px solid ${ti.color}50`,
                            borderRadius: '0.4rem',
                            color: ti.color,
                            fontSize: '0.72rem',
                            padding: '0.25rem 0.5rem',
                            fontWeight: 700,
                            maxWidth: 140,
                          }}>
                            {ti.icon} {lbl}
                          </span>
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
                          {/* [Removed] Quick add type button - registrations now read-only */}
                        </div>
                      </td>
                      {/* المدينة */}
                      <td style={{ padding: '0.55rem 0.85rem', color: '#64748b', fontSize: '0.75rem' }}>{cityDisplay(reg)}</td>
                      {/* الحالة - dot + label */}
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

            {/* Read-only notice */}
            <div style={{ 
              background: 'rgba(59,130,246,0.08)', 
              border: '1px solid rgba(59,130,246,0.25)', 
              borderRadius: '0.5rem', 
              padding: '0.6rem 1rem', 
              marginTop: 12,
              marginBottom: 12 
            }}>
              <div style={{ color: '#60a5fa', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
                <span>تاب التسجيلات للعرض فقط. لتعديل الحالة أو إضافة مهام أو تواصل، انتقل إلى <strong>تاب جهات الاتصال</strong></span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {/* Convert to contact button - ONLY ACTION AVAILABLE */}
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

              {/* All other actions removed - moved to contacts tab */}
            </div>
          </div>

          {/* Task form, interaction form, multi-type removed - use contacts tab instead */}

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

      {/* Manual Registration Form Modal */}
      {showManualRegForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          zIndex: 999, padding: '1rem', overflow: 'auto'
        }}>
          <div style={{ 
            ...S.card, 
            maxWidth: 650, 
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            borderColor: 'rgba(16,185,129,0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, position: 'sticky', top: 0, background: '#13102a', paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                ➕ إضافة تسجيل يدوياً
              </h3>
              <button 
                onClick={() => { setShowManualRegForm(false); setManualRegForm({ full_name: '', email: '', phone: '', city: '', country: '', reg_type: 'general', status: 'pending', communication_channel: '', motivation: '', company_name: '', sector: '', stage: '', team_size: '', website: '', description: '' }); }} 
                style={{ ...S.btn('#374151'), padding: '0.3rem 0.6rem' }}
              >✕</button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!manualRegForm.full_name || !manualRegForm.email) {
                alert('الاسم والبريد الإلكتروني مطلوبان');
                return;
              }
              setSavingManualReg(true);
              try {
                const payload = {
                  event_id: eventId,
                  ...manualRegForm,
                  source: 'admin_manual'
                };
                const res = await fetch(`${API_BASE}/api/events/${eventId}/registrations`, {
                  method: 'POST',
                  headers,
                  body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.success) {
                  alert('✅ تم إضافة التسجيل بنجاح!');
                  setShowManualRegForm(false);
                  setManualRegForm({ full_name: '', email: '', phone: '', city: '', country: '', reg_type: 'general', status: 'pending', communication_channel: '', motivation: '', company_name: '', sector: '', stage: '', team_size: '', website: '', description: '' });
                  load();
                } else {
                  alert(data.error || 'فشل الحفظ');
                }
              } catch (err: any) {
                alert('خطأ: ' + err.message);
              } finally {
                setSavingManualReg(false);
              }
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* Personal Info */}
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={S.label}>الاسم الكامل *</label>
                  <input style={S.inp} required value={manualRegForm.full_name} onChange={e => setManualRegForm(f => ({ ...f, full_name: e.target.value }))} />
                </div>
                <div>
                  <label style={S.label}>البريد الإلكتروني *</label>
                  <input style={S.inp} type="email" required value={manualRegForm.email} onChange={e => setManualRegForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label style={S.label}>رقم الهاتف</label>
                  <input style={S.inp} value={manualRegForm.phone} onChange={e => setManualRegForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label style={S.label}>نوع التسجيل *</label>
                  <select style={S.inp} value={manualRegForm.reg_type} onChange={e => setManualRegForm(f => ({ ...f, reg_type: e.target.value }))}>
                    {Object.entries(REG_TYPE_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {v.label}</option>
                    ))}
                  </select>
                </div>
                {/* [Removed] Status field - will be set in contacts tab */}
                <div>
                  <label style={S.label}>المدينة</label>
                  <input style={S.inp} value={manualRegForm.city} onChange={e => setManualRegForm(f => ({ ...f, city: e.target.value }))} />
                </div>
                <div>
                  <label style={S.label}>الدولة</label>
                  <input style={S.inp} value={manualRegForm.country} onChange={e => setManualRegForm(f => ({ ...f, country: e.target.value }))} placeholder="Syria" />
                </div>
                <div>
                  <label style={S.label}>قناة التواصل (أدمن فقط)</label>
                  <select style={S.inp} value={manualRegForm.communication_channel} onChange={e => setManualRegForm(f => ({ ...f, communication_channel: e.target.value }))}>
                    <option value="">-- اختر القناة --</option>
                    <option value="phone">📞 هاتف</option>
                    <option value="email">📧 بريد إلكتروني</option>
                    <option value="whatsapp">💬 واتساب</option>
                    <option value="social_media">📱 وسائل التواصل</option>
                    <option value="website">🌐 موقع إلكتروني</option>
                    <option value="referral">👥 إحالة</option>
                    <option value="event">🎪 حدث</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>

                {/* Startup fields (conditional) */}
                {manualRegForm.reg_type === 'startup' && (
                  <>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={S.label}>اسم الشركة</label>
                      <input style={S.inp} value={manualRegForm.company_name} onChange={e => setManualRegForm(f => ({ ...f, company_name: e.target.value }))} />
                    </div>
                    <div>
                      <label style={S.label}>قطاع العمل</label>
                      <input style={S.inp} value={manualRegForm.sector} onChange={e => setManualRegForm(f => ({ ...f, sector: e.target.value }))} />
                    </div>
                    <div>
                      <label style={S.label}>مرحلة الشركة</label>
                      <input style={S.inp} value={manualRegForm.stage} onChange={e => setManualRegForm(f => ({ ...f, stage: e.target.value }))} />
                    </div>
                    <div>
                      <label style={S.label}>حجم الفريق</label>
                      <input style={S.inp} value={manualRegForm.team_size} onChange={e => setManualRegForm(f => ({ ...f, team_size: e.target.value }))} />
                    </div>
                    <div>
                      <label style={S.label}>الموقع الإلكتروني</label>
                      <input style={S.inp} value={manualRegForm.website} onChange={e => setManualRegForm(f => ({ ...f, website: e.target.value }))} />
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={S.label}>نبذة عن الشركة</label>
                      <textarea style={{ ...S.inp, minHeight: 70, resize: 'vertical' }} value={manualRegForm.description} onChange={e => setManualRegForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                  </>
                )}

                <div style={{ gridColumn: '1/-1' }}>
                  <label style={S.label}>دوافع المشاركة</label>
                  <textarea style={{ ...S.inp, minHeight: 60, resize: 'vertical' }} value={manualRegForm.motivation} onChange={e => setManualRegForm(f => ({ ...f, motivation: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button type="submit" style={S.btn('#10b981')} disabled={savingManualReg}>
                  {savingManualReg ? '⏳ جاري الحفظ...' : '✅ حفظ التسجيل'}
                </button>
                <button type="button" style={S.btn('#374151')} onClick={() => setShowManualRegForm(false)}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
