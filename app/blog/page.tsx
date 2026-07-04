'use client';
// app/blog/page.tsx - Blog listing + single article (query params for static export)
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const API_BASE = 'https://event-api.info1703.workers.dev';
const EVENT_ID = 1;

const CATEGORY_LABELS: Record<string, string> = {
  general: 'عام', startup: 'شركات ناشئة', investor: 'استثمار',
  tech: 'تكنولوجيا', news: 'أخبار', interview: 'مقابلات',
};

// ─── Article Detail View ──────────────────────────────────────────────────────
function ArticleView({ slug }: { slug: string }) {
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/events/${EVENT_ID}/articles/${slug}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => { if (data.data) setArticle(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '5rem', color: '#94a3b8' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #6C63FF', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      جاري التحميل...
    </div>
  );

  if (!article) return (
    <div style={{ textAlign: 'center', padding: '5rem', color: '#94a3b8' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📄</div>
      <p>المقال غير موجود</p>
      <a href="/blog" style={{ color: '#6C63FF' }}>← العودة للمدونة</a>
    </div>
  );

  const content = article.content_ar || article.content;
  const title = article.title_ar || article.title;
  const excerpt = article.excerpt_ar || article.excerpt;
  const readTime = Math.max(1, Math.ceil((content || '').split(' ').length / 200));

  return (
    <div>
      {/* Hero */}
      <div style={{ position: 'relative', background: '#13102a', marginBottom: 0 }}>
        {article.cover_image && (
          <>
            <img src={article.cover_image} alt={title} style={{ width: '100%', height: 320, objectFit: 'cover', opacity: 0.35 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0d0b1a 40%, transparent)' }} />
          </>
        )}
        <div style={{ maxWidth: 820, margin: '0 auto', padding: article.cover_image ? '0 1.5rem 2.5rem' : '2.5rem 1.5rem', position: 'relative' }}>
          <a href="/blog" style={{ color: '#6C63FF', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-block', marginBottom: '1.5rem' }}>← العودة للمدونة</a>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <span style={{ padding: '0.25rem 0.7rem', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, background: 'rgba(108,99,255,0.2)', color: '#a5b4fc' }}>
              {CATEGORY_LABELS[article.category] || article.category}
            </span>
            {article.tags && article.tags.split(',').map((tag: string) => (
              <span key={tag} style={{ padding: '0.25rem 0.7rem', borderRadius: 20, fontSize: '0.73rem', background: 'rgba(255,255,255,0.07)', color: '#94a3b8' }}>
                #{tag.trim()}
              </span>
            ))}
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 900, color: 'white', lineHeight: 1.4, margin: '0 0 0.75rem' }}>{title}</h1>
          {excerpt && <p style={{ fontSize: '1rem', color: '#94a3b8', lineHeight: 1.7, marginBottom: '1.25rem' }}>{excerpt}</p>}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#6C63FF,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, flexShrink: 0 }}>
              {article.author_name?.[0]}
            </div>
            <div>
              <p style={{ color: 'white', fontWeight: 600, margin: 0, fontSize: '0.88rem' }}>{article.author_name}</p>
              <p style={{ color: '#64748b', margin: 0, fontSize: '0.73rem' }}>
                {article.published_at ? new Date(article.published_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                {' · '}دقيقة {readTime} قراءة · {article.views} مشاهدة
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        <style>{`
          .ac h2{color:white;font-size:1.4rem;font-weight:700;border-bottom:1px solid rgba(108,99,255,0.25);padding-bottom:.4rem;margin:1.5rem 0 .75rem}
          .ac h3{color:#a5b4fc;font-size:1.1rem;font-weight:700;margin:1.2rem 0 .5rem}
          .ac p{color:#d1d5db;line-height:1.9;margin-bottom:1rem}
          .ac ul,.ac ol{color:#d1d5db;padding-right:1.5rem;margin-bottom:1rem}
          .ac li{margin-bottom:.4rem;line-height:1.7}
          .ac strong{color:white}
          .ac a{color:#6C63FF;text-decoration:underline}
          .ac img{max-width:100%;border-radius:8px;margin:1rem 0}
          .ac blockquote{border-right:4px solid #6C63FF;padding:1rem;margin:1.5rem 0;background:rgba(108,99,255,0.08);border-radius:0 8px 8px 0}
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

  const load = (cat = '') => {
    setLoading(true);
    const q = cat ? `?category=${cat}` : '';
    fetch(`${API_BASE}/api/events/${EVENT_ID}/articles${q}&limit=20`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => setArticles(data.data || []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const CATS = ['', 'general', 'startup', 'investor', 'tech', 'news', 'interview'];

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'rgba(108,99,255,0.06)', borderBottom: '1px solid rgba(108,99,255,0.2)', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <a href="/" style={{ color: '#6C63FF', textDecoration: 'none', fontSize: '0.88rem' }}>← الصفحة الرئيسية</a>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'white', margin: '0.75rem 0 0.4rem' }}>📝 المدونة</h1>
          <p style={{ color: '#94a3b8', margin: 0 }}>مقالات وأفكار حول ريادة الأعمال والشركات الناشئة</p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        {/* Category filter */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {CATS.map(c => (
            <button key={c} onClick={() => { setCategory(c); load(c); }}
              style={{ padding: '0.4rem 1rem', borderRadius: 20, fontSize: '0.82rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: category === c ? '#6C63FF' : 'rgba(108,99,255,0.1)',
                color: category === c ? 'white' : '#94a3b8' }}>
              {c ? (CATEGORY_LABELS[c] || c) : '🌐 الكل'}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            <div style={{ width: 36, height: 36, border: '3px solid #6C63FF', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : articles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
            <p>لا توجد مقالات بعد</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {articles.map(article => (
              <a key={article.id} href={`/blog?article=${article.slug}`}
                style={{ textDecoration: 'none', display: 'block' }}>
                <article style={{ background: '#13102a', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '1rem', overflow: 'hidden', transition: 'border-color 0.2s', height: '100%' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#6C63FF')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(108,99,255,0.2)')}>
                  {article.cover_image && (
                    <img src={article.cover_image} alt={article.title_ar || article.title}
                      style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                  )}
                  <div style={{ padding: '1.1rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                      <span style={{ padding: '0.15rem 0.55rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, background: 'rgba(108,99,255,0.15)', color: '#a5b4fc' }}>
                        {CATEGORY_LABELS[article.category] || article.category}
                      </span>
                    </div>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', margin: '0 0 0.4rem', lineHeight: 1.5 }}>
                      {article.title_ar || article.title}
                    </h2>
                    {(article.excerpt_ar || article.excerpt) && (
                      <p style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.6, margin: '0 0 0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>
                        {article.excerpt_ar || article.excerpt}
                      </p>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b' }}>
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
    <div style={{ minHeight: '100vh', background: '#0d0b1a', color: '#e2e8f0', fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>
      {articleSlug ? <ArticleView slug={articleSlug} /> : <ArticlesList />}
    </div>
  );
}

export default function BlogPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0d0b1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontFamily: 'Cairo,sans-serif' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: 40, height: 40, border: '3px solid #6C63FF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <BlogContent />
    </Suspense>
  );
}
