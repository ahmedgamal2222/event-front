'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchEventArchive } from '../../lib/api';

function formatDate(d: string) {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }); }
  catch { return d; }
}

function EventCard({ ev }: { ev: any }) {
  const now = new Date();
  const start = new Date(ev.start_date);
  const end = new Date(ev.end_date);
  const isPast = end < now;
  const isCurrent = start <= now && end >= now;

  return (
    <Link href={`/${ev.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        background: '#13102a', border: `1px solid ${isCurrent ? 'rgba(108,99,255,0.5)' : 'rgba(108,99,255,0.15)'}`,
        borderRadius: '1rem', overflow: 'hidden', transition: 'transform 0.2s, border-color 0.2s',
        cursor: 'pointer', position: 'relative',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(108,99,255,0.5)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.borderColor = isCurrent ? 'rgba(108,99,255,0.5)' : 'rgba(108,99,255,0.15)'; }}>

        {/* Cover */}
        <div style={{ position: 'relative', height: 180, background: ev.primary_color ? `${ev.primary_color}25` : '#1a1730', overflow: 'hidden' }}>
          {ev.cover_image
            ? <img src={ev.cover_image} alt={ev.name_ar || ev.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🗓</div>
          }
          {/* Overlay gradient */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(19,16,42,0.9) 0%, transparent 60%)' }} />

          {/* Badges */}
          <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {ev.edition_number && (
              <span style={{ background: 'rgba(108,99,255,0.9)', color: 'white', borderRadius: '0.4rem', padding: '0.2rem 0.6rem', fontSize: '0.72rem', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
                {ev.edition_number}
              </span>
            )}
            {isCurrent && (
              <span style={{ background: '#10b981', color: 'white', borderRadius: '0.4rem', padding: '0.2rem 0.6rem', fontSize: '0.72rem', fontWeight: 700, animation: 'pulse 2s infinite' }}>
                🔴 جارٍ الآن
              </span>
            )}
            {!isCurrent && !isPast && (
              <span style={{ background: '#f59e0b', color: 'black', borderRadius: '0.4rem', padding: '0.2rem 0.6rem', fontSize: '0.72rem', fontWeight: 700 }}>
                قادم
              </span>
            )}
          </div>

          {/* Logo */}
          {ev.logo && (
            <img src={ev.logo} alt="logo" style={{ position: 'absolute', bottom: 10, right: 10, width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)', background: 'white' }} />
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '1.1rem 1.25rem 1.25rem' }}>
          <h3 style={{ color: 'white', margin: '0 0 0.3rem', fontSize: '1.05rem', fontWeight: 700 }}>
            {ev.name_ar || ev.name}
          </h3>
          {ev.tagline_ar && (
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0 0 0.75rem', lineHeight: 1.5 }}>{ev.tagline_ar}</p>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.78rem', color: '#64748b', flexWrap: 'wrap' }}>
            <span>📅 {formatDate(ev.start_date)}</span>
            {(ev.location_ar || ev.city) && <span>📍 {ev.location_ar || ev.city}</span>}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0.65rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: isPast ? '#a5b4fc' : '#6C63FF', fontWeight: 600 }}>
            {isPast ? '📂 أرشيف الحدث' : '→ عرض التفاصيل'}
          </span>
          <span style={{ fontSize: '0.72rem', color: '#475569' }}>#{ev.id}</span>
        </div>
      </div>
    </Link>
  );
}

export default function ArchivePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'past' | 'upcoming'>('all');

  useEffect(() => {
    fetchEventArchive()
      .then(r => setEvents(r.data || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const filtered = events.filter(ev => {
    if (filter === 'past') return new Date(ev.end_date) < now;
    if (filter === 'upcoming') return new Date(ev.end_date) >= now;
    return true;
  });

  const currentEvent = events.find(ev => new Date(ev.start_date) <= now && new Date(ev.end_date) >= now);

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#0d0b1a', color: 'white', fontFamily: "'Segoe UI', Arial, sans-serif" }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }`}</style>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #13102a 0%, #1a1040 100%)', borderBottom: '1px solid rgba(108,99,255,0.2)', padding: '4rem 1.5rem 3rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗂</div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, margin: '0 0 1rem', background: 'linear-gradient(135deg, #ffffff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            أرشيف الأحداث
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: 480, margin: '0 auto 1.5rem', lineHeight: 1.7 }}>
            جميع نسخ الحدث — السابقة والحالية والقادمة — في مكان واحد
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { v: 'all', l: `الكل (${events.length})` },
              { v: 'upcoming', l: `القادمة (${events.filter(e => new Date(e.end_date) >= now).length})` },
              { v: 'past', l: `السابقة (${events.filter(e => new Date(e.end_date) < now).length})` },
            ].map(f => (
              <button key={f.v} onClick={() => setFilter(f.v as any)}
                style={{ padding: '0.45rem 1.1rem', borderRadius: '2rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.15s',
                  background: filter === f.v ? '#6C63FF' : 'rgba(255,255,255,0.07)',
                  color: filter === f.v ? 'white' : '#94a3b8' }}>
                {f.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Current event spotlight */}
        {currentEvent && (
          <div style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.35)', borderRadius: '1.25rem', padding: '1.5rem', marginBottom: '2.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {currentEvent.cover_image && (
              <img src={currentEvent.cover_image} alt="" style={{ width: 100, height: 70, objectFit: 'cover', borderRadius: '0.6rem', flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, marginBottom: '0.3rem' }}>🔴 الحدث الجاري الآن</div>
              <h2 style={{ color: 'white', margin: '0 0 0.3rem', fontWeight: 700, fontSize: '1.15rem' }}>{currentEvent.name_ar || currentEvent.name}</h2>
              <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>{formatDate(currentEvent.start_date)} — {formatDate(currentEvent.end_date)}</div>
            </div>
            <Link href={`/${currentEvent.slug}`}
              style={{ background: '#6C63FF', color: 'white', borderRadius: '0.5rem', padding: '0.55rem 1.25rem', textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
              اذهب للحدث →
            </Link>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            <p>جار تحميل الأحداث...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
            <p>لا توجد أحداث في هذا التصفية</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {filtered.map(ev => <EventCard key={ev.id} ev={ev} />)}
          </div>
        )}

        {/* Back link */}
        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
          <Link href="/" style={{ color: '#64748b', fontSize: '0.85rem', textDecoration: 'none' }}>
            ← العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    </main>
  );
}
