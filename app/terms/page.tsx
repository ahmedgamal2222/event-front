'use client';
// app/terms/page.tsx - Terms & Privacy page
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PixelInjector from '../components/PixelInjector';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev';
const EVENT_ID = Number(process.env.NEXT_PUBLIC_EVENT_ID || 1);

const STYLES = `
  .tc h2{color:white;font-size:1.4rem;font-weight:700;border-bottom:1px solid rgba(108,99,255,0.2);padding-bottom:.4rem;margin:1.5rem 0 .75rem}
  .tc h3{color:#a5b4fc;font-size:1.1rem;font-weight:700;margin:1.2rem 0 .5rem}
  .tc p{color:#d1d5db;line-height:1.9;margin-bottom:1rem}
  .tc ul,.tc ol{color:#d1d5db;padding-right:1.5rem;margin-bottom:1rem}
  .tc li{margin-bottom:.4rem;line-height:1.7}
  .tc strong{color:white}
  .tc a{color:#6C63FF;text-decoration:underline}
  .tc hr{border:none;border-top:1px solid rgba(108,99,255,0.2);margin:1.5rem 0}
`;

function TermsContent() {
  const searchParams = useSearchParams();
  const tab = searchParams?.get('tab') || 'terms';
  const pageSlug = searchParams?.get('page');
  const [terms, setTerms] = useState<{ terms_content?: string; privacy_content?: string } | null>(null);
  const [staticPage, setStaticPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pageSlug) {
      // Load custom static page
      fetch(`${API_BASE}/api/events/${EVENT_ID}/pages/${pageSlug}`, { cache: 'no-store' })
        .then(r => r.json())
        .then(data => { if (data.data) setStaticPage(data.data); })
        .catch(() => {})
        .finally(() => setLoading(false));
      return;
    }
    fetch(`${API_BASE}/api/events/${EVENT_ID}/terms`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => { if (data.data) setTerms(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab, pageSlug]);

  const active = tab === 'privacy' ? 'privacy' : 'terms';
  const tabStyle = (t: string) => ({
    padding: '0.5rem 1.25rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
    background: active === t ? '#6C63FF' : 'rgba(255,255,255,0.06)', color: active === t ? 'white' : '#94a3b8', textDecoration: 'none', display: 'inline-block',
  } as React.CSSProperties);

  // Render custom static page
  if (pageSlug) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d0b1a', color: '#e2e8f0', fontFamily: 'Cairo,sans-serif', direction: 'rtl' }}>
        <PixelInjector eventId={EVENT_ID} />
        <div style={{ background: 'rgba(108,99,255,0.06)', borderBottom: '1px solid rgba(108,99,255,0.2)', padding: '1.5rem' }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <a href="/" style={{ color: '#6C63FF', textDecoration: 'none', fontSize: '0.88rem' }}>← الصفحة الرئيسية</a>
          </div>
        </div>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <div style={{ width: 36, height: 36, border: '3px solid #6C63FF', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : !staticPage ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
              <p>الصفحة غير موجودة</p>
              <a href="/" style={{ color: '#6C63FF', marginTop: '1rem', display: 'inline-block' }}>← العودة للرئيسية</a>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', marginBottom: '2rem', borderBottom: '1px solid rgba(108,99,255,0.2)', paddingBottom: '1rem' }}>
                {staticPage.title_ar || staticPage.title}
              </h1>
              <style>{STYLES}</style>
              <div className="tc" dangerouslySetInnerHTML={{ __html: staticPage.content_ar || staticPage.content || '' }} />
            </>
          )}
        </div>
      </div>
    );
  }


  return (
    <div style={{ minHeight: '100vh', background: '#0d0b1a', color: '#e2e8f0', fontFamily: 'Cairo,sans-serif', direction: 'rtl' }}>
      <PixelInjector eventId={EVENT_ID} />
      <div style={{ background: 'rgba(108,99,255,0.06)', borderBottom: '1px solid rgba(108,99,255,0.2)', padding: '1.5rem' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <a href="/" style={{ color: '#6C63FF', textDecoration: 'none', fontSize: '0.88rem' }}>← الصفحة الرئيسية</a>
        </div>
      </div>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          <a href="/terms?tab=terms" style={tabStyle('terms')}>📋 الشروط والأحكام</a>
          <a href="/terms?tab=privacy" style={tabStyle('privacy')}>🔒 سياسة الخصوصية</a>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ width: 36, height: 36, border: '3px solid #6C63FF', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : !(active === 'terms' ? terms?.terms_content : terms?.privacy_content) ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📄</div>
            <p>لم يتم إضافة هذا المحتوى بعد</p>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', marginBottom: '2rem', borderBottom: '1px solid rgba(108,99,255,0.2)', paddingBottom: '1rem' }}>
              {active === 'terms' ? 'الشروط والأحكام' : 'سياسة الخصوصية'}
            </h1>
            <style>{STYLES}</style>
            <div className="tc" dangerouslySetInnerHTML={{ __html: active === 'terms' ? (terms?.terms_content || '') : (terms?.privacy_content || '') }} />
          </>
        )}
      </div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0d0b1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: 40, height: 40, border: '3px solid #6C63FF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <TermsContent />
    </Suspense>
  );
}
