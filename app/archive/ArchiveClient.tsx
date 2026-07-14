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
  const isPast    = end < now;
  const isCurrent = start <= now && end >= now;

  return (
    <Link href={`/${ev.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          background: '#13102a',
          border: `1px solid ${isCurrent ? 'rgba(108,99,255,0.5)' : 'rgba(108,99,255,0.15)'}`,
          borderRadius: '1rem', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(108,99,255,0.2)';
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(108,99,255,0.45)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = '';
          (e.currentTarget as HTMLElement).style.boxShadow = '';
          (e.currentTarget as HTMLElement).style.borderColor = isCurrent ? 'rgba(108,99,255,0.5)' : 'rgba(108,99,255,0.15)';
        }}
      >
        {/* Cover */}
        <div style={{ position: 'relative', height: 170, background: ev.primary_color ? `${ev.primary_color}20` : '#1a1730', overflow: 'hidden' }}>
          {ev.cover_image
            ? <img src={ev.cover_image} alt={ev.name_ar || ev.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '3.5rem', opacity: 0.2 }}>🗓</div>
              </div>
            )
          }
          {/* overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(19,16,42,0.85) 0%, transparent 55%)' }} />

          {/* Badges */}
          <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {ev.edition_number && (
              <span style={{ background: `${ev.primary_color || '#6C63FF'}ee`, color: 'white', borderRadius: '0.35rem', padding: '0.18rem 0.55rem', fontSize: '0.7rem', fontWeight: 700 }}>
                {ev.edition_number}
              </span>
            )}
            {isCurrent && (
              <span style={{ background: '#10b981', color: 'white', borderRadius: '0.35rem', padding: '0.18rem 0.55rem', fontSize: '0.7rem', fontWeight: 700 }}>
                🔴 جارٍ الآن
              </span>
            )}
            {!isCurrent && !isPast && (
              <span style={{ background: '#f59e0b', color: 'black', borderRadius: '0.35rem', padding: '0.18rem 0.55rem', fontSize: '0.7rem', fontWeight: 700 }}>
                قادم قريباً
              </span>
            )}
            {isPast && ev.status === 'archived' && (
              <span style={{ background: 'rgba(108,99,255,0.7)', color: 'white', borderRadius: '0.35rem', padding: '0.18rem 0.55rem', fontSize: '0.7rem', fontWeight: 700 }}>
                🗂 مؤرشف
              </span>
            )}
          </div>

          {/* Logo */}
          {ev.logo && (
            <img src={ev.logo} alt="logo" style={{ position: 'absolute', bottom: 10, right: 10, width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)', background: 'white' }} />
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '1rem 1.1rem 0.8rem' }}>
          <h3 style={{ color: 'white', margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 700, lineHeight: 1.3 }}>{ev.name_ar || ev.name}</h3>
          {ev.tagline_ar && <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '0 0 0.6rem', lineHeight: 1.5 }}>{ev.tagline_ar}</p>}
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: '#64748b', flexWrap: 'wrap' }}>
            {ev.start_date && <span>📅 {formatDate(ev.start_date)}</span>}
            {(ev.location_ar || ev.city) && <span>📍 {ev.location_ar || ev.city}</span>}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0.55rem 1.1rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: isPast ? '#a5b4fc' : (ev.primary_color || '#6C63FF'), fontWeight: 600 }}>
            {isPast ? '📂 عرض الأرشيف' : '→ عرض التفاصيل'}
          </span>
          <span style={{ fontSize: '0.68rem', color: '#374151', fontFamily: 'monospace' }}>#{ev.id}</span>
        </div>
      </div>
    </Link>
  );
}

export default function ArchiveClient() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'past' | 'upcoming'>('all');

  useEffect(() => {
    fetchEventArchive()
      .then(r => setEvents(r.data || []))
      .catch(() => setError('تعذّر تحميل الأحداث، يرجى التحقق من الاتصال'))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const filtered = events.filter(ev => {
    if (filter === 'past')     return new Date(ev.end_date) < now;
    if (filter === 'upcoming') return new Date(ev.end_date) >= now;
    return true;
  });

  const currentEvent = events.find(ev => new Date(ev.start_date) <= now && new Date(ev.end_date) >= now);
  const pastCount     = events.filter(e => new Date(e.end_date) < now).length;
  const upcomingCount = events.filter(e => new Date(e.end_date) >= now).length;

  return (
    <main dir="rtl" style={{ minHeight: '100vh', background: '#0d0b1a', color: 'white', fontFamily: "'Segoe UI', Arial, sans-serif" }}>

      {/* ── Hero ── */}
      <div style={{ background: 'linear-gradient(160deg, #13102a 0%, #1a1040 100%)', borderBottom: '1px solid rgba(108,99,255,0.2)', padding: '5rem 1.5rem 3.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* glow */}
        <div style={{ position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(108,99,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
          <div style={{ fontSize: '2.8rem', marginBottom: '0.75rem' }}>🗂</div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 900, margin: '0 0 0.75rem', background: 'linear-gradient(135deg, #ffffff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            أرشيف الأحداث
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: 460, margin: '0 auto 1.5rem', lineHeight: 1.7 }}>
            جميع النسخ — السابقة والحالية والقادمة — في مكان واحد
          </p>

          {/* Stats */}
          {!loading && events.length > 0 && (
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {[
                { label: 'إجمالي', value: events.length, color: '#a5b4fc' },
                { label: 'منتهية', value: pastCount,     color: '#94a3b8' },
                { label: 'قادمة',  value: upcomingCount, color: '#86efac' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '0.75rem', padding: '0.6rem 1.1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {([['all', `الكل (${events.length})`], ['upcoming', `قادمة (${upcomingCount})`], ['past', `منتهية (${pastCount})`]] as const).map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v as any)}
                style={{ padding: '0.4rem 1rem', borderRadius: '2rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', transition: 'all 0.15s',
                  background: filter === v ? '#6C63FF' : 'rgba(255,255,255,0.07)',
                  color: filter === v ? 'white' : '#94a3b8' }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {/* Current event spotlight */}
        {currentEvent && filter !== 'past' && (
          <Link href={`/${currentEvent.slug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: '2.5rem' }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(108,99,255,0.05))', border: '1px solid rgba(108,99,255,0.4)', borderRadius: '1.25rem', padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap', transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(108,99,255,0.7)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(108,99,255,0.4)')}>
              {currentEvent.cover_image && (
                <img src={currentEvent.cover_image} alt="" style={{ width: 100, height: 70, objectFit: 'cover', borderRadius: '0.6rem', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700, marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                  الحدث الجاري الآن
                </div>
                <h2 style={{ color: 'white', margin: '0 0 0.3rem', fontWeight: 700, fontSize: '1.1rem' }}>{currentEvent.name_ar || currentEvent.name}</h2>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{formatDate(currentEvent.start_date)} — {formatDate(currentEvent.end_date)}</div>
              </div>
              <span style={{ background: '#6C63FF', color: 'white', borderRadius: '0.5rem', padding: '0.5rem 1.25rem', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
                اذهب للحدث →
              </span>
            </div>
          </Link>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '5rem', color: '#94a3b8' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</div>
            <p>جار تحميل الأحداث...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#fca5a5', background: 'rgba(239,68,68,0.06)', borderRadius: '1rem', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚠️</div>
            <p style={{ marginBottom: '1rem' }}>{error}</p>
            <button onClick={() => { setError(''); setLoading(true); fetchEventArchive().then(r => setEvents(r.data || [])).catch(() => setError('فشل التحميل')).finally(() => setLoading(false)); }}
              style={{ background: '#6C63FF', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.25rem', cursor: 'pointer', fontWeight: 600 }}>
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '5rem', color: '#64748b' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem', opacity: 0.4 }}>📂</div>
            {events.length === 0 ? (
              <>
                <p style={{ marginBottom: '0.5rem', fontSize: '1rem', color: '#94a3b8' }}>لا توجد أحداث في الأرشيف بعد</p>
                <p style={{ fontSize: '0.82rem' }}>يتطلب الظهور هنا: حالة = منشور أو مؤرشف + ظاهر للزوار + مفعّل في الأرشيف</p>
              </>
            ) : (
              <p>لا توجد أحداث في هذا التصنيف</p>
            )}
          </div>
        )}

        {/* Grid */}
        {!loading && !error && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.5rem' }}>
            {filtered.map(ev => <EventCard key={ev.id} ev={ev} />)}
          </div>
        )}

        {/* Back link */}
        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
          <Link href="/" style={{ color: '#475569', fontSize: '0.82rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#a5b4fc')}
            onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
            ← العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin  { to { transform: rotate(360deg) } }
      `}</style>
    </main>
  );
}
