'use client';
// app/components/CompetitionPage.tsx
// قالب «مسابقة الريادة المجتمعية» — تصميم احترافي بألوان الموقع + استمارة Tally مضمّنة
import TallyEmbed from './TallyEmbed';
import EmbeddedRegistrationForm from './EmbeddedRegistrationForm';

const CATEGORIES = [
  { icon: '👴', title: 'المتقاعد الريادي' },
  { icon: '🎓', title: 'الطالب الريادي' },
  { icon: '🧑‍🎤', title: 'اليافع الريادي' },
  { icon: '🔬', title: 'العالم الريادي' },
  { icon: '💼', title: 'الخبير الريادي' },
  { icon: '♿', title: 'أصحاب الهمم' },
  { icon: '📚', title: 'الباحث الريادي' },
  { icon: '🤝', title: 'الأوقاف والعمل الخيري والإنساني الريادي' },
  { icon: '🏢', title: 'الموظف الريادي' },
  { icon: '👩‍💼', title: 'المرأة الريادية' },
];

const STEPS = [
  { title: 'سجّل مشروعك', desc: 'املأ النموذج المضمّن أدناه مباشرة وأدخل بيانات مشروعك.' },
  { title: 'اختر الفئة', desc: 'حدّد الفئة التي تنتمي إليها من بين الفئات العشر المستهدفة.' },
  { title: 'انتظر التقييم', desc: 'سيقوم فريق تحكيم متخصص بتقييم المشاريع وفق معايير معلنة.' },
];

const PRIZES = [
  { icon: '🎤', text: 'عرض مشروعه على منصة القمة' },
  { icon: '🏅', text: 'التكريم بدرع القمة' },
  { icon: '📜', text: 'خطاب شكر وتقدير من إدارة القمة' },
  { icon: '📘', text: 'الإدراج في كتاب القمة لهذه النسخة' },
  { icon: '💎', text: 'عضوية القمة' },
  { icon: '🌐', text: 'الإدراج في الموقع الإلكتروني للقمة' },
];

const COMP_CSS = `
.comp{--teal:var(--primary,#14b8a6);--teal-d:var(--primary-dark,#0f766e);--gold:var(--accent,#D4AF37);--bg:var(--bg-dark,#052e33);--card:var(--bg-card,#0b4248);--txt:var(--text,#e6f7f5);--muted:var(--text-muted,#7fb8b1);
  direction:rtl;font-family:Cairo,Tajawal,system-ui,-apple-system,Segoe UI,sans-serif;color:var(--txt);
  background:linear-gradient(180deg,#04191d 0%,var(--bg) 55%,#03171a 100%)}
.comp *{box-sizing:border-box}
.comp-hero{position:relative;text-align:center;padding:68px 22px 58px;background:radial-gradient(ellipse at 50% -10%,rgba(45,212,191,.22),transparent 60%);border-bottom:1px solid rgba(45,212,191,.16);overflow:hidden}
.comp-badge{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,var(--gold),#b8912f);color:#10231f;font-weight:800;font-size:.84rem;padding:9px 22px;border-radius:999px;box-shadow:0 10px 26px rgba(212,175,55,.28)}
.comp-hero h1{font-size:clamp(2rem,4.6vw,3.2rem);font-weight:900;color:#fff;margin:20px 0 12px;letter-spacing:-.5px;line-height:1.35}
.comp-hero p{max-width:780px;margin:0 auto 12px;font-size:clamp(1rem,2vw,1.13rem);line-height:2.05;color:var(--txt)}
.comp-hero strong{color:var(--gold)}
.comp-note{color:var(--gold)!important;font-weight:700;margin-top:6px!important}
.comp-wrap{max-width:1120px;margin:0 auto;padding:0 22px 64px}
.comp-section{padding:44px 0 6px}
.comp-title{text-align:center;font-size:clamp(1.35rem,3vw,1.9rem);font-weight:900;color:#fff;margin:0 0 8px}
.comp-sub{text-align:center;color:var(--muted);margin:0 auto 30px;max-width:660px;font-size:1rem;line-height:1.9}
.comp-grid{display:grid;gap:16px}
.comp-cats{grid-template-columns:repeat(auto-fit,minmax(185px,1fr))}
.comp-steps{grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
.comp-prizes{grid-template-columns:repeat(auto-fit,minmax(195px,1fr))}
.comp-card{background:linear-gradient(180deg,rgba(255,255,255,.065),rgba(255,255,255,.02));border:1px solid rgba(45,212,191,.2);border-radius:16px;padding:24px 16px;text-align:center;transition:transform .25s ease,border-color .25s ease,box-shadow .25s ease}
.comp-card:hover{transform:translateY(-5px);border-color:rgba(212,175,55,.55);box-shadow:0 18px 44px rgba(0,0,0,.38)}
.comp-icon{font-size:2rem;display:block;margin-bottom:10px}
.comp-card h3{font-size:1rem;font-weight:800;color:#fff;margin:0 0 10px;line-height:1.6}
.comp-seats{display:inline-block;background:rgba(212,175,55,.14);color:var(--gold);border:1px solid rgba(212,175,55,.45);font-size:.74rem;font-weight:700;padding:3px 13px;border-radius:999px}
.comp-num{width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,var(--teal),var(--teal-d));color:#04211d;font-weight:900;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-size:1.15rem;box-shadow:0 8px 20px rgba(20,184,166,.28)}
.comp-prize{border-right:4px solid rgba(212,175,55,.75)}
.comp-prize .comp-icon{font-size:1.7rem}
.comp-prize p{margin:0;font-size:.93rem;line-height:1.8;color:var(--txt)}
.comp-register{margin-top:40px;border:1px solid rgba(45,212,191,.28);border-radius:22px;padding:40px 20px 30px;background:linear-gradient(135deg,rgba(20,184,166,.16),rgba(11,66,72,.72));text-align:center;box-shadow:0 22px 60px rgba(0,0,0,.35)}
.comp-register h2{font-size:clamp(1.5rem,3vw,2rem);font-weight:900;color:#fff;margin:0 0 8px}
.comp-register>p{color:var(--txt);margin:0 auto 22px;max-width:620px;line-height:1.9}
.comp-form{max-width:780px;margin:0 auto;background:rgba(3,15,18,.55);border:1px solid rgba(255,255,255,.09);border-radius:18px;padding:16px;box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}
.comp-foot{padding:26px 22px 40px;text-align:center;color:var(--muted);font-size:.85rem;line-height:1.9;border-top:1px solid rgba(255,255,255,.06);margin-top:44px}
.comp-foot a{color:var(--gold);text-decoration:none}
@media(max-width:640px){.comp-hero{padding:46px 16px 40px}.comp-wrap{padding:0 14px 46px}.comp-cats{grid-template-columns:repeat(2,1fr);gap:11px}.comp-card{padding:18px 10px}.comp-card h3{font-size:.86rem}.comp-icon{font-size:1.55rem}.comp-section{padding:34px 0 4px}.comp-register{padding:28px 12px 22px;border-radius:18px}.comp-form{padding:8px}}
`;

export default function CompetitionPage({
  tallyUrl,
  eventId,
  eventName = 'قمة الشركات الناشئة السورية',
}: {
  tallyUrl?: string;
  eventId: number;
  eventName?: string;
}) {
  return (
    <div className="comp">
      <style>{COMP_CSS}</style>

      {/* Hero */}
      <header className="comp-hero">
        <span className="comp-badge">🏆 مسابقة الريادة المجتمعية</span>
        <h1>«مقعدك في القمة»</h1>
        <p>
          القمة لكل فئات المجتمع، وليست لأصحاب الشركات وحدهم. نفتح الباب لأصحاب المشاريع الريادية
          من مختلف الفئات للتنافس على <strong>30 مقعداً مجانياً</strong> لعرض مشاريعهم على منصة القمة.
        </p>
        <p className="comp-note">«فكرتك تستحق منصة… وهذه منصتك.»</p>
      </header>

      <div className="comp-wrap">
        {/* الفئات */}
        <section className="comp-section">
          <h2 className="comp-title">🎯 الفئات المستهدفة</h2>
          <p className="comp-sub">3 مقاعد لكل فئة من الفئات العشر التالية</p>
          <div className="comp-grid comp-cats">
            {CATEGORIES.map(c => (
              <div key={c.title} className="comp-card">
                <span className="comp-icon">{c.icon}</span>
                <h3>{c.title}</h3>
                <span className="comp-seats">3 مقاعد</span>
              </div>
            ))}
          </div>
        </section>

        {/* الخطوات */}
        <section className="comp-section">
          <h2 className="comp-title">📋 كيف تشارك؟</h2>
          <p className="comp-sub">ثلاث خطوات بسيطة تفصلك عن مقعدك في القمة</p>
          <div className="comp-grid comp-steps">
            {STEPS.map((s, i) => (
              <div key={s.title} className="comp-card">
                <div className="comp-num">{i + 1}</div>
                <h3>{s.title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.93rem', lineHeight: 1.9, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* الجوائز */}
        <section className="comp-section">
          <h2 className="comp-title">🎁 ما الذي يناله الفائز؟</h2>
          <p className="comp-sub">حزمة متكاملة من الفرص والتقدير</p>
          <div className="comp-grid comp-prizes">
            {PRIZES.map(p => (
              <div key={p.text} className="comp-card comp-prize">
                <span className="comp-icon">{p.icon}</span>
                <p>{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* التسجيل */}
        <section className="comp-register" id="register">
          <h2>🔗 سجّل الآن</h2>
          <p>لا تفوّت الفرصة، فكرتك تستحق منصة… وهذه منصتك.</p>
          <div className="comp-form">
            {tallyUrl
              ? <TallyEmbed url={tallyUrl} title="نموذج التسجيل — مقعدك في القمة" />
              : <EmbeddedRegistrationForm eventId={eventId} primaryColor="#0f9b8a" />}
          </div>
          <p style={{ marginTop: 18, color: 'var(--gold)', fontSize: '0.92rem', fontWeight: 700 }}>
            ⏰ التسجيل مفتوح الآن — المقاعد محدودة (30 مقعداً)
          </p>
        </section>
      </div>

      <footer className="comp-foot">
        © {new Date().getFullYear()} {eventName} — جميع الحقوق محفوظة. · للاستفسار:{' '}
        <a href="mailto:info@s3syria.com">info@s3syria.com</a>
      </footer>
    </div>
  );
}
