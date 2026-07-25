'use client';
import { useState, useEffect } from 'react';

const S = {
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem', colorScheme: 'dark' } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 } as React.CSSProperties),
  label: { fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block' } as React.CSSProperties,
};

// تعريف الأقسام وترجمتها وتجميعها
export const PERMISSION_SECTIONS: { key: string; label: string; group: string }[] = [
  // المبيعات
  { key: 'registrations', label: '📋 التسجيلات', group: 'المبيعات' },
  { key: 'payments', label: '💳 المدفوعات', group: 'المبيعات' },
  { key: 'tickets', label: '🎫 التذاكر', group: 'المبيعات' },
  // CRM
  { key: 'crm_contacts', label: '👥 جهات الاتصال', group: 'CRM' },
  { key: 'crm_tasks', label: '✅ المهام والمتابعة', group: 'CRM' },
  { key: 'crm_escalated', label: '🔺 المصعّدات', group: 'CRM' },
  // إدارة الحدث
  { key: 'event', label: '⚙️ معلومات الحدث', group: 'الحدث' },
  { key: 'video', label: '🎬 الفيديو التعريفي', group: 'الحدث' },
  { key: 'siteconfig', label: '🎨 محتوى الصفحة', group: 'الحدث' },
  { key: 'formconfig', label: '📝 فورم التسجيل', group: 'الحدث' },
  { key: 'countries', label: '🌍 قائمة الدول', group: 'الحدث' },
  // المحتوى
  { key: 'agenda', label: '📅 البرنامج', group: 'المحتوى' },
  { key: 'speakers', label: '🎙️ المتحدثون', group: 'المحتوى' },
  { key: 'venue', label: '📸 معرض الصور', group: 'المحتوى' },
  { key: 'sponsors', label: '🏅 الرعاة', group: 'المحتوى' },
  { key: 'faqs', label: '❓ الأسئلة الشائعة', group: 'المحتوى' },
  { key: 'articles', label: '📝 المقالات', group: 'المحتوى' },
  { key: 'pages', label: '📄 الصفحات الثابتة', group: 'المحتوى' },
  // الدعم
  { key: 'support', label: '💬 الدعم الفني', group: 'الدعم' },
  { key: 'pixels', label: '📊 البكسل والتتبع', group: 'الدعم' },
  { key: 'email', label: '📧 إعدادات البريد', group: 'الدعم' },
  { key: 'terms', label: '⚖️ الشروط والأحكام', group: 'الدعم' },
  { key: 'campaigns', label: '📧 الحملات البريدية', group: 'الدعم' },
];

const ALL_SECTIONS = PERMISSION_SECTIONS.map(p => p.key);
const GROUPS = Array.from(new Set(PERMISSION_SECTIONS.map(p => p.group)));

interface Event {
  id: number; name: string; name_ar?: string; slug: string; status: string;
}

interface PermRow {
  event_id: number | null;
  sections: string[]; // parsed from JSON
}

interface Props {
  adminId: number;
  adminName: string;
  token: string;
  apiBase: string;
  onClose: () => void;
}

export default function AdminPermissionsEditor({ adminId, adminName, token, apiBase, onClose }: Props) {
  const [events, setEvents] = useState<Event[]>([]);
  const [perms, setPerms] = useState<PermRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    const load = async () => {
      const [evRes, permRes] = await Promise.all([
        fetch(`${apiBase}/api/events/all`, { headers }),
        fetch(`${apiBase}/api/auth/admins/${adminId}/permissions`, { headers }),
      ]);
      const evData = await evRes.json();
      const permData = await permRes.json();

      if (evData.success) setEvents(evData.data || []);
      if (permData.success) {
        setPerms((permData.data || []).map((p: any) => ({
          event_id: p.event_id,
          sections: (() => { try { return JSON.parse(p.sections); } catch { return p.sections === 'all' ? ALL_SECTIONS : []; } })(),
        })));
      }
      setLoading(false);
    };
    load();
  }, [adminId, apiBase, token]);

  // مساعد: هل لديه صلاحية معينة لحدث معين؟
  const hasPerm = (eventId: number | null, section: string) => {
    const row = perms.find(p => p.event_id === eventId);
    if (!row) return false;
    return row.sections.includes(section) || row.sections.includes('all');
  };

  const hasAllSections = (eventId: number | null) => {
    const row = perms.find(p => p.event_id === eventId);
    if (!row) return false;
    return ALL_SECTIONS.every(s => row.sections.includes(s));
  };

  const hasEventRow = (eventId: number | null) => perms.some(p => p.event_id === eventId);

  const toggleSection = (eventId: number | null, section: string) => {
    setPerms(prev => {
      const idx = prev.findIndex(p => p.event_id === eventId);
      if (idx === -1) {
        return [...prev, { event_id: eventId, sections: [section] }];
      }
      const sections = prev[idx].sections.includes(section)
        ? prev[idx].sections.filter(s => s !== section)
        : [...prev[idx].sections, section];
      const updated = [...prev];
      if (sections.length === 0) {
        updated.splice(idx, 1);
      } else {
        updated[idx] = { ...updated[idx], sections };
      }
      return updated;
    });
  };

  const toggleAllSections = (eventId: number | null, giveAll: boolean) => {
    setPerms(prev => {
      const filtered = prev.filter(p => p.event_id !== eventId);
      if (!giveAll) return filtered;
      // عند تفعيل حدث جديد: ابدأ بقسم واحد افتراضيًا وليس كل الصلاحيات
      const existing = prev.find(p => p.event_id === eventId);
      if (existing) return [...filtered, existing]; // احتفظ بالصلاحيات الحالية
      return [...filtered, { event_id: eventId, sections: [] }]; // فارغ ليختار المستخدم
    });
  };

  const giveAllSections = (eventId: number | null) => {
    setPerms(prev => {
      const filtered = prev.filter(p => p.event_id !== eventId);
      return [...filtered, { event_id: eventId, sections: [...ALL_SECTIONS] }];
    });
  };

  const clearAllSections = (eventId: number | null) => {
    setPerms(prev => prev.filter(p => p.event_id !== eventId));
  };

  const toggleGroup = (eventId: number | null, group: string, giveAll: boolean) => {
    const groupSections = PERMISSION_SECTIONS.filter(p => p.group === group).map(p => p.key);
    setPerms(prev => {
      const idx = prev.findIndex(p => p.event_id === eventId);
      if (idx === -1) {
        return giveAll ? [...prev, { event_id: eventId, sections: groupSections }] : prev;
      }
      const current = prev[idx].sections;
      const sections = giveAll
        ? Array.from(new Set([...current, ...groupSections]))
        : current.filter(s => !groupSections.includes(s));
      const updated = [...prev];
      if (sections.length === 0) { updated.splice(idx, 1); }
      else { updated[idx] = { ...updated[idx], sections }; }
      return updated;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/auth/admins/${adminId}/permissions`, {
        method: 'PUT', headers,
        body: JSON.stringify({ permissions: perms }),
      });
      const data = await res.json();
      if (data.success) onClose();
      else alert(data.error);
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ color: '#94a3b8' }}>جاري التحميل...</div>
    </div>
  );

  // الأحداث المتاحة: null = كل الأحداث، ثم كل حدث على حدة
  const eventOptions: { id: number | null; label: string }[] = [
    { id: null, label: '🌐 جميع الأحداث (عامة)' },
    ...events.map(e => ({ id: e.id, label: `${e.status === 'published' ? '🟢' : '🟡'} ${e.name_ar || e.name}` })),
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, overflowY: 'auto', padding: '2rem 1rem' }}>
      <div style={{ background: '#13102a', border: '1px solid rgba(108,99,255,0.3)', borderRadius: '1rem', width: '100%', maxWidth: 720, direction: 'rtl' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <h2 style={{ color: 'white', margin: 0, fontSize: '1rem', fontWeight: 700 }}>🔐 صلاحيات: {adminName}</h2>
            <p style={{ color: '#64748b', margin: '2px 0 0', fontSize: '0.78rem' }}>حدد الأحداث والأقسام التي يمكن لهذا المسؤول الوصول إليها</p>
          </div>
          <button onClick={onClose} style={S.btn('#374151')}>✕ إغلاق</button>
        </div>

        {/* Content */}
        <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {eventOptions.map(ev => {
            const hasRow = hasEventRow(ev.id);
            const allSelected = hasAllSections(ev.id);
            const groupsInSections = (sections: string[]) => GROUPS.filter(g =>
              PERMISSION_SECTIONS.filter(p => p.group === g).every(p => sections.includes(p.key))
            );

            return (
              <div key={String(ev.id)} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '0.75rem', overflow: 'hidden', border: `1px solid ${hasRow ? 'rgba(108,99,255,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
                {/* Event Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: hasRow ? 'rgba(108,99,255,0.1)' : 'transparent' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={hasRow}
                      onChange={e => toggleAllSections(ev.id, e.target.checked)}
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#6C63FF' }}
                    />
                    <span style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>{ev.label}</span>
                  </label>
                  {hasRow && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => giveAllSections(ev.id)} style={{ ...S.btn('#374151'), fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}>كل الأقسام</button>
                      <button onClick={() => clearAllSections(ev.id)} style={{ ...S.btn('#374151'), fontSize: '0.72rem', padding: '0.2rem 0.5rem', background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>إلغاء الكل</button>
                    </div>
                  )}
                </div>

                {/* Sections Grid */}
                {hasRow && (
                  <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {GROUPS.map(group => {
                      const groupSections = PERMISSION_SECTIONS.filter(p => p.group === group);
                      const allGroupSelected = groupSections.every(p => hasPerm(ev.id, p.key));
                      return (
                        <div key={group} style={{ marginBottom: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={allGroupSelected}
                                onChange={e => toggleGroup(ev.id, group, e.target.checked)}
                                style={{ accentColor: '#6C63FF', cursor: 'pointer' }}
                              />
                              <span style={{ color: '#818cf8', fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{group}</span>
                            </label>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 6, paddingRight: 20 }}>
                            {groupSections.map(section => (
                              <label key={section.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '0.3rem 0.5rem', borderRadius: '0.4rem', background: hasPerm(ev.id, section.key) ? 'rgba(108,99,255,0.15)' : 'transparent' }}>
                                <input
                                  type="checkbox"
                                  checked={hasPerm(ev.id, section.key)}
                                  onChange={() => toggleSection(ev.id, section.key)}
                                  style={{ accentColor: '#6C63FF', cursor: 'pointer', flexShrink: 0 }}
                                />
                                <span style={{ color: hasPerm(ev.id, section.key) ? '#c4b5fd' : '#94a3b8', fontSize: '0.8rem' }}>{section.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
            {perms.reduce((acc, p) => acc + p.sections.length, 0)} صلاحية محددة
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={S.btn('#374151')}>إلغاء</button>
            <button onClick={save} disabled={saving} style={S.btn()}>{saving ? 'جاري الحفظ...' : '💾 حفظ الصلاحيات'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
