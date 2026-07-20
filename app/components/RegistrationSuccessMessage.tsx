// app/components/RegistrationSuccessMessage.tsx
'use client';

export interface SuccessMessageProps {
  registrationType: 'startup' | 'member' | 'general';
  fullName: string;
  companyName?: string;
  ticketCode?: string;
  eventId?: number;
  eventName?: string;
  onClose: () => void;
}

export default function RegistrationSuccessMessage({
  registrationType,
  fullName,
  companyName,
  eventName = 'Ø§Ù„Ø­Ø¯Ø«',
  onClose
}: SuccessMessageProps) {
  const isStartup = registrationType === 'startup' || !!companyName;

  return (
    <div style={{ textAlign: 'center', padding: '2rem 1rem', direction: 'rtl' }}>
      {/* Icon */}
      <div style={{ fontSize: '3.5rem', marginBottom: '1rem', animation: 'bounce 1s infinite' }}>
        {isStartup ? 'ðŸš€' : 'ðŸŽ‰'}
      </div>

      {/* Title */}
      <h3 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
        {isStartup ? 'âœ… Ø§Ø³ØªÙ„Ù…Ù†Ø§ Ø·Ù„Ø¨ Ø´Ø±ÙƒØªÙƒ!' : 'âœ… ØªÙ… Ø§Ù„ØªØ³Ø¬ÙŠÙ„ Ø¨Ù†Ø¬Ø§Ø­!'}
      </h3>
      <p style={{ color: '#94a3b8', margin: '0 0 1.5rem' }}>
        Ø´ÙƒØ±Ø§Ù‹ Ù„Ùƒ ÙŠØ§ {fullName}{companyName ? ` Ù…Ù† ${companyName}` : ''}
      </p>

      {/* Steps â€” Startup */}
      {isStartup ? (
        <div style={{ marginBottom: '1.5rem', textAlign: 'right' }}>
          <div style={{ color: '#6C63FF', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Ø§Ù„Ø®Ø·ÙˆØ§Øª Ø§Ù„ØªØ§Ù„ÙŠØ©
          </div>
          {[
            { icon: 'ðŸ“‹', title: 'Ø·Ù„Ø¨Ùƒ Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©', desc: 'ÙŠØ±Ø§Ø¬Ø¹ Ø§Ù„ÙØ±ÙŠÙ‚ Ø·Ù„Ø¨Ùƒ ÙˆÙ…Ø¹Ù„ÙˆÙ…Ø§Øª Ù…Ø´Ø±ÙˆØ¹Ùƒ Ø®Ù„Ø§Ù„ 24-48 Ø³Ø§Ø¹Ø©' },
            { icon: 'ðŸ“ž', title: 'Ù…ÙƒØ§Ù„Ù…Ø© Ø§Ø³ØªØ¹Ù„Ø§Ù…', desc: 'Ø³ÙŠØªÙˆØ§ØµÙ„ Ù…Ø¹Ùƒ Ø£Ø­Ø¯ Ø£Ø¹Ø¶Ø§Ø¡ Ø§Ù„ÙØ±ÙŠÙ‚ Ø¹Ø¨Ø± ÙˆØ§ØªØ³Ø§Ø¨ Ù„ØªØ­Ø¯ÙŠØ¯ Ù…ÙˆØ¹Ø¯ Ù…ÙƒØ§Ù„Ù…Ø© Ù‚ØµÙŠØ±Ø© (15 Ø¯Ù‚ÙŠÙ‚Ø©) Ø¹Ù† Ù…Ø´Ø±ÙˆØ¹ÙƒÙ…' },
            { icon: 'ðŸ’³', title: 'Ø§Ù„Ù‚Ø¨ÙˆÙ„ ÙˆØ§Ù„Ø¯ÙØ¹', desc: 'ÙÙŠ Ø­Ø§Ù„ Ø§Ù„Ù‚Ø¨ÙˆÙ„ Ø³ØªØµÙ„Ùƒ Ø±Ø³Ø§Ù„Ø© ØªØ£ÙƒÙŠØ¯ Ù…Ø¹ ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ø¯ÙØ¹ ($100 â€” ØªØ°ÙƒØ±Ø© Ø´Ø±ÙƒØ§Øª Ù†Ø§Ø´Ø¦Ø© ÙˆØªØ´Ù…Ù„ 3 ØªØ°Ø§ÙƒØ± Ù„Ù„ÙØ±ÙŠÙ‚)' },
            { icon: 'ðŸŽ«', title: 'ØªØ°ÙƒØ±ØªÙƒ ÙˆÙ…Ù‚Ø¹Ø¯Ùƒ', desc: 'Ø¨Ø¹Ø¯ ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø¯ÙØ¹ ØªØµÙ„Ùƒ ØªØ°Ø§ÙƒØ± Ø§Ù„ÙØ±ÙŠÙ‚ Ø¨Ø±Ù…ÙˆØ² QR Ù…Ø¨Ø§Ø´Ø±Ø© Ø¹Ù„Ù‰ ÙˆØ§ØªØ³Ø§Ø¨' },
          ].map((step, i) => (
            <div key={i} style={{
              display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
              padding: '0.75rem', marginBottom: '0.5rem',
              background: 'rgba(108,99,255,0.06)',
              border: '1px solid rgba(108,99,255,0.15)',
              borderRadius: '0.75rem',
            }}>
              <span style={{ fontSize: '1.25rem', flexShrink: 0, marginTop: 2 }}>{step.icon}</span>
              <div>
                <div style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>{step.title}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: 2 }}>{step.desc}</div>
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
            <div style={{ color: '#10b981', fontWeight: 600, marginBottom: '0.4rem' }}>ðŸ“§ Ø±Ø³Ø§Ù„Ø© ØªØ£ÙƒÙŠØ¯</div>
            <div style={{ color: '#cbd5e1', fontSize: '0.88rem' }}>
              Ø³ØªØµÙ„Ùƒ Ø±Ø³Ø§Ù„Ø© ØªØ£ÙƒÙŠØ¯ Ø¹Ù„Ù‰ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ø§Ù„Ù…Ø³Ø¬Ù„ ØªØªØ¶Ù…Ù† ØªÙØ§ØµÙŠÙ„ {eventName} ÙˆÙƒÙŠÙÙŠØ© Ø§Ù„Ø­Ø¶ÙˆØ±.
            </div>
          </div>
          <div style={{
            padding: '1rem',
            background: 'rgba(108,99,255,0.06)',
            border: '1px solid rgba(108,99,255,0.15)',
            borderRadius: '0.75rem',
            textAlign: 'right',
          }}>
            <div style={{ color: '#818cf8', fontWeight: 600, marginBottom: '0.4rem' }}>ðŸŽ« ØªØ°ÙƒØ±ØªÙƒ</div>
            <div style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
              ØªØ°ÙƒØ±Ø© Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø³ØªØµÙ„Ùƒ Ø¨Ø±Ù…Ø² QR Ù‚Ø¨Ù„ Ø§Ù†Ø·Ù„Ø§Ù‚ Ø§Ù„ÙØ¹Ø§Ù„ÙŠØ©. Ø§Ø­ØªÙØ¸ Ø¨Ø±Ù‚Ù… Ù‡Ø§ØªÙÙƒ Ø§Ù„Ù…Ø³Ø¬Ù„ Ù„Ø§Ø³ØªÙ‚Ø¨Ø§Ù„Ù‡Ø§.
            </div>
          </div>
        </div>
      )}

      {/* Important note */}
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
        ðŸ’¬ ØªØ£ÙƒØ¯ Ù…Ù† Ø¥Ø¨Ù‚Ø§Ø¡ ÙˆØ§ØªØ³Ø§Ø¨ Ù…ÙØ¹Ù„Ø§Ù‹ Ø¹Ù„Ù‰ Ø§Ù„Ø±Ù‚Ù… Ø§Ù„Ù…Ø³Ø¬Ù„ â€” Ø³ÙŠØªÙˆØ§ØµÙ„ Ù…Ø¹Ùƒ Ø§Ù„ÙØ±ÙŠÙ‚ Ø®Ù„Ø§Ù„Ù‡
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        style={{
          background: '#6C63FF', color: 'white', border: 'none',
          borderRadius: '0.5rem', padding: '0.65rem 2rem',
          fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
          width: '100%',
        }}
      >
        حسناً، شكراً!
      </button>
    </div>
  );
}
