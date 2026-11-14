'use client';
// app/components/EmbeddedRegistrationForm.tsx
// استمارة تسجيل مدمجة تُستخدم داخل الصفحات الثابتة (بدون فتح نافذة/إعادة تحميل)
import { useEffect, useState } from 'react';
import { submitRegistration, apiFetch } from '../../lib/api';
import type { FormConfig } from '../../lib/types';

const DEFAULT_CFG: FormConfig = {
  enabled_types: ['general'],
  form_title: 'سجّل الآن',
  form_subtitle: '',
  show_phone: true,
  require_phone: false,
  show_city: true,
  require_city: false,
  show_motivation: false,
  motivation_label: 'لماذا تريد الحضور؟',
  terms_text: 'أوافق على الشروط والأحكام وسياسة الخصوصية',
  cities: ['دمشق', 'حلب', 'حمص', 'اللاذقية', 'طرطوس', 'حماة', 'دير الزور', 'الرقة', 'القامشلي', 'إدلب', 'درعا', 'خارج سوريا'],
  sectors: [],
  stages: ['فكرة', 'نموذج أولي', 'مرحلة مبكرة', 'نمو', 'توسع'],
  type_labels: { general: 'حضور عام', startup: 'ستارتب', investor: 'مستثمر', speaker: 'متحدث', sponsor: 'راعي', media: 'إعلام' },
  extra_fields: [],
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(148,163,184,0.28)',
  borderRadius: '0.55rem',
  padding: '0.62rem 0.8rem',
  color: 'var(--text, #e6f7f5)',
  fontSize: '0.92rem',
  outline: 'none',
  fontFamily: 'inherit',
  colorScheme: 'dark',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  color: 'var(--text-muted, #7fb8b1)',
  marginBottom: '0.3rem',
  fontWeight: 600,
};

export default function EmbeddedRegistrationForm({ eventId, primaryColor = '#14b8a6' }: { eventId: number; primaryColor?: string }) {
  const [cfg, setCfg] = useState<FormConfig>(DEFAULT_CFG);
  const [event, setEvent] = useState<any>(null);
  const [tab, setTab] = useState('general');
  const [form, setForm] = useState<Record<string, any>>({ agreed: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ name: string; code?: string; type: string } | null>(null);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  // Load event + its form configuration once
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list: any = await apiFetch<any>('/api/events');
        const found = (list?.data || []).find((e: any) => Number(e.id) === Number(eventId));
        if (!found?.slug) return;
        const res: any = await apiFetch<any>(`/api/events/${found.slug}`);
        const ev = res?.data;
        if (!alive || !ev) return;
        setEvent(ev);
        if (ev.form_config) {
          try {
            const parsed = JSON.parse(ev.form_config);
            const merged: FormConfig = { ...DEFAULT_CFG, ...parsed };
            if (!merged.enabled_types?.length) merged.enabled_types = ['general'];
            setCfg(merged);
            setTab(prev => (merged.enabled_types.includes(prev) ? prev : merged.enabled_types[0]));
          } catch {}
        }
      } catch {}
    })();
    return () => { alive = false; };
  }, [eventId]);

  const enabledTypes = cfg.enabled_types?.length ? cfg.enabled_types : ['general'];
  const typeLabel = (t: string) => cfg.type_labels?.[t] || DEFAULT_CFG.type_labels?.[t] || t;
  const isClosed = event && Number(event.registration_open) === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.full_name?.trim() || !form.email?.trim()) {
      setError('الاسم الكامل والبريد الإلكتروني مطلوبان');
      return;
    }
    if (!form.agreed) {
      setError('يجب الموافقة على ' + (cfg.terms_text || DEFAULT_CFG.terms_text));
      return;
    }
    setLoading(true);
    try {
      const extra = Object.fromEntries(
        (cfg.extra_fields || [])
          .filter((f: any) => (f.for_types || []).includes(tab))
          .map((f: any) => [f.key, form[f.key] || null])
      );
      const res: any = await submitRegistration(eventId, {
        reg_type: tab,
        full_name: form.full_name,
        email: form.email,
        ...(cfg.show_phone ? { phone: form.phone || null } : {}),
        ...(cfg.show_city ? { city: form.city === 'خارج سوريا' ? (form.country_city || null) : (form.city || null) } : {}),
        ...(form.city === 'خارج سوريا' ? { country: form.country || '' } : {}),
        ...(cfg.show_motivation ? { motivation: form.motivation || null } : {}),
        ...extra,
        ...(tab === 'startup' ? {
          company_name: form.company_name || null,
          sector: form.sector || null,
          stage: form.stage || null,
          team_size: form.team_size || null,
          website: form.website || null,
          description: form.description || null,
        } : {}),
      });
      setResult({ name: form.full_name, code: res?.data?.ticket_code, type: tab });
    } catch (err: any) {
      setError(err?.message || 'تعذّر إرسال التسجيل، حاول مرة أخرى');
    }
    setLoading(false);
  };


  // ── Success ────────────────────────────────────────────────────────────────
  if (result) {
    return (
      <div style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: '0.9rem', padding: '1.75rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>✅</div>
        <h3 style={{ margin: '0 0 0.5rem', color: 'var(--heading, #fff)', fontSize: '1.15rem' }}>تم تسجيلك بنجاح!</h3>
        <p style={{ margin: '0 0 0.25rem', color: 'var(--text-muted, #7fb8b1)', fontSize: '0.9rem' }}>
          أهلاً {result.name} — تم حفظ تسجيلك فوراً ({typeLabel(result.type)})
        </p>
        {result.code && (
          <p style={{ margin: '0.5rem 0 0', color: 'var(--text, #e6f7f5)', fontSize: '0.9rem' }}>
            رقم التذكرة: <strong style={{ letterSpacing: 1 }}>{result.code}</strong>
          </p>
        )}
        <p style={{ margin: '0.9rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted, #7fb8b1)' }}>
          احتفظ برقم التذكرة — ستصلك التفاصيل على بريدك الإلكتروني.
        </p>
        <button
          type="button"
          onClick={() => { setResult(null); setForm({ agreed: false }); }}
          style={{ marginTop: '1rem', background: primaryColor, color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.4rem', cursor: 'pointer', fontWeight: 700 }}
        >
          تسجيل شخص آخر
        </button>
      </div>
    );
  }

  // ── Closed ─────────────────────────────────────────────────────────────────
  if (isClosed) {
    return (
      <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.9rem', padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted, #7fb8b1)' }}>
        ⛔ التسجيل مغلق حالياً لهذه الفعالية.
      </div>
    );
  }

  const showCountry = form.city === 'خارج سوريا';
  const extraForTab = (cfg.extra_fields || []).filter((f: any) => (f.for_types || []).includes(tab));

  return (
    <form onSubmit={handleSubmit} dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <style>{`@media(max-width:640px){.erf-grid{grid-template-columns:1fr !important}}`}</style>

      {/* نوع التسجيل */}
      {enabledTypes.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', background: 'rgba(255,255,255,0.05)', padding: '0.3rem', borderRadius: '0.6rem' }}>
          {enabledTypes.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{
                flex: 1, minWidth: 110, padding: '0.45rem 0.6rem', borderRadius: '0.45rem', cursor: 'pointer',
                border: 'none', fontSize: '0.85rem', fontWeight: 700, fontFamily: 'inherit',
                background: tab === t ? primaryColor : 'transparent',
                color: tab === t ? '#fff' : 'var(--text-muted, #7fb8b1)',
              }}
            >
              {typeLabel(t)}
            </button>
          ))}
        </div>
      )}

      <div className="erf-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
        <div>
          <label style={labelStyle}>الاسم الكامل *</label>
          <input style={inputStyle} required value={form.full_name || ''} onChange={e => set('full_name', e.target.value)} placeholder="أدخل اسمك الكامل" />
        </div>
        <div>
          <label style={labelStyle}>البريد الإلكتروني *</label>
          <input style={inputStyle} type="email" required value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="example@email.com" dir="ltr" />
        </div>

        {cfg.show_phone && (
          <div>
            <label style={labelStyle}>رقم الهاتف {cfg.require_phone ? '*' : ''}</label>
            <input style={inputStyle} type="tel" required={!!cfg.require_phone} value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+963 9xx xxx xxx" dir="ltr" />
          </div>
        )}

        {cfg.show_city && (
          <div>
            <label style={labelStyle}>المدينة {cfg.require_city ? '*' : ''}</label>
            <select style={inputStyle} required={!!cfg.require_city} value={form.city || ''} onChange={e => set('city', e.target.value)}>
              <option value="">اختر المدينة</option>
              {(cfg.cities || DEFAULT_CFG.cities).map((c: string) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {showCountry && (
          <>
            <div>
              <label style={labelStyle}>الدولة</label>
              <input style={inputStyle} value={form.country || ''} onChange={e => set('country', e.target.value)} placeholder="اسم الدولة" />
            </div>
            <div>
              <label style={labelStyle}>المدينة (خارج سوريا)</label>
              <input style={inputStyle} value={form.country_city || ''} onChange={e => set('country_city', e.target.value)} placeholder="اسم المدينة" />
            </div>
          </>
        )}
      </div>

      {/* حقول الستارتب */}
      {tab === 'startup' && (
        <div className="erf-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
          <div>
            <label style={labelStyle}>اسم الشركة / المشروع *</label>
            <input style={inputStyle} required value={form.company_name || ''} onChange={e => set('company_name', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>القطاع</label>
            {Array.isArray(cfg.sectors) && cfg.sectors.length > 0 ? (
              <select style={inputStyle} value={form.sector || ''} onChange={e => set('sector', e.target.value)}>
                <option value="">اختر القطاع</option>
                {cfg.sectors.map((s: string) => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <input style={inputStyle} value={form.sector || ''} onChange={e => set('sector', e.target.value)} />
            )}
          </div>
          <div>
            <label style={labelStyle}>مرحلة المشروع</label>
            <select style={inputStyle} value={form.stage || ''} onChange={e => set('stage', e.target.value)}>
              <option value="">اختر المرحلة</option>
              {(cfg.stages || DEFAULT_CFG.stages).map((s: string) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>حجم الفريق</label>
            <input style={inputStyle} value={form.team_size || ''} onChange={e => set('team_size', e.target.value)} placeholder="مثال: 5" />
          </div>
          <div>
            <label style={labelStyle}>الموقع الإلكتروني</label>
            <input style={inputStyle} value={form.website || ''} onChange={e => set('website', e.target.value)} placeholder="https://" dir="ltr" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>وصف المشروع</label>
            <textarea style={{ ...inputStyle, minHeight: 90 }} value={form.description || ''} onChange={e => set('description', e.target.value)} />
          </div>
        </div>
      )}

      {/* حقول إضافية من إعدادات الفورم */}
      {extraForTab.map((f: any) => (
        <div key={f.key}>
          <label style={labelStyle}>{f.label}{f.required ? ' *' : ''}</label>
          {f.type === 'textarea' ? (
            <textarea style={{ ...inputStyle, minHeight: 90 }} required={!!f.required} value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder || ''} />
          ) : f.type === 'select' && Array.isArray(f.options) && f.options.length > 0 ? (
            <select style={inputStyle} required={!!f.required} value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)}>
              <option value="">اختر</option>
              {f.options.map((o: string) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input style={inputStyle} type={f.type === 'number' ? 'number' : 'text'} required={!!f.required} value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder || ''} />
          )}
        </div>
      ))}

      {cfg.show_motivation && (
        <div>
          <label style={labelStyle}>{cfg.motivation_label || DEFAULT_CFG.motivation_label}</label>
          <textarea style={{ ...inputStyle, minHeight: 100 }} value={form.motivation || ''} onChange={e => set('motivation', e.target.value)} />
        </div>
      )}

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-muted, #7fb8b1)', fontSize: '0.85rem' }}>
        <input type="checkbox" checked={!!form.agreed} onChange={e => set('agreed', e.target.checked)} style={{ accentColor: primaryColor, width: 16, height: 16 }} />
        {cfg.terms_text || DEFAULT_CFG.terms_text}
      </label>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '0.5rem', padding: '0.7rem 0.9rem', color: '#fca5a5', fontSize: '0.85rem' }}>
          ❌ {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          background: primaryColor, color: '#fff', border: 'none', borderRadius: '0.6rem',
          padding: '0.75rem 1.5rem', fontSize: '1rem', fontWeight: 800, fontFamily: 'inherit',
          cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? '⏳ جارٍ إرسال التسجيل...' : '✅ سجّل الآن'}
      </button>
      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted, #7fb8b1)', textAlign: 'center' }}>
        يتم حفظ تسجيلك فوراً في قاعدة البيانات دون مغادرة الصفحة.
      </p>
    </form>
  );
}

