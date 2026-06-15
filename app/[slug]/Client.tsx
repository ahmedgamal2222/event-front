'use client';
import { useState, useEffect, useRef } from 'react';
import { Event, Speaker, AgendaDay, Stats, Sponsor, Faq } from '../../lib/types';
import { fetchEvent, fetchSpeakers, fetchAgenda, fetchStats, fetchSponsors, fetchFaqs, submitRegistration } from '../../lib/api';

const API_EVENT_SLUG = process.env.NEXT_PUBLIC_EVENT_SLUG || 's3-summit-2026';

// ─── Session type colors & labels ──────────────────────────────────────────────
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

function RegistrationForm({ event, onClose }: { event: Event; onClose: () => void }) {
  const [tab, setTab] = useState<'startup' | 'general'>('startup');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', city: '',
    company_name: '', sector: '', stage: '', team_size: '', website: '', description: '',
    agreed: false,
  });

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agreed) { setError('يجب الموافقة على الشروط والأحكام'); return; }
    setLoading(true); setError('');
    try {
      await submitRegistration(event.id, {
        reg_type: tab,
        full_name: form.full_name, email: form.email, phone: form.phone, city: form.city,
        ...(tab === 'startup' ? {
          company_name: form.company_name, sector: form.sector, stage: form.stage,
          team_size: form.team_size, website: form.website, description: form.description
        } : {})
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ. يرجى المحاولة مرة أخرى.');
    }
    setLoading(false);
  };

  if (success) return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">🎉</div>
      <h3 className="text-2xl font-bold text-white mb-2">تم التسجيل بنجاح!</h3>
      <p className="text-[var(--text-muted)] mb-6">سيصلك بريد إلكتروني بتأكيد التسجيل وكود التذكرة.</p>
      <button onClick={onClose} className="btn-primary">إغلاق</button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-2 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
        {([['startup', '🚀 تسجيل شركة ناشئة'], ['general', '👤 مشاركة عامة']] as const).map(([t, l]) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all ${tab === t ? 'text-white' : 'text-[var(--text-muted)]'}`}
            style={{ background: tab === t ? 'var(--primary)' : 'transparent' }}>
            {l}
          </button>
        ))}
      </div>

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
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-1">رقم الهاتف</label>
          <input className="input-field" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+963..." />
        </div>
        <div>
          <label className="block text-sm text-[var(--text-muted)] mb-1">المدينة</label>
          <select className="input-field" value={form.city} onChange={e => set('city', e.target.value)}>
            <option value="">اختر المدينة</option>
            {['دمشق','حلب','حمص','اللاذقية','طرطوس','حماة','دير الزور','الرقة','القامشلي','إدلب','درعا'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value="خارج سوريا">خارج سوريا</option>
          </select>
        </div>
      </div>

      {/* Startup-specific */}
      {tab === 'startup' && (
        <>
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
                  {['تكنولوجيا المعلومات','التجارة الإلكترونية','التعليم','الصحة','التمويل والدفع','الزراعة','الطاقة','التصنيع','الخدمات اللوجستية','أخرى'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--text-muted)] mb-1">مرحلة الشركة *</label>
                <select className="input-field" required value={form.stage} onChange={e => set('stage', e.target.value)}>
                  <option value="">اختر المرحلة</option>
                  <option value="idea">فكرة</option>
                  <option value="mvp">نموذج أولي MVP</option>
                  <option value="early">مرحلة مبكرة</option>
                  <option value="growth">نمو</option>
                  <option value="scaling">توسع</option>
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
        </>
      )}

      {/* Terms */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={form.agreed} onChange={e => set('agreed', e.target.checked)}
          className="mt-1 w-4 h-4 accent-[var(--primary)]" />
        <span className="text-sm text-[var(--text-muted)]">
          أوافق على <a href="#" className="text-[var(--primary)] hover:underline">الشروط والأحكام</a> وسياسة الخصوصية
        </span>
      </label>

      {error && <div className="p-3 rounded-lg text-red-400 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>{error}</div>}

      <button type="submit" disabled={loading} className="btn-primary w-full text-center" style={{ opacity: loading ? 0.7 : 1 }}>
        {loading ? 'جار الإرسال...' : 'إرسال طلب التسجيل'}
      </button>
    </form>
  );
}

export default function EventLandingClient() {
  const [event, setEvent] = useState<Event | null>(null);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [agenda, setAgenda] = useState<AgendaDay[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [activeDay, setActiveDay] = useState(0);
  const [showRegModal, setShowRegModal] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const eventRes = await fetchEvent(API_EVENT_SLUG);
        const ev: Event = eventRes.data;
        setEvent(ev);
        const [spRes, agRes, stRes, spnRes, fqRes] = await Promise.all([
          fetchSpeakers(ev.id), fetchAgenda(ev.id), fetchStats(ev.id), fetchSponsors(ev.id), fetchFaqs(ev.id)
        ]);
        setSpeakers(spRes.data || []);
        setAgenda(agRes.data || []);
        setStats(stRes.data || null);
        setSponsors(spnRes.data || []);
        setFaqs(fqRes.data || []);
      } catch { /* use default demo data */ }
      setLoading(false);
    })();
  }, []);

  const navLinks = [
    { href: '#about', label: 'عن الفعالية' },
    { href: '#agenda', label: 'البرنامج' },
    { href: '#speakers', label: 'المتحدثون' },
    { href: '#sponsors', label: 'الشركاء' },
    { href: '#faq', label: 'الأسئلة الشائعة' },
    { href: '#register', label: 'سجّل الآن' },
  ];

  const eventName = event?.name_ar || 'قمة الشركات الناشئة السورية';
  const eventTagline = event?.tagline_ar || 'Syria Startups Summit';
  const startDate = event?.start_date || '2026-12-25';
  const endDate = event?.end_date || '2026-12-27';
  const location = event?.location_ar || 'دمشق، سوريا';
  const description = event?.description_ar || 'ثلاثة أيام من الإلهام، التواصل، والابتكار — لبناء مستقبل ريادة الأعمال في سوريا';
  const primaryColor = event?.primary_color || '#6C63FF';

  const formatDateAr = (d: string) => {
    const date = new Date(d);
    const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    return { day: date.getDate(), month: months[date.getMonth()], year: date.getFullYear() };
  };

  const sd = formatDateAr(startDate);
  const ed = formatDateAr(endDate);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d0b1a' }}>
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-t-transparent rounded-full mx-auto mb-4 animate-spin" style={{ borderColor: primaryColor, borderTopColor: 'transparent' }} />
        <p className="text-[var(--text-muted)]">جار التحميل...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#0d0b1a' }}>
      {/* ── Navbar ───────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 glass" style={{ borderBottom: '1px solid rgba(108,99,255,0.2)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" className="font-black text-xl text-white" style={{ letterSpacing: '-0.02em' }}>
            <span style={{ color: primaryColor }}>S3</span> Summit
          </a>
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(l => (
              <a key={l.href} href={l.href} className="text-sm text-[var(--text-muted)] hover:text-white transition-colors">
                {l.label}
              </a>
            ))}
          </div>
          <button onClick={() => setShowRegModal(true)} className="btn-primary text-sm py-2 px-4">
            سجّل الآن
          </button>
        </div>
      </nav>

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

          <h1 className="text-5xl md:text-7xl font-black text-white mb-4" style={{ letterSpacing: '-0.03em' }}>
            <span style={{ color: primaryColor }}>S3</span>
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
            <button onClick={() => setShowRegModal(true)} className="btn-primary">🚀 سجّل شركتك الناشئة</button>
            <button onClick={() => setShowRegModal(true)} className="btn-outline">حضور عام</button>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="card grid grid-cols-2 md:grid-cols-4 gap-8 py-8">
            <StatCounter value={stats?.days_count || 3} label="أيام من الإلهام" />
            <StatCounter value={stats?.startup_count || 50} label="شركة ناشئة" />
            <StatCounter value={stats?.speaker_count || 20} label="متحدث متميز" />
            <StatCounter value={stats?.total_registrations || 500} label="مشارك" />
          </div>
        </div>
      </section>

      {/* ── About ─────────────────────────────────────────────────────────────── */}
      <section id="about" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="section-badge">عن الفعالية</div>
            <h2 className="section-title">لماذا S³ Summit؟</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { emoji: '🚀', title: 'إطلاق الأفكار', desc: 'منصة لعرض شركاتك الناشئة أمام مستثمرين وشركاء من سوريا والمنطقة العربية' },
              { emoji: '🤝', title: 'التواصل والشبكات', desc: 'فرصة ذهبية للتواصل مع رواد أعمال، مستثمرين، وخبراء في الاقتصاد الرقمي' },
              { emoji: '💡', title: 'ورش عمل مكثفة', desc: 'جلسات تدريبية متخصصة في بناء المنتج، التسويق الرقمي، وجذب التمويل' },
              { emoji: '🏆', title: 'مسابقة الشركات', desc: 'تنافس أفضل الشركات الناشئة السورية للفوز بجوائز وفرص تمويل حقيقية' },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="card hover:border-[var(--primary)] transition-all group">
                <div className="text-4xl mb-4">{emoji}</div>
                <h3 className="text-white font-bold text-lg mb-2 group-hover:text-[var(--primary)] transition-colors">{title}</h3>
                <p className="text-[var(--text-muted)] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Agenda ────────────────────────────────────────────────────────────── */}
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

      {/* ── Speakers ─────────────────────────────────────────────────────────── */}
      <section id="speakers" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="section-badge">المتحدثون</div>
            <h2 className="section-title">قيادات ملهمة</h2>
            <p className="text-[var(--text-muted)] mt-2">نخبة من رواد الأعمال والمستثمرين والخبراء</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {speakers.map(speaker => (
              <div key={speaker.id} className="card text-center hover:border-[var(--primary)] transition-all group">
                {speaker.photo_url ? (
                  <img src={speaker.photo_url} alt={speaker.name_ar}
                    className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-2 group-hover:border-[var(--primary)] transition-all"
                    style={{ borderColor: 'rgba(108,99,255,0.3)' }} />
                ) : (
                  <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-xl font-black text-white"
                       style={{ background: speaker.is_surprise ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${primaryColor}, #4f46e5)` }}>
                    {speaker.is_surprise ? '?' : (speaker.name_ar?.split(' ').map(w => w[0]).slice(0,2).join('') || speaker.name[0])}
                  </div>
                )}
                <h3 className="text-white font-bold text-sm">{speaker.name_ar || speaker.name}</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{speaker.title_ar}</p>
                <p className="text-xs mt-1 font-semibold" style={{ color: primaryColor }}>{speaker.company}</p>
                {speaker.is_featured === 1 && (
                  <span className="tag mt-2 text-xs" style={{ background: '#f59e0b20', color: '#f59e0b' }}>✦ مميز</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sponsors ──────────────────────────────────────────────────────────── */}
      {sponsors.length > 0 && (
        <section id="sponsors" className="py-16 px-6" style={{ background: 'rgba(108,99,255,0.03)' }}>
          <div className="max-w-4xl mx-auto text-center">
            <div className="section-badge">الشركاء والرعاة</div>
            <h2 className="section-title mb-10">شركاء القمة</h2>
            <div className="flex flex-wrap gap-8 justify-center items-center">
              {sponsors.map(sp => (
                <div key={sp.id} className="card px-8 py-4 flex items-center justify-center">
                  {sp.logo_url ? (
                    <img src={sp.logo_url} alt={sp.name} className="h-10 object-contain opacity-70 hover:opacity-100 transition-opacity" />
                  ) : (
                    <span className="text-white font-bold">{sp.name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Register ─────────────────────────────────────────────────────────── */}
      <section id="register" className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="section-badge">التسجيل</div>
            <h2 className="section-title">انضم إلى القمة</h2>
            <p className="text-[var(--text-muted)] mt-2">سجّل الآن وكن جزءاً من أكبر تجمع لريادة الأعمال</p>
          </div>
          <div className="card" style={{ background: 'rgba(13,11,26,0.9)' }}>
            {event ? <RegistrationForm event={event} onClose={() => {}} /> : (
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
              {navLinks.map(l => <a key={l.href} href={l.href} className="text-sm text-[var(--text-muted)] hover:text-white transition-colors">{l.label}</a>)}
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">تواصل معنا</h4>
            {event?.email && <a href={`mailto:${event.email}`} className="block text-sm text-[var(--text-muted)] hover:text-white transition-colors mb-1">{event.email}</a>}
            <div className="flex gap-3 mt-3">
              {event?.twitter && <a href={`https://twitter.com/${event.twitter}`} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-white transition-colors" title="X (Twitter)">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>}
              {event?.instagram && <a href={`https://instagram.com/${event.instagram}`} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-white transition-colors" title="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>}
              {event?.linkedin && <a href={`https://linkedin.com/company/${event.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-white transition-colors" title="LinkedIn">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>}
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 text-center text-sm text-[var(--text-muted)]" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          © {ed.year} S³ Summit · جميع الحقوق محفوظة
        </div>
      </footer>

      {/* ── Registration Modal ─────────────────────────────────────────────────── */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6"
               style={{ background: '#13102a', border: '1px solid rgba(108,99,255,0.3)' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">التسجيل في القمة</h3>
              <button onClick={() => setShowRegModal(false)} className="text-[var(--text-muted)] hover:text-white text-2xl leading-none">×</button>
            </div>
            {event && <RegistrationForm event={event} onClose={() => setShowRegModal(false)} />}
          </div>
        </div>
      )}
    </div>
  );
}
