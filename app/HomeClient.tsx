'use client';
/**
 * HomeClient — fetches events live on every visit.
 * This replaces the static server-rendered homepage so new events
 * appear immediately without needing a site rebuild.
 */
import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev';

export default function HomeClient() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/events`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        const list = d.success ? (d.data as any[]) : [];
        if (list.length === 1) {
          // Single event → redirect directly
          window.location.replace(`/${list[0].slug}`);
        } else {
          setEvents(list);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || events.length === 0) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0a0818',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontFamily: 'system-ui, sans-serif' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.5 }}>🌌</div>
            <p style={{ margin: 0 }}>جاري التحميل...</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontFamily: 'system-ui, sans-serif', direction: 'rtl' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎯</div>
            <p style={{ margin: 0 }}>لا توجد فعاليات منشورة حالياً</p>
          </div>
        )}
      </div>
    );
  }

  return <EventSelector events={events} />;
}

function EventSelector({ events }: { events: any[] }) {
  return (
    <div style={{ margin: 0, background: '#0a0818', fontFamily: "'Cairo', system-ui, -apple-system, sans-serif", minHeight: '100vh', direction: 'rtl' }}>
      {/* Background effect */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(108,99,255,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '3.5rem 1.25rem 3rem', position: 'relative' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.25)', borderRadius: '2rem', padding: '6px 18px', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 600, letterSpacing: '0.05em' }}>🎯 اختر الحدث</span>
          </div>
          <h1 style={{ color: 'white', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', margin: '0 0 0.75rem', fontWeight: 800, lineHeight: 1.2 }}>
            فعاليات ومؤتمرات
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>
            اختر الفعالية للتسجيل أو الاطلاع على التفاصيل
          </p>
        </div>

        {/* Events grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: events.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          maxWidth: events.length === 1 ? 520 : 'none',
          margin: events.length === 1 ? '0 auto' : undefined,
        }}>
          {events.map((event: any) => {
            const color = event.primary_color || '#6C63FF';
            const isOpen = !!event.registration_open;
            return (
              <EventCard key={event.id} event={event} color={color} isOpen={isOpen} />
            );
          })}
        </div>

        <p style={{ textAlign: 'center', color: '#374151', fontSize: '0.78rem', marginTop: '2.5rem' }}>
          {events.length} {events.length === 1 ? 'فعالية' : 'فعاليات'} متاحة حالياً
        </p>
      </div>
    </div>
  );
}

function EventCard({ event, color, isOpen }: { event: any; color: string; isOpen: boolean }) {
  const [hovered, setHovered] = useState(false);

  const startDate = event.start_date
    ? (() => { try { return new Date(event.start_date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }); } catch { return event.start_date; } })()
    : null;

  return (
    <a
      href={`/${event.slug}`}
      style={{
        display: 'block', textDecoration: 'none',
        background: 'rgba(19,16,42,0.9)',
        border: `1px solid ${hovered ? color + '70' : color + '30'}`,
        borderRadius: '1.25rem',
        overflow: 'hidden',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        boxShadow: hovered ? `0 12px 40px ${color}25` : '0 4px 20px rgba(0,0,0,0.3)',
        transform: hovered ? 'translateY(-6px)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Cover image */}
      {event.cover_image ? (
        <div style={{
          height: 180, position: 'relative',
          background: `linear-gradient(to bottom, transparent 40%, rgba(19,16,42,0.9)), url(${event.cover_image}) center/cover no-repeat`,
        }}>
          {event.logo && (
            <div style={{ position: 'absolute', bottom: 12, right: 16 }}>
              <img src={event.logo} alt="logo" style={{ height: 36, objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }} />
            </div>
          )}
        </div>
      ) : (
        <div style={{ height: 120, background: `linear-gradient(135deg, ${color}18, ${color}06)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {event.logo
            ? <img src={event.logo} alt="logo" style={{ height: 50, objectFit: 'contain' }} />
            : <span style={{ fontSize: '2.5rem' }}>🎯</span>
          }
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '1.25rem', textAlign: 'right' }}>
        <h2 style={{ color: 'white', margin: '0 0 0.35rem', fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.3 }}>
          {event.name_ar || event.name}
        </h2>
        {event.tagline_ar && (
          <p style={{ color: '#94a3b8', margin: '0 0 0.85rem', fontSize: '0.85rem', lineHeight: 1.5 }}>{event.tagline_ar}</p>
        )}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: '1rem' }}>
          {event.location_ar && (
            <span style={{ color: '#64748b', fontSize: '0.78rem' }}>📍 {event.location_ar}</span>
          )}
          {startDate && (
            <span style={{ color: '#64748b', fontSize: '0.78rem' }}>📅 {startDate}</span>
          )}
        </div>
        <div style={{
          display: 'flex', background: isOpen ? color : 'rgba(107,114,128,0.2)',
          color: 'white', padding: '0.6rem 1.1rem', borderRadius: '0.6rem',
          fontSize: '0.88rem', fontWeight: 600, alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>{isOpen ? '✅ سجّل الآن' : '🔒 التسجيل مغلق'}</span>
          <span style={{ opacity: 0.8, fontSize: '0.8rem' }}>اضغط للدخول ←</span>
        </div>
      </div>
    </a>
  );
}
