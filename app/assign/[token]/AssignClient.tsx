'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev';

interface Ticket {
  id: number; status: string; type_name?: string;
  event_name?: string; start_date?: string; end_date?: string;
  buyer_name?: string;
}

export default function TicketAssignClient() {
  const params = useParams();
  const token = params.token as string;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignments, setAssignments] = useState<Record<number, { full_name: string; phone: string; email: string }>>({});
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [submitting, setSubmitting] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/crm/tickets/assign/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setTickets(data.data.filter((t: Ticket) => t.status === 'unassigned'));
        } else {
          setError(data.error || 'خطأ في تحميل التذاكر');
        }
      })
      .catch(() => setError('تعذر الاتصال بالخادم'))
      .finally(() => setLoading(false));
  }, [token]);

  const assign = async (ticketId: number) => {
    const form = assignments[ticketId];
    if (!form?.full_name) return alert('الاسم مطلوب');
    setSubmitting(s => ({ ...s, [ticketId]: true }));
    try {
      const res = await fetch(`${API_BASE}/api/crm/tickets/assign/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: ticketId, ...form }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(s => ({ ...s, [ticketId]: true }));
      } else {
        alert(data.error);
      }
    } finally {
      setSubmitting(s => ({ ...s, [ticketId]: false }));
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0818', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#94a3b8' }}>جاري التحميل...</div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#0a0818', display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl' }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
        <h1 style={{ color: '#ef4444', fontSize: '1.25rem' }}>{error}</h1>
        <p style={{ color: '#94a3b8' }}>قد يكون الرابط منتهي الصلاحية أو غير صالح.</p>
      </div>
    </div>
  );

  if (tickets.length === 0) return (
    <div style={{ minHeight: '100vh', background: '#0a0818', display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl' }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
        <h1 style={{ color: '#10b981', fontSize: '1.25rem' }}>تم تعيين جميع التذاكر!</h1>
        <p style={{ color: '#94a3b8' }}>سيصل كل مشارك تذكرته مع رمز QR قريباً.</p>
      </div>
    </div>
  );

  const firstTicket = tickets[0];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0818', direction: 'rtl', padding: '2rem 1rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎫</div>
          <h1 style={{ color: 'white', fontSize: '1.5rem', margin: '0 0 0.5rem' }}>تعيين التذاكر</h1>
          <p style={{ color: '#94a3b8' }}>
            {firstTicket.event_name && <><strong style={{ color: 'white' }}>{firstTicket.event_name}</strong> · </>}
            لديك {tickets.length} {tickets.length === 1 ? 'تذكرة' : 'تذاكر'} للتعيين
          </p>
        </div>

        {/* Tickets */}
        {tickets.map((ticket, index) => (
          <div key={ticket.id} style={{
            background: '#13102a',
            border: '1px solid rgba(108,99,255,0.2)',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '1.25rem',
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ background: 'rgba(108,99,255,0.2)', color: '#818cf8', fontSize: '0.8rem', padding: '3px 10px', borderRadius: '2rem', fontWeight: 600 }}>
                تذكرة {index + 1} {ticket.type_name ? `· ${ticket.type_name}` : ''}
              </span>
            </div>

            {submitted[ticket.id] ? (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                <p style={{ color: '#10b981', fontWeight: 600 }}>تم التعيين بنجاح!</p>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>ستصل التذكرة مع رمز QR قريباً</p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.3rem' }}>الاسم الكامل *</label>
                    <input
                      style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.6rem 0.85rem', color: 'white', outline: 'none', fontSize: '0.95rem', boxSizing: 'border-box', colorScheme: 'dark' }}
                      placeholder="أدخل الاسم الكامل"
                      value={assignments[ticket.id]?.full_name || ''}
                      onChange={e => setAssignments(a => ({ ...a, [ticket.id]: { ...a[ticket.id], full_name: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.3rem' }}>رقم الهاتف (+963...)</label>
                    <input
                      style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.6rem 0.85rem', color: 'white', outline: 'none', fontSize: '0.95rem', boxSizing: 'border-box', colorScheme: 'dark' }}
                      placeholder="+963xxxxxxxxx"
                      value={assignments[ticket.id]?.phone || ''}
                      onChange={e => setAssignments(a => ({ ...a, [ticket.id]: { ...a[ticket.id], phone: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.3rem' }}>البريد الإلكتروني (اختياري)</label>
                    <input
                      style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.6rem 0.85rem', color: 'white', outline: 'none', fontSize: '0.95rem', boxSizing: 'border-box', colorScheme: 'dark' }}
                      type="email" placeholder="example@email.com"
                      value={assignments[ticket.id]?.email || ''}
                      onChange={e => setAssignments(a => ({ ...a, [ticket.id]: { ...a[ticket.id], email: e.target.value } }))}
                    />
                  </div>
                </div>
                <button
                  onClick={() => assign(ticket.id)}
                  disabled={submitting[ticket.id] || !assignments[ticket.id]?.full_name}
                  style={{
                    width: '100%', background: '#6C63FF', color: 'white', border: 'none',
                    borderRadius: '0.5rem', padding: '0.75rem', fontSize: '0.95rem', fontWeight: 600,
                    cursor: submitting[ticket.id] ? 'wait' : 'pointer',
                    opacity: !assignments[ticket.id]?.full_name ? 0.5 : 1,
                  }}
                >
                  {submitting[ticket.id] ? 'جاري التعيين...' : 'تعيين هذه التذكرة ✓'}
                </button>
              </div>
            )}
          </div>
        ))}

        <p style={{ color: '#6b7280', fontSize: '0.8rem', textAlign: 'center', marginTop: '1.5rem' }}>
          سيصل كل مشارك تذكرته برمز QR مباشرة · هذا الرابط صالح لمرة واحدة لكل تذكرة
        </p>
      </div>
    </div>
  );
}
