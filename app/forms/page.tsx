'use client';
// app/forms/page.tsx – Public standalone form renderer (/f/{slug})
import { useEffect, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { fetchPublicForm, submitPublicForm } from '../../lib/api';
import PublicFormField from '../components/PublicFormField';




function PublicForm() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pathSlug = (() => {
    const segs = (pathname || '').split('/').filter(Boolean);
    // /f/{slug}
    if (segs[0] === 'f' && segs[1]) { try { return decodeURIComponent(segs[1]); } catch { return segs[1]; } }
    return null;
  })();

  const slug = searchParams?.get('slug') || pathSlug || '';

  const [form, setForm] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [values, setValues] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) { setNotFound(true); setLoading(false); return; }
    let alive = true;
    (async () => {
      try {
        const res = await fetchPublicForm(slug);
        if (!alive) return;
        if (res?.data) setForm(res.data); else setNotFound(true);
      } catch { if (alive) setNotFound(true); }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [slug]);

  const set = (k: string, v: any) => setValues(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setError('');
    const missing = (form.fields || []).filter((f: any) => {
      const v = values[f.key];
      return f.required && (f.type === 'checkbox' ? !v : !String(v ?? '').trim());
    });
    if (missing.length) {
      setError(`يرجى تعبئة الحقول المطلوبة: ${missing.map((f: any) => f.label).join('، ')}`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitPublicForm(slug, values);
      setDone(res?.data?.message || form.success_message || '✅ تم إرسال الاستمارة بنجاح');
    } catch (err: any) {
      setError(err?.message || 'تعذّر الإرسال، حاول مرة أخرى');
    }
    setSubmitting(false);
  };

  const accent = 'var(--primary, #14b8a6)';

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at 50% -10%, rgba(45,212,191,.18), transparent 55%), var(--bg-dark, #052e33)', padding: '2.5rem 1rem 4rem', fontFamily: 'Cairo,Tajawal,system-ui,-apple-system,Segoe UI,sans-serif', color: 'var(--text, #e8eefc)' }}>
      <style>{`@media(max-width:640px){.pf-grid{grid-template-columns:1fr !important}}.pf-input::placeholder{color:rgba(148,163,184,.7)}.pf-input:focus{border-color:var(--primary,#14b8a6) !important;box-shadow:0 0 0 3px rgba(20,184,166,.15)}@keyframes pfspin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', letterSpacing: 2, color: 'var(--text-muted, #7fb8b1)', fontWeight: 700 }}>S³ SUMMIT 2026</div>
        </div>

        <div style={{ background: 'var(--bg-card, #0b4248)', border: '1px solid rgba(45,212,191,0.22)', borderRadius: '1.1rem', padding: '2rem', boxShadow: '0 24px 60px rgba(0,0,0,0.35)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted, #7fb8b1)' }}>
              <div style={{ width: 38, height: 38, border: `3px solid ${accent}`, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 1rem', animation: 'pfspin .8s linear infinite' }} />
              جارٍ تحميل الاستمارة...
            </div>
          ) : notFound || !form ? (
            <div style={{ textAlign: 'center', padding: '2.5rem' }}>
              <div style={{ fontSize: '2.4rem', marginBottom: '.5rem' }}>🔗</div>
              <h2 style={{ color: '#fff', margin: '0 0 .5rem', fontSize: '1.2rem' }}>الاستمارة غير موجودة</h2>
              <p style={{ color: 'var(--text-muted, #7fb8b1)', fontSize: '.9rem', margin: 0 }}>تأكد من صحة الرابط أو تواصل مع إدارة القمة.</p>
            </div>
          ) : done ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '.75rem' }}>✅</div>
              <h2 style={{ color: '#fff', margin: '0 0 .5rem', fontSize: '1.25rem' }}>تم الإرسال بنجاح</h2>
              <p style={{ color: 'var(--text-muted, #7fb8b1)', fontSize: '.95rem', lineHeight: 1.9, margin: '0 0 1.5rem' }}>{done}</p>
              <button type="button" onClick={() => { setDone(null); setValues({}); }} style={{ background: accent, color: '#04211d', border: 'none', borderRadius: '0.6rem', padding: '0.6rem 1.6rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                إرسال استمارة أخرى
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h1 style={{ color: '#fff', fontSize: 'clamp(1.3rem,3vw,1.7rem)', fontWeight: 900, margin: '0 0 .5rem', lineHeight: 1.4 }}>{form.title}</h1>
                {form.description && <p style={{ color: 'var(--text-muted, #7fb8b1)', fontSize: '.92rem', lineHeight: 1.9, margin: 0 }}>{form.description}</p>}
              </div>

              <div className="pf-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
                {(form.fields || []).map((f: any) => (
                  <div key={f.key} style={{ gridColumn: f.width === 'half' ? 'auto' : '1 / -1' }}>
                    <PublicFormField field={f} value={values[f.key]} onChange={v => set(f.key, v)} />
                  </div>
                ))}
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '0.5rem', padding: '0.7rem 0.9rem', color: '#fca5a5', fontSize: '.85rem' }}>❌ {error}</div>
              )}

              <button type="submit" disabled={submitting} style={{ background: `linear-gradient(135deg, ${accent}, var(--primary-dark, #0f766e))`, color: '#04211d', border: 'none', borderRadius: '0.65rem', padding: '0.85rem 1.5rem', fontSize: '1rem', fontWeight: 900, fontFamily: 'inherit', cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.75 : 1 }}>
                {submitting ? '⏳ جارٍ الإرسال...' : (form.submit_label || 'إرسال')}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text-muted, #7fb8b1)', fontSize: '.75rem', marginTop: '1.25rem' }}>
          © {new Date().getFullYear()} S³ Summit — بياناتك محفوظة وتُستخدم لأغراض التسجيل فقط.
        </p>
      </div>
    </div>
  );
}

export default function FormsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'var(--bg-dark, #052e33)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 42, height: 42, border: '3px solid var(--primary, #14b8a6)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'pfspin .8s linear infinite' }} />
        <style>{`@keyframes pfspin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <PublicForm />
    </Suspense>
  );
}

