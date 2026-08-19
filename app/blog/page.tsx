'use client';
// app/blog/page.tsx - Blog listing + single article (query params for static export)
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import PixelInjector from '../components/PixelInjector';

const API_BASE = 'https://event-api.info1703.workers.dev';
const EVENT_ID = 1;

// ─── Theme helpers (تركواز عميق افتراضياً) ────────────────────────────────────
function hexToRgba(hex: string, alpha: number): string {
  const h = String(hex || '').replace('#', '');
  if (h.length !== 6) return String(hex);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// تطبيق ألوان الثيم على متغيرات CSS العامة (تركواز عميق كقيم افتراضية)
function applyThemeColors(colors: Record<string, string | number> = {}) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const vars: Record<string, string> = {
    '--primary': String(colors.primary ?? '#14b8a6'),
    '--primary-dark': String(colors.primary_dark ?? '#0f766e'),
    '--accent': String(colors.accent ?? '#D4AF37'),
    '--bg-dark': String(colors.bg_dark ?? '#052e33'),
    '--bg-card': String(colors.bg_card ?? '#0b4248'),
    '--text': String(colors.text ?? '#e6f7f5'),
    '--text-muted': String(colors.text_muted ?? '#7fb8b1'),
    '--heading': String(colors.heading ?? '#ffffff'),
    '--navbar-bg': String(colors.navbar_bg_dark ?? 'rgba(5,46,51,0.92)'),
    '--navbar-border': String(colors.navbar_border ?? 'rgba(20,184,166,0.35)'),
    '--gradient-from': String(colors.gradient_text_from ?? '#2dd4bf'),
    '--gradient-to': String(colors.gradient_text_to ?? '#D4AF37'),
    '--btn-primary': String(colors.btn_primary_bg ?? '#0f766e'),
    '--btn-primary2': String(colors.btn_primary_bg2 ?? '#0d9488'),
    '--btn-outline': String(colors.btn_outline_color ?? '#0f766e'),
    '--link-hover': String(colors.link_hover ?? '#0f766e'),
  };
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

// تحميل ألوان الثيم من API وتطبيقها + إرجاعها للحالة
function useThemeColors() {
  const [themeColors, setThemeColors] = useState<Record<string, string | number>>({});
  useEffect(() => {
    applyThemeColors(themeColors);
  }, [themeColors]);
  useEffect(() => {
    let active = true;
    const loadTheme = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/events/${EVENT_ID}`, { cache: 'no-store' });
        const data = await res.json();
        if (data?.data?.site_config) {
          try {
            const sc = JSON.parse(data.data.site_config);
            if (sc.theme_colors && active) setThemeColors(sc.theme_colors);
          } catch {}
        }
      } catch {}
    };
    loadTheme();
    return () => { active = false; };
  }, []);
  return themeColors;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'عام', startup: 'شركات ناشئة', investor: 'استثمار',
  tech: 'تكنولوجيا', news: 'أخبار', interview: 'مقابلات',
};

// ─── Article Detail View ──────────────────────────────────────────────────────
function ArticleView({ slug }: { slug: string }) {
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const themeColors = useThemeColors();

  const primary = String(themeColors.primary || '#14b8a6');
  const bgDark = String(themeColors.bg_dark || '#052e33');
  const bgCard = String(themeColors.bg_card || '#0b4248');
  const text = String(themeColors.text || '#e6f7f5');
  const textMuted = String(themeColors.text_muted || '#7fb8b1');
  const heading = String(themeColors.heading || '#ffffff');
  const btnPrimary = String(themeColors.btn_primary_bg || '#0f766e');
  const btnPrimary2 = String(themeColors.btn_primary_bg2 || '#0d9488');
  const link = String(themeColors.link_hover || '#0f766e');
  const chipColor = String(themeColors.gradient_text_from || '#2dd4bf');
  // عرض صفحة المقال — يتبع إعداد صفحة المدونات إن ضُبط، والافتراضي 820
  const artMaxW = themeColors.blg_max_width ? Number(themeColors.blg_max_width) : 820;

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/api/events/${EVENT_ID}/articles/${slug}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => { if (data.data && active) setArticle(data.data); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '5rem', color: textMuted }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${btnPrimary}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      جاري التحميل...
    </div>
  );

  if (!article) return (
    <div style={{ textAlign: 'center', padding: '5rem', color: textMuted }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📄</div>
      <p>المقال غير موجود</p>
      <a href="/blog" style={{ color: link }}>← العودة للمدونة</a>
    </div>
  );

  const content = article.content_ar || article.content;
  const title = article.title_ar || article.title;
  const excerpt = article.excerpt_ar || article.excerpt;
  const readTime = Math.max(1, Math.ceil((content || '').split(' ').length / 200));

  return (
    <div>
      {/* Hero */}
      <div style={{ position: 'relative', background: bgCard, marginBottom: 0 }}>
        {article.cover_image && (
          <>
            <img src={article.cover_image} alt={title} style={{ width: '100%', height: 320, objectFit: 'cover', opacity: 0.35 }} />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${bgDark} 40%, transparent)` }} />
          </>
        )}
        <div style={{ maxWidth: artMaxW, margin: '0 auto', padding: article.cover_image ? '0 1.5rem 2.5rem' : '2.5rem 1.5rem', position: 'relative' }}>
          <a href="/blog" style={{ color: link, textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1.5rem' }}>← العودة للمدونة</a>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <span style={{ padding: '0.25rem 0.7rem', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, background: `${hexToRgba(primary, 0.2)}`, color: chipColor }}>
              {CATEGORY_LABELS[article.category] || article.category}
            </span>
            {article.tags && article.tags.split(',').map((tag: string) => (
              <span key={tag} style={{ padding: '0.25rem 0.7rem', borderRadius: 20, fontSize: '0.73rem', background: 'rgba(255,255,255,0.07)', color: textMuted }}>
                #{tag.trim()}
              </span>
            ))}
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 900, color: heading, lineHeight: 1.4, margin: '0 0 0.75rem' }}>{title}</h1>
          {excerpt && <p style={{ fontSize: '1rem', color: textMuted, lineHeight: 1.7, marginBottom: '1.25rem' }}>{excerpt}</p>}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg, ${primary}, ${btnPrimary2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, flexShrink: 0 }}>
              {article.author_name?.[0]}
            </div>
            <div>
              <p style={{ color: heading, fontWeight: 600, margin: 0, fontSize: '0.88rem' }}>{article.author_name}</p>
              <p style={{ color: textMuted, margin: 0, fontSize: '0.73rem' }}>
                {article.published_at ? new Date(article.published_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                {' · '}دقيقة {readTime} قراءة · {article.views} مشاهدة
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: artMaxW, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        {/* File attachment download */}
        {article.file_attachment && (
          <a href={article.file_attachment} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.25rem', background: `${hexToRgba(primary, 0.15)}`, border: `1px solid ${hexToRgba(primary, 0.4)}`, borderRadius: '0.6rem', color: chipColor, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, marginBottom: '1.5rem' }}>
            📎 {article.file_attachment_name || 'تحميل الملف المرفق'}
          </a>
        )}
        <style>{`
          .ac h2{color:${heading};font-size:1.4rem;font-weight:700;border-bottom:1px solid ${hexToRgba(primary, 0.25)};padding-bottom:.4rem;margin:1.5rem 0 .75rem}
          .ac h3{color:${chipColor};font-size:1.1rem;font-weight:700;margin:1.2rem 0 .5rem}
          .ac p{color:${text};line-height:1.9;margin-bottom:1rem}
          .ac ul,.ac ol{color:${text};padding-right:1.5rem;margin-bottom:1rem}
          .ac li{margin-bottom:.4rem;line-height:1.7}
          .ac strong{color:${heading}}
          .ac a{color:${primary};text-decoration:underline}
          .ac img{max-width:100%;border-radius:8px;margin:1rem 0}
          .ac blockquote{border-right:4px solid ${primary};padding:1rem;margin:1.5rem 0;background:${hexToRgba(primary, 0.08)};border-radius:0 8px 8px 0}
          .ac code{background:rgba(255,255,255,0.1);padding:.15rem .4rem;border-radius:4px;font-family:monospace;font-size:.88em}
        `}</style>
        <div className="ac" dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </div>
  );
}

// ─── Articles List View ───────────────────────────────────────────────────────
function ArticlesList() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const themeColors = useThemeColors();

  const primary = String(themeColors.primary || '#14b8a6');
  const bgDark = String(themeColors.bg_dark || '#052e33');
  const bgCard = String(themeColors.bg_card || '#0b4248');
  const text = String(themeColors.text || '#e6f7f5');
  const textMuted = String(themeColors.text_muted || '#7fb8b1');
  const heading = String(themeColors.heading || '#ffffff');
  const btnPrimary = String(themeColors.btn_primary_bg || '#0f766e');
  const btnPrimary2 = String(themeColors.btn_primary_bg2 || '#0d9488');
  const link = String(themeColors.link_hover || '#0f766e');
  const chipColor = String(themeColors.gradient_text_from || '#2dd4bf');

  // إعدادات صفحة المدونات من الثيم (بالأدمن)
  const blgMaxW = Number(themeColors.blg_max_width) || 1100;
  const blgTitleFs = Number(themeColors.blg_title_fs) || 32;
  const blgHeaderPad = Number(themeColors.blg_header_pad) ?? 32;
  const blgCardRadius = Number(themeColors.blg_card_radius) ?? 16;
  const blgCardGap = Number(themeColors.blg_card_gap) ?? 20;
  const blgTitleMt = Number(themeColors.blg_title_mt) ?? 12;
  const blgDescMt = Number(themeColors.blg_desc_mt) ?? 4;

  const load = (cat = '') => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '20' });
    if (cat) params.set('category', cat);
    fetch(`${API_BASE}/api/events/${EVENT_ID}/articles?${params}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => setArticles(data.data || []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(''); }, []);

  const CATS = ['', 'general', 'startup', 'investor', 'tech', 'news', 'interview'];

  return (
    <div>
      {/* Header */}
      <div style={{ background: `${hexToRgba(primary, 0.06)}`, borderBottom: `1px solid ${hexToRgba(primary, 0.2)}`, padding: `${blgHeaderPad}px 1.5rem` }}>
        <div style={{ maxWidth: blgMaxW, margin: '0 auto' }}>
          <a href="/" style={{ color: link, textDecoration: 'none', fontSize: '0.88rem' }}>← الصفحة الرئيسية</a>
          <h1 style={{ fontSize: `${blgTitleFs}px`, fontWeight: 900, color: heading, margin: `${blgTitleMt}px 0 ${blgDescMt}px` }}>المدونة</h1>
          <p style={{ color: textMuted, margin: `${blgDescMt}px 0 0` }}>مقالات وأفكار حول ريادة الأعمال والشركات الناشئة</p>
        </div>
      </div>

      <div style={{ maxWidth: blgMaxW, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        {/* Category filter */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {CATS.map(c => (
            <button key={c} onClick={() => { setCategory(c); load(c); }}
              style={{ padding: '0.4rem 1rem', borderRadius: 20, fontSize: '0.82rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: category === c ? btnPrimary : `${hexToRgba(primary, 0.1)}`,
                color: category === c ? 'white' : textMuted }}>
              {c ? (CATEGORY_LABELS[c] || c) : '🌐 الكل'}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: textMuted }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${btnPrimary}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : articles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: textMuted }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
            <p>لا توجد مقالات بعد</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: `${blgCardGap}px` }}>
            {articles.map(article => (
              <a key={article.id} href={`/blog?article=${article.slug}`}
                style={{ textDecoration: 'none', display: 'block' }}>
                <article style={{ background: bgCard, border: `1px solid ${hexToRgba(primary, 0.2)}`, borderRadius: `${blgCardRadius}px`, overflow: 'hidden', transition: 'border-color 0.2s, transform 0.2s', height: '100%', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = primary)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = hexToRgba(primary, 0.2))}>
                  {article.cover_image && (
                    <img src={article.cover_image} alt={article.title_ar || article.title}
                      style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                  )}
                  <div style={{ padding: '1.1rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                      <span style={{ padding: '0.15rem 0.55rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, background: `${hexToRgba(primary, 0.15)}`, color: chipColor }}>
                        {CATEGORY_LABELS[article.category] || article.category}
                      </span>
                    </div>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: heading, margin: '0 0 0.4rem', lineHeight: 1.5 }}>
                      {article.title_ar || article.title}
                    </h2>
                    {(article.excerpt_ar || article.excerpt) && (
                      <p style={{ color: textMuted, fontSize: '0.82rem', lineHeight: 1.6, margin: '0 0 0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>
                        {article.excerpt_ar || article.excerpt}
                      </p>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: textMuted }}>
                      <span>✍️ {article.author_name}</span>
                      <span>{article.views} مشاهدة</span>
                    </div>
                  </div>
                </article>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function BlogContent() {
  const searchParams = useSearchParams();
  const articleSlug = searchParams?.get('article');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text)', fontFamily: 'Cairo, sans-serif', direction: 'rtl' }} data-theme="dark">
      <PixelInjector eventId={EVENT_ID} />
      {articleSlug ? <ArticleView slug={articleSlug} /> : <ArticlesList />}
    </div>
  );
}

export default function BlogPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontFamily: 'Cairo,sans-serif' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: 40, height: 40, border: '3px solid #14b8a6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <BlogContent />
    </Suspense>
  );
}
