'use client';
/**
 * AdminCRMMain — إدارة علاقات العملاء الموحدة
 * التسجيلات | جهات الاتصال | المهام | المصعّدات
 */
import { useState } from 'react';
import AdminEventRegistrations from './AdminEventRegistrations';
import AdminCRMUnified from './AdminCRMUnified';
import AdminCRMTasks from './AdminCRMTasks';

const S = {
  btn: (color = '#6C63FF') => ({
    background: color, color: 'white', border: 'none',
    borderRadius: '0.4rem', padding: '0.45rem 1rem',
    cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600
  } as React.CSSProperties),
};

type View = 'registrations' | 'contacts' | 'tasks' | 'escalated';

interface Props {
  token: string;
  apiBase: string;
  eventId: number;
}

const VIEWS: { key: View; label: string; desc: string }[] = [
  { key: 'registrations', label: '📋 التسجيلات',          desc: 'إدارة الطلبات، تغيير الحالة، تحويل للمسجلين لجهات اتصال' },
  { key: 'contacts',      label: '👥 جهات الاتصال',        desc: 'ملفات شاملة مع التاريخ والمهام' },
  { key: 'tasks',         label: '✅ لوحة المهام',          desc: 'جميع المهام مع إمكانية الإضافة والمتابعة' },
  { key: 'escalated',     label: '🔺 المصعّدات',            desc: 'الحالات التي تتطلب قراراً من الإدارة' },
];

export default function AdminCRMMain({ token, apiBase, eventId }: Props) {
  const [view, setView] = useState<View>('contacts');

  const current = VIEWS.find(v => v.key === view)!;

  return (
    <div style={{ direction: 'rtl' }}>
      {/* ── Navigation Bar ── */}
      <div style={{
        background: 'rgba(13,11,26,0.8)',
        border: '1px solid rgba(108,99,255,0.2)',
        borderRadius: '1rem',
        padding: '0.75rem 1rem',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap',
      }}>
        {VIEWS.map(v => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            style={{
              background: view === v.key ? 'rgba(108,99,255,0.3)' : 'transparent',
              color: view === v.key ? '#c4b5fd' : '#64748b',
              border: view === v.key ? '1px solid rgba(108,99,255,0.5)' : '1px solid transparent',
              borderRadius: '0.5rem',
              padding: '0.45rem 0.9rem',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: view === v.key ? 700 : 400,
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { if (view !== v.key) (e.currentTarget.style.background = 'rgba(108,99,255,0.1)'); }}
            onMouseLeave={e => { if (view !== v.key) (e.currentTarget.style.background = 'transparent'); }}
          >
            {v.label}
          </button>
        ))}

        {/* Description */}
        <span style={{
          marginRight: 'auto',
          color: '#4b5563',
          fontSize: '0.75rem',
          paddingRight: '0.5rem',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        }}>
          {current.desc}
        </span>
      </div>

      {/* ── View Content ── */}
      {view === 'registrations' && (
        <AdminEventRegistrations key={`regs-${eventId}`} token={token} eventId={eventId} />
      )}

      {view === 'contacts' && (
        <AdminCRMUnified key={`contacts-${eventId}`} token={token} apiBase={apiBase} eventId={eventId} />
      )}

      {view === 'tasks' && (
        <AdminCRMTasks key={`tasks-${eventId}`} token={token} apiBase={apiBase} eventId={eventId} mode="all" />
      )}

      {view === 'escalated' && (
        <AdminCRMTasks key={`esc-${eventId}`} token={token} apiBase={apiBase} eventId={eventId} mode="escalated" />
      )}
    </div>
  );
}
