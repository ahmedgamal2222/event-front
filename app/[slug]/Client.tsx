'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Event, Speaker, AgendaDay, Sponsor, Faq, FormConfig, SiteConfig } from '../../lib/types';
import { fetchEvent, fetchSpeakers, fetchAgenda, fetchSponsors, fetchFaqs, submitRegistration, fetchVenueGallery, fetchArticles, fetchTerms, fetchPages, fetchPaymentSettingsPublic, fetchCountries, fetchEventNavigation } from '../../lib/api';
import { VenueMedia } from '../../lib/types';
import PixelInjector from '../components/PixelInjector';
import TicketsSection from '../components/TicketsSection';
import SupportWidget from '../components/SupportWidget';
import RegistrationSuccessMessage from '../components/RegistrationSuccessMessage';
import { ThemeToggle, ThemeToggleAuto, IconX, IconInstagram, IconLinkedIn, IconTikTok, IconYouTube, IconFacebook, IconWhatsApp, IconTelegram, IconArchive, IconArrowRight, IconArrowLeft, AboutIcon } from '../components/SiteIcons';

const DEFAULT_EVENT_SLUG = ''; // No hardcoded fallback — slug MUST come from URL params

// ─── Event Navigation Bar ──────────────────────────────────────────────────────
function EventNavBar({ eventId, primaryColor, archiveLabel, showArchive, showThemeToggle, themeMode, onThemeToggle, editableText }: { eventId: number; primaryColor: string; archiveLabel?: string; showArchive?: boolean; showThemeToggle?: boolean; themeMode: 'dark' | 'light'; onThemeToggle: () => void; editableText: Record<string, string> }) {
  const [nav, setNav] = useState<{ prev: any; current: any; next: any } | null>(null);
  const label = editableText.archive_label || archiveLabel || '\uD83D\uDDC2 \u062C\u0645\u064A\u0639 \u0627\u0644\u0646\u0633\u062E';
  const prevLabel = editableText.nav_prev_label || 'الحدث السابق';
  const nextLabel = editableText.nav_next_label || 'الحدث التالي';
  const showArc = showArchive !== false;
  const showTheme = showThemeToggle !== false;

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
    <div className="event-nav-bar" style={{ background: 'var(--event-nav-bg)', borderBottom: `1px solid var(--event-nav-border)`, padding: '0.6rem 1.5rem', direction: 'rtl' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {/* الجهة اليمنى: الحدث السابق + الأرشيف */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {showArc && hasPrev && (
            <Link href={`/${nav!.prev.slug}`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--event-nav-text)', fontSize: '0.82rem', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--event-nav-text-hover)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--event-nav-text)')}>
              <IconArrowRight size={16} />
              <div>
                <div style={{ fontSize: '0.68rem', color: 'var(--event-nav-text)' }} className="nav-subtext"
                  data-edit="text" data-label="ملصق الحدث السابق" data-text="nav_prev_label" data-color="text" data-size="fs_small" data-min="8" data-max="20">
                  <RichInline html={editableText.nav_prev_label} fallback={prevLabel} />
                </div>
                <div style={{ fontWeight: 600 }}>{nav!.prev.name_ar || nav!.prev.name} {nav!.prev.edition_number ? `(${nav!.prev.edition_number})` : fmt(nav!.prev.start_date)}</div>
              </div>
            </Link>
          )}
          {showArc && (
            <Link href="/archive"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--event-nav-text)', textDecoration: 'none', padding: '0.25rem 0.75rem', border: '1px solid var(--event-nav-border)', borderRadius: '2rem', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--event-nav-text-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--event-nav-text-hover)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--event-nav-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--event-nav-text)'; }}>
              <IconArchive size={13} />
              <span data-edit="text" data-label="ملصق الأرشيف" data-text="archive_label" data-color="text" data-size="fs_small" data-min="8" data-max="20">
                <RichInline html={editableText.archive_label} fallback={label} />
              </span>
            </Link>
          )}
        </div>

        {/* الجهة اليسرى: زر الثيم + الحدث التالي */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {showTheme && <ThemeToggle isDark={themeMode === 'dark'} onToggle={onThemeToggle} size={42} />}
          {showArc && hasNext && (
            <Link href={`/${nav!.next.slug}`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--event-nav-text)', fontSize: '0.82rem', transition: 'color 0.15s', textAlign: 'left' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--event-nav-text-hover)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--event-nav-text)')}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--event-nav-text)' }} className="nav-subtext"
                  data-edit="text" data-label="ملصق الحدث التالي" data-text="nav_next_label" data-color="text" data-size="fs_small" data-min="8" data-max="20">
                  <RichInline html={editableText.nav_next_label} fallback={nextLabel} />
                </div>
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

// حقل لون صغير داخل لوحة التعديل المباشر
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const safe = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value) ? value : (value?.startsWith('var(') ? '#6C63FF' : value || '#6C63FF');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', borderRadius: '0.45rem', padding: '0.25rem 0.6rem 0.25rem 0.35rem' }}>
      <span style={{ position: 'relative', width: 26, height: 26, borderRadius: '0.35rem', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.18)', flexShrink: 0, background: safe === '#6C63FF' && value?.startsWith('var(') ? 'conic-gradient(#6C63FF, #4f46e5, #6C63FF)' : safe }}>
        <input type="color" value={safe === '#6C63FF' && value?.startsWith('var(') ? '#6C63FF' : safe} onChange={e => onChange(e.target.value)}
          style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer', border: 'none', padding: 0 }} />
      </span>
      <span style={{ color: '#94a3b8', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{label}</span>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} dir="ltr" placeholder="مثل #6C63FF أو rgba(...)"
        style={{ width: 110, background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '0.72rem', fontFamily: 'monospace' }} />
    </div>
  );
}

// ── عرض نص قد يحتوي وسوم <span> ملونة (تلوين كل كلمة على حدة) ──
// إذا كان النص يحتوي HTML (من محرر التلوين المباشر) يُعرض بأمان، وإلا يُعرض كنص عادي.
function RichInline({ html, fallback }: { html?: string; fallback?: React.ReactNode }) {
  if (!html || !String(html).trim()) return <>{fallback}</>;
  if (/<[a-z][^>]*>/i.test(String(html))) {
    return <span dangerouslySetInnerHTML={{ __html: String(html) }} />;
  }
  return <>{String(html)}</>;
}

// تحويل وسوم <font color> (ناتجة عن execCommand) إلى <span style="color:..."> للحفظ الموحد
const normalizeRichHtml = (html: string) =>
  html
    .replace(/<font\s+color="([^"]+)"[^>]*>(.*?)<\/font>/gi, '<span style="color:$1">$2</span>')
    .replace(/<font\s+color='([^']+)'[^>]*>(.*?)<\/font>/gi, '<span style="color:$1">$2</span>')
    .replace(/\u00a0/g, ' ');

// حقل تحرير نصي غني — يتيح تلوين كل كلمة (أو جزء) على حدة داخل لوحة التعديل المباشر
function InlineRichText({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || '')) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);
  const emit = () => { if (ref.current) onChange(normalizeRichHtml(ref.current.innerHTML)); };
  const applyColor = (color: string) => {
    if (!ref.current) return;
    ref.current.focus();
    try {
      document.execCommand('styleWithCSS', false, true);
      document.execCommand('foreColor', false, color);
    } catch { /* بعض المتصفحات ترفض بدون تحديد */ }
    emit();
  };
  const clearFormatting = () => {
    if (!ref.current) return;
    ref.current.focus();
    try { document.execCommand('removeFormat', false); } catch {}
    emit();
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        data-placeholder={placeholder || 'اكتب النص...'}
        className="rich-inline-editor"
        style={{
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(108,99,255,0.35)',
          borderRadius: '0.45rem', padding: '0.45rem 0.7rem', color: 'white', outline: 'none',
          minWidth: 230, minHeight: '1.7em', fontSize: '0.82rem', lineHeight: 1.5,
        }}
      />
      <ColorField label="🎨 تلوين المحدد" value="#f59e0b" onChange={applyColor} />
      <button
        onClick={clearFormatting}
        title="إزالة التلوين عن الكلمة/النص المحدد"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.2)', color: '#fca5a5', borderRadius: '0.4rem', padding: '0.3rem 0.55rem', cursor: 'pointer', fontSize: '0.72rem' }}
      >🧹 إزالة تلوين المحدد</button>
    </div>
  );
}

// القيمة الأصلية للنص القابل للتعديل (تُعرض كـ placeholder في حقل التعديل المباشر)
function editTextPlaceholder(
  key: string, siteCfg: SiteConfig, eventName: string, eventTagline: string,
  description: string, location: string, ed: { day: number; month: string; year: number }, cfg: FormConfig,
): string {
  const aboutCard = key?.startsWith('about_card_')
    ? siteCfg.about_cards[Number(key.split('_')[2])]?.title || ''
    : '';
  const map: Record<string, string> = {
    hero_abbr: siteCfg.hero_abbr,
    hero_btn_primary: siteCfg.hero_btn_primary,
    hero_btn_secondary: siteCfg.hero_btn_secondary,
    hero_badge: `${location} · ${ed.month} ${ed.year}`,
    event_name: eventName,
    event_tagline: eventTagline,
    description,
    navbar_btn: 'سجّل الآن',
    navbar_brand: eventName,
    about_badge: siteCfg.about_badge,
    about_title: siteCfg.about_title,
    agenda_badge: 'البرنامج',
    agenda_title: 'أيام مكثّفة',
    speakers_badge: 'المتحدثون',
    speakers_title: 'قيادات ملهمة',
    sponsors_badge: 'الشركاء والرعاة',
    sponsors_title: 'شركاء القمة',
    register_badge: 'التسجيل',
    register_title: cfg.form_title || 'انضم إلى القمة',
    faq_badge: 'الأسئلة الشائعة',
    faq_title: 'أجوبة على أسئلتك',
  };
  return aboutCard || map[key] || '';
}

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
          <div className="countdown-card card w-20 h-20 flex items-center justify-center text-3xl font-black"
               style={{ background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.4)', color: 'white' }}>
            {String(value).padStart(2, '0')}
          </div>
          <div className="text-xs text-[var(--text-muted)] mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}

function StatCounter({ value, label, labelKey }: { value: number; label: string; labelKey: number }) {
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
      <div className="text-[var(--text-muted)] text-sm mt-1"
        data-edit="text" data-label="تسمية إحصائية" data-text={`stat_${labelKey}_label`} data-color="text" data-size="fs_body" data-min="10" data-max="30">
        <RichInline html={label.indexOf('<') >= 0 ? label : ''} fallback={label} />
      </div>
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
    let mounted = true;
    const load = async () => {
      try {
        const { fetchTickets } = await import('../../lib/api');
        const r = await fetchTickets(eventId, true);
        if (mounted) setTickets(r.data || []);
      } catch {}
    };
    load();
    const timer = setInterval(load, 5000);
    return () => { mounted = false; clearInterval(timer); };
  }, [eventId]);
  if (!tickets.length) return <p className="text-[var(--text-muted)]" style={{ fontSize: '0.85rem' }}>لا توجد تذاكر متاحة حالياً</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {tickets.map(t => (
        <button key={t.id} onClick={() => onSelect(t.id, t.price_per_unit)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(108,99,255,0.3)`, borderRadius: '0.6rem', cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(108,99,255,0.15)'; e.currentTarget.style.borderColor = primaryColor; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(108,99,255,0.3)'; }}>
          <div style={{ textAlign: 'right' }}>
            <div className="text-white font-bold" style={{ fontSize: '0.9rem' }}>{t.name_ar}</div>
            {t.description && <div className="text-[var(--text-muted)]" style={{ fontSize: '0.75rem' }}>{t.description}</div>}
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
             <p className="text-[var(--text-muted)]" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
              {paymentSettings.payment_subtitle || 'أرسل صورة الفاتورة عبر واتساب لتأكيد تسجيلك'}
            </p>
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', background: '#25D366', color: 'white', borderRadius: '0.6rem', textDecoration: 'none', fontWeight: 700, fontSize: '1rem' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.107 1.523 5.83L0 24l6.336-1.5C8.024 23.45 9.972 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.89 0-3.663-.522-5.177-1.43L3 22l1.44-4.705A9.945 9.945 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              تواصل عبر واتساب
            </a>
          </div>
          <p className="text-[var(--text-muted)]" style={{ fontSize: '0.78rem' }}>سيقوم الفريق بتأكيد دفعك خلال 24 ساعة وإرسال تذكرتك على بريدك</p>
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
             <input className="input-field" required={cfg.require_phone} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+963..." dir="ltr"/>
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
    show_theme_toggle: true,
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
      ticket_instructions: {
        startup_step1_title: 'طلبك قيد المراجعة',
        startup_step1_desc: 'يراجع الفريق طلبك ومعلومات مشروعك خلال 24-48 ساعة',
        startup_step2_title: 'مكالمة استعلام',
        startup_step2_desc: 'سيتواصل معك أحد أعضاء الفريق عبر واتساب لتحديد موعد مكالمة قصيرة (15 دقيقة) عن مشروعكم',
        startup_step3_title: 'القبول والدفع',
        startup_step3_desc: 'في حال القبول ستصلك رسالة تأكيد مع تفاصيل الدفع',
        startup_step4_title: 'تذكرتك ومقعدك',
        startup_step4_desc: 'بعد تأكيد الدفع تصلك تذاكر الفريق برموز QR مباشرة على واتساب',
        startup_note: 'تأكد من إبقاء واتساب مفعلاً على الرقم المسجل – سيتواصل معك الفريق خلاله',
        general_confirm_title: 'رسالة تأكيد',
        general_confirm_desc: 'ستصلك رسالة تأكيد على البريد الإلكتروني المسجل تتضمن تفاصيل الحدث وكيفية الحضور',
        general_ticket_title: 'تذكرتك',
        general_ticket_desc: 'تذكرة الدخول ستصلك برمز QR قبل انطلاق الفعالية. احتفظ برقم هاتفك المسجل لاستقبالها',
        general_note: 'تأكد من إبقاء واتساب مفعلاً على الرقم المسجل – سيتواصل معك الفريق خلاله',
        close_btn_text: 'حسناً، شكراً!',
        startup_success_title: 'استلمنا طلب شركتك!',
        general_success_title: 'تم التسجيل بنجاح!',
        custom_messages: [],
      },
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
      show_theme_toggle: raw.show_theme_toggle !== undefined ? !!raw.show_theme_toggle : false,
      default_theme: raw.default_theme === 'light' || raw.default_theme === 'dark' ? raw.default_theme : 'dark',
      ticket_instructions: { ...fallback.ticket_instructions, ...(raw.ticket_instructions || {}) },
    };
  };
  const [activeDay, setActiveDay] = useState(0);
  const [showRegModal, setShowRegModal] = useState(false);
  const [regInitialTab, setRegInitialTab] = useState<string | undefined>(undefined);
  const openModal = (tab?: string) => {
    // Force refresh tickets from server when registration modal opens
    if (event?.id) {
      import('../../lib/api').then(({ fetchTickets }) => {
        fetchTickets(event.id, true).then(r => {
          if (Array.isArray(r?.data)) {
            // Trigger a re-render of TicketsSection by dispatching a custom event
            window.dispatchEvent(new CustomEvent('tickets-refresh', { detail: r.data }));
          }
        }).catch(() => {});
      });
    }
    setRegInitialTab(tab); setShowRegModal(true);
  };
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSpeaker, setSelectedSpeaker] = useState<any | null>(null);
  const [venueGallery, setVenueGallery] = useState<VenueMedia[]>([]);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  // ── Live preview from admin panel (theme_preview + theme_mode query params) ──
  const [previewMode, setPreviewMode] = useState<'light' | 'dark' | null>(null);
  const [previewTheme, setPreviewTheme] = useState<Record<string, string | number> | null>(null);
  const [previewText, setPreviewText] = useState<Record<string, string> | null>(null);
  const [previewDir, setPreviewDir] = useState<'rtl' | 'ltr' | null>(null);
  const [editMode, setEditMode] = useState(false);

  // ── Direct editor inside preview (click element → edit) ──
  const [editColors, setEditColors] = useState<Record<string, string | number>>({});
  const [editText, setEditText] = useState<Record<string, string>>({});
  const [editDir, setEditDir] = useState<'rtl' | 'ltr'>('rtl');
  const [editTarget, setEditTarget] = useState<null | {
    kind: 'text' | 'section-bg' | 'button' | 'navbar' | 'logo' | 'body-bg' | 'hero' | 'card' | 'section';
    label: string;
    colorKey?: string;   // مفتاح لون النص/الزر (mode-aware)
    bgKey?: string;      // مفتاح لون الخلفية خلف العنصر
    sizeKey?: string;    // مفتاح حجم الخط (px)
    min?: number;
    max?: number;
    textKey?: string;    // مفتاح نص قابل للتعديل
        options?: string[];  // خيارات إضافية (مثل transparent)
    // حقول إضافية متعددة لعناصر مثل البطاقات:
    // تُقرأ من data-colors="key:label|key:label" و data-sizes="key:label:min:max|..."
    colorFields?: { key: string; label: string }[];
    sizeFields?: { key: string; label: string; min: number; max: number }[];
    // ── تموضع دقيق: حشوات padding الجهات الأربع (مفتاح القسم/العنصر) ──
    padKey?: string;
    // ── عناصر متداخلة داخل القسم (مثل بطاقات المتحدثين) — خيار الدخول إليها ──
    inner?: { el: HTMLElement; label: string }[];
  }>(null);

  // ── تحكم مباشر في الناف بار أثناء التعديل (لمسائل عرض/إخفاء معاينة أولية) ──
  const [navLogoVisible, setNavLogoVisible] = useState(true);
  const [navBrandVisible, setNavBrandVisible] = useState(true);
  const [saveToast, setSaveToast] = useState('');

  // خريطة مفاتيح الخطوط → قيم CSS (تُطبّق على --font-family مباشرة، وتُعاد كتابتها مرةً واحدة)
  const FONT_FAMILY_CSS: Record<string, string> = {
    cairo: `'Cairo', 'Segoe UI', system-ui, sans-serif`,
    tajawal: `'Tajawal', 'Cairo', 'Segoe UI', sans-serif`,
    inter: `'Inter', 'Segoe UI', system-ui, sans-serif`,
    amiri: `'Amiri', 'Cairo', serif`,
    system: `system-ui, -apple-system, sans-serif`,
    mono: `ui-monospace, SFMono-Regular, Menlo, monospace`,
  };
  const fontFamilyCss = (key?: string) => (key ? (FONT_FAMILY_CSS[key] ?? key) : undefined);

  // Read the preview params once (used by the admin panel's real live preview iframe)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tm = params.get('theme_mode');
    const tp = params.get('theme_preview');
    const tt = params.get('theme_text');
    const td = params.get('theme_dir');
    const ed = params.get('edit');
    if (tm === 'light' || tm === 'dark') setPreviewMode(tm);
    if (tp) {
      try { setPreviewTheme(JSON.parse(decodeURIComponent(tp))); } catch {}
    }
    if (tt) {
      try { setPreviewText(JSON.parse(decodeURIComponent(tt))); } catch {}
    }
    if (td === 'rtl' || td === 'ltr') setPreviewDir(td);
    setEditMode(ed === '1');
  }, []);

  // Initialize theme: admin preview mode has priority, then saved preference, then default_theme
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('event_theme') : null;
    const t = previewMode || (saved === 'light' ? 'light' : saved === 'dark' ? 'dark' : (siteCfg.default_theme || 'dark'));
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
  }, [previewMode, siteCfg.default_theme]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('event_theme', next);
  };

  // ── Direct editor inside the preview: click a text / background / button ──
  const parseFields = (raw: string | undefined, kind: 'color' | 'size') => {
    if (!raw) return undefined;
    return raw.split('|').map(seg => {
      const parts = seg.split(':');
      if (kind === 'color') return { key: parts[0], label: parts[1] || 'لون' };
      return { key: parts[0], label: parts[1] || 'حجم', min: Number(parts[2]) || 8, max: Number(parts[3]) || 160 };
    }).filter((f: any) => f && f.key) as any;
  };

  const handleEditClick = (e: React.MouseEvent) => {
    if (!editMode) return;
    const el = (e.target as HTMLElement).closest('[data-edit]') as HTMLElement | null;
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    selectElement(el);
  };

  // بناء بيانات التعديل من أي عنصر (نص / زر / قسم / بطاقة) + جمع العناصر المتداخلة بداخله
  const buildTargetFromElement = (el: HTMLElement) => {
    const d = el.dataset;
    const modeKey = (base: string) => (theme === 'light' ? base + '_light' : base);
    const inner = Array.from(el.querySelectorAll<HTMLElement>('[data-edit]'))
      .filter(c => c !== el)
      .slice(0, 40)
      .map(c => ({ el: c, label: c.dataset.label || 'عنصر داخلي' }));
    return {
      kind: (d.edit || 'text') as any,
      label: d.label || 'عنصر',
      colorKey: d.color ? (d.modeaware === '1' ? modeKey(d.color) : d.color) : undefined,
      bgKey: d.bg ? (d.bgmodeaware === '1' ? modeKey(d.bg) : d.bg) : undefined,
      sizeKey: d.size || undefined,
      min: d.min ? Number(d.min) : undefined,
      max: d.max ? Number(d.max) : undefined,
      textKey: d.text || undefined,
      options: d.options ? d.options.split(',') : undefined,
      colorFields: parseFields(d.colors, 'color'),
      sizeFields: parseFields(d.sizes, 'size'),
      padKey: d.pad || undefined,
      inner: inner.length > 0 ? inner : undefined,
    };
  };

  // اختيار عنصر + تحديث معاينة الألوان/النصوص المحفوظة فوراً
  const selectElement = (el: HTMLElement, shouldScroll = false) => {
    const d = el.dataset;
    // ضبط قيمة النص الحالية في المحرر إذا لم تكن مخزنة بعد (حتى لا يفتح الحقل فارغاً)
    if (d.text) {
      setEditText(prev => {
        if (prev[d.text!] !== undefined && prev[d.text!] !== '') return prev;
        return { ...prev, [d.text!]: d.default !== undefined ? d.default : (el.innerText || '') };
      });
    }
    // تمييز العنصر المحدد بحدود برتقالية
    document.querySelectorAll('[data-edit]').forEach(el2 => el2.setAttribute('data-edit-selected', '0'));
    el.setAttribute('data-edit-selected', '1');
    if (shouldScroll) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setEditTarget(buildTargetFromElement(el));
  };

  // تطبيق لون النص على الوضع الحالي + الوضع المقابل تلقائياً
  // (يحل مشكلة "اللون دائماً أسود" — اللون المختار يظهر في dark والـ light معاً)
  const applyColorAllModes = (baseKey: string, value: string) => {
    setEditColors(prev => {
      const next = { ...prev, [baseKey]: value };
      if (!baseKey.endsWith('_light')) next[baseKey + '_light'] = value;
      else next[baseKey.replace(/_light$/, '')] = value;
      return next;
    });
  };

  // Send live edits back to the admin panel (parent window)
  const applyEdits = () => {
    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      window.parent.postMessage({
        source: 'event-theme-editor',
        colors: editColors,
        text: editText,
        direction: editDir,
        mode: theme,
      }, '*');
    }
  };

    // أرسل كل تعديل مباشر فور تغيّره (نص/لون/حجم/اتجاه) للوحة التحكم
  useEffect(() => {
    applyEdits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editColors, editText, editDir]);

  // زر "حفظ التعديلات" المباشرة من داخل المعاينة → يرسل إشارة إلى الوالد (لوحة الأدمن)
  // فيدخّنه على حفظ theme_colors + editable_text + page_direction في سجل الفعالية.
  const saveDirectEdits = () => {
    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      window.parent.postMessage({
        source: 'event-theme-editor',
        saveDirect: true,
        colors: editColors,
        text: editText,
        direction: editDir,
        mode: theme,
      }, '*');
      setSaveToast('⏳ جارٍ حفظ التعديلات على الخادم...');
    } else {
      setSaveToast('⚠️ احفظ من داخل لوحة الأدمن (المعاينة غير مدمجة كـ iframe)');
    }
    setTimeout(() => setSaveToast(''), 4000);
  };


  useEffect(() => {
    // Reset state when slug changes to avoid showing stale data
    setEvent(null);
    setSpeakers([]);
    setAgenda([]);
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
        const [spRes, agRes, spnRes, fqRes, venueRes, artRes] = await Promise.allSettled([
          fetch(`${API_URL}/api/events/${ev.id}/speakers`).then(r => r.json()),
          fetch(`${API_URL}/api/events/${ev.id}/agenda`).then(r => r.json()),
          fetch(`${API_URL}/api/events/${ev.id}/sponsors`).then(r => r.json()),
          fetch(`${API_URL}/api/events/${ev.id}/faqs`).then(r => r.json()),
          fetch(`${API_URL}/api/events/${ev.id}/venue`).then(r => r.json()),
          fetch(`${API_URL}/api/events/${ev.id}/articles?limit=1&status=published`).then(r => r.json()),
        ]);

        const val = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? r.value : null;
        setSpeakers(val(spRes)?.data || []);
        setAgenda(val(agRes)?.data || []);
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

  // Poll site config every 30s for near-real-time updates from admin panel
  useEffect(() => {
    if (!event?.id) return;
    const id = event.id;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev';
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/events/${id}`).then(r => r.json());
        if (res?.success && res?.data?.site_config) {
          setSiteCfg(prev => normalizeSiteConfig({ ...prev, ...JSON.parse(res.data.site_config) }));
        }
      } catch {}
    }, 30000);
    return () => clearInterval(timer);
  }, [event?.id]);

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
  // (previewTheme from ?theme_preview= + live edits merge on top for the admin preview)
  const themeColors: Record<string, string | number> = {
    ...((siteCfg as any).theme_colors || {}),
    ...(previewTheme || {}),
    ...editColors,
  };
  const editableText: Record<string, string> = {
    ...((siteCfg as any).editable_text || {}),
    ...(previewText || {}),
    ...editText,
  };
  const pageDir: 'rtl' | 'ltr' = previewDir || editDir || ((themeColors as any).page_direction === 'ltr' ? 'ltr' : 'rtl');

  // ── خلفية الـ Hero: صورة / فيديو / يوتيوب / رابط خارجي ──
  const heroBgType = ((themeColors as any).hero_bg_type as string) || 'none';
  const heroBgImage = ((themeColors as any).hero_bg_image as string) || '';
  const heroBgVideo = ((themeColors as any).hero_bg_video as string) || '';
  const heroBgYt = ((themeColors as any).hero_bg_youtube as string) || '';
  const heroOverlay = ((themeColors as any).hero_bg_overlay as string) || 'rgba(13,11,26,0.55)';
  const heroBgPos = ((themeColors as any).hero_bg_pos as string) || 'center';
  const heroAlign = ((themeColors as any).hero_align as string) || 'center';
  const heroY = ((themeColors as any).hero_y as string) || 'center';
  const ytEmbedUrl = (src: string) => {
    const m = (src || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
    const id = m ? m[1] : (src || '').trim();
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&rel=0&playsinline=1` : '';
  };
  const heroFlexJustify = heroY === 'top' ? 'flex-start' : heroY === 'bottom' ? 'flex-end' : 'center';
  const heroFlexAlign = heroAlign === 'center' ? 'center' : heroAlign === 'right' ? 'flex-end' : 'flex-start';
  // قسم خلفية: لون واحد أو تدرّج (عند وجود section_*_bg2)
  const secBg = (bg: any, bg2: any) => bg2 ? `linear-gradient(135deg, ${bg || 'transparent'}, ${bg2})` : (bg || undefined);
  // مفاتيح الأقسام + أي مفاتيح حشوات جديدة تُضاف لاحقاً (section_<key>_pad_<side>)
  const secPadVars: Record<string, string> = {};
  for (const k of Object.keys(themeColors)) {
    const m = k.match(/^section_(.+)_pad_(top|bottom|left|right)$/);
    const v = (themeColors as any)[k];
    if (m && v !== undefined && v !== null && v !== '') {
      secPadVars[`--sec-${m[1]}-pad-${m[2]}`] = Number(v) + 'px';
    }
  }
  // تفعيل/إيقاف تدرج العناوين من الثيم
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-gradient-text', String(themeColors.gradient_text_enabled ?? '1') === '0' ? '0' : '1');
  }
  const themeVarsStyle = Object.keys(themeColors).length > 0 ? {
    // ── الوضع الليلي (الافتراضي) ──
    '--primary':      themeColors.primary      || primaryColor,
    '--primary-dark': themeColors.primary_dark || primaryColor,
    '--accent':       themeColors.accent       || '#f59e0b',
    '--bg-dark':      themeColors.bg_dark      || '#0d0b1a',
    '--bg-card':      themeColors.bg_card      || '#13102a',
    '--text':         themeColors.text         || '#e2e8f0',
    '--text-muted':   themeColors.text_muted   || '#94a3b8',
    '--heading':      themeColors.heading      || '#ffffff',
    '--navbar-bg':     themeColors.navbar_bg_dark  || 'rgba(19,16,42,0.75)',
    '--navbar-blur':   themeColors.navbar_blur === 'off' ? 'none' : 'blur(12px)',
    '--navbar-border': themeColors.navbar_border   || 'rgba(108,99,255,0.2)',
    // ── الوضع النهاري — تُطبق تلقائياً عند data-theme="light" عبر CSS ──
    '--bg-light':          themeColors.bg_light          || '#ffffff',
    '--bg-card-light':     themeColors.bg_card_light     || '#ffffff',
    '--text-light':        themeColors.text_light        || '#0f172a',
    '--text-muted-light':  themeColors.text_muted_light  || '#475569',
    '--heading-light':     themeColors.heading_light     || '#0f172a',
    '--border-light':      themeColors.border_light      || 'rgba(108,99,255,0.16)',
    '--panel-light':       themeColors.panel_light       || '#ffffff',
    '--footer-bg-light':   themeColors.footer_bg_light   || '#f8fafc',
    '--event-nav-bg-light': themeColors.event_nav_bg_light || '#ffffff',
    '--option-bg-light':   themeColors.option_bg_light   || '#ffffff',
    '--section-tickets-bg-light': themeColors.section_tickets_bg_light || undefined as any,
    // ── الأحجام (الخطوط) ──
    '--fs-hero':      (themeColors.fs_hero      || 72) + 'px',
    '--fs-hero-sub':  (themeColors.fs_hero_sub  || 30) + 'px',
    '--fs-section':   (themeColors.fs_section   || 32) + 'px',
    '--fs-card-title':(themeColors.fs_card_title || 17) + 'px',
    '--fs-body':      (themeColors.fs_body      || 16) + 'px',
    '--fs-small':     (themeColors.fs_small     || 13) + 'px',
    '--fs-nav':       (themeColors.fs_nav       || 14) + 'px',
    // ── خلفيات الأقسام (لون أو تدرّج عند وجود *_bg2) ──
    '--section-hero-bg':      secBg(themeColors.section_hero_bg, themeColors.section_hero_bg2) || 'transparent',
    '--section-stats-bg':     secBg(themeColors.section_stats_bg, themeColors.section_stats_bg2) || 'transparent',
    '--section-about-bg':     secBg(themeColors.section_about_bg, themeColors.section_about_bg2) || 'transparent',
    '--section-agenda-bg':    secBg(themeColors.section_agenda_bg, themeColors.section_agenda_bg2) || 'rgba(108,99,255,0.03)',
    '--section-speakers-bg':  secBg(themeColors.section_speakers_bg, themeColors.section_speakers_bg2) || 'transparent',
    '--section-video-bg':     secBg(themeColors.section_video_bg, themeColors.section_video_bg2) || 'rgba(108,99,255,0.04)',
    '--section-venue-bg':     secBg(themeColors.section_venue_bg, themeColors.section_venue_bg2) || 'rgba(0,0,0,0.3)',
    '--section-faq-bg':       secBg(themeColors.section_faq_bg, themeColors.section_faq_bg2) || 'rgba(108,99,255,0.03)',
    '--section-sponsors-bg':  secBg(themeColors.section_sponsors_bg, themeColors.section_sponsors_bg2) || 'rgba(108,99,255,0.03)',
    '--section-register-bg':  secBg(themeColors.section_register_bg, themeColors.section_register_bg2) || 'transparent',
    '--section-tickets-bg':   secBg(themeColors.section_tickets_bg, themeColors.section_tickets_bg2) || 'var(--bg-dark)',
    // ── الأزرار + hover + تدرجات ──
    '--btn-primary-bg':    themeColors.btn_primary_bg     || 'var(--primary)',
    '--btn-primary-bg2':   themeColors.btn_primary_bg2    || 'var(--primary-dark)',
    '--btn-primary-color': themeColors.btn_primary_color  || '#ffffff',
    '--btn-outline-color': themeColors.btn_outline_color  || 'var(--primary)',
        '--btn-radius':        ((themeColors.btn_radius as number) || 8) + 'px',
    '--btn-primary-hover': themeColors.btn_primary_hover  || undefined,
    '--btn-outline-hover': themeColors.btn_outline_hover  || undefined,
    '--link-hover':        themeColors.link_hover         || undefined,
    '--btn-gradient-angle': ((themeColors.btn_gradient_angle as number) || 135) + 'deg',
    '--gradient-angle':     ((themeColors.btn_gradient_angle as number) || 135) + 'deg',
    '--gradient-from':      themeColors.gradient_text_from || 'var(--primary)',
    '--gradient-to':        themeColors.gradient_text_to   || 'var(--accent)',
    '--gradient-text-color': themeColors.heading           || '#ffffff',
    // ── حشوات الأقسام (padding لكل سكشن على حدة) ──
    ...secPadVars,
    // ── Font family + heading alignment (أي خط / موضع العنوان) ──
    '--font-family': fontFamilyCss((themeColors as any).font_family),
    '--title-align': (themeColors as any).text_align || undefined,
  } as React.CSSProperties : undefined;

  // ── إعدادات بطاقات المتحدثين (من الثيم) ──
  const spkPhotoW   = Number((themeColors as any).spk_photo_w) || 80;
  const spkPhotoH   = Number((themeColors as any).spk_photo_h) || 80;
  const spkShape    = ((themeColors as any).spk_photo_shape as string) || 'circle';
  const spkRadius   = spkShape === 'circle' ? 9999 : spkShape === 'square' ? 0 : Number((themeColors as any).spk_photo_radius) || 16;
  const spkAlign    = ((themeColors as any).spk_align as string) || 'center';
  const spkAlignText: 'center' | 'left' | 'right' = spkAlign === 'left' ? 'left' : spkAlign === 'right' ? 'right' : 'center';
  const spkCols     = Number((themeColors as any).spk_cols) || 4;
  const spkGap      = Number((themeColors as any).spk_gap) != null ? Number((themeColors as any).spk_gap) : 24;
  const spkEqual    = (themeColors as any).spk_equal_h !== 0;
  const spkPhotoMb  = Number((themeColors as any).spk_photo_mb) != null ? Number((themeColors as any).spk_photo_mb) : 16;
  const spkNameMt   = Number((themeColors as any).spk_name_mt) != null ? Number((themeColors as any).spk_name_mt) : 4;
  const spkRoleMt   = Number((themeColors as any).spk_role_mt) != null ? Number((themeColors as any).spk_role_mt) : 6;
  const spkCompMt   = Number((themeColors as any).spk_company_mt) != null ? Number((themeColors as any).spk_company_mt) : 4;
  const spkRoleMode = ((themeColors as any).spk_role_mode as string) || 'show';

  // ── إعدادات الفوتر (من الثيم) ──
  const ftrPadT    = Number((themeColors as any).ftr_pad_top) ?? 24;
  const ftrPadB    = Number((themeColors as any).ftr_pad_bottom) ?? 24;
  const ftrPadL    = Number((themeColors as any).ftr_pad_left) ?? 24;
  const ftrPadR    = Number((themeColors as any).ftr_pad_right) ?? 24;
  const ftrShowImg = (themeColors as any).ftr_show_image === 1;
  const ftrImg     = ((themeColors as any).ftr_image as string) || '';
  const ftrImgW    = Number((themeColors as any).ftr_image_w) ?? 120;
  const ftrImgH    = Number((themeColors as any).ftr_image_h) ?? 0;
  const ftrImgR    = Number((themeColors as any).ftr_image_radius) ?? 12;
  const ftrImgMb   = Number((themeColors as any).ftr_image_mb) ?? 12;
  const ftrAlign   = ((themeColors as any).ftr_align as string) || 'center';
  const ftrTextSize = Number((themeColors as any).ftr_text_size) ?? 13;
  const ftrGap     = Number((themeColors as any).ftr_gap) ?? 24;

  // ── صورة داخل محتوى الـ Hero (من الثيم) ──
  const heroImgShow = (themeColors as any).hero_img_show === 1;
  const heroImgSrc  = ((themeColors as any).hero_img_src as string) || '';
  const heroImgW    = Number((themeColors as any).hero_img_w) ?? 320;
  const heroImgH    = Number((themeColors as any).hero_img_h) ?? 0;
  const heroImgR    = Number((themeColors as any).hero_img_radius) ?? 16;
  const heroImgMt   = Number((themeColors as any).hero_img_mt) ?? 0;
  const heroImgMb   = Number((themeColors as any).hero_img_mb) ?? 16;
  const heroImgPos  = ((themeColors as any).hero_img_pos as string) || 'below_badge';

  // ── استبدال الاختصار الكبير (S3) بصوره + مكان اسم الحدث (من الثيم / التعديل المباشر) ──
  const tc = (k: string) => (editMode ? (editColors[k] ?? themeColors[k]) : themeColors[k]);
  const heroAbbrType = String(tc('hero_abbr_type') || 'text');
  const heroAbbrImg  = String(tc('hero_abbr_image') || '');
  const heroAbbrW    = Number(tc('hero_abbr_image_w')) || 220;
  const heroAbbrH    = Number(tc('hero_abbr_image_h')) || 0;
  const heroAbbrR    = Number(tc('hero_abbr_image_radius')) || 0;
  const heroAbbrMt   = Number(tc('hero_abbr_image_mt')) ?? 0;
  const heroAbbrMb   = Number(tc('hero_abbr_image_mb')) ?? 16;
  const heroNameType = String(tc('hero_name_type') || 'text');
  const heroNameImg  = String(tc('hero_name_image') || '');
  const heroNameW    = Number(tc('hero_name_image_w')) || 360;
  const heroNameH    = Number(tc('hero_name_image_h')) || 0;
  const heroNameR    = Number(tc('hero_name_image_radius')) || 0;
  const heroNameMt   = Number(tc('hero_name_image_mt')) ?? 0;
  const heroNameMb   = Number(tc('hero_name_image_mb')) ?? 16;

  // Light-mode navbar color — injected on :root so the CSS data-theme="light" block picks it up
  const navbarBgLight = themeColors.navbar_bg_light || 'rgba(255,255,255,0.98)';
  if (typeof document !== 'undefined') {
       document.documentElement.style.setProperty('--navbar-bg-light-custom', String(navbarBgLight));
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
        <h2 className="text-white" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>تعذّر تحميل بيانات الفعالية</h2>
        <p className="text-[var(--text-muted)]" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>تحقق من اتصالك بالإنترنت أو حاول مجدداً</p>
        <button
          onClick={() => window.location.reload()}
          style={{ background: '#6C63FF', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.65rem 1.5rem', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, marginLeft: '0.75rem' }}
        >↻ إعادة المحاولة</button>
        <a href="/" className="text-[var(--text-muted)]" style={{ fontSize: '0.9rem', display: 'block', marginTop: '1rem' }}>← العودة للرئيسية</a>
      </div>
    </div>
  );

  return (
    <div
      className="event-page min-h-screen"
      style={{ background: 'var(--bg-dark)', ...(themeVarsStyle || {}) }}
      data-editing={editMode ? '1' : '0'}
      dir={pageDir}
      onClickCapture={handleEditClick}
    >
      {/* Pixel Tracking */}
      <PixelInjector eventId={event?.id || 1} />
      {/* ── Navbar ───────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 glass" >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {(siteCfg.logo_position === 'navbar' || siteCfg.logo_position === 'both') && siteCfg.logo_url && (
              <img 
                src={siteCfg.logo_url} 
                alt="logo" 
                className="object-contain" 
                data-edit="logo" data-label="شعار النافبار" data-size="logo_navbar_height" data-min="24" data-max="140"
                                style={{
                  ...(editMode && !navLogoVisible ? { opacity: 0.4, pointerEvents: 'none' } : {}),
                  height: 'var(--logo-navbar-height, 360px)',
                  width: 'auto',
                  maxWidth: 360,
                  // background: theme === 'dark' && themeColors.logo_bg ? themeColors.logo_bg as string : (theme === 'dark' ? 'rgba(255, 255, 255, 0.95)' : 'transparent'),
                  //                   padding: theme === 'dark' ? `${Number(themeColors.logo_padding || 8)}px ${Number(themeColors.logo_padding || 8) + 4}px` : '0',
                  borderRadius: theme === 'dark' ? `${themeColors.logo_radius || 12}px` : '0',
                  // boxShadow: theme === 'dark' ? '0 4px 16px rgba(0, 0, 0, 0.2)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              />
            )}
                        <a href="#" className="font-black text-xl text-[var(--heading)]" style={{ letterSpacing: '-0.02em' }}
               data-edit="text" data-label="اسم العلامة في النافبار" data-text="navbar_brand" data-color="heading" data-size="fs_nav" data-min="12" data-max="40">
              {editableText.navbar_brand
                ? <RichInline html={editableText.navbar_brand} />
                : (<><span className="text-[var(--primary)]">{event?.name?.split(' ')[0] || 'S3'}</span> {event?.name?.split(' ').slice(1).join(' ') || 'Summit'}</>)}
            </a>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((l, i) => (
              l.href.startsWith('/') && l.href !== '#'
                ? <Link key={l.href} href={l.href} className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                    data-edit="text" data-label="رابط في النافبار" data-text={`nav_label_${i}`} data-color="text" data-size="fs_nav" data-min="10" data-max="28">
                    <RichInline html={editableText[`nav_label_${i}`]} fallback={l.label} />
                  </Link>
                : <a key={l.href} href={l.href} className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                    data-edit="text" data-label="رابط في النافبار" data-text={`nav_label_${i}`} data-color="text" data-size="fs_nav" data-min="10" data-max="28">
                    <RichInline html={editableText[`nav_label_${i}`]} fallback={l.label} />
                  </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {siteCfg.show_theme_toggle !== false && <ThemeToggle isDark={theme === 'dark'} onToggle={toggleTheme} size={38} />}
            <button onClick={() => openModal()} className="btn-primary text-sm py-2 px-4" data-edit="button" data-label="زر سجّل الآن (النافبار)" data-text="navbar_btn" data-color="btn_primary_color" data-bg="btn_primary_bg">
              <RichInline html={editableText.navbar_btn} fallback={'سجّل الآن'} />
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
          showThemeToggle={siteCfg.show_theme_toggle !== false}
          themeMode={theme}
          onThemeToggle={toggleTheme}
          editableText={editableText}
        />
      )}

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section
        className="hero-section relative overflow-hidden"
        data-edit="hero"
        data-label="قسم الـ Hero (الخلفية)"
        data-bg="section_hero_bg"
        data-options="transparent"
        data-pad="hero"
        style={{ background: 'var(--section-hero-bg, transparent)', paddingTop: 'var(--sec-hero-pad-top, 8rem)', paddingBottom: 'var(--sec-hero-pad-bottom, 5rem)', paddingLeft: 'var(--sec-hero-pad-left, 1.5rem)', paddingRight: 'var(--sec-hero-pad-right, 1.5rem)' }}
      >
        {/* خلفية الوسائط: صورة / فيديو / يوتيوب — يضبطها الأدمن */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {heroBgType === 'image' && heroBgImage && (
            <img src={heroBgImage} alt="" className="w-full h-full object-cover" style={{ objectPosition: heroBgPos }} />
          )}
          {heroBgType === 'video' && heroBgVideo && (
            <video src={heroBgVideo} autoPlay muted loop playsInline className="w-full h-full object-cover" style={{ objectPosition: heroBgPos }} />
          )}
          {heroBgType === 'youtube' && ytEmbedUrl(heroBgYt) && (
            <iframe
              src={ytEmbedUrl(heroBgYt)}
              title="Hero background"
              className="w-full h-full"
              style={{ pointerEvents: 'none', border: 'none', transform: 'scale(1.15)' }}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          )}
          {(heroBgType === 'image' || heroBgType === 'video' || heroBgType === 'youtube') && (
            <div className="absolute inset-0" style={{ background: heroOverlay }} />
          )}
          {/* توهج أساسي */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-20 blur-3xl"
               style={{ background: `radial-gradient(circle, ${primaryColor}, transparent)` }} />
        </div>

        <div
          className="max-w-4xl mx-auto relative"
          style={{
            textAlign: heroAlign as any,
            display: 'flex', flexDirection: 'column',
            justifyContent: heroFlexJustify, alignItems: heroFlexAlign,
            minHeight: '52vh',
          }}
        >
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full text-sm font-semibold"
               style={{ background: 'rgba(108,99,255,0.15)', border: `1px solid ${primaryColor}40`, color: primaryColor, fontSize: 'var(--fs-small, 13px)' }}
               data-edit="text" data-label="شريط الموقع والتاريخ" data-text="hero_badge" data-color="primary" data-size="fs_small" data-min="10" data-max="24">
            <RichInline html={editableText.hero_badge} fallback={`${location} · ${ed.month} ${ed.year}`} />
          </div>

          {heroImgShow && heroImgSrc && heroImgPos === 'below_badge' && (
            <img src={heroImgSrc} alt="hero visual"
              style={{ width: heroImgW, height: heroImgH || 'auto', borderRadius: heroImgR, marginTop: heroImgMt, marginBottom: heroImgMb, maxWidth: '100%', objectFit: 'contain', alignSelf: 'center' }} />
          )}

          {event?.logo && (
            <div className="mb-6 flex justify-center">
              <img src={event.logo} alt="شعار الحدث"
                data-edit="logo" data-label="شعار الـ Hero" data-size="logo_hero_height" data-min="40" data-max="300"
                style={{ maxHeight: `var(--logo-hero-height, 100px)`, height: 'auto', maxWidth: '90%', objectFit: 'contain' }} />
            </div>
          )}

          {heroImgShow && heroImgSrc && heroImgPos === 'above_title' && (
            <img src={heroImgSrc} alt="hero visual"
              style={{ width: heroImgW, height: heroImgH || 'auto', borderRadius: heroImgR, marginTop: heroImgMt, marginBottom: heroImgMb, maxWidth: '100%', objectFit: 'contain', alignSelf: 'center' }} />
          )}

          {heroAbbrType === 'image' && heroAbbrImg ? (
            <div className="hero-title-area" style={{ marginTop: heroAbbrMt, marginBottom: heroAbbrMb, display: 'flex', justifyContent: 'inherit', width: '100%' }}>
              <img src={heroAbbrImg} alt="S3"
                data-edit="text" data-label="صورة الاختصار (S3)" data-text="hero_abbr"
                style={{ width: heroAbbrW, height: heroAbbrH || 'auto', borderRadius: heroAbbrR, objectFit: 'contain', maxWidth: '100%' }} />
            </div>
          ) : (
            <h1 className="hero-title font-black mb-4" style={{ letterSpacing: '-0.03em', color: 'var(--heading)', fontSize: 'var(--fs-hero, 72px)', lineHeight: 1.1 }}
                data-edit="text" data-label="الاختصار الكبير (S3)" data-text="hero_abbr" data-color="primary" data-size="fs_hero" data-min="24" data-max="140">
              <span className="text-[var(--primary)]"><RichInline html={editableText.hero_abbr} fallback={siteCfg.hero_abbr} /></span>
            </h1>
          )}
          {heroNameType === 'image' && heroNameImg ? (
            <div className="hero-name-img" style={{ marginTop: heroNameMt, marginBottom: heroNameMb, display: 'flex', justifyContent: 'center', width: '100%' }}>
              <img src={heroNameImg} alt={eventName}
                data-edit="text" data-label="اسم الحدث" data-text="event_name"
                style={{ width: heroNameW, height: heroNameH || 'auto', borderRadius: heroNameR, objectFit: 'contain', maxWidth: '100%' }} />
            </div>
          ) : (
            <h2 className="hero-subtitle font-bold mb-2" style={{ color: 'var(--heading)', fontSize: 'var(--fs-hero-sub, 30px)' }}
                data-edit="text" data-label="اسم الحدث" data-text="event_name" data-color="heading" data-size="fs_hero_sub" data-min="14" data-max="60">
              <RichInline html={editableText.event_name} fallback={eventName} />
            </h2>
          )}
          <p className="text-lg text-[var(--text-muted)] mb-2" style={{ fontSize: 'var(--fs-body, 16px)' }}
             data-edit="text" data-label="الشعار النصي" data-text="event_tagline" data-color="text" data-size="fs_body" data-min="10" data-max="30">
            <RichInline html={editableText.event_tagline} fallback={eventTagline} />
          </p>
          <p className="text-[var(--text-muted)] max-w-xl mx-auto mb-8" style={{ fontSize: 'var(--fs-body, 16px)' }}
             data-edit="text" data-label="وصف الحدث" data-text="description" data-color="text" data-size="fs_body" data-min="10" data-max="30">
            <RichInline html={editableText.description} fallback={description} />
          </p>

          {/* Date display */}
          <div className="flex items-center justify-center gap-4 mb-8"
            data-edit="text" data-label="تواريخ الحدث (اللون والحجم)" data-color="heading" data-size="fs_body" data-min="10" data-max="60">
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
            <button onClick={() => openModal('startup')} className="btn-primary"
              data-edit="button" data-label="زر التسجيل الرئيسي" data-text="hero_btn_primary" data-color="btn_primary_color" data-bg="btn_primary_bg" data-size="fs_body" data-min="10" data-max="30">
              <RichInline html={editableText.hero_btn_primary} fallback={siteCfg.hero_btn_primary} />
            </button>
            {siteCfg.hero_btn_secondary && (
              <button onClick={() => openModal('general')} className="btn-outline"
                data-edit="button" data-label="زر الحضور العام" data-text="hero_btn_secondary" data-color="btn_outline_color" data-size="fs_body" data-min="10" data-max="30">
                <RichInline html={editableText.hero_btn_secondary} fallback={siteCfg.hero_btn_secondary} />
              </button>
            )}
          </div>

          {heroImgShow && heroImgSrc && heroImgPos === 'after_buttons' && (
            <img src={heroImgSrc} alt="hero visual"
              style={{ width: heroImgW, height: heroImgH || 'auto', borderRadius: heroImgR, marginTop: heroImgMt, marginBottom: heroImgMb, maxWidth: '100%', objectFit: 'contain', alignSelf: 'center' }} />
          )}
        </div>
      </section>

      {/* ── Intro Video ───────────────────────────────────────────────────────── */}
      {event?.show_intro_video && event?.intro_video_url && (
        <section className="intro-video-section" data-edit="section-bg" data-label="قسم الفيديو التعريفي" data-bg="section_video_bg" data-options="transparent" data-pad="video" style={{ background: 'var(--section-video-bg, rgba(108,99,255,0.04))', paddingTop: 'var(--sec-video-pad-top, 4rem)', paddingBottom: 'var(--sec-video-pad-bottom, 4rem)', paddingLeft: 'var(--sec-video-pad-left, 1.5rem)', paddingRight: 'var(--sec-video-pad-right, 1.5rem)' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="section-badge" data-edit="text" data-label="شارة قسم الفيديو" data-text="video_badge" data-color="primary" data-size="fs_small" data-min="10" data-max="24">
                <RichInline html={editableText.video_badge} fallback={'مقدمة بالفيديو'} />
              </div>
              <h2 className="section-title" data-edit="text" data-label="عنوان قسم الفيديو" data-text="video_title" data-color="heading" data-size="fs_section" data-min="14" data-max="60">
                <RichInline html={editableText.video_title} fallback={'تعرف على الحدث'} />
              </h2>
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
      <section className="stats-section" data-edit="section-bg" data-label="خلفية قسم الإحصائيات" data-bg="section_stats_bg" data-options="transparent" data-pad="stats" style={{ paddingTop: 'var(--sec-stats-pad-top, 4rem)', paddingBottom: 'var(--sec-stats-pad-bottom, 4rem)', paddingLeft: 'var(--sec-stats-pad-left, 1.5rem)', paddingRight: 'var(--sec-stats-pad-right, 1.5rem)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="card grid grid-cols-2 md:grid-cols-4 gap-8 py-8"
            data-edit="card" data-label="أرقام قسم الإحصائيات (الخلفية ولون/حجم النصوص)"
            data-bg="bg_card" data-bgmodeaware="1"
            data-colors="heading:لون الأرقام,text:لون التسميات" data-sizes="fs_card_title:حجم الأرقام:16:80,fs_body:حجم التسميات:10:30">
            {(siteCfg.stats || []).map((s, i) => (
              <StatCounter key={s.label} value={s.fallback} label={String(editableText[`stat_${i}_label`] || s.label)} labelKey={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── About ─────────────────────────────────────────────────────────────── */}
      <section id="about" data-pad="about" data-edit="section-bg" data-label="خلفية قسم عن الفعالية" data-bg="section_about_bg" data-options="transparent" style={{ paddingTop: 'var(--sec-about-pad-top, 5rem)', paddingBottom: 'var(--sec-about-pad-bottom, 5rem)', paddingLeft: 'var(--sec-about-pad-left, 1.5rem)', paddingRight: 'var(--sec-about-pad-right, 1.5rem)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="section-badge" data-edit="text" data-label="شارة قسم عن الفعالية" data-text="about_badge" data-color="primary" data-size="fs_small" data-min="10" data-max="24">
              <RichInline html={editableText.about_badge} fallback={siteCfg.about_badge} />
            </div>
            <h2 className="section-title" style={{ fontSize: 'var(--fs-section, 32px)' }}
                data-edit="text" data-label="عنوان قسم عن الفعالية" data-text="about_title" data-color="heading" data-size="fs_section" data-min="14" data-max="60">
              <RichInline html={editableText.about_title} fallback={siteCfg.about_title} />
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(siteCfg.about_cards || []).map(({ emoji, icon, title, desc }, i) => (
              <div key={title} className="card hover:border-[var(--primary)] transition-all group"
                data-edit="card" data-label={`بطاقة: ${title} (لون/حجم النصوص وخلفية البطاقة)`}
                data-bg="bg_card" data-bgmodeaware="1"
                data-colors="heading:لون العنوان,text:لون الوصف" data-sizes="fs_card_title:حجم العنوان:12:40,fs_body:حجم الوصف:10:30">
                <div className="mb-4" style={{ color: 'var(--primary)' }}><AboutIcon name={icon} emoji={emoji} size={40} /></div>
                <h3 className="text-lg font-bold mb-2 group-hover:text-[var(--primary)] transition-colors text-white" style={{ fontSize: 'var(--fs-card-title, 17px)' }}>
                  <RichInline html={editableText[`about_card_${i}_title`]} fallback={title} />
                </h3>
                <p className="text-[var(--text-muted)] text-sm leading-relaxed" data-edit="text" data-label={`وصف: ${title}`} data-text={`about_card_${i}_desc`} data-color="text" data-size="fs_body" data-min="10" data-max="30">
                  <RichInline html={editableText[`about_card_${i}_desc`]} fallback={desc} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Agenda ────────────────────────────────────────────────────────────── */}
      {agenda.length > 0 && (
      <section id="agenda" data-pad="agenda" data-edit="section-bg" data-label="خلفية قسم البرنامج" data-bg="section_agenda_bg" data-options="transparent" style={{ background: 'var(--section-agenda-bg, rgba(108,99,255,0.03))', paddingTop: 'var(--sec-agenda-pad-top, 5rem)', paddingBottom: 'var(--sec-agenda-pad-bottom, 5rem)', paddingLeft: 'var(--sec-agenda-pad-left, 1.5rem)', paddingRight: 'var(--sec-agenda-pad-right, 1.5rem)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="section-badge" data-edit="text" data-label="شارة قسم البرنامج" data-text="agenda_badge" data-color="primary" data-size="fs_small" data-min="10" data-max="24">
              <RichInline html={editableText.agenda_badge} fallback={'البرنامج'} />
            </div>
            <h2 className="section-title" style={{ fontSize: 'var(--fs-section, 32px)' }}
                data-edit="text" data-label="عنوان قسم البرنامج" data-text="agenda_title" data-color="heading" data-size="fs_section" data-min="14" data-max="60">
              <RichInline html={editableText.agenda_title} fallback={'أيام مكثّفة'} />
            </h2>
          </div>

          {/* Day tabs */}
          {agenda.length > 0 && (
            <>
              <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                {agenda.map((day, i) => (
                  <button key={day.id} onClick={() => setActiveDay(i)}
                    className={`flex-shrink-0 px-6 py-3 rounded-lg text-sm font-semibold transition-all ${activeDay === i ? '' : ''}`}
                    style={{ color: activeDay === i ? 'white' : 'var(--text-muted)', background: activeDay === i ? primaryColor : 'rgba(255,255,255,0.05)', border: activeDay === i ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>
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
                    <div key={session.id} className="card flex gap-4 items-start hover:border-opacity-60 transition-all" style={{ borderColor: style.bg + '40' }}
                      data-edit="card" data-label="بطاقة جلسة (لون/حجم النصوص وخلفية البطاقة)"
                      data-bg="bg_card" data-bgmodeaware="1"
                      data-colors="heading:لون العنوان,text:لون الوصف,primary:لون اسم المتحدث" data-sizes="fs_card_title:حجم العنوان:12:40,fs_body:حجم الوصف:10:30">
                      <div className="text-[var(--text-muted)] text-sm font-mono w-12 flex-shrink-0 pt-0.5">{session.time_start}</div>
                      <div className="flex-1 min-w-0">
                         <h4 className="font-semibold text-white" data-edit="text" data-label="عنوان الجلسة" data-text={`session_${session.id}_title`} data-color="heading" data-size="fs_card_title" data-min="12" data-max="40">
                           <RichInline html={editableText[`session_${session.id}_title`]} fallback={session.title_ar} />
                         </h4>
                         {session.description_ar && <p className="text-[var(--text-muted)] text-sm mt-1" data-edit="text" data-label="وصف الجلسة" data-text={`session_${session.id}_desc`} data-color="text" data-size="fs_body" data-min="10" data-max="30">
                           <RichInline html={editableText[`session_${session.id}_desc`]} fallback={session.description_ar} />
                         </p>}
                        {session.speaker_name && (
                          <div className="flex items-center gap-2 mt-2">
                            {session.speaker_photo ? (
                              <img src={session.speaker_photo} alt="" className="w-6 h-6 rounded-full" />
                            ) : (
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white font-bold"
                                   style={{ background: primaryColor }}>{session.speaker_name[0]}</div>
                            )}
                            <span className="text-xs text-[var(--text-muted)]" data-edit="text" data-label="اسم المتحدث في الجلسة" data-text={`session_${session.id}_speaker`} data-color="text" data-size="fs_small" data-min="8" data-max="20">
                              <RichInline html={editableText[`session_${session.id}_speaker`]} fallback={session.speaker_name} />
                            </span>
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
      <section id="speakers" data-pad="speakers" data-edit="section-bg" data-label="خلفية قسم المتحدثين" data-bg="section_speakers_bg" data-options="transparent" style={{ paddingTop: 'var(--sec-speakers-pad-top, 5rem)', paddingBottom: 'var(--sec-speakers-pad-bottom, 5rem)', paddingLeft: 'var(--sec-speakers-pad-left, 1.5rem)', paddingRight: 'var(--sec-speakers-pad-right, 1.5rem)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="section-badge" data-edit="text" data-label="شارة قسم المتحدثين" data-text="speakers_badge" data-color="primary" data-size="fs_small" data-min="10" data-max="24">
              <RichInline html={editableText.speakers_badge} fallback={'المتحدثون'} />
            </div>
            <h2 className="section-title" style={{ fontSize: 'var(--fs-section, 32px)' }}
                data-edit="text" data-label="عنوان قسم المتحدثين" data-text="speakers_title" data-color="heading" data-size="fs_section" data-min="14" data-max="60">
              <RichInline html={editableText.speakers_title} fallback={'قيادات ملهمة'} />
            </h2>
            <p className="text-[var(--text-muted)] mt-2" data-edit="text" data-label="وصف قسم المتحدثين" data-text="speakers_sub" data-color="text" data-size="fs_body" data-min="10" data-max="30">
              <RichInline html={editableText.speakers_sub} fallback={'نخبة من رواد الأعمال والمستثمرين والخبراء · اضغط لقراءة السيرة الذاتية'} />
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 spk-grid gap-6">
            <style>{`
              .spk-grid{ gap: ${spkGap}px; }
              @media (min-width:1024px){ .spk-grid{ grid-template-columns: repeat(${spkCols}, minmax(0,1fr)) !important; } }
            `}</style>
            {speakers.map(speaker => (
              <div key={speaker.id}
                className={`card hover:border-[var(--primary)] transition-all group cursor-pointer flex flex-col ${spkEqual ? 'h-full' : ''}`}
                style={{ textAlign: spkAlignText, alignItems: spkAlignText === 'center' ? 'center' : spkAlignText === 'left' ? 'flex-start' : 'flex-end' }}
                onClick={() => !speaker.is_surprise && setSelectedSpeaker(speaker)}
                data-edit="card" data-label={`بطاقة متحدث: ${speaker.name_ar || speaker.name} (خلفية + لون/حجم النصوص)`}
                data-bg="bg_card" data-bgmodeaware="1"
                data-colors="heading:لون الاسم,text:لون المنصب,primary:لون الشركة" data-sizes="fs_card_title:حجم الاسم:12:40,fs_body:حجم النص:10:30">
                {speaker.photo_url ? (
                  <img src={speaker.photo_url} alt={speaker.name_ar}
                    className="object-cover border-2 group-hover:border-[var(--primary)] transition-all"
                    style={{ width: spkPhotoW, height: spkPhotoH, borderRadius: spkRadius, marginBottom: spkPhotoMb, borderColor: 'rgba(108,99,255,0.3)', display: 'block' }} />
                ) : (
                  <div className="flex items-center justify-center text-xl font-black text-white"
                       style={{ width: spkPhotoW, height: spkPhotoH, borderRadius: spkRadius, marginBottom: spkPhotoMb, background: speaker.is_surprise ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${primaryColor}, #4f46e5)` }}>
                    {speaker.is_surprise ? '?' : (speaker.name_ar?.split(' ').map((w: string) => w[0]).slice(0,2).join('') || speaker.name[0])}
                  </div>
                )}
                <h3 className="font-bold" style={{ marginTop: spkNameMt, fontSize: 'var(--fs-card-title, 1rem)', color: 'var(--heading)', lineHeight: 1.4 }}
                    data-edit="text" data-label="اسم المتحدث" data-text={`speaker_${speaker.id}_name`} data-color="heading" data-size="fs_card_title" data-min="12" data-max="40">
                  <RichInline html={editableText[`speaker_${speaker.id}_name`]} fallback={speaker.name_ar || speaker.name} />
                </h3>
                {(() => {
                  const role = String(speaker.title_ar || '').trim();
                  if (spkRoleMode === 'hide') return null;
                  if (spkRoleMode !== 'force' && !role) return null;
                  return (
                    <p className="text-xs" style={{ marginTop: spkRoleMt, color: 'var(--text-muted)' }}
                       data-edit="text" data-label="منصب المتحدث" data-text={`speaker_${speaker.id}_title`} data-color="text" data-size="fs_body" data-min="8" data-max="22">
                      <RichInline html={editableText[`speaker_${speaker.id}_title`]} fallback={role || '— بدون منصب —'} />
                    </p>
                  );
                })()}
                {speaker.company ? (
                  <p className="text-xs font-semibold" style={{ marginTop: spkCompMt, color: 'var(--primary)' }}
                     data-edit="text" data-label="شركة المتحدث" data-text={`speaker_${speaker.id}_company`} data-color="primary" data-size="fs_body" data-min="8" data-max="22">
                    <RichInline html={editableText[`speaker_${speaker.id}_company`]} fallback={speaker.company} />
                  </p>
                ) : null}
                {speaker.is_featured === 1 && (
                  <span className="tag text-xs" style={{ background: '#f59e0b20', color: '#f59e0b', marginTop: 8 }}>✦ مميز</span>
                )}
                {!speaker.is_surprise && (
                  <p className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ marginTop: 'auto', paddingTop: 10, color: 'var(--text-muted)' }}>اضغط للمزيد ←</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      )}
      {venueGallery.length > 0 && (
        <section id="venue" data-pad="venue" style={{ background: 'var(--section-venue-bg, var(--band))', paddingTop: 'var(--sec-venue-pad-top, 5rem)', paddingBottom: 'var(--sec-venue-pad-bottom, 5rem)', paddingLeft: 'var(--sec-venue-pad-left, 1.5rem)', paddingRight: 'var(--sec-venue-pad-right, 1.5rem)' }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="section-badge" data-edit="text" data-label="شارة قسم المكان" data-text="venue_badge" data-color="primary" data-size="fs_small" data-min="10" data-max="24">
                <RichInline html={editableText.venue_badge} fallback={'مكان الحدث'} />
              </div>
              <h2 className="section-title" data-edit="text" data-label="عنوان قسم المكان" data-text="venue_title" data-color="heading" data-size="fs_section" data-min="14" data-max="60">
                <RichInline html={editableText.venue_title} fallback={'قاعة المؤتمر'} />
              </h2>
              <p className="text-[var(--text-muted)] mt-2" data-edit="text" data-label="وصف قسم المكان" data-text="venue_sub" data-color="text" data-size="fs_body" data-min="10" data-max="30">
                <RichInline html={editableText.venue_sub} fallback={'استعرض مكان انعقاد القمة'} />
              </p>
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
      {event && <TicketsSection key={`tickets-${event.id}`} eventId={event.id} editableText={editableText} />}

      {/* ── Sponsors ──────────────────────────────────────────────────────────── */}
      {sponsors.length > 0 && (
        <section id="sponsors" data-pad="sponsors" data-edit="section-bg" data-label="خلفية قسم الشركاء" data-bg="section_sponsors_bg" data-options="transparent" style={{ background: 'var(--section-sponsors-bg, rgba(108,99,255,0.03))', paddingTop: 'var(--sec-sponsors-pad-top, 4rem)', paddingBottom: 'var(--sec-sponsors-pad-bottom, 4rem)', paddingLeft: 'var(--sec-sponsors-pad-left, 1.5rem)', paddingRight: 'var(--sec-sponsors-pad-right, 1.5rem)' }}>
          <div className="max-w-5xl mx-auto text-center">
            <div className="section-badge" data-edit="text" data-label="شارة قسم الشركاء" data-text="sponsors_badge" data-color="primary" data-size="fs_small" data-min="10" data-max="24">
              <RichInline html={editableText.sponsors_badge} fallback={'الشركاء والرعاة'} />
            </div>
            <h2 className="section-title mb-10" style={{ fontSize: 'var(--fs-section, 32px)' }}
                data-edit="text" data-label="عنوان قسم الشركاء" data-text="sponsors_title" data-color="heading" data-size="fs_section" data-min="14" data-max="60">
              <RichInline html={editableText.sponsors_title} fallback={'شركاء القمة'} />
            </h2>
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
                    <span className="font-bold text-sm text-center text-white" data-edit="text" data-label="اسم الشريك" data-text={`sponsor_${sp.id}_name`} data-color="heading" data-size="fs_card_title" data-min="10" data-max="30">
                      <RichInline html={editableText[`sponsor_${sp.id}_name`]} fallback={sp.name} />
                    </span>
                    {/* Tier badge */}
                    {sp.tier && (
                      <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.6rem', borderRadius: 20, background: `${tierColor}18`, color: tierColor, border: `1px solid ${tierColor}35`, fontWeight: 700 }}
                        data-edit="text" data-label="رتبة الشريك" data-text={`sponsor_${sp.id}_tier`} data-color="primary" data-size="fs_small" data-min="8" data-max="18">
                        <RichInline html={editableText[`sponsor_${sp.id}_tier`]} fallback={tierAr[sp.tier] || sp.tier} />
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
      <section id="register" data-pad="register" data-edit="section-bg" data-label="خلفية قسم التسجيل" data-bg="section_register_bg" data-options="transparent" style={{ paddingTop: 'var(--sec-register-pad-top, 5rem)', paddingBottom: 'var(--sec-register-pad-bottom, 5rem)', paddingLeft: 'var(--sec-register-pad-left, 1.5rem)', paddingRight: 'var(--sec-register-pad-right, 1.5rem)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="section-badge" data-edit="text" data-label="شارة قسم التسجيل" data-text="register_badge" data-color="primary" data-size="fs_small" data-min="10" data-max="24">
              <RichInline html={editableText.register_badge} fallback={'التسجيل'} />
            </div>
            <h2 className="section-title" style={{ fontSize: 'var(--fs-section, 32px)' }}
                data-edit="text" data-label="عنوان قسم التسجيل" data-text="register_title" data-color="heading" data-size="fs_section" data-min="14" data-max="60">
              <RichInline html={editableText.register_title} fallback={cfg.form_title || 'انضم إلى القمة'} />
            </h2>
            <p className="text-[var(--text-muted)] mt-2" data-edit="text" data-label="وصف قسم التسجيل" data-text="register_subtitle" data-color="text" data-size="fs_body" data-min="10" data-max="30">
              <RichInline html={editableText.register_subtitle} fallback={cfg.form_subtitle || 'سجّل الآن وكن جزءاً من أكبر تجمع لريادة الأعمال'} />
            </p>
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
        <section id="faq" data-pad="faq" data-edit="section-bg" data-label="خلفية قسم الأسئلة" data-bg="section_faq_bg" data-options="transparent" style={{ background: 'var(--section-faq-bg, rgba(108,99,255,0.03))', paddingTop: 'var(--sec-faq-pad-top, 5rem)', paddingBottom: 'var(--sec-faq-pad-bottom, 5rem)', paddingLeft: 'var(--sec-faq-pad-left, 1.5rem)', paddingRight: 'var(--sec-faq-pad-right, 1.5rem)' }}>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <div className="section-badge" data-edit="text" data-label="شارة قسم الأسئلة" data-text="faq_badge" data-color="primary" data-size="fs_small" data-min="10" data-max="24">
                <RichInline html={editableText.faq_badge} fallback={'الأسئلة الشائعة'} />
              </div>
              <h2 className="section-title" style={{ fontSize: 'var(--fs-section, 32px)' }}
                  data-edit="text" data-label="عنوان قسم الأسئلة" data-text="faq_title" data-color="heading" data-size="fs_section" data-min="14" data-max="60">
                <RichInline html={editableText.faq_title} fallback={'أجوبة على أسئلتك'} />
              </h2>
            </div>
            <div className="space-y-3">
              {faqs.map(faq => (
                <div key={faq.id} className="card cursor-pointer" onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white" data-edit="text" data-label="السؤال" data-text={`faq_${faq.id}_q`} data-color="heading" data-size="fs_card_title" data-min="12" data-max="30">
                      <RichInline html={editableText[`faq_${faq.id}_q`]} fallback={faq.question_ar} />
                    </span>
                    <span className="text-[var(--primary)] text-xl transition-transform" style={{ transform: openFaq === faq.id ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
                  </div>
                  {openFaq === faq.id && (
                    <p className="text-[var(--text-muted)] text-sm mt-3 leading-relaxed" data-edit="text" data-label="الإجابة" data-text={`faq_${faq.id}_a`} data-color="text" data-size="fs_body" data-min="10" data-max="26">
                      <RichInline html={editableText[`faq_${faq.id}_a`]} fallback={faq.answer_ar} />
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="py-12 px-6 border-t">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
          <div className="font-black text-xl mb-2 text-white"><span className="text-[var(--primary)]">S3</span> Summit</div>
          {heroNameType === 'image' && heroNameImg ? (
            <div className="flex justify-center w-full" style={{ marginTop: heroNameMt, marginBottom: heroNameMb }}>
              <img src={heroNameImg} alt={eventName}
                data-edit="text" data-label="اسم الحدث في الفوتر" data-text="event_name"
                style={{ width: heroNameW, height: heroNameH || 'auto', borderRadius: heroNameR, objectFit: 'contain', maxWidth: '100%' }} />
            </div>
          ) : (
            <p className="text-[var(--text-muted)] text-sm" data-edit="text" data-label="اسم الحدث في الفوتر" data-text="event_name" data-color="text" data-size="fs_body" data-min="10" data-max="26">
              <RichInline html={editableText.event_name} fallback={eventName} />
            </p>
          )}
          <p className="text-[var(--text-muted)] text-sm">{sd.day}–{ed.day} {ed.month} {ed.year}</p>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-white" data-edit="text" data-label="عنوان روابط سريعة" data-text="footer_links_title" data-color="heading" data-size="fs_card_title" data-min="12" data-max="30">
            <RichInline html={editableText.footer_links_title} fallback={'روابط سريعة'} />
          </h4>
          <div className="flex flex-col gap-2">
            {navLinks.filter(l => !l.href.startsWith('/')).map(l => {
              const navIdx = navLinks.findIndex(nl => nl.href === l.href);
              return <a key={l.href} href={l.href} className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                data-edit="text" data-label="رابط سريع" data-text={`nav_label_${navIdx}`} data-color="text" data-size="fs_nav" data-min="10" data-max="24">
                <RichInline html={editableText[`nav_label_${navIdx}`]} fallback={l.label} />
              </a>;
            })}
            {/* رابط الأرشيف — حسب إعدادات الأدمن */}
            {siteCfg.archive_link_enabled !== false && (siteCfg.archive_link_position === 'footer' || siteCfg.archive_link_position === 'both' || siteCfg.archive_link_position === undefined) && (
              <Link href="/archive" className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                data-edit="text" data-label="رابط الأرشيف في الفوتر" data-text="archive_label" data-color="text" data-size="fs_nav" data-min="10" data-max="24">
                <RichInline html={editableText.archive_label} fallback={siteCfg.archive_link_label || '🗂 أرشيف الأحداث'} />
              </Link>
            )}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-white" data-edit="text" data-label="عنوان تواصل معنا" data-text="footer_contact_title" data-color="heading" data-size="fs_card_title" data-min="12" data-max="30">
            <RichInline html={editableText.footer_contact_title} fallback={'تواصل معنا'} />
          </h4>
          {event?.email && <a href={`mailto:${event.email}`} className="block text-sm text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors mb-1">{event.email}</a>}
          <div className="flex gap-3 mt-3 flex-wrap" style={{ alignItems: 'center' }}>
            {event?.twitter && <a href={event.twitter.startsWith('http') ? event.twitter : `https://twitter.com/${event.twitter}`} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors" title="X (Twitter)"><IconX size={18} /></a>}
            {event?.instagram && <a href={event.instagram.startsWith('http') ? event.instagram : `https://instagram.com/${event.instagram}`} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors" title="Instagram"><IconInstagram size={18} /></a>}
            {event?.linkedin && <a href={event.linkedin.startsWith('http') ? event.linkedin : `https://linkedin.com/company/${event.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors" title="LinkedIn"><IconLinkedIn size={18} /></a>}
            {(event as any)?.tiktok && <a href={(event as any).tiktok.startsWith('http') ? (event as any).tiktok : `https://tiktok.com/@${(event as any).tiktok}`} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors" title="TikTok"><IconTikTok size={18} /></a>}
            {(event as any)?.youtube && <a href={(event as any).youtube.startsWith('http') ? (event as any).youtube : `https://youtube.com/@${(event as any).youtube}`} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors" title="YouTube"><IconYouTube size={18} /></a>}
            {(event as any)?.facebook && <a href={(event as any).facebook.startsWith('http') ? (event as any).facebook : `https://facebook.com/${(event as any).facebook}`} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors" title="Facebook"><IconFacebook size={18} /></a>}
            {(event as any)?.whatsapp_link && <a href={(event as any).whatsapp_link} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors" title="WhatsApp"><IconWhatsApp size={18} /></a>}
            {(event as any)?.telegram && <a href={(event as any).telegram.startsWith('http') ? (event as any).telegram : `https://t.me/${(event as any).telegram}`} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors" title="Telegram"><IconTelegram size={18} /></a>}
          </div>
        </div>
        </div>
        {/* {(siteCfg.logo_position === 'footer' || siteCfg.logo_position === 'both') && siteCfg.logo_url && (
          <div className="max-w-6xl mx-auto mt-8 pt-6 pb-6 text-center border-t" style={{ borderColor: 'rgba(108,99,255,0.12)' }}>
            <img 
              src={siteCfg.logo_url} 
              alt="logo" 
              className="h-16 object-contain mx-auto mb-4" 
              style={{
                background: theme === 'dark' ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
                padding: theme === 'dark' ? '12px 16px' : '0',
                borderRadius: theme === 'dark' ? '14px' : '0',
                boxShadow: theme === 'dark' ? '0 6px 20px rgba(108, 99, 255, 0.3)' : 'none',
                transition: 'all 0.3s ease'
              }}
            />
          </div>
        )} */}
        {/* <div className="max-w-6xl mx-auto pt-6 text-center text-sm text-[var(--text-muted)]" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          © {ed.year} {event?.name_ar || event?.name || 'S³ Summit'} · جميع الحقوق محفوظة
        </div> */}
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
                <p className="text-sm font-semibold text-[var(--primary)]">{selectedSpeaker.title_ar}</p>
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
              <div className="mb-4 p-4 rounded-lg" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(108,99,255,0.2)' }}>
                <h4 className="text-white font-semibold mb-3 text-sm">🏆 الإنجازات</h4>
                <ul className="space-y-2">
                  {selectedSpeaker.achievements.split('\n').filter(Boolean).map((a: string, i: number) => (
                    <li key={i} className="text-[var(--text-muted)] text-sm flex items-start gap-2">
                      <span className="text-[var(--primary)]">◆</span>
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
               <h3 className="text-xl font-bold text-white">التسجيل في القمة</h3>
               <button onClick={() => setShowRegModal(false)} className="text-[var(--text-muted)] hover:text-[var(--primary)] text-2xl leading-none">×</button>
             </div>
            {event && <RegistrationForm event={event} onClose={() => setShowRegModal(false)} cfg={cfg} initialTab={regInitialTab} ticketInstructions={(siteCfg as any)?.ticket_instructions} />}
          </div>
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      {(footerPages.length > 0 || (termsData?.show_in_footer && (termsData?.terms_content || termsData?.privacy_content))) && (
        <footer style={{ background: 'var(--footer-bg)', borderTop: '1px solid rgba(108,99,255,0.15)', padding: `${ftrPadT}px ${ftrPadR}px ${ftrPadB}px ${ftrPadL}px`, textAlign: ftrAlign as any }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: `0.5rem ${ftrGap}px` }}>
            {ftrShowImg && ftrImg && (
              <div style={{ width: '100%', display: 'flex', justifyContent: ftrAlign === 'center' ? 'center' : ftrAlign === 'left' ? 'flex-start' : 'flex-end', marginBottom: ftrImgMb }}>
                <img src={ftrImg} alt="footer logo" style={{ width: ftrImgW, height: ftrImgH || 'auto', borderRadius: ftrImgR, objectFit: 'contain', maxWidth: '100%' }} />
              </div>
            )}
            {footerPages.map(page => (
              <a key={page.id} href={`/terms?page=${page.slug}`}
                className="text-[var(--text-muted)]" style={{ textDecoration: 'none', fontSize: `${ftrTextSize}px`, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#6C63FF')}
                onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
                {page.title_ar || page.title}
              </a>
            ))}
            {termsData?.show_in_footer && termsData?.terms_content && (
              <a href={`/terms?tab=terms`}
                className="text-[var(--text-muted)]" style={{ textDecoration: 'none', fontSize: `${ftrTextSize}px`, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#6C63FF')}
                onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
                الشروط والأحكام
              </a>
            )}
            {termsData?.show_in_footer && termsData?.privacy_content && (
              <a href={`/terms?tab=privacy`}
                className="text-[var(--text-muted)]" style={{ textDecoration: 'none', fontSize: `${ftrTextSize}px`, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#6C63FF')}
                onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
                سياسة الخصوصية
              </a>
            )}
          </div>
          <p className="text-[var(--text-muted)]" style={{ fontSize: '0.75rem', margin: '0.75rem 0 0' }}>© {new Date().getFullYear()} {event?.name_ar || 'S3 Summit'}. جميع الحقوق محفوظة.</p>
        </footer>
      )}

      {/* ── شريط وضع التعديل المباشر ── */}
      {editMode && (
        <div className="theme-edit-banner">
                    <span>✏️ وضع التعديل المباشر — اضغط على أي عنصر (نص / زر / شعار / خلفية) لتغييره</span>
          <button
            onClick={saveDirectEdits}
            style={{ background: 'rgba(234,178,48,0.9)', color: '#111', border: '1px solid rgba(234,178,48,0.6)', borderRadius: '999px', padding: '0.25rem 0.8rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem', marginRight: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.35)' }}
          >💾 حفظ التعديلات</button>
          <button
            onClick={() => { setEditMode(false); setEditTarget(null); }}
            style={{ background: 'rgba(108,99,255,0.35)', color: 'white', border: 'none', borderRadius: '999px', padding: '0.25rem 0.7rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem' }}
          >✕ إيقاف</button>
          {saveToast && (
            <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(108,99,255,0.4)', color: '#fcd34d', borderRadius: '0.6rem', padding: '0.5rem 1rem', fontSize: '0.8rem', zIndex: 10000, backdropFilter: 'blur(8px)' }}>
              {saveToast}
            </div>
          )}
        </div>
      )}

      {/* ── لوحة التعديل المباشر للعنصر المحدد ── */}
      {editMode && editTarget && (
        <div
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
            background: 'rgba(19,16,42,0.97)', borderTop: '1.5px solid rgba(108,99,255,0.55)',
            padding: '0.7rem 1rem', boxShadow: '0 -10px 40px rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ color: '#a5b4fc', fontWeight: 800, fontSize: '0.82rem', minWidth: 150, whiteSpace: 'nowrap' }}>
              ✏️ {editTarget.label}
            </span>

                        {/* النص (محرر غني — تلوين كل كلمة على حدة) */}
            {editTarget.textKey && (
              <InlineRichText
                value={editText[editTarget.textKey] ?? ''}
                onChange={v => setEditText(prev => ({ ...prev, [editTarget.textKey!]: v }))}
                placeholder={editTextPlaceholder(editTarget.textKey, siteCfg, eventName, eventTagline, description, location, ed, cfg)}
              />
            )}

            {/* لون النص/الزر الرئيسي (يُطبّق على كلا الوضعين الليلي والنهاري) */}
            {editTarget.colorKey && (
              <ColorField
                label={editTarget.kind === 'button' ? 'لون الزر' : 'لون النص'}
                value={String(editColors[editTarget.colorKey] ?? themeColors[editTarget.colorKey] ?? '')}
                onChange={v => applyColorAllModes(editTarget.colorKey!, v)}
              />
            )}

            {/* حقول ألوان إضافية (تستخدمها البطاقات/السكاشن لتلوين كل نوع نص بشكل منفصل) */}
            {editTarget.colorFields?.map(f => (
              <ColorField
                key={f.key}
                label={f.label}
                value={String(editColors[f.key] ?? themeColors[f.key] ?? '')}
                onChange={v => applyColorAllModes(f.key, v)}
              />
            ))}

                                    {/* لون الخلفية خلف العنصر */}
            {editTarget.bgKey && (
              <ColorField
                label="لون الخلفية"
                value={String(editColors[editTarget.bgKey] ?? themeColors[editTarget.bgKey] ?? '')}
                onChange={v => setEditColors(prev => ({ ...prev, [editTarget.bgKey!]: v }))}
              />
            )}
            {editTarget.bgKey && editTarget.options?.includes('transparent') && (
              <button onClick={() => setEditColors(prev => ({ ...prev, [editTarget.bgKey!]: 'transparent' }))}
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.2)', color: '#94a3b8', borderRadius: '0.4rem', padding: '0.35rem 0.6rem', cursor: 'pointer', fontSize: '0.72rem' }}>
                🚫 شفاف
              </button>
            )}

                        {/* الحجم الرئيسي */}
            {editTarget.sizeKey && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label style={{ color: '#94a3b8', fontSize: '0.72rem' }}>الحجم</label>
                <input
                  type="range" min={editTarget.min ?? 8} max={editTarget.max ?? 160}
                  value={Number(editColors[editTarget.sizeKey] ?? themeColors[editTarget.sizeKey] ?? 16)}
                  onChange={e => setEditColors(prev => ({ ...prev, [editTarget.sizeKey!]: Number(e.target.value) }))}
                  style={{ width: 110, accentColor: '#6C63FF' }}
                />
                <input
                  type="number" min={editTarget.min ?? 8} max={editTarget.max ?? 160}
                  value={Number(editColors[editTarget.sizeKey] ?? themeColors[editTarget.sizeKey] ?? 16)}
                  onChange={e => setEditColors(prev => ({ ...prev, [editTarget.sizeKey!]: Number(e.target.value) }))}
                  style={{ width: 58, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(108,99,255,0.35)', borderRadius: '0.4rem', padding: '0.3rem 0.4rem', color: 'white', fontSize: '0.78rem', direction: 'ltr' }}
                />
                <span style={{ color: '#64748b', fontSize: '0.7rem' }}>px</span>
              </div>
            )}

            {/* استبدال الاختصار (S3) / اسم الحدث بصورة (من وضع التعديل المباشر) */}
            {editTarget.textKey && (editTarget.textKey === 'hero_abbr' || editTarget.textKey === 'event_name') && (() => {
              const prefix = editTarget.textKey === 'hero_abbr' ? 'hero_abbr' : 'hero_name';
              const typeKey = `${prefix}_type`;
              const isImg = String(editColors[typeKey] ?? themeColors[typeKey] ?? 'text') === 'image';
              const set = (k: string, v: any) => setEditColors(p => ({ ...p, [k]: v }));
              const num = (k: string) => Number(editColors[k] ?? themeColors[k] ?? '');
              const sb = (act: boolean) => ({ padding: '0.3rem 0.7rem', borderRadius: '0.4rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.72rem', border: 'none',
                background: act ? '#6C63FF' : 'rgba(255,255,255,0.07)', color: act ? 'white' : '#94a3b8' } as React.CSSProperties);
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ color: '#a5b4fc', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>🖼️ كصورة:</span>
                  <button style={sb(!isImg)} onClick={() => set(typeKey, 'text')}>🔤 نص</button>
                  <button style={sb(isImg)} onClick={() => set(typeKey, 'image')}>🖼️ صورة</button>
                  {isImg && (
                    <>
                      <input value={String(editColors[`${prefix}_image`] ?? '')} onChange={e => set(`${prefix}_image`, e.target.value)}
                        placeholder="رابط الصورة (أو ارفعها من تبويب hero)" style={{ width: 190, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(108,99,255,0.35)', borderRadius: '0.4rem', padding: '0.3rem 0.5rem', color: 'white', fontSize: '0.78rem' }} />
                      <label style={{ color: '#64748b', fontSize: '0.7rem' }}>العرض</label>
                      <input type="number" value={num(`${prefix}_image_w`) || 220} onChange={e => set(`${prefix}_image_w`, Number(e.target.value))}
                        style={{ width: 52, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(108,99,255,0.35)', borderRadius: '0.4rem', padding: '0.3rem 0.4rem', color: 'white', fontSize: '0.78rem', direction: 'ltr' }} />
                      <label style={{ color: '#64748b', fontSize: '0.7rem' }}>الارتفاع</label>
                      <input type="number" value={num(`${prefix}_image_h`) || 0} onChange={e => set(`${prefix}_image_h`, Number(e.target.value))}
                        style={{ width: 52, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(108,99,255,0.35)', borderRadius: '0.4rem', padding: '0.3rem 0.4rem', color: 'white', fontSize: '0.78rem', direction: 'ltr' }} />
                    </>
                  )}
                </div>
              );
            })()}
            {/* حقول حجم إضافية (البطاقات/السكاشن تتيح تعديل حجم كل نوع نص بشكل منفصل) */}
            {editTarget.sizeFields?.map(f => (
              <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <label style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{f.label}</label>
                <input
                  type="range" min={f.min} max={f.max}
                  value={Number(editColors[f.key] ?? themeColors[f.key] ?? 16)}
                  onChange={e => setEditColors(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
                  style={{ width: 110, accentColor: '#6C63FF' }}
                />
                <input
                  type="number" min={f.min} max={f.max}
                  value={Number(editColors[f.key] ?? themeColors[f.key] ?? 16)}
                   onChange={e => setEditColors(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
                   style={{ width: 58, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(108,99,255,0.35)', borderRadius: '0.4rem', padding: '0.3rem 0.4rem', color: 'white', fontSize: '0.78rem', direction: 'ltr' }}
                 />
                 <span style={{ color: '#64748b', fontSize: '0.7rem' }}>px</span>
               </div>
             ))}

                        {/* ── الحشوة الدقيقة (padding) للقسم/العنصر — تحريك بأربعة اتجاهات ── */}
            {editTarget.padKey && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.25)', borderRadius: '0.5rem', padding: '0.5rem 0.7rem' }}>
                <label style={{ color: '#a5b4fc', fontSize: '0.72rem', fontWeight: 700 }}>
                  📐 الحشوة (padding) — حرّك المحتوى بالاتجاهات الأربعة
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: 6, alignItems: 'center' }}>
                  {([
                    ['top', 'أعلى'], ['right', 'يمين'], ['bottom', 'أسفل'], ['left', 'يسار'],
                  ] as const).map(([side, lbl]) => {
                    const key = `section_${editTarget.padKey}_pad_${side}`;
                    const def = side === 'top' ? (editTarget.padKey === 'hero' ? 128 : 80) : (side === 'bottom' ? 80 : 24);
                    return (
                      <div key={side} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <label style={{ color: '#94a3b8', fontSize: '0.66rem', minWidth: 26 }}>{lbl}:</label>
                        <input type="number" min={0} max={320}
                          value={Number(editColors[key as string] ?? (themeColors as any)[key] ?? def)}
                          onChange={e => setEditColors(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                          style={{ width: 56, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(108,99,255,0.35)', borderRadius: '0.4rem', padding: '0.25rem 0.3rem', color: 'white', fontSize: '0.75rem', direction: 'ltr' }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── الدخول إلى العناصر المتداخلة داخل القسم (مثل بطاقات المتحدثين) ── */}
            {editTarget.inner && editTarget.inner.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ color: '#a5b4fc', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap', paddingTop: 8 }}>
                  ➕ داخل القسم ({editTarget.inner.length}):
                </span>
                {editTarget.inner.slice(0, 12).map((c, i) => (
                  <button key={i} onClick={() => selectElement(c.el, true)}
                    title="الدخول إلى هذا العنصر وتعديل ألوانه وخطوطه ومحتواه"
                    style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', color: '#6ee7b7', borderRadius: '999px', padding: '0.2rem 0.6rem', cursor: 'pointer', fontSize: '0.7rem', whiteSpace: 'nowrap', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    ⬇ {c.label}
                  </button>
                ))}
                {editTarget.inner.length > 12 && <span style={{ color: '#64748b', fontSize: '0.68rem', paddingTop: 8, whiteSpace: 'nowrap' }}>+{editTarget.inner.length - 12} أخرى…</span>}
              </div>
            )}

            {/* الخط العام — أي خط (يطبق على كل الصفحة) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <label style={{ color: '#94a3b8', fontSize: '0.72rem' }}>الخط:</label>
              <select
                value={String(editColors.font_family as string || (themeColors as any).font_family || 'cairo')}
                onChange={e => setEditColors(prev => ({ ...prev, font_family: e.target.value }))}
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(108,99,255,0.35)', borderRadius: '0.4rem', padding: '0.3rem 0.5rem', color: 'white', fontSize: '0.78rem' }}
              >
                <option value='cairo'>Cairo (افتراضي)</option>
                <option value='tajawal'>Tajawal</option>
                <option value='inter'>Inter</option>
                <option value='amiri'>Amiri</option>
                <option value='system'>نظام</option>
                <option value='mono'>أحرف ثابتة</option>
              </select>
            </div>
            {/* محاذاة العناوين — تغيير موضع العنوان */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <label style={{ color: '#94a3b8', fontSize: '0.72rem' }}>محاذاة العناوين:</label>
              <select
                value={String(editColors.text_align as string || (themeColors as any).text_align || 'center')}
                onChange={e => setEditColors(prev => ({ ...prev, text_align: e.target.value }))}
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(108,99,255,0.35)', borderRadius: '0.4rem', padding: '0.3rem 0.5rem', color: 'white', fontSize: '0.78rem' }}
              >
                <option value='center'>وسط</option>
                <option value='right'>يمين</option>
                <option value='left'>يسار</option>
              </select>
            </div>
            {/* اتجاه الصفحة */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.06)', padding: 3, borderRadius: '0.45rem' }}>
              <button onClick={() => setEditDir('rtl')}
                style={{ padding: '0.3rem 0.7rem', borderRadius: '0.35rem', cursor: 'pointer', border: 'none', fontWeight: 700, fontSize: '0.75rem', background: editDir === 'rtl' ? '#6C63FF' : 'transparent', color: editDir === 'rtl' ? 'white' : '#94a3b8' }}>
                ⇄ RTL
              </button>
              <button onClick={() => setEditDir('ltr')}
                style={{ padding: '0.3rem 0.7rem', borderRadius: '0.35rem', cursor: 'pointer', border: 'none', fontWeight: 700, fontSize: '0.75rem', background: editDir === 'ltr' ? '#6C63FF' : 'transparent', color: editDir === 'ltr' ? 'white' : '#94a3b8' }}>
                LTR ⇄
              </button>
            </div>
            {/* محاذاة الـ Hero + التموضع العمودي */}
            {editTarget.kind === 'hero' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <label style={{ color: '#94a3b8', fontSize: '0.72rem' }}>محاذاة:</label>
                <select
                  value={String(editColors.hero_align ?? themeColors.hero_align ?? 'center')}
                  onChange={e => setEditColors(prev => ({ ...prev, hero_align: e.target.value }))}
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(108,99,255,0.35)', borderRadius: '0.4rem', padding: '0.3rem 0.5rem', color: 'white', fontSize: '0.75rem' }}
                >
                  <option value="center">وسط</option>
                  <option value="right">يمين</option>
                  <option value="left">يسار</option>
                </select>
                <label style={{ color: '#94a3b8', fontSize: '0.72rem' }}>عمودياً:</label>
                <select
                  value={String(editColors.hero_y ?? themeColors.hero_y ?? 'center')}
                  onChange={e => setEditColors(prev => ({ ...prev, hero_y: e.target.value }))}
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(108,99,255,0.35)', borderRadius: '0.4rem', padding: '0.3rem 0.5rem', color: 'white', fontSize: '0.75rem' }}
                >
                  <option value="center">وسط</option>
                  <option value="top">أعلى</option>
                  <option value="bottom">أسفل</option>
                </select>
                <span style={{ color: '#f59e0b', fontSize: '0.7rem' }}>💡 خلفية فيديو/صورة/يوتيوب من تبويب «خلفية الـ Hero»</span>
              </div>
            )}

            <button
              onClick={() => setEditTarget(null)}
              style={{ marginLeft: 'auto', background: 'rgba(239,68,68,0.25)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '0.4rem', padding: '0.35rem 0.8rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem' }}
            >✕</button>
          </div>
        </div>
      )}
    </div>
  );
}