'use client';
import { useState, useEffect } from 'react';

const S = {
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem', colorScheme: 'dark' } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.2rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 } as React.CSSProperties),
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '1rem', padding: '1.25rem' } as React.CSSProperties,
  label: { fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block' } as React.CSSProperties,
};

interface ThemeColors {
  primary?: string; primary_dark?: string; accent?: string;
  bg_dark?: string; bg_card?: string; text?: string; text_muted?: string; heading?: string;
  navbar_bg_dark?: string; navbar_bg_light?: string; navbar_blur?: string; navbar_border?: string;
}

const PRESETS: { name: string; emoji: string; colors: ThemeColors }[] = [
  { name: 'البنفسجي', emoji: 'U+1F7E3', colors: { primary:'#6C63FF', primary_dark:'#4f46e5', accent:'#f59e0b', bg_dark:'#0d0b1a', bg_card:'#13102a', text:'#e2e8f0', text_muted:'#94a3b8', heading:'#ffffff', navbar_bg_dark:'rgba(13,11,26,0.88)', navbar_bg_light:'rgba(255,255,255,0.98)', navbar_blur:'on', navbar_border:'rgba(108,99,255,0.25)' } },
  { name: 'الأزرق', emoji: 'U+1F535', colors: { primary:'#2563eb', primary_dark:'#1d4ed8', accent:'#f59e0b', bg_dark:'#0a0f1e', bg_card:'#111827', text:'#e2e8f0', text_muted:'#9ca3af', heading:'#ffffff', navbar_bg_dark:'rgba(10,15,30,0.9)', navbar_bg_light:'#ffffff', navbar_blur:'on', navbar_border:'rgba(37,99,235,0.25)' } },
  { name: 'الأخضر', emoji: 'U+1F7E2', colors: { primary:'#10b981', primary_dark:'#059669', accent:'#f59e0b', bg_dark:'#0a1a14', bg_card:'#0f2018', text:'#d1fae5', text_muted:'#6ee7b7', heading:'#ecfdf5', navbar_bg_dark:'rgba(10,26,20,0.9)', navbar_bg_light:'#f0fdf4', navbar_blur:'on', navbar_border:'rgba(16,185,129,0.25)' } },
  { name: 'الذهبي', emoji: 'U+1F7E1', colors: { primary:'#d97706', primary_dark:'#b45309', accent:'#6C63FF', bg_dark:'#0f0c02', bg_card:'#1c1600', text:'#fef3c7', text_muted:'#fcd34d', heading:'#fffbeb', navbar_bg_dark:'rgba(15,12,2,0.9)', navbar_bg_light:'#fffbeb', navbar_blur:'off', navbar_border:'rgba(217,119,6,0.3)' } },
  { name: 'الوردي', emoji: 'U+1FA77', colors: { primary:'#ec4899', primary_dark:'#db2777', accent:'#8b5cf6', bg_dark:'#160a12', bg_card:'#1e0f1a', text:'#fce7f3', text_muted:'#f9a8d4', heading:'#fdf2f8', navbar_bg_dark:'rgba(22,10,18,0.9)', navbar_bg_light:'#fdf2f8', navbar_blur:'on', navbar_border:'rgba(236,72,153,0.25)' } },
  { name: 'الرمادي', emoji: 'U+26AB', colors: { primary:'#6b7280', primary_dark:'#4b5563', accent:'#3b82f6', bg_dark:'#111827', bg_card:'#1f2937', text:'#f9fafb', text_muted:'#9ca3af', heading:'#ffffff', navbar_bg_dark:'rgba(17,24,39,0.95)', navbar_bg_light:'#f9fafb', navbar_blur:'off', navbar_border:'rgba(107,114,128,0.25)' } },
];

const PICONS: Record<string, string> = { 'U+1F7E3': 'U+1F7E3', 'U+1F535': 'U+1F535', 'U+1F7E2': 'U+1F7E2', 'U+1F7E1': 'U+1F7E1', 'U+1FA77': 'U+1FA77', 'U+26AB': 'U+26AB' };
const PEMOJIS = ['🟣','🔵','🟢','🟡','🩷','⚫'];

const COLOR_FIELDS: { key: keyof ThemeColors; label: string; section: string }[] = [
  { key: 'primary',      label: 'اللون الرئيسي',     section: 'main' },
  { key: 'primary_dark', label: 'الرئيسي (hover)',    section: 'main' },
  { key: 'accent',       label: 'لون التمييز',        section: 'main' },
  { key: 'bg_dark',      label: 'خلفية الصفحة',       section: 'main' },
  { key: 'bg_card',      label: 'خلفية البطاقات',     section: 'main' },
  { key: 'heading',      label: 'لون العناوين',        section: 'main' },
  { key: 'text',         label: 'لون النص',            section: 'main' },
  { key: 'text_muted',   label: 'النص الخافت',         section: 'main' },
  { key: 'navbar_bg_dark',  label: 'خلفية الناف (ليلي)', section: 'navbar' },
  { key: 'navbar_bg_light', label: 'خلفية الناف (نهاري)', section: 'navbar' },
  { key: 'navbar_border',   label: 'حدود الناف بار',     section: 'navbar' },
];

interface Props { eventId: number; eventSlug: string; token: string; currentPrimaryColor?: string; save: (fn: () => Promise<void>) => void; saving: boolean; }

function ColorPicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', borderRadius: '0.6rem', padding: '0.65rem 0.85rem' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{ width: 34, height: 34, borderRadius: '0.4rem', background: value || '#6C63FF', border: '2px solid rgba(255,255,255,0.15)', overflow: 'hidden', cursor: 'pointer' }}>
          <input type="color" value={value || '#6C63FF'} onChange={e => onChange(e.target.value)}
            style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer', border: 'none', padding: 0 }} />
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: 'white', fontWeight: 600, fontSize: '0.8rem' }}>{label}</div>
      </div>
      <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
        style={{ ...S.inp, width: 84, textAlign: 'center', fontSize: '0.72rem', padding: '0.25rem 0.35rem', direction: 'ltr', fontFamily: 'monospace' }} />
    </div>
  );
}

export default function AdminThemeBuilder({ eventId, eventSlug, token, currentPrimaryColor, save, saving }: Props) {
  const [colors, setColors] = useState<ThemeColors>({
    primary: currentPrimaryColor || '#6C63FF',
    primary_dark: '#4f46e5', accent: '#f59e0b',
    bg_dark: '#0d0b1a', bg_card: '#13102a',
    text: '#e2e8f0', text_muted: '#94a3b8', heading: '#ffffff',
    navbar_bg_dark: 'rgba(13,11,26,0.88)',
    navbar_bg_light: 'rgba(255,255,255,0.98)',
    navbar_blur: 'on',
    navbar_border: 'rgba(108,99,255,0.25)',
  });
  const [loaded, setLoaded] = useState(false);
  const [section, setSection] = useState<'main' | 'navbar'>('main');

  useEffect(() => {
    if (!token || !eventSlug) return;
    fetch(`https://event-api.info1703.workers.dev/api/events/${eventSlug}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(d => {
      if (d.data?.site_config) {
        try {
          const sc = JSON.parse(d.data.site_config);
          if (sc.theme_colors) setColors(prev => ({ ...prev, ...sc.theme_colors }));
          else if (d.data.primary_color) setColors(prev => ({ ...prev, primary: d.data.primary_color }));
        } catch {}
      } else if (d.data?.primary_color) setColors(prev => ({ ...prev, primary: d.data.primary_color }));
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [eventSlug, token]);

  const setColor = (k: keyof ThemeColors, v: string) => setColors(c => ({ ...c, [k]: v }));

  const saveAll = () => save(async () => {
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    const eventRes = await fetch(`https://event-api.info1703.workers.dev/api/events/${eventSlug}`, { headers });
    const eventData = await eventRes.json();
    let sc: any = {};
    if (eventData.data?.site_config) { try { sc = JSON.parse(eventData.data.site_config); } catch {} }
    sc.theme_colors = colors;
    await fetch(`https://event-api.info1703.workers.dev/api/events/${eventId}`, {
      method: 'PUT', headers, body: JSON.stringify({ primary_color: colors.primary, site_config: sc }),
    });
  });

  if (!loaded) return <p style={{ color: '#94a3b8' }}>جاري التحميل...</p>;

  const visibleFields = COLOR_FIELDS.filter(f => f.section === section);
  const blurOn = colors.navbar_blur !== 'off';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', margin: 0 }}>🎨 الثيم والألوان</h1>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: 4 }}>تحكم كامل بألوان الموقع والناف بار — تأثير فوري على الزوار</p>
        </div>
        <button style={S.btn()} onClick={saveAll} disabled={saving}>
          {saving ? 'جاري الحفظ...' : '💾 حفظ'}
        </button>
      </div>

      {/* Presets */}
      <div style={S.card}>
        <h3 style={{ color: 'white', fontWeight: 700, marginBottom: 12, fontSize: '0.95rem' }}>🎭 ثيمات جاهزة</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: 8 }}>
          {PRESETS.map((p, pi) => (
            <button key={p.name} onClick={() => setColors(p.colors)} style={{
              background: p.colors.bg_dark, border: `2px solid ${colors.primary === p.colors.primary ? p.colors.primary! : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '0.75rem', padding: '0.75rem', cursor: 'pointer', textAlign: 'right', transition: 'border-color 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = p.colors.primary || '#6C63FF')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = colors.primary === p.colors.primary ? p.colors.primary! : 'rgba(255,255,255,0.08)')}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                {[p.colors.primary, p.colors.accent, p.colors.bg_card, p.colors.navbar_bg_dark].map((col, i) => (
                  <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: col || '#333', flexShrink: 0 }} />
                ))}
              </div>
              <div style={{ color: p.colors.heading || '#fff', fontSize: '0.78rem', fontWeight: 600 }}>{PEMOJIS[pi]} {p.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Section Tabs + Color Pickers */}
      <div style={S.card}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['main', 'navbar'] as const).map(s => (
            <button key={s} onClick={() => setSection(s)} style={{
              padding: '0.4rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', border: 'none',
              background: section === s ? '#6C63FF' : 'rgba(255,255,255,0.07)', color: section === s ? 'white' : '#94a3b8',
            }}>
              {s === 'main' ? '🎨 الصفحة' : '📐 الناف بار'}
            </button>
          ))}
        </div>

        {section === 'navbar' && (
          <div style={{ marginBottom: 14, background: 'rgba(108,99,255,0.07)', borderRadius: '0.6rem', padding: '0.75rem 1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
              <div onClick={() => setColors(c => ({ ...c, navbar_blur: c.navbar_blur === 'off' ? 'on' : 'off' }))}
                style={{ width: 40, height: 22, borderRadius: 11, background: blurOn ? '#6C63FF' : '#374151', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 2, left: blurOn ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 600, fontSize: '0.85rem' }}>
                  {blurOn ? '✨ تأثير الضبابية (Glassmorphism)' : '🔲 خلفية صلبة'}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.72rem' }}>
                  {blurOn ? 'الناف بار شفاف مع ضبابية — يبدو عصري' : 'الناف بار بلون صلب كامل'}
                </div>
              </div>
            </label>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
          {visibleFields.map(({ key, label }) => (
            <ColorPicker key={key} label={label} value={colors[key] as string || ''} onChange={v => setColor(key, v)} />
          ))}
        </div>
      </div>

      {/* Dual-Mode Preview */}
      <div style={S.card}>
        <h3 style={{ color: 'white', fontWeight: 700, marginBottom: 14, fontSize: '0.95rem' }}>👁️ معاينة فورية — ليلي ونهاري</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Dark Mode Preview */}
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginBottom: 6, textAlign: 'center' }}>🌙 الوضع الليلي</div>
            <div style={{ borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ background: colors.navbar_bg_dark || 'rgba(13,11,26,0.88)', backdropFilter: blurOn ? 'blur(12px)' : 'none', borderBottom: `1px solid ${colors.navbar_border || 'rgba(108,99,255,0.25)'}`, padding: '0.7rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: colors.heading || '#fff', fontWeight: 800, fontSize: '0.85rem' }}>
                  <span style={{ color: colors.primary || '#6C63FF' }}>S3</span> Summit
                </span>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {['الرئيسية', 'المتحدثون'].map(l => <span key={l} style={{ color: colors.text_muted || '#94a3b8', fontSize: '0.68rem' }}>{l}</span>)}
                  <div style={{ background: `linear-gradient(135deg,${colors.primary || '#6C63FF'},${colors.primary_dark || '#4f46e5'})`, color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '0.35rem' }}>سجّل</div>
                </div>
              </div>
              <div style={{ background: colors.bg_dark || '#0d0b1a', padding: '1.5rem 1rem', textAlign: 'center' }}>
                <div style={{ display: 'inline-block', background: `${colors.primary || '#6C63FF'}20`, border: `1px solid ${colors.primary || '#6C63FF'}40`, color: colors.primary || '#6C63FF', fontSize: '0.62rem', padding: '0.2rem 0.6rem', borderRadius: 99, marginBottom: 8 }}>قمة الشركات الناشئة</div>
                <div style={{ color: colors.heading || '#fff', fontWeight: 800, fontSize: '1rem' }}>
                  <span style={{ background: `linear-gradient(135deg,${colors.primary || '#6C63FF'},${colors.accent || '#f59e0b'})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>S3</span> Syria Summit
                </div>
                <div style={{ color: colors.text_muted || '#94a3b8', fontSize: '0.7rem', margin: '4px 0 10px' }}>دمشق — 2026</div>
                <div style={{ background: `linear-gradient(135deg,${colors.primary || '#6C63FF'},${colors.primary_dark || '#4f46e5'})`, color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '0.3rem 0.8rem', borderRadius: '0.4rem', display: 'inline-block' }}>سجّل الآن</div>
              </div>
              <div style={{ background: colors.bg_card || '#13102a', borderTop: `1px solid ${colors.primary || '#6C63FF'}20`, display: 'flex', justifyContent: 'center' }}>
                {[['500+', 'مشارك'], ['30+', 'متحدث']].map(([v, l]) => (
                  <div key={l} style={{ padding: '0.65rem 0.9rem', textAlign: 'center', borderLeft: `1px solid ${colors.primary || '#6C63FF'}15` }}>
                    <div style={{ color: colors.primary || '#6C63FF', fontWeight: 800, fontSize: '0.88rem' }}>{v}</div>
                    <div style={{ color: colors.text_muted || '#94a3b8', fontSize: '0.6rem' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Light Mode Preview */}
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.72rem', marginBottom: 6, textAlign: 'center' }}>☀️ الوضع النهاري</div>
            <div style={{ borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid rgba(108,99,255,0.15)' }}>
              <div style={{ background: colors.navbar_bg_light || 'rgba(255,255,255,0.98)', borderBottom: `1px solid ${colors.navbar_border || 'rgba(108,99,255,0.18)'}`, padding: '0.7rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#1e1b3a', fontWeight: 800, fontSize: '0.85rem' }}>
                  <span style={{ color: colors.primary || '#6C63FF' }}>S3</span> Summit
                </span>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {['الرئيسية', 'المتحدثون'].map(l => <span key={l} style={{ color: '#4b5563', fontSize: '0.68rem' }}>{l}</span>)}
                  <div style={{ background: `linear-gradient(135deg,${colors.primary || '#6C63FF'},${colors.primary_dark || '#4f46e5'})`, color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '0.35rem' }}>سجّل</div>
                </div>
              </div>
              <div style={{ background: '#f5f6fc', padding: '1.5rem 1rem', textAlign: 'center' }}>
                <div style={{ display: 'inline-block', background: `${colors.primary || '#6C63FF'}15`, border: `1px solid ${colors.primary || '#6C63FF'}40`, color: colors.primary || '#6C63FF', fontSize: '0.62rem', padding: '0.2rem 0.6rem', borderRadius: 99, marginBottom: 8 }}>قمة الشركات الناشئة</div>
                <div style={{ color: '#14122b', fontWeight: 800, fontSize: '1rem' }}>
                  <span style={{ background: `linear-gradient(135deg,${colors.primary || '#6C63FF'},${colors.accent || '#f59e0b'})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>S3</span> Syria Summit
                </div>
                <div style={{ color: '#5b6472', fontSize: '0.7rem', margin: '4px 0 10px' }}>دمشق — 2026</div>
                <div style={{ background: `linear-gradient(135deg,${colors.primary || '#6C63FF'},${colors.primary_dark || '#4f46e5'})`, color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '0.3rem 0.8rem', borderRadius: '0.4rem', display: 'inline-block' }}>سجّل الآن</div>
              </div>
              <div style={{ background: '#fff', borderTop: `1px solid ${colors.primary || '#6C63FF'}20`, display: 'flex', justifyContent: 'center' }}>
                {[['500+', 'مشارك'], ['30+', 'متحدث']].map(([v, l]) => (
                  <div key={l} style={{ padding: '0.65rem 0.9rem', textAlign: 'center', borderLeft: `1px solid ${colors.primary || '#6C63FF'}15` }}>
                    <div style={{ color: colors.primary || '#6C63FF', fontWeight: 800, fontSize: '0.88rem' }}>{v}</div>
                    <div style={{ color: '#5b6472', fontSize: '0.6rem' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <p style={{ color: '#475569', fontSize: '0.72rem', marginTop: 10, textAlign: 'center' }}>احفظ ثم زر الموقع للمعاينة الكاملة على الموقع الحقيقي</p>
      </div>
    </div>
  );
}