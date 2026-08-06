'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Event, Speaker, AgendaDay, Stats, Sponsor, Faq, FormConfig, SiteConfig } from '../../lib/types';
import { fetchEvent, fetchSpeakers, fetchAgenda, fetchStats, fetchSponsors, fetchFaqs, submitRegistration, fetchVenueGallery, fetchArticles, fetchTerms, fetchPages, fetchPaymentSettingsPublic, fetchCountries, fetchEventNavigation } from '../../lib/api';
import { VenueMedia } from '../../lib/types';
import PixelInjector from '../components/PixelInjector';
import TicketsSection from '../components/TicketsSection';
import SupportWidget from '../components/SupportWidget';
import RegistrationSuccessMessage from '../components/RegistrationSuccessMessage';
import { ThemeToggle, ThemeToggleAuto, IconX, IconInstagram, IconLinkedIn, IconTikTok, IconYouTube, IconFacebook, IconWhatsApp, IconTelegram, IconArchive, IconArrowRight, IconArrowLeft, AboutIcon } from '../components/SiteIcons';

const DEFAULT_EVENT_SLUG = ''; // No hardcoded fallback — slug MUST come from URL params

// ─── Event Navigation Bar ──────────────────────────────────────────────────────
function EventNavBar({ eventId, primaryColor, archiveLabel, showArchive, showThemeToggle }: { eventId: number; primaryColor: string; archiveLabel?: string; showArchive?: boolean; showThemeToggle?: boolean }) {
  const [nav, setNav] = useState<{ prev: any; current: any; next: any } | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const label = archiveLabel || '\uD83D\uDDC2 \u062C\u0645\u064A\u0639 \u0627\u0644\u0646\u0633\u062E';
  const showArc = showArchive !== false;
  const showTheme = showThemeToggle !== false;

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('event_theme') : null;
    const t = saved === 'light' ? 'light' : 'dark';
    setTheme(t as 'dark' | 'light');
    document.documentElement.setAttribute('data-theme', t);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('event_theme', next);
  };

  useEffect(() => {
    if (!eventId) return;
    fetchEventNavigation(eventId).then(r => setNav(r.data)).catch(() => {});
  }, [eventId]);

  // \u0625\u0630\u0627 \u0644\u0645 \u064A\u0643\u0646 \u0647\u0646\u0627\u0643 \u0623\u064A \u0634\u064A\u0621 \u0644\u0644\u0639\u0631\u0636 \u0623\u062E\u0641\u0650 \u0627\u0644\u0634\u0631\u064A\u0637
  if (!showArc && !showTheme) return null;

  const fmt = (d: string) => d ? new Date(d).getFullYear().toString() : '';
  const hasPrev = nav?.prev;
  const hasNext = nav?.next;

  return (
    <div style={{ background: 'rgba(0,0,0,0.4)', borderBottom: `1px solid ${primaryColor}30`, padding: '0.6rem 1.5rem', direction: 'rtl' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {/* \u0627\u0644\u062C\u0647\u0629 \u0627\u0644\u064A\u0645\u0646\u0649: \u0627\u0644\u062D\u062F\u062B \u0627\u0644\u0633\u0627\u0628\u0642 + \u0627\u0644\u0623\u0631\u0634\u064A\u0641 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {showArc && hasPrev && (
            <Link href={`/${nav!.prev.slug}`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#94a3b8', fontSize: '0.82rem', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'white')}
              onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
              <IconArrowRight size={16} />
              <div>
                <div style={{ fontSize: '0.68rem', color: '#475569' }}>\u0627\u0644\u062D\u062F\u062B \u0627\u0644\u0633\u0627\u0628\u0642</div>
                <div style={{ fontWeight: 600 }}>{nav!.prev.name_ar || nav!.prev.name} {nav!.prev.edition_number ? `(${nav!.prev.edition_number})` : fmt(nav!.prev.start_date)}</div>
              </div>
            </Link>
          )}
          {showArc && (
            <Link href="/archive"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#64748b', textDecoration: 'none', padding: '0.25rem 0.75rem', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '2rem', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${primaryColor}60`; (e.currentTarget as HTMLElement).style.color = '#a5b4fc'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = '#64748b'; }}>
              <IconArchive size={13} /> {label}
            </Link>
          )}
        </div>

        {/* \u0627\u0644\u062C\u0647\u0629 \u0627\u0644\u064A\u0633\u0631\u0649: \u0632\u0631 \u0627\u0644\u062B\u064A\u0645 + \u0627\u0644\u062D\u062F\u062B \u0627\u0644\u062A\u0627\u0644\u064A */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {showTheme && <ThemeToggle isDark={theme === 'dark'} onToggle={toggleTheme} size={42} />}
          {showArc && hasNext && (
            <Link href={`/${nav!.next.slug}`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#94a3b8', fontSize: '0.82rem', transition: 'color 0.15s', textAlign: 'left' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'white')}
              onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.68rem', color: '#475569' }}>\u0627\u0644\u062D\u062F\u062B \u0627\u0644\u062A\u0627\u0644\u064A</div>
                <div style={{ fontWeight: 600 }}>{nav!.next.name_ar || nav!.next.name} {nav!.next.edition_number ? `(${nav!.next.edition_number})` : fmt(nav!.next.start_date)}</div>
              </div>
              <IconArrowLeft size={16} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// Session type colors & labels
const SESSION_STYLES: Record<string, { bg: string; label: string }> = {
  keynote:     { bg: '#6C63FF', label: 'رئيسية' },
  talk:        { bg: '#0ea5e9', label: 'محاضرة' },
  workshop:    { bg: '#f59e0b', label: 'ورشة' },
  panel:       { bg: '#10b981', label: 'نقاش' },
  networking:  { bg: '#8b5cf6', label: 'تواصل' },
  break:       { bg: '#6b7280', label: 'استراحة' },
  competition: { bg: '#ef4444', label: 'مسابقة' },
};

function Countdown({ targetDate }: { targetDate: string }) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return (
    <div className="flex gap-4 justify-center my-8">
      {[
        { value: time.days, label: 'يوم' },
        { value: time.hours, label: 'ساعة' },
        { value: time.minutes, label: 'دقيقة' },
        { value: time.seconds, label: 'ثانية' },
      ].map(({ value, label }) => (
        <div key={label} className="text-center">
          <div className="card w-20 h-20 flex items-center justify-center text-3xl font-black text-white"
               style={{ background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.4)' }}>
            {String(value).padStart(2, '0')}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}

function StatCounter({ value, label }: { value: number; label: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const observed = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !observed.current) {
        observed.current = true;
        let start = 0;
        const step = Math.ceil(value / 50);
        const timer = setInterval(() => {
          start += step;
          if (start >= value) { setDisplay(value); clearInterval(timer); }
          else setDisplay(start);
        }, 30);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl font-black gradient-text">{display}+</div>
      <div className="text-[var(--text-muted)] text-sm mt-1">{label}</div>
    </div>
  );
}

// ─── Ticket Selector for payment ─────────────────────────────────────────────
// Country Select component — loads from API
// components/CountrySelect.tsx (أو داخل نفس الملف)
function CountrySelect({ eventId, value, onChange, cityValue, onCityChange, required }: { 
  eventId: number; 
  value: string; 
  onChange: (v: string) => void; 
  cityValue?: string; 
  onCityChange?: (v: string) => void; 
  required?: boolean;
}) {
  const [countries, setCountries] = useState<{ id: number; name_ar: string; cities?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCountries(eventId)
      .then(r => {
        setCountries(r.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [eventId]);

  const selected = countries.find(co => co.name_ar === value);
  let cities: string[] = [];
  if (selected?.cities) {
    try {
      const parsed = JSON.parse(selected.cities);
      if (Array.isArray(parsed)) cities = parsed;
    } catch (e) {
      console.warn('Failed to parse cities for', selected.name_ar, e);
    }
  }

  if (loading) return <div className="text-sm text-[var(--text-muted)]">جار تحميل الدول...</div>;

  return (
    <div className="space-y-3">
      <select className="input-field" required={required} value={value} onChange={e => { 
        onChange(e.target.value); 
        if (onCityChange) onCityChange(''); 
      }}>
        <option value="">اختر الدولة</option>
        {countries.map(co => <option key={co.id} value={co.name_ar}>{co.name_ar}</option>)}
      </select>

      {value && onCityChange && (
        cities.length > 0 ? (
          <select className="input-field" value={cityValue || ''} onChange={e => onCityChange(e.target.value)}>
            <option value="">اختر المدينة</option>
            {cities.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
        ) : (
          <input className="input-field" placeholder="أدخل اسم المدينة (غير مسجلة في القائمة)" value={cityValue || ''} onChange={e => onCityChange(e.target.value)} />
        )
      )}
    </div>
  );
}

function TicketSelector({ eventId, onSelect, primaryColor }: { eventId: number; onSelect: (ticketId: number, amount: number) => void; primaryColor: string }) {
  const [tickets, setTickets] = useState<any[]>([]);
  useEffect(() => {
    import('../../lib/api').then(({ fetchTickets }) => {
      fetchTickets(eventId).then(r => setTickets(r.data || [])).catch(() => {});
    });
  }, [eventId]);
  if (!tickets.length) return <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>لا توجد تذاكر متاحة حالياً</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {tickets.map(t => (
        <button key={t.id} onClick={() => onSelect(t.id, t.price_per_unit)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(108,99,255,0.3)`, borderRadius: '0.6rem', cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(108,99,255,0.15)'; e.currentTarget.style.borderColor = primaryColor; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(108,99,255,0.3)'; }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>{t.name_ar}</div>
            {t.description && <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{t.description}</div>}
          </div>
          <div style={{ color: primaryColor, fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>${t.price_per_unit}</div>
        </button>
      ))}
    </div>
  );
}

// ─── Registration Form ────────────────────────────────────────────────────────
function RegistrationForm({ event, onClose, cfg, initialTab, ticketInstructions }: { event: Event; onClose: () => void; cfg: FormConfig; initialTab?: string; ticketInstructions?: any }) {
  const enabledTypes = cfg.enabled_types || ['startup', 'general'];
  const [tab, setTab] = useState<string>(initialTab && enabledTypes.includes(initialTab) ? initialTab : (enabledTypes[0] || 'general'));
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [regData, setRegData] = useState<{ id: number; ticket_code: string; full_name: string; company_name?: string } | null>(null);
  const [error, setError] = useState('');
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', city: '', country: '', country_city: '', motivation: '',
    company_name: '', sector: '', stage: '', team_size: '', website: '', description: '',
    work_field: '', participation_reason: '', communication_channel: '',
    agreed: false,
  } as Record<string, any>);

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));
  const primaryColor = event.primary_color || '#6C63FF';

  // Load payment settings once
  useEffect(() => {
    fetchPaymentSettingsPublic(event.id).then(r => setPaymentSettings(r.data)).catch(() => {});
  }, [event.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agreed) { setError('يجب الموافقة على ' + cfg.terms_text); return; }
    setLoading(true); setError('');
    try {
      const res = await submitRegistration(event.id, {
        reg_type: tab,
        full_name: form.full_name, email: form.email,
        ...(cfg.show_phone ? { phone: form.phone } : {}),
        ...(cfg.show_city ? { city: form.city === 'خارج سوريا' ? (form.country_city || null) : form.city } : {}),
        ...(form.city === 'خارج سوريا' ? { country: form.country || '' } : {}),
        ...(cfg.show_motivation ? { motivation: form.motivation } : {}),
        ...(form.communication_channel ? { communication_channel: form.communication_channel } : {}),
        // extra_fields for this tab
        ...Object.fromEntries(
          (cfg.extra_fields || []).filter(f => f.for_types.includes(tab)).map(f => [f.key, form[f.key] || null])
        ),
        ...(tab === 'startup' ? {
          company_name: form.company_name, sector: form.sector, stage: form.stage,
          team_size: form.team_size, website: form.website, description: form.description
        } : {})
      });
      setRegData({ id: res.data?.id, ticket_code: res.data?.ticket_code, full_name: form.full_name, company_name: form.company_name });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ. يرجى المحاولة مرة أخرى.');
    }
    setLoading(false);
  };

  if (success) {
    // Build WhatsApp link if payments enabled + whatsapp gateway
    const showWhatsApp = paymentSettings?.payments_enabled
      && paymentSettings?.whatsapp_number
      && (paymentSettings?.gateway === 'whatsapp' || !paymentSettings?.gateway);

    const waMessage = paymentSettings?.whatsapp_message_template
      ? paymentSettings.whatsapp_message_template
          .replace('{name}', form.full_name)
          .replace('{order_ref}', regData?.ticket_code || '')
          .replace('{amount}', '')
          .replace('{currency}', paymentSettings?.currency || 'USD')
      : `مرحباً، أريد إتمام دفع التسجيل في الحدث.%0Aالاسم: ${form.full_name}%0Aرقم التذكرة: ${regData?.ticket_code || ''}`;

    const waNumber = paymentSettings?.whatsapp_number?.replace(/[^0-9]/g, '') || '';
    const waUrl = `https://wa.me/${waNumber}?text=${waMessage}`;

    if (showWhatsApp) {
      return (
        <div className="text-center space-y-5">
          <div style={{ fontSize: '3rem' }}>✅</div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">تم التسجيل بنجاح!</h3>
            <p className="text-[var(--text-muted)] text-sm">رقم التذكرة: <span style={{ color: primaryColor, fontWeight: 700 }}>{regData?.ticket_code}</span></p>
          </div>
          <div style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.3)', borderRadius: '0.75rem', padding: '1.25rem', direction: 'rtl' }}>
            <p style={{ color: '#4ade80', fontWeight: 700, marginBottom: '0.5rem' }}>💳 لإتمام الدفع</p>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {paymentSettings.payment_subtitle || 'أرسل صورة الفاتورة عبر واتساب لتأكيد تسجيلك'}
            </p>
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', background: '#25D366', color: 'white', borderRadius: '0.6rem', textDecoration: 'none', fontWeight: 700, fontSize: '1rem' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.107 1.523 5.83L0 24l6.336-1.5C8.024 23.45 9.972 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.89 0-3.663-.522-5.177-1.43L3 22l1.44-4.705A9.945 9.945 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              تواصل عبر واتساب
            </a>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.78rem' }}>سيقوم الفريق بتأكيد دفعك خلال 24 ساعة وإرسال تذكرتك على بريدك</p>
          <button onClick={onClose} className="btn-outline text-sm">إغلاق</button>
        </div>
      );
    }

    return (
      <RegistrationSuccessMessage
        registrationType={tab as any}
        fullName={form.full_name}
        companyName={tab === 'startup' ? form.company_name : undefined}
        ticketCode={regData?.ticket_code}
        eventName={(event as any)?.name_ar || (event as any)?.name}
        customInstructions={ticketInstructions}
        onClose={onClose}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tab switcher – only show if more than 1 enabled type */}
      {enabledTypes.length > 1 && (
        <div className="flex flex-wrap gap-2 p-1 rounded-lg form-tab-switcher" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {enabledTypes.map(t => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all ${tab === t ? 'text-white' : 'text-[var(--text-muted)]'}`}
              style={{ background: tab === t ? primaryColor : 'transparent', minWidth: 100 }}>
              {cfg.type_labels?.[t] || t}
            </button>
          ))}
        </div>
      )}

      {/* Personal info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-1">الاسم الكامل *</label>
          <input className="input-field" required value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="أدخل اسمك الكامل" />
        </div>
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-1">البريد الإلكتروني *</label>
          <input className="input-field" type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="example@email.com" />
        </div>
        {cfg.show_phone && (
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-1">رقم الهاتف {cfg.require_phone ? '*' : ''}</label>
            <input className="input-field" required={cfg.require_phone} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+963..." />
          </div>
        )}
        {/* Communication Channel (Admin Only) */}
        {typeof window !== 'undefined' && localStorage.getItem('admin_token') && (
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-1">قناة التواصل (أدمن فقط)</label>
            <select className="input-field" value={form.communication_channel} onChange={e => set('communication_channel', e.target.value)}>
              <option value="">-- اختر القناة --</option>
              <option value="phone">📞 هاتف</option>
              <option value="email">📧 بريد إلكتروني</option>
              <option value="whatsapp">💬 واتساب</option>
              <option value="social_media">📱 وسائل التواصل</option>
              <option value="website">🌐 موقع إلكتروني</option>
              <option value="referral">👥 إحالة</option>
              <option value="event">🎪 حدث</option>
              <option value="other">أخرى</option>
            </select>
          </div>
        )}
        {cfg.show_city && (
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-1">المدينة {cfg.require_city ? '*' : ''}</label>
            <select className="input-field" required={cfg.require_city} value={form.city} onChange={e => set('city', e.target.value)}>
              <option value="">اختر المدينة</option>
              {(cfg.cities || []).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
        {/* Country selector when city = خارج سوريا */}
        {cfg.show_city && form.city === 'خارج سوريا' && (
          <div className="md:col-span-2">
            <label className="block text-sm text-[var(--text-muted)] mb-1">الدولة والمدينة *</label>
            <CountrySelect
              eventId={event.id}
              value={form.country || ''}
              onChange={v => set('country', v)}
              cityValue={form.country_city || ''}
              onCityChange={v => set('country_city', v)}
              required
            />
          </div>
        )}
        {cfg.show_motivation && (
          <div className="md:col-span-2">
            <label className="block text-sm text-[var(--text-muted)] mb-1">{cfg.motivation_label || 'الدوافع'}</label>
            <textarea className="input-field" rows={3} value={form.motivation} onChange={e => set('motivation', e.target.value)} placeholder="اكتب إجابتك هنا..." />
          </div>
        )}
        {/* Extra fields for this tab */}
        {(cfg.extra_fields || []).filter(f => f.for_types.includes(tab)).map(f => (
          <div key={f.key} className={f.type === 'textarea' ? 'md:col-span-2' : ''}>
            <label className="block text-sm text-[var(--text-muted)] mb-1">{f.label}{f.required ? ' *' : ''}</label>
            {f.type === 'select' ? (
              <select className="input-field" required={f.required} value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)}>
                <option value="">اختر...</option>
                {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea className="input-field" required={f.required} rows={3} value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder || ''} />
            ) : (
              <input className="input-field" required={f.required} value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder || ''} />
            )}
          </div>
        ))}
      </div>

      {/* Startup-specific */}
      {tab === 'startup' && (
        <div className="border-t border-[var(--border)] pt-4">
          <h4 className="text-white font-semibold mb-3">معلومات الشركة</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1">اسم الشركة *</label>
              <input className="input-field" required value={form.company_name} onChange={e => set('company_name', e.target.value)} placeholder="اسم شركتك الناشئة" />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1">قطاع العمل *</label>
              <select className="input-field" required value={form.sector} onChange={e => set('sector', e.target.value)}>
                <option value="">اختر القطاع</option>
                {(cfg.sectors || []).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1">مرحلة الشركة *</label>
              <select className="input-field" required value={form.stage} onChange={e => set('stage', e.target.value)}>
                <option value="">اختر المرحلة</option>
                {(cfg.stages || []).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1">حجم الفريق</label>
              <select className="input-field" value={form.team_size} onChange={e => set('team_size', e.target.value)}>
                <option value="">اختر الحجم</option>
                <option value="1">مؤسس منفرد</option>
                <option value="2-5">٢ – ٥ أشخاص</option>
                <option value="6-10">٦ – ١٠ أشخاص</option>
                <option value="11-20">١١ – ٢٠ شخصاً</option>
                <option value="20+">أكثر من ٢٠</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm text-[var(--text-muted)] mb-1">الموقع الإلكتروني أو وسائل التواصل</label>
            <input className="input-field" value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://..." />
          </div>
          <div className="mt-4">
            <label className="block text-sm text-[var(--text-muted)] mb-1">نبذة عن الشركة وفكرتها *</label>
            <textarea className="input-field" required rows={4} value={form.description} onChange={e => set('description', e.target.value)} placeholder="اشرح فكرة شركتك، المشكلة التي تحلها، وما الذي يميزها..." />
          </div>
        </div>
      )}

      {/* Terms */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={form.agreed} onChange={e => set('agreed', e.target.checked)}
          className="mt-1 w-4 h-4 accent-[var(--primary)]" />
        <span className="text-sm text-[var(--text-muted)]">
          {cfg.terms_text || 'أوافق على الشروط والأحكام وسياسة الخصوصية'}
        </span>
      </label>

      {error && <div className="p-3 rounded-lg text-red-400 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>{error}</div>}

      <button type="submit" disabled={loading} className="btn-primary w-full text-center" style={{ opacity: loading ? 0.7 : 1 }}>
        {loading ? 'جار الإرسال...' : 'إرسال طلب التسجيل'}
      </button>
    </form>
  );
}

export default function EventLandingClient({ slug }: { slug?: string } = {}) {
  const [event, setEvent] = useState<Event | null>(null);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [agenda, setAgenda] = useState<AgendaDay[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [footerPages, setFooterPages] = useState<any[]>([]);
  const [termsData, setTermsData] = useState<{ terms_content?: string; privacy_content?: string; show_in_footer?: number } | null>(null);
  const [cfg, setCfg] = useState<FormConfig>({
    enabled_types: ['startup', 'general'],
    form_title: 'سجّل في القمة',
    form_subtitle: 'كن جزءاً من أكبر تجمع لريادة الأعمال',
    show_phone: true, require_phone: false,
    show_city: true, require_city: false,
    show_motivation: false, motivation_label: 'لماذا تريد الحضور؟',
    terms_text: 'أوافق على الشروط والأحكام وسياسة الخصوصية',
    cities: ['دمشق','حلب','حمص','اللاذقية','طرطوس','حماة','دير الزور','الرقة','القامشلي','إدلب','درعا','خارج سوريا'],
    sectors: ['تكنولوجيا المعلومات','التجارة الإلكترونية','التعليم','الصحة','التمويل والدفع','الزراعة','الطاقة','التصنيع','الخدمات اللوجستية','أخرى'],
    stages: ['فكرة','نموذج أولي MVP','مرحلة مبكرة','نمو','توسع'],
    type_labels: { startup: '🚀 شركة ناشئة', general: '👤 حضور عام', investor: '💼 مستثمر', speaker: '🎙️ متحدث', sponsor: '🏅 راعي', media: '📹 إعلام' },    extra_fields: [
      { key: 'work_field', label: 'مجال العمل أو الاهتمام', type: 'text', placeholder: 'مثل: تقنية معلومات، تعليم، طب...', required: false, for_types: ['general','investor','speaker','media'] },
      { key: 'participation_reason', label: 'لماذا تريد المشاركة في القمة؟', type: 'textarea', placeholder: 'شاركنا بدوافعك...', required: false, for_types: ['general','investor'] },
    ],  });
  const [siteCfg, setSiteCfg] = useState<SiteConfig>({
    hero_abbr: 'S3',
    hero_btn_primary: '🚀 سجّل شركتك الناشئة',
    hero_btn_secondary: 'حضور عام',
    stats: [
      { label: 'أيام من الإلهام', field: 'days_count', fallback: 3 },
      { label: 'شركة ناشئة', field: 'startup_count', fallback: 50 },
      { label: 'متحدث متميز', field: 'speaker_count', fallback: 20 },
      { label: 'مشارك', field: 'total_registrations', fallback: 500 },
    ],
    about_badge: 'عن الفعالية',
    about_title: 'لماذا S³ Summit؟',
    about_cards: [
      { emoji: '🚀', title: 'إطلاق الأفكار', desc: 'منصة لعرض شركاتك الناشئة أمام مستثمرين وشركاء من سوريا والمنطقة العربية' },
      { emoji: '🤝', title: 'التواصل والشبكات', desc: 'فرصة ذهبية للتواصل مع رواد أعمال، مستثمرين، وخبراء في الاقتصاد الرقمي' },
      { emoji: '💡', title: 'ورش عمل مكثفة', desc: 'جلسات تدريبية متخصصة في بناء المنتج، التسويق الرقمي، وجذب التمويل' },
      { emoji: '🏆', title: 'مسابقة الشركات', desc: 'تنافس أفضل الشركات الناشئة السورية للفوز بجوائز وفرص تمويل حقيقية' },
    ],
    logo_url: '',
    logo_position: 'navbar',
  });
  const normalizeSiteConfig = (raw: any): SiteConfig => {
    const fallback = {
      hero_abbr: 'S3',
      hero_btn_primary: '🚀 سجّل شركتك الناشئة',
      hero_btn_secondary: 'حضور عام',
      stats: [
        { label: 'أيام من الإلهام', field: 'days_count', fallback: 3 },
        { label: 'شركة ناشئة', field: 'startup_count', fallback: 50 },
        { label: 'متحدث متميز', field: 'speaker_count', fallback: 20 },
        { label: 'مشارك', field: 'total_registrations', fallback: 500 },
      ],
      about_badge: 'عن الفعالية',
      about_title: 'لماذا S³ Summit؟',
      about_cards: [
        { emoji: '🚀', title: 'إطلاق الأفكار', desc: 'منصة لعرض شركاتك الناشئة أمام مستثمرين وشركاء من سوريا والمنطقة العربية' },
        { emoji: '🤝', title: 'التواصل والشبكات', desc: 'فرصة ذهبية للتواصل مع رواد أعمال، مستثمرين، وخبراء في الاقتصاد الرقمي' },
        { emoji: '💡', title: 'ورش عمل مكثفة', desc: 'جلسات تدريبية متخصصة في بناء المنتج، التسويق الرقمي، وجذب التمويل' },
        { emoji: '🏆', title: 'مسابقة الشركات', desc: 'تنافس أفضل الشركات الناشئة السورية للفوز بجوائز وفرص تمويل حقيقية' },
      ],
      logo_url: '',
      logo_position: 'navbar',
    } as SiteConfig;
    if (!raw || typeof raw !== 'object') return fallback;

    return {
      ...fallback,
      ...raw,
      stats: Array.isArray(raw.stats)
        ? raw.stats
            .filter((s: any) => s && typeof s.label === 'string' && typeof s.field === 'string')
            .map((s: any) => ({
              label: s.label,
              field: s.field,
              fallback: Number.isFinite(Number(s.fallback)) ? Number(s.fallback) : 0,
            }))
        : fallback.stats,
      about_cards: Array.isArray(raw.about_cards)
        ? raw.about_cards
            .filter((c: any) => c && typeof c.title === 'string')
            .map((c: any) => ({ emoji: c.emoji || '✨', icon: typeof c.icon === 'string' ? c.icon : undefined, title: c.title, desc: c.desc || '' }))
        : fallback.about_cards,
      logo_url: typeof raw.logo_url === 'string' ? raw.logo_url : fallback.logo_url,
      logo_position: ['navbar', 'footer', 'both'].includes(raw.logo_position) ? raw.logo_position : fallback.logo_position,
      archive_link_enabled: raw.archive_link_enabled !== undefined ? !!raw.archive_link_enabled : true,
      archive_link_label: typeof raw.archive_link_label === 'string' ? raw.archive_link_label : '🗂 النسخ السابقة',
      archive_link_position: ['navbar', 'footer', 'both', 'none'].includes(raw.archive_link_position) ? raw.archive_link_position : 'both',
      show_theme_toggle: raw.show_theme_toggle !== undefined ? !!raw.show_theme_toggle : true,
      ticket_instructions: raw.ticket_instructions || undefined,
    };
  };
  const [activeDay, setActiveDay] = useState(0);
  const [showRegModal, setShowRegModal] = useState(false);
  const [regInitialTab, setRegInitialTab] = useState<string | undefined>(undefined);
  const openModal = (tab?: string) => { setRegInitialTab(tab); setShowRegModal(true); };
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSpeaker, setSelectedSpeaker] = useState<any | null>(null);
  const [venueGallery, setVenueGallery] = useState<VenueMedia[]>([]);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Initialize theme from localStorage
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('event_theme') : null;
    const t = saved === 'light' ? 'light' : 'dark';
    setTheme(t);
  }, []);

  useEffect(() => {
    // Reset state when slug changes to avoid showing stale data
    setEvent(null);
    setSpeakers([]);
    setAgenda([]);
    setStats(null);
    setSponsors([]);
    setFaqs([]);
    setVenueGallery([]);
    setLoading(true);

    (async () => {
      try {
        // Get slug from prop OR directly from URL (robust for static export)
        let effectiveSlug = slug && slug.trim() ? slug.trim() : null;
        if (!effectiveSlug && typeof window !== 'undefined') {
          // Derive from pathname: /s3-summit-2026/ → s3-summit-2026
          const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
          effectiveSlug = path || null;
        }
        if (!effectiveSlug) {
          setLoading(false);
          return;
        }

        // Fetch event data — simple GET, no Content-Type header needed
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev';
        const evResponse = await fetch(`${API_URL}/api/events/${effectiveSlug}`);
        if (!evResponse.ok) {
          console.error('Event fetch failed:', evResponse.status, evResponse.statusText);
          setLoading(false);
          return;
        }
        const evJson = await evResponse.json();

        if (!evJson?.success || !evJson?.data) {
          console.error('Event not found or invalid response:', evJson);
          // Event not found — show error state
          setLoading(false);
          return;
        }

        const ev: Event = evJson.data;
        setEvent(ev);

        // Parse form_config
        if (ev.form_config) {
          try { setCfg(JSON.parse(ev.form_config)); } catch {}
        }
        // Parse site_config
        if (ev.site_config) {
          try { setSiteCfg(normalizeSiteConfig(JSON.parse(ev.site_config))); } catch {}
        }
        // Update browser title dynamically
        document.title = `${ev.name_ar || ev.name} – ${ev.tagline_ar || ev.tagline || ''}`;

        // Fetch all sub-resources in parallel — don't let any single failure block the rest
        const [spRes, agRes, stRes, spnRes, fqRes, venueRes, artRes] = await Promise.allSettled([
          fetch(`${API_URL}/api/events/${ev.id}/speakers`).then(r => r.json()),
          fetch(`${API_URL}/api/events/${ev.id}/agenda`).then(r => r.json()),
          fetch(`${API_URL}/api/events/${ev.id}/stats`).then(r => r.json()),
          fetch(`${API_URL}/api/events/${ev.id}/sponsors`).then(r => r.json()),
          fetch(`${API_URL}/api/events/${ev.id}/faqs`).then(r => r.json()),
          fetch(`${API_URL}/api/events/${ev.id}/venue`).then(r => r.json()),
          fetch(`${API_URL}/api/events/${ev.id}/articles?limit=1&status=published`).then(r => r.json()),
        ]);

        const val = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? r.value : null;
        setSpeakers(val(spRes)?.data || []);
        setAgenda(val(agRes)?.data || []);
        setStats(val(stRes)?.data || null);
        setSponsors(val(spnRes)?.data || []);
        setFaqs(val(fqRes)?.data || []);
        setVenueGallery(val(venueRes)?.data || []);
        setHasArticles((val(artRes)?.data || []).length > 0);

        // Non-critical data — non-blocking
        fetch(`${API_URL}/api/events/${ev.id}/pages?location=footer`)
          .then(r => r.json()).then(d => setFooterPages(d?.data || [])).catch(() => {});
        fetch(`${API_URL}/api/events/${ev.id}/terms`)
          .then(r => r.json()).then(d => setTermsData(d?.data || null)).catch(() => {});

      } catch (err) {
        console.error('Event page fetch error:', err);
      }
      setLoading(false);
    })();
  }, [slug]); // re-fetch whenever slug changes
  const [hasArticles, setHasArticles] = useState(false);

  const navLinks = [
    { href: '#about', label: 'عن الفعالية' },
    ...(agenda.length > 0 ? [{ href: '#agenda', label: 'البرنامج' }] : []),
    ...(speakers.length > 0 ? [{ href: '#speakers', label: 'المتحدثون' }] : []),
    ...(sponsors.length > 0 ? [{ href: '#sponsors', label: 'الشركاء' }] : []),
    ...(faqs.length > 0 ? [{ href: '#faq', label: 'الأسئلة الشائعة' }] : []),
    { href: '#register', label: 'سجّل الآن' },
    ...(hasArticles ? [{ href: '/blog', label: 'المدونة' }] : []),
    // رابط الأرشيف — يُضاف للـ navbar حسب إعدادات الأدمن
    ...(siteCfg.archive_link_enabled !== false && (siteCfg.archive_link_position === 'navbar' || siteCfg.archive_link_position === 'both' || siteCfg.archive_link_position === undefined)
      ? [{ href: '/archive', label: siteCfg.archive_link_label || '🗂 النسخ السابقة' }]
      : []),
  ];

  const eventName = event?.name_ar || 'قمة الشركات الناشئة السورية';
  const eventTagline = event?.tagline_ar || 'Syria Startups Summit';
  const startDate = event?.start_date || '2026-12-25';
  const endDate = event?.end_date || '2026-12-27';
  const location = event?.location_ar || 'دمشق، سوريا';
  const description = event?.description_ar || 'ثلاثة أيام من الإلهام، التواصل، والابتكار — لبناء مستقبل ريادة الأعمال في سوريا';
  const primaryColor = event?.primary_color || '#6C63FF';

  // Build CSS variable overrides from theme_colors stored in site_config
  const themeColors = (siteCfg as any).theme_colors || {};
  const themeVarsStyle = Object.keys(themeColors).length > 0 ? {
    '--primary':      themeColors.primary      || primaryColor,
    '--primary-dark': themeColors.primary_dark || primaryColor,
    '--accent':       themeColors.accent       || '#f59e0b',
    '--bg-dark':      themeColors.bg_dark      || '#0d0b1a',
    '--bg-card':      themeColors.bg_card      || '#13102a',
    '--text':         themeColors.text         || '#e2e8f0',
    '--text-muted':   themeColors.text_muted   || '#94a3b8',
    '--heading':      themeColors.heading      || '#ffffff',
    // Dark mode navbar (applied globally; light mode nav overrides via CSS vars in light block)
    '--navbar-bg':     themeColors.navbar_bg_dark  || 'rgba(19,16,42,0.75)',
    '--navbar-blur':   themeColors.navbar_blur === 'off' ? 'none' : 'blur(12px)',
    '--navbar-border': themeColors.navbar_border   || 'rgba(108,99,255,0.2)',
  } as React.CSSProperties : undefined;

  // Light-mode navbar vars — injected into :root so CSS data-theme="light" block picks them up
  const navbarBgLight = themeColors.navbar_bg_light || 'rgba(255,255,255,0.98)';

  // Inject light-mode navbar color as inline style on body if customized
  const navbarLightBg = themeColors.navbar_bg_light;
  if (typeof document !== 'undefined' && navbarLightBg) {
    // Set as CSS custom property on :root for light mode override
    document.documentElement.style.setProperty('--navbar-bg-light-custom', navbarLightBg);
  }

  const formatDateAr = (d: string) => {
    const date = new Date(d);
    const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    return { day: date.getDate(), month: months[date.getMonth()], year: date.getFullYear() };
  };

  const sd = formatDateAr(startDate);
  const ed = formatDateAr(endDate);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-dark)' }}>
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-t-transparent rounded-full mx-auto mb-4 animate-spin" style={{ borderColor: primaryColor, borderTopColor: 'transparent' }} />
        <p className="text-[var(--text-muted)]">جار التحميل...</p>
      </div>
    </div>
  );

  // If event failed to load, show error with retry button
  if (!event) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{ color: 'white', fontSize: '1.25rem', marginBottom: '0.5rem' }}>تعذّر تحميل بيانات الفعالية</h2>
        <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.9rem' }}>تحقق من اتصالك بالإنترنت أو حاول مجدداً</p>
        <button
          onClick={() => window.location.reload()}
          style={{ background: '#6C63FF', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.65rem 1.5rem', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, marginLeft: '0.75rem' }}
        >↻ إعادة المحاولة</button>
        <a href="/" style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'block', marginTop: '1rem' }}>← العودة للرئيسية</a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-dark)', ...(themeVarsStyle || {}) }}>
      {/* Pixel Tracking */}
      <PixelInjector eventId={event?.id || 1} />
      {/* ── Navbar ───────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 glass" style={{ borderBottom: '1px solid rgba(108,99,255,0.2)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {(siteCfg.logo_position === 'navbar' || siteCfg.logo_position === 'both') && siteCfg.logo_url && (
              <img 
                src={siteCfg.logo_url} 
                alt="logo" 
                className="h-10 object-contain" 
                style={{
                  background: theme === 'dark' ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
                  padding: theme === 'dark' ? '8px 12px' : '0',
                  borderRadius: theme === 'dark' ? '10px' : '0',
                  boxShadow: theme === 'dark' ? '0 4px 12px rgba(108, 99, 255, 0.2)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              />
            )}
            <a href="#" className="font-black text-xl text-white" style={{ letterSpacing: '-0.02em' }}>
              <span style={{ color: primaryColor }}>{event?.name?.split(' ')[0] || 'S3'}</span> {event?.name?.split(' ').slice(1).join(' ') || 'Summit'}
            </a>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(l => (
              l.href.startsWith('/') && l.href !== '#'
                ? <Link key={l.href} href={l.href} className="text-sm text-[var(--text-muted)] hover:text-white transition-colors" style={{ color: undefined }}>{l.label}</Link>
                : <a key={l.href} href={l.href} className="text-sm text-[var(--text-muted)] hover:text-white transition-colors" style={{ color: undefined }}>{l.label}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {(siteCfg as any)?.show_theme_toggle !== false && <ThemeToggleAuto size={42} />}
            <button onClick={() => openModal()} className="btn-primary text-sm py-2 px-4">
              سجّل الآن
            </button>
          </div>
        </div>
      </nav>

      {/* ── Event Navigation Bar (prev / next events + archive) ─────────────── */}
      {event && siteCfg.archive_link_enabled !== false && siteCfg.archive_link_position !== 'none' && (
        <EventNavBar
          eventId={event.id}
          primaryColor={primaryColor}
          archiveLabel={siteCfg.archive_link_label}
          showArchive={true}
          showThemeToggle={false}
        />
      )}

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-20 blur-3xl"
               style={{ background: `radial-gradient(circle, ${primaryColor}, transparent)` }} />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full text-sm font-semibold"
               style={{ background: 'rgba(108,99,255,0.15)', border: `1px solid ${primaryColor}40`, color: primaryColor }}>
            {location} · {ed.month} {ed.year}
          </div>

          {event?.logo && (
            <div className="mb-6 flex justify-center">
              <img src={event.logo} alt="شعار الحدث" style={{ maxHeight: 100, objectFit: 'contain' }} />
            </div>
          )}

          <h1 className="text-5xl md:text-7xl font-black text-white mb-4" style={{ letterSpacing: '-0.03em' }}>
            <span style={{ color: primaryColor }}>{siteCfg.hero_abbr}</span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{eventName}</h2>
          <p className="text-lg text-[var(--text-muted)] mb-2">{eventTagline}</p>
          <p className="text-[var(--text-muted)] max-w-xl mx-auto mb-8">{description}</p>

          {/* Date display */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="text-center">
              <div className="text-4xl font-black text-white">{sd.day}</div>
              <div className="text-sm text-[var(--text-muted)]">{sd.month}</div>
            </div>
            <div className="text-2xl text-[var(--text-muted)]">—</div>
            <div className="text-center">
              <div className="text-4xl font-black text-white">{ed.day}</div>
              <div className="text-sm text-[var(--text-muted)]">{ed.month} {ed.year}</div>
            </div>
          </div>

          <Countdown targetDate={startDate + 'T09:00:00'} />

          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={() => openModal('startup')} className="btn-primary">{siteCfg.hero_btn_primary}</button>
            {siteCfg.hero_btn_secondary && <button onClick={() => openModal('general')} className="btn-outline">{siteCfg.hero_btn_secondary}</button>}
          </div>
        </div>
      </section>

      {/* ── Intro Video ───────────────────────────────────────────────────────── */}
      {event?.show_intro_video && event?.intro_video_url && (
        <section className="py-16 px-6" style={{ background: 'rgba(108,99,255,0.04)' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="section-badge">مقدمة بالفيديو</div>
              <h2 className="section-title">تعرف على الحدث</h2>
            </div>
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                aspectRatio: '16/9',
                background: '#0d0b1a',
                boxShadow: `0 20px 60px rgba(108,99,255,0.25)`,
                border: `1px solid rgba(108,99,255,0.3)`
              }}
            >
              {event.intro_video_url.includes('youtube.com') || event.intro_video_url.includes('youtu.be') ? (
                // YouTube embed
                <iframe
                  src={event.intro_video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : event.intro_video_url.includes('vimeo.com') ? (
                // Vimeo embed
                <iframe
                  src={`https://player.vimeo.com/video/${event.intro_video_url.split('/').pop()}`}
                  className="w-full h-full"
                  allowFullScreen
                />
              ) : (
                // Direct video
                <video
                  src={event.intro_video_url}
                  poster={event.intro_video_thumbnail || undefined}
                  controls
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Stats ─────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="card grid grid-cols-2 md:grid-cols-4 gap-8 py-8">
            {(siteCfg.stats || []).map(s => (
              <StatCounter key={s.label} value={(stats as any)?.[s.field] || s.fallback} label={s.label} />
            ))}
          </div>
        </div>
      </section>

      {/* ── About ─────────────────────────────────────────────────────────────── */}
      <section id="about" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="section-badge">{siteCfg.about_badge}</div>
            <h2 className="section-title">{siteCfg.about_title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(siteCfg.about_cards || []).map(({ emoji, icon, title, desc }) => (
              <div key={title} className="card hover:border-[var(--primary)] transition-all group">
                <div className="mb-4" style={{ color: 'var(--primary)' }}><AboutIcon name={icon} emoji={emoji} size={40} /></div>
                <h3 className="text-white font-bold text-lg mb-2 group-hover:text-[var(--primary)] transition-colors">{title}</h3>
                <p className="text-[var(--text-muted)] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Agenda ────────────────────────────────────────────────────────────── */}
      {agenda.length > 0 && (
      <section id="agenda" className="py-20 px-6" style={{ background: 'rgba(108,99,255,0.03)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="section-badge">البرنامج</div>
            <h2 className="section-title">أيام مكثّفة</h2>
          </div>

          {/* Day tabs */}
          {agenda.length > 0 && (
            <>
              <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                {agenda.map((day, i) => (
                  <button key={day.id} onClick={() => setActiveDay(i)}
                    className={`flex-shrink-0 px-6 py-3 rounded-lg text-sm font-semibold transition-all ${activeDay === i ? 'text-white' : 'text-[var(--text-muted)]'}`}
                    style={{ background: activeDay === i ? primaryColor : 'rgba(255,255,255,0.05)', border: activeDay === i ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>
                    {day.label}
                    {day.date && <span className="block text-xs opacity-70">
                      {new Date(day.date).toLocaleDateString('ar', { day: 'numeric', month: 'long' })}
                    </span>}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {agenda[activeDay]?.sessions.map(session => {
                  const style = SESSION_STYLES[session.session_type] || SESSION_STYLES.talk;
                  return (
                    <div key={session.id} className="card flex gap-4 items-start hover:border-opacity-60 transition-all" style={{ borderColor: style.bg + '40' }}>
                      <div className="text-[var(--text-muted)] text-sm font-mono w-12 flex-shrink-0 pt-0.5">{session.time_start}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold">{session.title_ar}</h4>
                        {session.description_ar && <p className="text-[var(--text-muted)] text-sm mt-1">{session.description_ar}</p>}
                        {session.speaker_name && (
                          <div className="flex items-center gap-2 mt-2">
                            {session.speaker_photo ? (
                              <img src={session.speaker_photo} alt="" className="w-6 h-6 rounded-full" />
                            ) : (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-bold"
                                   style={{ background: primaryColor }}>{session.speaker_name[0]}</div>
                            )}
                            <span className="text-xs text-[var(--text-muted)]">{session.speaker_name}</span>
                          </div>
                        )}
                      </div>
                      <span className="tag text-xs flex-shrink-0"
                            style={{ background: style.bg + '20', color: style.bg }}>
                        {style.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
      )}

      {/* ── Speakers ─────────────────────────────────────────────────────────── */}
      {speakers.length > 0 && (
      <section id="speakers" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="section-badge">المتحدثون</div>
            <h2 className="section-title">قيادات ملهمة</h2>
            <p className="text-[var(--text-muted)] mt-2">نخبة من رواد الأعمال والمستثمرين والخبراء · اضغط لقراءة السيرة الذاتية</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {speakers.map(speaker => (
              <div key={speaker.id}
                className="card text-center hover:border-[var(--primary)] transition-all group cursor-pointer"
                onClick={() => !speaker.is_surprise && setSelectedSpeaker(speaker)}
              >
                {speaker.photo_url ? (
                  <img src={speaker.photo_url} alt={speaker.name_ar}
                    className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-2 group-hover:border-[var(--primary)] transition-all"
                    style={{ borderColor: 'rgba(108,99,255,0.3)' }} />
                ) : (
                  <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-xl font-black text-white"
                       style={{ background: speaker.is_surprise ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${primaryColor}, #4f46e5)` }}>
                    {speaker.is_surprise ? '?' : (speaker.name_ar?.split(' ').map((w: string) => w[0]).slice(0,2).join('') || speaker.name[0])}
                  </div>
                )}
                <h3 className="text-white font-bold text-sm">{speaker.name_ar || speaker.name}</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{speaker.title_ar}</p>
                <p className="text-xs mt-1 font-semibold" style={{ color: primaryColor }}>{speaker.company}</p>
                {speaker.is_featured === 1 && (
                  <span className="tag mt-2 text-xs" style={{ background: '#f59e0b20', color: '#f59e0b' }}>✦ مميز</span>
                )}
                {!speaker.is_surprise && (
                  <p className="text-xs text-[var(--text-muted)] mt-2 opacity-0 group-hover:opacity-100 transition-opacity">اضغط للمزيد ←</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      )}
      {venueGallery.length > 0 && (
        <section id="venue" className="py-20 px-6" style={{ background: 'var(--band)' }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="section-badge">مكان الحدث</div>
              <h2 className="section-title">قاعة المؤتمر</h2>
              <p className="text-[var(--text-muted)] mt-2">استعرض مكان انعقاد القمة</p>
            </div>
            {/* Main viewer */}
            <div className="relative rounded-2xl overflow-hidden mb-4" style={{ aspectRatio: '16/9', background: '#0d0b1a' }}>
              {venueGallery[activeGalleryIndex]?.media_type === 'video' ? (
                <video
                  key={venueGallery[activeGalleryIndex].media_url}
                  src={venueGallery[activeGalleryIndex].media_url}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={venueGallery[activeGalleryIndex]?.media_url}
                  alt={venueGallery[activeGalleryIndex]?.title || 'Venue'}
                  className="w-full h-full object-cover"
                />
              )}
              {/* Navigation arrows */}
              {venueGallery.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveGalleryIndex(i => (i - 1 + venueGallery.length) % venueGallery.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all"
                    style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)' }}
                  >←</button>
                  <button
                    onClick={() => setActiveGalleryIndex(i => (i + 1) % venueGallery.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all"
                    style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)' }}
                  >→</button>
                </>
              )}
              {venueGallery[activeGalleryIndex]?.title && (
                <div className="absolute bottom-0 inset-x-0 p-4" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
                  <p className="text-white font-semibold">{venueGallery[activeGalleryIndex].title}</p>
                </div>
              )}
            </div>
            {/* Thumbnails */}
            {venueGallery.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {venueGallery.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveGalleryIndex(idx)}
                    className="flex-shrink-0 rounded-lg overflow-hidden transition-all"
                    style={{
                      width: 80, height: 60,
                      border: idx === activeGalleryIndex ? `2px solid ${primaryColor}` : '2px solid transparent',
                      opacity: idx === activeGalleryIndex ? 1 : 0.6
                    }}
                  >
                    {item.media_type === 'video' ? (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--bg-card)' }}>
                        <span className="text-white text-lg">▶</span>
                      </div>
                    ) : (
                      <img src={item.media_url} alt="" className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Tickets ───────────────────────────────────────────────────────────── */}
      {event && <TicketsSection eventId={event.id} />}

      {/* ── Sponsors ──────────────────────────────────────────────────────────── */}
      {sponsors.length > 0 && (
        <section id="sponsors" className="py-16 px-6" style={{ background: 'rgba(108,99,255,0.03)' }}>
          <div className="max-w-5xl mx-auto text-center">
            <div className="section-badge">الشركاء والرعاة</div>
            <h2 className="section-title mb-10">شركاء القمة</h2>
            <div className="flex flex-wrap gap-6 justify-center items-stretch">
              {sponsors.map(sp => {
                const tierColors: Record<string, string> = {
                  platinum: '#e5e7eb', gold: '#fcd34d', silver: '#94a3b8',
                  bronze: '#b45309', media: '#0ea5e9',
                };
                const tierAr: Record<string, string> = {
                  platinum: 'بلاتيني', gold: 'ذهبي', silver: 'فضي',
                  bronze: 'برونزي', media: 'إعلامي',
                };
                const tierColor = tierColors[sp.tier] || '#94a3b8';
                return (
                  <div key={sp.id} className="card flex flex-col items-center gap-3 px-6 py-5"
                    style={{ minWidth: 160, maxWidth: 200, flex: '0 0 auto', transition: 'transform 0.2s, border-color 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.borderColor = `${tierColor}50`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.borderColor = ''; }}>
                    {/* Logo */}
                    {sp.logo_url ? (
                      <img src={sp.logo_url} alt={sp.name} style={{ height: 52, maxWidth: 140, objectFit: 'contain' }} />
                    ) : (
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${tierColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🏅</div>
                    )}
                    {/* Name */}
                    <span className="text-white font-bold text-sm text-center">{sp.name}</span>
                    {/* Tier badge */}
                    {sp.tier && (
                      <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.6rem', borderRadius: 20, background: `${tierColor}18`, color: tierColor, border: `1px solid ${tierColor}35`, fontWeight: 700 }}>
                        {tierAr[sp.tier] || sp.tier}
                      </span>
                    )}
                    {/* Website */}
                    {sp.website && (
                      <a href={sp.website} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '0.7rem', color: primaryColor, textDecoration: 'none', opacity: 0.8 }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '0.8')}>
                        {sp.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Register ─────────────────────────────────────────────────────────── */}
      <section id="register" className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="section-badge">التسجيل</div>
            <h2 className="section-title">{cfg.form_title || 'انضم إلى القمة'}</h2>
            <p className="text-[var(--text-muted)] mt-2">{cfg.form_subtitle || 'سجّل الآن وكن جزءاً من أكبر تجمع لريادة الأعمال'}</p>
          </div>
          <div className="card" style={{ background: 'var(--bg-card)' }}>
            {event ? <RegistrationForm event={event} onClose={() => {}} cfg={cfg} initialTab={regInitialTab} /> : (
              <p className="text-center text-[var(--text-muted)] py-8">لم يتم تحميل بيانات الفعالية.</p>
            )}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────────── */}
      {faqs.length > 0 && (
        <section id="faq" className="py-20 px-6" style={{ background: 'rgba(108,99,255,0.03)' }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <div className="section-badge">الأسئلة الشائعة</div>
              <h2 className="section-title">أجوبة على أسئلتك</h2>
            </div>
            <div className="space-y-3">
              {faqs.map(faq => (
                <div key={faq.id} className="card cursor-pointer" onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}>
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">{faq.question_ar}</span>
                    <span className="text-[var(--primary)] text-xl transition-transform" style={{ transform: openFaq === faq.id ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
                  </div>
                  {openFaq === faq.id && (
                    <p className="text-[var(--text-muted)] text-sm mt-3 leading-relaxed">{faq.answer_ar}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="py-12 px-6" style={{ borderTop: '1px solid rgba(108,99,255,0.15)' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="font-black text-xl text-white mb-2"><span style={{ color: primaryColor }}>S3</span> Summit</div>
            <p className="text-[var(--text-muted)] text-sm">{eventName}</p>
            <p className="text-[var(--text-muted)] text-sm">{sd.day}–{ed.day} {ed.month} {ed.year}</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">روابط سريعة</h4>
            <div className="flex flex-col gap-2">
              {navLinks.filter(l => !l.href.startsWith('/')).map(l => <a key={l.href} href={l.href} className="text-sm text-[var(--text-muted)] hover:text-white transition-colors">{l.label}</a>)}
              {/* رابط الأرشيف — حسب إعدادات الأدمن */}
              {siteCfg.archive_link_enabled !== false && (siteCfg.archive_link_position === 'footer' || siteCfg.archive_link_position === 'both' || siteCfg.archive_link_position === undefined) && (
                <Link href="/archive" className="text-sm text-[var(--text-muted)] hover:text-white transition-colors">
                  {siteCfg.archive_link_label || '🗂 أرشيف الأحداث'}
                </Link>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">تواصل معنا</h4>
            {event?.email && <a href={`mailto:${event.email}`} className="block text-sm text-[var(--text-muted)] hover:text-white transition-colors mb-1">{event.email}</a>}
            <div className="flex gap-3 mt-3 flex-wrap" style={{ alignItems: 'center' }}>
              {event?.twitter && <a href={event.twitter.startsWith('http') ? event.twitter : `https://twitter.com/${event.twitter}`} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-white transition-colors" title="X (Twitter)"><IconX size={18} /></a>}
              {event?.instagram && <a href={event.instagram.startsWith('http') ? event.instagram : `https://instagram.com/${event.instagram}`} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-white transition-colors" title="Instagram"><IconInstagram size={18} /></a>}
              {event?.linkedin && <a href={event.linkedin.startsWith('http') ? event.linkedin : `https://linkedin.com/company/${event.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-white transition-colors" title="LinkedIn"><IconLinkedIn size={18} /></a>}
              {(event as any)?.tiktok && <a href={(event as any).tiktok.startsWith('http') ? (event as any).tiktok : `https://tiktok.com/@${(event as any).tiktok}`} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-white transition-colors" title="TikTok"><IconTikTok size={18} /></a>}
              {(event as any)?.youtube && <a href={(event as any).youtube.startsWith('http') ? (event as any).youtube : `https://youtube.com/@${(event as any).youtube}`} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-white transition-colors" title="YouTube"><IconYouTube size={18} /></a>}
              {(event as any)?.facebook && <a href={(event as any).facebook.startsWith('http') ? (event as any).facebook : `https://facebook.com/${(event as any).facebook}`} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-white transition-colors" title="Facebook"><IconFacebook size={18} /></a>}
              {(event as any)?.whatsapp_link && <a href={(event as any).whatsapp_link} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-white transition-colors" title="WhatsApp"><IconWhatsApp size={18} /></a>}
              {(event as any)?.telegram && <a href={(event as any).telegram.startsWith('http') ? (event as any).telegram : `https://t.me/${(event as any).telegram}`} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-white transition-colors" title="Telegram"><IconTelegram size={18} /></a>}
            </div>
          </div>
        </div>
        {(siteCfg.logo_position === 'footer' || siteCfg.logo_position === 'both') && siteCfg.logo_url && (
          <div className="max-w-6xl mx-auto mt-8 pt-6 pb-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <img 
              src={siteCfg.logo_url} 
              alt="logo" 
              className="h-12 object-contain mx-auto mb-4" 
              style={{
                background: theme === 'dark' ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
                padding: theme === 'dark' ? '12px 16px' : '0',
                borderRadius: theme === 'dark' ? '12px' : '0',
                boxShadow: theme === 'dark' ? '0 4px 16px rgba(108, 99, 255, 0.25)' : 'none',
                transition: 'all 0.3s ease'
              }}
            />
          </div>
        )}
        <div className="max-w-6xl mx-auto pt-6 text-center text-sm text-[var(--text-muted)]" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          © {ed.year} {event?.name_ar || event?.name || 'S³ Summit'} · جميع الحقوق محفوظة
        </div>
      </footer>

      {/* ── Support Widget ─────────────────────────────────────────────────────── */}
      {event && <SupportWidget eventId={event.id} primaryColor={event.primary_color || '#6C63FF'} />}

      {/* ── Speaker Bio Modal ──────────────────────────────────────────────────── */}
      {selectedSpeaker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => setSelectedSpeaker(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-8 relative"
            style={{ background: 'var(--bg-card)', border: '1px solid rgba(108,99,255,0.3)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedSpeaker(null)}
              className="absolute top-4 left-4 text-[var(--text-muted)] hover:text-white text-2xl leading-none"
            >×</button>

            {/* Speaker photo + name */}
            <div className="flex items-start gap-5 mb-6">
              {selectedSpeaker.photo_url ? (
                <img src={selectedSpeaker.photo_url} alt={selectedSpeaker.name_ar}
                  className="w-20 h-20 rounded-full object-cover flex-shrink-0"
                  style={{ border: `2px solid ${primaryColor}` }} />
              ) : (
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black text-white flex-shrink-0"
                     style={{ background: `linear-gradient(135deg, ${primaryColor}, #4f46e5)` }}>
                  {selectedSpeaker.name_ar?.split(' ').map((w: string) => w[0]).slice(0,2).join('')}
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{selectedSpeaker.name_ar || selectedSpeaker.name}</h3>
                <p className="text-sm font-semibold" style={{ color: primaryColor }}>{selectedSpeaker.title_ar}</p>
                <p className="text-sm text-[var(--text-muted)]">{selectedSpeaker.company}</p>
                {selectedSpeaker.is_featured === 1 && (
                  <span className="tag text-xs mt-2 inline-block" style={{ background: '#f59e0b20', color: '#f59e0b' }}>✦ متحدث مميز</span>
                )}
              </div>
            </div>

            {/* Bio */}
            {(selectedSpeaker.bio_ar || selectedSpeaker.bio) && (
              <div className="mb-4">
                <h4 className="text-white font-semibold mb-2 text-sm">نبذة تعريفية</h4>
                <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                  {selectedSpeaker.bio_ar || selectedSpeaker.bio}
                </p>
              </div>
            )}

            {/* Extended bio */}
            {selectedSpeaker.bio_extended && (
              <div className="mb-4">
                <h4 className="text-white font-semibold mb-2 text-sm">التفاصيل</h4>
                <p className="text-[var(--text-muted)] text-sm leading-relaxed">{selectedSpeaker.bio_extended}</p>
              </div>
            )}

            {/* Achievements */}
            {selectedSpeaker.achievements && (
              <div className="mb-4 p-4 rounded-lg" style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)' }}>
                <h4 className="text-white font-semibold mb-3 text-sm">🏆 الإنجازات</h4>
                <ul className="space-y-2">
                  {selectedSpeaker.achievements.split('\n').filter(Boolean).map((a: string, i: number) => (
                    <li key={i} className="text-[var(--text-muted)] text-sm flex items-start gap-2">
                      <span style={{ color: primaryColor }}>◆</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Social links */}
            {(selectedSpeaker.linkedin_url || selectedSpeaker.twitter_url) && (
              <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
                {selectedSpeaker.linkedin_url && (
                  <a href={selectedSpeaker.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
                    style={{ background: '#0077B5', color: 'white' }}>
                    LinkedIn
                  </a>
                )}
                {selectedSpeaker.twitter_url && (
                  <a href={selectedSpeaker.twitter_url} target="_blank" rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
                    style={{ background: '#000', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
                    𝕏 Twitter
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Registration Modal ─────────────────────────────────────────────────── */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6"
               style={{ background: 'var(--bg-card)', border: '1px solid rgba(108,99,255,0.3)' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold section-title" style={{ color: 'var(--heading)' }}>التسجيل في القمة</h3>
              <button onClick={() => setShowRegModal(false)} className="text-[var(--text-muted)] hover:text-white text-2xl leading-none">×</button>
            </div>
            {event && <RegistrationForm event={event} onClose={() => setShowRegModal(false)} cfg={cfg} initialTab={regInitialTab} ticketInstructions={(siteCfg as any)?.ticket_instructions} />}
          </div>
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      {(footerPages.length > 0 || (termsData?.show_in_footer && (termsData?.terms_content || termsData?.privacy_content))) && (
        <footer style={{ background: 'var(--footer-bg)', borderTop: '1px solid rgba(108,99,255,0.15)', padding: '1.5rem 1.5rem', textAlign: 'center' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem 1.5rem' }}>
            {footerPages.map(page => (
              <a key={page.id} href={`/terms?page=${page.slug}`}
                style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.82rem', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#6C63FF')}
                onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
                {page.title_ar || page.title}
              </a>
            ))}
            {termsData?.show_in_footer && termsData?.terms_content && (
              <a href={`/terms?tab=terms`}
                style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.82rem', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#6C63FF')}
                onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
                الشروط والأحكام
              </a>
            )}
            {termsData?.show_in_footer && termsData?.privacy_content && (
              <a href={`/terms?tab=privacy`}
                style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.82rem', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#6C63FF')}
                onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
                سياسة الخصوصية
              </a>
            )}
          </div>
          <p style={{ color: '#475569', fontSize: '0.75rem', margin: '0.75rem 0 0' }}>© {new Date().getFullYear()} {event?.name_ar || 'S3 Summit'}. جميع الحقوق محفوظة.</p>
        </footer>
      )}
    </div>
  );
}
