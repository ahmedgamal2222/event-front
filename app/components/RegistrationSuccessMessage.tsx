// app/components/RegistrationSuccessMessage.tsx
'use client';

export interface SuccessMessageProps {
  registrationType: 'startup' | 'member' | 'general' | string;
  fullName: string;
  companyName?: string;
  city?: string;
  ticketCode?: string;
  eventId?: number;
  eventName?: string;
  onClose: () => void;
  customInstructions?: TicketInstructions;
}

export interface TicketInstructions {
  // For startup/company registrations
  startup_step1_title?: string;
  startup_step1_desc?: string;
  startup_step2_title?: string;
  startup_step2_desc?: string;
  startup_step3_title?: string;
  startup_step3_desc?: string;
  startup_step4_title?: string;
  startup_step4_desc?: string;
  startup_note?: string;
  // For general registrations
  general_confirm_title?: string;
  general_confirm_desc?: string;
  general_ticket_title?: string;
  general_ticket_desc?: string;
  general_note?: string;
  // Button
  close_btn_text?: string;
  // Success title
  startup_success_title?: string;
  general_success_title?: string;
  custom_messages?: Array<{ id?: string | number; text: string }>;
}

const DEFAULT: TicketInstructions = {
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
  general_ticket_desc: 'تذكرة الدخول ستصلك برمز QR بعد تسديد الرسوم وقبل انطلاق الفعالية. احتفظ برقم هاتفك المسجل لاستقبالها',
  general_note: 'تأكد من إبقاء واتساب مفعلاً على الرقم المسجل – سيتواصل معك الفريق خلاله',
  close_btn_text: 'حسناً، شكراً!',
  startup_success_title: 'استلمنا طلب شركتك!',
  general_success_title: 'تم التسجيل بنجاح!',
  custom_messages: [],
};

export default function RegistrationSuccessMessage({
  registrationType,
  fullName,
  companyName,
  city,
  ticketCode,
  eventName = 'الحدث',
  onClose,
  customInstructions,
}: SuccessMessageProps) {
  const isStartup = registrationType === 'startup' || !!companyName;
  const c = { ...DEFAULT, ...customInstructions };

  const startupSteps = [
    { icon: '📋', title: c.startup_step1_title!, desc: c.startup_step1_desc! },
    { icon: '📞', title: c.startup_step2_title!, desc: c.startup_step2_desc! },
    { icon: '💳', title: c.startup_step3_title!, desc: c.startup_step3_desc! },
    { icon: '🎫', title: c.startup_step4_title!, desc: c.startup_step4_desc! },
  ];

  return (
    <div style={{ textAlign: 'center', padding: '2rem 1rem', direction: 'rtl' }}>
      {/* Icon */}
      <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
        {isStartup ? '🚀' : '🎉'}
      </div>

      {/* Title */}
      <h3 style={{ color: 'var(--heading)', fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
        ✅ {isStartup ? c.startup_success_title : c.general_success_title}
      </h3>
      <p style={{ color: 'var(--text-muted)', margin: '0 0 0.35rem' }}>
        شكراً لك يا <strong style={{ color: 'var(--heading)' }}>{fullName}</strong>
        {companyName ? ` من ${companyName}` : city ? ` من ${city}` : ''}
      </p>
      {ticketCode && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0 0 1.5rem' }}>
          رقم التسجيل: <span style={{ color: '#818cf8', fontWeight: 700 }}>{ticketCode}</span>
        </p>
      )}
      {!ticketCode && <div style={{ marginBottom: '1.5rem' }} />}

      {/* Steps – Startup */}
      {isStartup ? (
        <div style={{ marginBottom: '1.5rem', textAlign: 'right' }}>
          <div style={{ color: '#6C63FF', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            الخطوات التالية
          </div>
          {startupSteps.map((step, i) => (
            <div key={i} style={{
              display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
              padding: '0.75rem', marginBottom: '0.5rem',
              background: 'rgba(108,99,255,0.06)',
              border: '1px solid rgba(108,99,255,0.15)',
              borderRadius: '0.75rem',
            }}>
              <span style={{ fontSize: '1.25rem', flexShrink: 0, marginTop: 2 }}>{step.icon}</span>
              <div>
                <div style={{ color: 'var(--heading)', fontWeight: 600, fontSize: '0.9rem' }}>{step.title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 2 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* General registration */
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            padding: '1rem',
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: '0.75rem',
            textAlign: 'right',
            marginBottom: '0.75rem',
          }}>
            <div style={{ color: '#10b981', fontWeight: 600, marginBottom: '0.4rem' }}>📧 {c.general_confirm_title}</div>
            <div style={{ color: 'var(--text)', fontSize: '0.88rem' }}>
              {c.general_confirm_desc!.replace('{eventName}', eventName)}
            </div>
          </div>
          <div style={{
            padding: '1rem',
            background: 'rgba(108,99,255,0.06)',
            border: '1px solid rgba(108,99,255,0.15)',
            borderRadius: '0.75rem',
            textAlign: 'right',
          }}>
            <div style={{ color: '#818cf8', fontWeight: 600, marginBottom: '0.4rem' }}>🎫 {c.general_ticket_title}</div>
             <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{c.general_ticket_desc}</div>
          </div>
        </div>
      )}

      {/* Note */}
      <div style={{
        padding: '0.75rem 1rem',
        background: 'rgba(245,158,11,0.08)',
        border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: '0.6rem',
        marginBottom: '1.5rem',
        textAlign: 'right',
        fontSize: '0.83rem',
        color: '#fbbf24',
      }}>
        💬 {isStartup ? c.startup_note : c.general_note}
      </div>

      {/* Custom messages from admin */}
      {(c.custom_messages || []).filter((m: any) => m && m.text).map((m: any, idx: number) => (
        <div key={m.id || idx} style={{
          padding: '0.75rem 1rem',
          background: 'rgba(108,99,255,0.06)',
          border: '1px solid rgba(108,99,255,0.15)',
          borderRadius: '0.6rem',
          marginBottom: '0.75rem',
          textAlign: 'right',
          fontSize: '0.88rem',
          color: 'var(--text)',
        }}>
          {m.text}
        </div>
      ))}

      {/* Close button */}
      <button
        onClick={() => {
          onClose();
          // Scroll to top after closing
          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
        }}
        style={{
          background: 'linear-gradient(135deg, #6C63FF, #8b5cf6)',
          color: 'white', border: 'none',
          borderRadius: '0.6rem', padding: '0.75rem 2.5rem',
          fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
          width: '100%', letterSpacing: '0.02em',
          boxShadow: '0 4px 20px rgba(108,99,255,0.4)',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 25px rgba(108,99,255,0.5)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(108,99,255,0.4)'; }}
      >
        {c.close_btn_text}
      </button>
    </div>
  );
}