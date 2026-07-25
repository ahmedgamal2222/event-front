'use client';
import { useState, useEffect } from 'react';
import AdminEventRegistrations from './AdminEventRegistrations';
import AdminCRMUnified from './AdminCRMUnified';
import AdminCRMTasks from './AdminCRMTasks';

type View = 'registrations' | 'contacts' | 'tasks' | 'escalated';

interface Props {
  token: string;
  apiBase: string;
  eventId: number;
  isSuperAdmin?: boolean;
  myPermissions?: { event_id: number | null; sections: string[] }[];
  readOnly?: boolean;
}

const VIEW_PERMISSION_KEYS: Record<View, string[]> = {
  registrations: ['registrations'],
  contacts:      ['crm_contacts', 'crm_unified', 'crm_main'],
  tasks:         ['crm_tasks'],
  escalated:     ['crm_escalated'],
};

const ALL_VIEWS: { key: View; label: string; desc: string }[] = [
  { key: 'registrations', label: 'التسجيلات',       desc: 'عرض الطلبات وتغيير الحالات وتحويل للجهات' },
  { key: 'contacts',      label: 'جهات الاتصال',   desc: 'ملفات شاملة مع التاريخ والمهام' },
  { key: 'tasks',         label: 'لوحة المهام',     desc: 'جميع المهام والمتابعات' },
  { key: 'escalated',     label: 'المصعدات',        desc: 'الحالات التي تتطلب قرارا من الادارة' },
];

export default function AdminCRMMain({ token, apiBase, eventId, isSuperAdmin, myPermissions, readOnly }: Props) {
  const allowedViews = ALL_VIEWS.filter(v => {
    if (isSuperAdmin || !myPermissions || myPermissions.length === 0) return true;
    const keys = VIEW_PERMISSION_KEYS[v.key];
    return myPermissions.some(perm => {
      if (perm.event_id !== null && perm.event_id !== eventId) return false;
      return keys.some(k => perm.sections.includes(k) || perm.sections.includes('all'));
    });
  });

  const [view, setView] = useState<View>(allowedViews[0]?.key || 'registrations');

  useEffect(() => {
    if (allowedViews.length > 0 && !allowedViews.find(v => v.key === view)) {
      setView(allowedViews[0].key);
    }
  }, [eventId]);

  if (allowedViews.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#64748b', padding: '4rem 2rem' }}>
        <p>ليس لديك صلاحية للوصول الى هذا القسم</p>
      </div>
    );
  }

  const current = allowedViews.find(v => v.key === view) || allowedViews[0];

  return (
    <div style={{ direction: 'rtl' }}>
      {readOnly && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(239,68,68,0.08))',
          border: '1px solid rgba(245,158,11,0.45)',
          borderRadius: '0.75rem',
          padding: '0.85rem 1.2rem',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>👁️</div>
          <div>
            <div style={{ color: '#fcd34d', fontWeight: 700, fontSize: '0.88rem' }}>أنت في وضع المشاهدة فقط</div>
            <div style={{ color: '#d97706', fontSize: '0.78rem', marginTop: 2 }}>
              يمكنك الاطلاع على البيانات فقط. لتفعيل الصلاحيات تواصل مع المسؤول الرئيسي.
            </div>
          </div>
        </div>
      )}
      <div style={{ background: 'rgba(13,11,26,0.8)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '1rem', padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {allowedViews.map(v => (
          <button key={v.key} onClick={() => setView(v.key)} style={{ background: view === v.key ? 'rgba(108,99,255,0.3)' : 'transparent', color: view === v.key ? '#c4b5fd' : '#64748b', border: view === v.key ? '1px solid rgba(108,99,255,0.5)' : '1px solid transparent', borderRadius: '0.5rem', padding: '0.45rem 0.9rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: view === v.key ? 700 : 400, whiteSpace: 'nowrap' }}>
            {v.label}
          </button>
        ))}
        <span style={{ marginRight: 'auto', color: '#4b5563', fontSize: '0.75rem' }}>{current.desc}</span>
      </div>
      {view === 'registrations' && <AdminEventRegistrations key={`regs-${eventId}`} token={token} eventId={eventId} readOnly={readOnly} />}
      {view === 'contacts' && <AdminCRMUnified key={`contacts-${eventId}`} token={token} apiBase={apiBase} eventId={eventId} readOnly={readOnly} />}
      {view === 'tasks' && <AdminCRMTasks key={`tasks-${eventId}`} token={token} apiBase={apiBase} eventId={eventId} mode="all" readOnly={readOnly} />}
      {view === 'escalated' && <AdminCRMTasks key={`esc-${eventId}`} token={token} apiBase={apiBase} eventId={eventId} mode="escalated" readOnly={readOnly} />}
    </div>
  );
}