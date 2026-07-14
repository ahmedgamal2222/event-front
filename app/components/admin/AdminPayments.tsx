'use client';
import { useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev';

const S = {
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem', colorScheme: 'dark' } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 } as React.CSSProperties),
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '0.8rem', padding: '1.25rem' } as React.CSSProperties,
  label: { fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block', fontWeight: 600 } as React.CSSProperties,
};

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: 'rgba(245,158,11,0.15)', color: '#fcd34d', label: '⏳ قيد الانتظار' },
  paid:      { bg: 'rgba(16,185,129,0.15)', color: '#86efac', label: '✅ مدفوع' },
  failed:    { bg: 'rgba(239,68,68,0.12)', color: '#fca5a5', label: '❌ فشل' },
  cancelled: { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af', label: '🚫 ملغى' },
  refunded:  { bg: 'rgba(139,92,246,0.15)', color: '#c4b5fd', label: '↩️ مسترجع' },
};

const DEFAULT_DESIGN = {
  bg_color: '#13102a', primary_color: '#6C63FF', text_color: '#ffffff', accent_color: '#a5b4fc',
  logo_url: '', header_title: 'S3 Summit 2026', header_subtitle: 'تذكرة الحضور الرسمية',
  show_event_date: true, show_venue: true, show_registration_type: true, show_ticket_number: true,
  footer_text: 'يرجى إحضار هذه التذكرة يوم الحدث', footer_note: '',
  email_subject: '🎫 تذكرتك لحضور S3 Summit 2026',
  email_intro: 'مبروك! تم تأكيد دفعك وتسجيلك في الحدث.',
};

export default function AdminPayments({ eventId, token }: { eventId: number; token: string }) {
  const [tab, setTab] = useState<'settings' | 'orders' | 'design' | 'qr'>('orders');
  const [orderFilter, setOrderFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [settings, setSettings] = useState<any>({
    payments_enabled: 0, gateway: 'shamcash', currency: 'USD',
    shamcash_merchant_id: '', shamcash_api_key: '', shamcash_secret_key: '',
    shamcash_sandbox: 1, payment_title: 'إتمام الدفع',
    payment_subtitle: 'ادفع بأمان عبر شام كاش',
    success_message: 'تم الدفع بنجاح! شكراً لك.',
  });
  const [design, setDesign] = useState<any>(DEFAULT_DESIGN);
  const [orders, setOrders] = useState<any[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [sendingTicket, setSendingTicket] = useState<number | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // QR Scanner state
  const [qrInput, setQrInput] = useState('');
  const [qrResult, setQrResult] = useState<any>(null);
  const [qrLoading, setQrLoading] = useState(false);

  const showMsg = (msg: string, isErr = false) => {
    if (isErr) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 3500);
  };

  useEffect(() => {
    fetch(`${API_BASE}/api/events/${eventId}/payments/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(d => {
      if (d.data) {
        const defaults = {
          gateway: 'whatsapp',
          whatsapp_message_template: `مرحباً،\nأريد إتمام دفع تسجيلي في الحدث.\nالاسم: {name}\nرقم التذكرة: {order_ref}\nبانتظار تأكيدكم، شكراً.`,
        };
        setSettings((s: any) => ({ ...s, ...defaults, ...d.data }));
      }
    }).catch(() => {});

    fetch(`${API_BASE}/api/events/${eventId}/tickets-design/design`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(d => { if (d.data) setDesign((prev: any) => ({ ...prev, ...d.data })); }).catch(() => {});
  }, [eventId, token]);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/events/${eventId}/payments/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      setOrders(d.data || []);
      setRevenue(d.revenue || 0);
    } catch { setOrders([]); } finally { setOrdersLoading(false); }
  }, [eventId, token]);

  useEffect(() => { if (tab === 'orders') loadOrders(); }, [tab, loadOrders]);

  const saveSettings = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/events/${eventId}/payments/settings`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error);
      showMsg('✅ تم حفظ الإعدادات');
    } catch (e: any) { showMsg(e.message, true); } finally { setLoading(false); }
  };

  const saveDesign = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/events/${eventId}/tickets-design/design`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(design),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error);
      showMsg('✅ تم حفظ تصميم التذكرة');
    } catch (e: any) { showMsg(e.message, true); } finally { setLoading(false); }
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      await fetch(`${API_BASE}/api/events/${eventId}/payments/orders/${orderId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      loadOrders();
      showMsg(status === 'paid' ? '✅ تم تأكيد الدفع — ستصل التذكرة للبريد تلقائياً' : '✅ تم التحديث');
    } catch (e: any) { showMsg(e.message, true); }
  };

  const resendTicket = async (orderId: number) => {
    setSendingTicket(orderId);
    try {
      const r = await fetch(`${API_BASE}/api/events/${eventId}/tickets-design/send-ticket/${orderId}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error);
      showMsg('✅ تم إعادة إرسال التذكرة');
    } catch (e: any) { showMsg(e.message, true); }
    setSendingTicket(null);
  };

  const verifyQr = async () => {
    if (!qrInput.trim()) return;
    setQrLoading(true); setQrResult(null);
    try {
      const r = await fetch(`${API_BASE}/api/events/${eventId}/tickets-design/verify-qr?code=${encodeURIComponent(qrInput.trim())}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      setQrResult(d);
    } catch (e: any) { setQrResult({ success: false, error: e.message }); }
    setQrLoading(false);
  };

  const tabStyle = (active: boolean) => ({
    padding: '0.45rem 1rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
    background: active ? '#6C63FF' : 'rgba(255,255,255,0.05)', color: active ? 'white' : '#94a3b8',
  } as React.CSSProperties);

  const filteredOrders = orders.filter(o =>
    orderFilter === 'all' ? true : orderFilter === 'paid' ? o.status === 'paid' : o.status !== 'paid'
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', margin: 0 }}>💳 إدارة المدفوعات</h1>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button style={tabStyle(tab === 'orders')} onClick={() => { setTab('orders'); loadOrders(); }}>📋 الطلبات</button>
          <button style={tabStyle(tab === 'design')} onClick={() => setTab('design')}>🎫 تصميم التذكرة</button>
          <button style={tabStyle(tab === 'qr')} onClick={() => setTab('qr')}>📷 مسح QR</button>
          <button style={tabStyle(tab === 'settings')} onClick={() => setTab('settings')}>⚙️ الإعدادات</button>
        </div>
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef444440', borderRadius: '0.5rem', padding: '0.75rem', color: '#fca5a5' }}>❌ {error}</div>}
      {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.5rem', padding: '0.75rem', color: '#86efac' }}>{success}</div>}

      {/* ── Settings Tab ── */}
      {tab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Notice: Sham Cash disabled */}
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '0.6rem', padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.85rem', color: '#fcd34d' }}>
            <span style={{ fontSize: '1.1rem' }}>⚠️</span>
            <div>شام كاش معطّل مؤقتاً. طريقة الدفع الحالية: <strong>واتساب (تأكيد يدوي)</strong></div>
          </div>

          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: 'white', margin: 0, fontWeight: 700 }}>🔘 تفعيل الدفع</h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={!!settings.payments_enabled}
                  onChange={e => setSettings((s: any) => ({ ...s, payments_enabled: e.target.checked ? 1 : 0 }))}
                  style={{ accentColor: '#6C63FF', width: 18, height: 18 }} />
                <span style={{ color: settings.payments_enabled ? '#86efac' : '#94a3b8', fontWeight: 600 }}>
                  {settings.payments_enabled ? '✅ مفعّل' : '❌ معطّل'}
                </span>
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={S.label}>طريقة الدفع</label>
                <select style={S.inp} value={settings.gateway || 'whatsapp'} onChange={e => setSettings((s: any) => ({ ...s, gateway: e.target.value }))}>
                  <option value="whatsapp">📱 واتساب (تأكيد يدوي)</option>
                  <option value="manual">📋 تحويل يدوي بدون واتساب</option>
                  <option value="shamcash" disabled>🏦 شام كاش (غير متاح حالياً)</option>
                </select>
              </div>
              <div>
                <label style={S.label}>العملة</label>
                <select style={S.inp} value={settings.currency || 'USD'} onChange={e => setSettings((s: any) => ({ ...s, currency: e.target.value }))}>
                  <option value="USD">$ دولار أمريكي</option>
                  <option value="SYP">ل.س ليرة سورية</option>
                  <option value="SAR">﷼ ريال سعودي</option>
                  <option value="TRY">₺ ليرة تركية</option>
                </select>
              </div>
            </div>
          </div>

          {/* WhatsApp settings */}
          {(settings.gateway === 'whatsapp' || !settings.gateway || settings.gateway === 'shamcash') && (
            <div style={S.card}>
              <h3 style={{ color: '#25D366', margin: '0 0 1rem', fontWeight: 700, fontSize: '1rem' }}>📱 إعدادات واتساب</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={S.label}>رقم واتساب (مع كود الدولة)</label>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>مثال:</span>
                    <input style={S.inp} value={settings.whatsapp_number || ''} dir="ltr"
                      onChange={e => setSettings((s: any) => ({ ...s, whatsapp_number: e.target.value.replace(/\s/g, '') }))}
                      placeholder="+963912345678" />
                  </div>
                  <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0.3rem 0 0' }}>
                    أدخل الرقم مع كود الدولة (+ ثم الكود ثم الرقم) بدون مسافات
                  </p>
                </div>
                <div>
                  <label style={S.label}>نص رسالة الدفع التلقائية</label>
                  <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '0 0 0.5rem' }}>
                    هذا النص سيُرسل عبر واتساب تلقائياً. يمكنك تعديله بأي شكل تريد.
                  </p>
                  <textarea rows={6} style={{ ...S.inp, resize: 'vertical', fontSize: '0.88rem', lineHeight: 1.6 }}
                    value={settings.whatsapp_message_template || ''}
                    onChange={e => setSettings((s: any) => ({ ...s, whatsapp_message_template: e.target.value }))}
                    dir="rtl" />
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>أضف تلقائياً:</span>
                    {[
                      { label: 'اسم المسجل', tag: '{name}' },
                      { label: 'رقم التذكرة', tag: '{order_ref}' },
                      { label: 'المبلغ', tag: '{amount}' },
                    ].map(item => (
                      <button key={item.tag} type="button"
                        onClick={() => setSettings((s: any) => ({ ...s, whatsapp_message_template: (s.whatsapp_message_template || '') + item.tag }))}
                        style={{ padding: '0.15rem 0.5rem', background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', borderRadius: '0.3rem', color: '#4ade80', fontSize: '0.72rem', cursor: 'pointer' }}>
                        + {item.label}
                      </button>
                    ))}
                    <button type="button"
                      onClick={() => setSettings((s: any) => ({ ...s, whatsapp_message_template: `مرحباً،\nأريد إتمام دفع تسجيلي في الحدث.\nالاسم: {name}\nرقم التذكرة: {order_ref}\nبانتظار تأكيدكم، شكراً.` }))}
                      style={{ padding: '0.15rem 0.5rem', background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: '0.3rem', color: '#a5b4fc', fontSize: '0.72rem', cursor: 'pointer' }}>
                      ↺ استعادة الافتراضي
                    </button>
                  </div>
                  {/* Live preview */}
                  {settings.whatsapp_number && settings.whatsapp_message_template && (
                    <div style={{ marginTop: '0.75rem', background: '#075e54', borderRadius: '0.5rem', padding: '0.75rem', fontSize: '0.82rem' }}>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', marginBottom: '0.4rem' }}>👁 معاينة الرسالة:</div>
                      <div style={{ background: '#dcf8c6', color: '#000', borderRadius: '8px 0 8px 8px', padding: '0.5rem 0.75rem', fontSize: '0.82rem', lineHeight: 1.6, direction: 'rtl', whiteSpace: 'pre-wrap', maxWidth: 280 }}>
                        {(settings.whatsapp_message_template || '')
                          .replace('{name}', 'محمد أحمد')
                          .replace('{order_ref}', 'TKT-ABC123')
                          .replace('{amount}', '50')
                          .replace('{currency}', settings.currency || 'USD')}
                      </div>
                    </div>
                  )}
                </div>
                {settings.whatsapp_number && (
                  <div style={{ background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.25)', borderRadius: '0.5rem', padding: '0.75rem', fontSize: '0.82rem', color: '#86efac' }}>
                    ✅ رابط واتساب: <a href={`https://wa.me/${settings.whatsapp_number.replace(/\+/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#4ade80', direction: 'ltr', display: 'inline-block' }}>
                      wa.me/{settings.whatsapp_number.replace(/\+/g, '')}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* UI texts */}
          <div style={S.card}>
            <h3 style={{ color: 'white', margin: '0 0 1rem', fontWeight: 700, fontSize: '1rem' }}>📝 نصوص صفحة الدفع</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div><label style={S.label}>عنوان صفحة الدفع</label>
                <input style={S.inp} value={settings.payment_title || ''} onChange={e => setSettings((s: any) => ({ ...s, payment_title: e.target.value }))} /></div>
              <div><label style={S.label}>النص التوضيحي</label>
                <input style={S.inp} value={settings.payment_subtitle || ''} onChange={e => setSettings((s: any) => ({ ...s, payment_subtitle: e.target.value }))} /></div>
              <div><label style={S.label}>رسالة بعد إرسال طلب الدفع</label>
                <input style={S.inp} value={settings.success_message || ''} onChange={e => setSettings((s: any) => ({ ...s, success_message: e.target.value }))} /></div>
            </div>
          </div>

          <button style={{ ...S.btn(), alignSelf: 'flex-start', padding: '0.6rem 2rem' }} onClick={saveSettings} disabled={loading}>
            {loading ? 'جار الحفظ...' : '💾 حفظ الإعدادات'}
          </button>
        </div>
      )}

      {/* ── Orders Tab ── */}
      {tab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Revenue summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {[
              { label: 'إجمالي الطلبات', value: orders.length, color: '#a5b4fc' },
              { label: 'المدفوعة', value: orders.filter(o => o.status === 'paid').length, color: '#86efac' },
              { label: 'إجمالي الإيرادات', value: `$${revenue.toFixed(0)}`, color: '#fcd34d' },
            ].map(s => (
              <div key={s.label} style={{ ...S.card, textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {[
              { v: 'all', l: `الكل (${orders.length})` },
              { v: 'paid', l: `✅ دفع (${orders.filter(o => o.status === 'paid').length})` },
              { v: 'pending', l: `⏳ لم يدفع (${orders.filter(o => o.status !== 'paid').length})` },
            ].map(f => (
              <button key={f.v} onClick={() => setOrderFilter(f.v as any)}
                style={{ ...tabStyle(orderFilter === f.v), fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}>
                {f.l}
              </button>
            ))}
          </div>

          {ordersLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>⏳ جار التحميل...</div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', ...S.card }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💳</div>
              <p>{orderFilter === 'paid' ? 'لا يوجد دافعون بعد' : orderFilter === 'pending' ? 'الجميع دفع 🎉' : 'لا توجد طلبات دفع بعد'}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredOrders.map(order => {
                const st = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
                return (
                  <div key={order.id} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ minWidth: 200 }}>
                      <div style={{ fontWeight: 700, color: 'white', fontSize: '0.92rem' }}>{order.customer_name}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{order.customer_email}</div>
                      <div style={{ fontFamily: 'monospace', color: '#6C63FF', fontSize: '0.72rem', marginTop: 4 }}>{order.order_ref}</div>
                      {order.paid_at && <div style={{ color: '#64748b', fontSize: '0.7rem' }}>دفع: {new Date(order.paid_at).toLocaleString('ar-SA')}</div>}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>${order.amount}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{order.currency}</div>
                    </div>
                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, background: st.bg, color: st.color }}>
                      {st.label}
                    </span>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {order.status === 'pending' && (
                        <button onClick={() => updateOrderStatus(order.id, 'paid')} style={{ ...S.btn('#10b981'), fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}>✅ تأكيد</button>
                      )}
                      {order.status === 'paid' && (
                        <button onClick={() => resendTicket(order.id)} disabled={sendingTicket === order.id}
                          style={{ ...S.btn('#3b82f6'), fontSize: '0.75rem', padding: '0.3rem 0.65rem', opacity: sendingTicket === order.id ? 0.6 : 1 }}>
                          {sendingTicket === order.id ? '⏳...' : '📧 إعادة التذكرة'}
                        </button>
                      )}
                      {order.status === 'pending' && (
                        <button onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          style={{ background: 'rgba(239,68,68,0.12)', color: '#fca5a5', border: '1px solid #ef444440', borderRadius: '0.3rem', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem' }}>إلغاء</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── QR Scanner Tab ── */}
      {tab === 'qr' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 520 }}>
          <div style={S.card}>
            <div style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: '1rem' }}>📷 التحقق من تذكرة بالـ QR</div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input style={{ ...S.inp, flex: 1 }} value={qrInput} onChange={e => setQrInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && verifyQr()}
                placeholder="الصق رمز التذكرة أو امسح QR..." dir="ltr" />
              <button style={S.btn()} onClick={verifyQr} disabled={qrLoading || !qrInput.trim()}>
                {qrLoading ? '⏳' : '🔍 فحص'}
              </button>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.75rem' }}>
              يمكنك لصق رمز التذكرة مباشرة، أو استخدام ماسح QR خارجي يرسل النص لهذا الحقل
            </p>
          </div>

          {qrResult && (
            <div style={{ ...S.card, border: `1px solid ${qrResult.success && qrResult.data?.valid ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.4)'}` }}>
              {!qrResult.success || !qrResult.data?.valid ? (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>❌</div>
                  <div style={{ color: '#fca5a5', fontWeight: 700 }}>تذكرة غير صالحة</div>
                  <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: 6 }}>{qrResult.error || 'لم يتم الدفع أو التذكرة غير موجودة'}</div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '2.5rem' }}>✅</div>
                    <div>
                      <div style={{ color: '#86efac', fontWeight: 700, fontSize: '1rem' }}>تذكرة صالحة — تم الدفع</div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                        {qrResult.data.paid_at ? `دفع بتاريخ: ${new Date(qrResult.data.paid_at).toLocaleString('ar-SA')}` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                    {[
                      { label: 'اسم الدافع', value: qrResult.data.customer_name },
                      { label: 'البريد', value: qrResult.data.customer_email },
                      { label: 'رقم التذكرة', value: qrResult.data.order_ref },
                      { label: 'المبلغ', value: `$${qrResult.data.amount}` },
                    ].map(item => (
                      <div key={item.label} style={{ background: 'rgba(16,185,129,0.06)', padding: '0.6rem 0.75rem', borderRadius: '0.4rem' }}>
                        <div style={{ color: '#86efac', fontSize: '0.7rem', marginBottom: 2 }}>{item.label}</div>
                        <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: 600 }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                  {qrResult.data.registration && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(108,99,255,0.08)', borderRadius: '0.5rem', border: '1px solid rgba(108,99,255,0.2)' }}>
                      <div style={{ color: '#a5b4fc', fontSize: '0.75rem', fontWeight: 700, marginBottom: 6 }}>📋 بيانات التسجيل</div>
                      {[
                        { label: 'الاسم', value: qrResult.data.registration.full_name },
                        { label: 'نوع التسجيل', value: qrResult.data.registration.reg_type },
                        qrResult.data.registration.company_name && { label: 'الشركة', value: qrResult.data.registration.company_name },
                        qrResult.data.registration.city && { label: 'المدينة', value: qrResult.data.registration.city },
                      ].filter(Boolean).map((item: any) => (
                        <div key={item.label} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.82rem', marginBottom: 3 }}>
                          <span style={{ color: '#64748b', minWidth: 70 }}>{item.label}:</span>
                          <span style={{ color: 'white' }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Ticket Design Tab ── */}
      {tab === 'design' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ fontWeight: 700, color: 'white', fontSize: '1.05rem' }}>🎨 تصميم التذكرة</div>
              <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 2 }}>خصّص شكل التذكرة — تُرسل للمسجّل عبر البريد عند تأكيد الدفع</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <a href={`${API_BASE}/api/events/${eventId}/tickets-design/preview`} target="_blank" rel="noopener noreferrer"
                style={{ ...S.btn('rgba(255,255,255,0.07)'), color: '#a5b4fc', textDecoration: 'none', border: '1px solid rgba(108,99,255,0.3)', padding: '0.45rem 1rem' }}>
                🔗 فتح معاينة كاملة
              </a>
              <button style={{ ...S.btn(), padding: '0.45rem 1.25rem' }} onClick={saveDesign} disabled={loading}>
                {loading ? '⏳ حفظ...' : '💾 حفظ التصميم'}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.25rem', alignItems: 'start' }}>
            {/* ── Controls panel ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

              {/* Colors */}
              <div style={S.card}>
                <div style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: '0.85rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  🎨 الألوان
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  {[
                    { key: 'bg_color',      label: 'الخلفية',    hint: 'لون جسم التذكرة' },
                    { key: 'primary_color', label: 'الرئيسي',    hint: 'شريط الهيدر والأزرار' },
                    { key: 'text_color',    label: 'النص',       hint: 'لون الاسم والقيم' },
                    { key: 'accent_color',  label: 'المميز',     hint: 'التسميات والأيقونات' },
                  ].map(f => (
                    <div key={f.key} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem', padding: '0.6rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <label style={{ color: '#94a3b8', fontSize: '0.68rem', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>{f.label}</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ position: 'relative', width: 32, height: 32, flexShrink: 0 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '0.35rem', background: design[f.key] || '#000', border: '2px solid rgba(255,255,255,0.15)', cursor: 'pointer' }} />
                          <input type="color" value={design[f.key] || '#000000'}
                            onChange={e => setDesign((d: any) => ({ ...d, [f.key]: e.target.value }))}
                            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                        </div>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'white' }}>{design[f.key]}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Color presets */}
                <div style={{ marginTop: '0.85rem' }}>
                  <div style={{ color: '#64748b', fontSize: '0.68rem', marginBottom: '0.4rem', fontWeight: 600 }}>قوالب جاهزة</div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {[
                      { name: 'بنفسجي غامق', bg: '#0f0c24', primary: '#6C63FF', text: '#ffffff', accent: '#a5b4fc' },
                      { name: 'أزرق ليلي',   bg: '#0a1628', primary: '#3b82f6', text: '#ffffff', accent: '#93c5fd' },
                      { name: 'أخضر زمردي',  bg: '#0a1f1a', primary: '#10b981', text: '#ffffff', accent: '#6ee7b7' },
                      { name: 'ذهبي ملكي',   bg: '#1a1200', primary: '#d97706', text: '#ffffff', accent: '#fcd34d' },
                      { name: 'أحمر دامسق',  bg: '#1a0808', primary: '#dc2626', text: '#ffffff', accent: '#fca5a5' },
                    ].map(p => (
                      <button key={p.name} title={p.name}
                        onClick={() => setDesign((d: any) => ({ ...d, bg_color: p.bg, primary_color: p.primary, text_color: p.text, accent_color: p.accent }))}
                        style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', cursor: 'pointer',
                          background: `linear-gradient(135deg, ${p.bg} 50%, ${p.primary} 50%)` }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Logo */}
              <div style={S.card}>
                <div style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: '0.75rem', fontSize: '0.85rem' }}>🖼 الشعار (Logo)</div>
                <label style={S.label}>رابط صورة الشعار</label>
                <input style={S.inp} value={design.logo_url || ''} placeholder="https://..."
                  onChange={e => setDesign((d: any) => ({ ...d, logo_url: e.target.value }))} dir="ltr" />
                <div style={{ color: '#475569', fontSize: '0.7rem', marginTop: '0.35rem' }}>يظهر في أعلى التذكرة. اتركه فارغاً لإخفائه</div>
              </div>

              {/* Texts */}
              <div style={S.card}>
                <div style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: '0.75rem', fontSize: '0.85rem' }}>📝 النصوص</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {[
                    { key: 'header_subtitle', label: 'العنوان الفرعي للتذكرة', placeholder: 'تذكرة الحضور الرسمية' },
                    { key: 'footer_text', label: 'تعليمات الدخول', placeholder: 'أبرز هذه التذكرة عند الدخول' },
                    { key: 'footer_note', label: 'ملاحظة إضافية (اختياري)', placeholder: '' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={S.label}>{f.label}</label>
                      <input style={S.inp} value={design[f.key] || ''} placeholder={f.placeholder}
                        onChange={e => setDesign((d: any) => ({ ...d, [f.key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Email */}
              <div style={S.card}>
                <div style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: '0.75rem', fontSize: '0.85rem' }}>📧 إعدادات البريد</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  <div>
                    <label style={S.label}>موضوع الرسالة</label>
                    <input style={S.inp} value={design.email_subject || ''} onChange={e => setDesign((d: any) => ({ ...d, email_subject: e.target.value }))} />
                  </div>
                  <div>
                    <label style={S.label}>مقدمة الرسالة (تظهر فوق التذكرة)</label>
                    <textarea rows={3} style={{ ...S.inp, resize: 'vertical' }} value={design.email_intro || ''}
                      onChange={e => setDesign((d: any) => ({ ...d, email_intro: e.target.value }))} />
                  </div>
                </div>
              </div>

              {/* Display options */}
              <div style={S.card}>
                <div style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: '0.75rem', fontSize: '0.85rem' }}>👁 حقول تظهر في التذكرة</div>
                {[
                  { key: 'show_event_date',        label: '📅 تاريخ الحدث' },
                  { key: 'show_venue',             label: '📍 مكان الحدث' },
                  { key: 'show_registration_type', label: '🏷 نوع التسجيل' },
                  { key: 'show_ticket_number',     label: '🔢 رقم التذكرة' },
                ].map(f => (
                  <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', padding: '0.3rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div onClick={() => setDesign((d: any) => ({ ...d, [f.key]: d[f.key] ? 0 : 1 }))}
                      style={{ width: 36, height: 20, borderRadius: 10, background: design[f.key] ? '#6C63FF' : 'rgba(255,255,255,0.1)',
                        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                        border: `1px solid ${design[f.key] ? '#6C63FF' : 'rgba(255,255,255,0.15)'}` }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'white',
                        position: 'absolute', top: 2, left: design[f.key] ? 19 : 2, transition: 'left 0.2s' }} />
                    </div>
                    <span style={{ fontSize: '0.82rem', color: design[f.key] ? 'white' : '#64748b' }}>{f.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ── Live Preview ── */}
            <div style={{ position: 'sticky', top: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ fontWeight: 700, color: '#a5b4fc', fontSize: '0.85rem' }}>👁 معاينة مباشرة</div>
                <span style={{ fontSize: '0.7rem', color: '#475569', background: 'rgba(255,255,255,0.04)', padding: '0.2rem 0.6rem', borderRadius: '0.3rem' }}>تتحدث تلقائياً</span>
              </div>

              {/* Ticket preview - mirrors buildTicketHtml */}
              <div style={{
                background: design.bg_color || '#0f0c24',
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: `0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px ${design.primary_color || '#6C63FF'}35`,
                direction: 'rtl',
                fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
              }}>
                {/* Header */}
                <div style={{
                  background: `linear-gradient(135deg, ${design.primary_color || '#6C63FF'} 0%, ${design.primary_color || '#6C63FF'}aa 100%)`,
                  padding: '20px 22px',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}>
                  {design.logo_url ? (
                    <img src={design.logo_url} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.25)', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 56, height: 56, borderRadius: 10, background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>🎫</div>
                  )}
                  <div>
                    <div style={{ color: 'white', fontWeight: 900, fontSize: '1.2rem', lineHeight: 1.2 }}>{design.header_title || 'اسم الحدث'}</div>
                    <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem', marginTop: 4 }}>{design.header_subtitle || 'تذكرة الحضور الرسمية'}</div>
                  </div>
                </div>

                {/* Wave */}
                <div style={{ height: 16, background: design.bg_color || '#0f0c24', WebkitMask: 'radial-gradient(circle at 50% 0%, transparent 10px, black 11px)', mask: 'radial-gradient(circle at 50% 0%, transparent 10px, black 11px)' }} />

                {/* Body */}
                <div style={{ padding: '16px 22px' }}>
                  {/* Attendee */}
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: design.text_color || '#ffffff', marginBottom: 4 }}>أحمد محمد الشريف</div>
                  <div style={{ fontSize: '0.72rem', color: design.accent_color || '#a5b4fc', marginBottom: 12 }}>🏢 شركة المثال للتقنية</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 700, background: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b40', marginBottom: 14 }}>🚀 شركة ناشئة</div>

                  {/* Info grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                    {design.show_event_date ? (
                      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '9px 12px', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ fontSize: '0.58rem', color: (design.accent_color || '#a5b4fc') + '99', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>📅 تاريخ الحدث</div>
                        <div style={{ fontSize: '0.78rem', color: design.text_color || '#fff', fontWeight: 700 }}>الجمعة ١٥ مايو ٢٠٢٦</div>
                      </div>
                    ) : null}
                    {design.show_venue ? (
                      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '9px 12px', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ fontSize: '0.58rem', color: (design.accent_color || '#a5b4fc') + '99', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>📍 المكان</div>
                        <div style={{ fontSize: '0.78rem', color: design.text_color || '#fff', fontWeight: 700 }}>دمشق، سوريا</div>
                      </div>
                    ) : null}
                    {design.show_ticket_number ? (
                      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '9px 12px', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ fontSize: '0.58rem', color: (design.accent_color || '#a5b4fc') + '99', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>🎫 رقم التذكرة</div>
                        <div style={{ fontSize: '0.7rem', color: design.text_color || '#fff', fontWeight: 700, fontFamily: 'monospace' }}>TKT-PREVIEW-001</div>
                      </div>
                    ) : null}
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '9px 12px', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ fontSize: '0.58rem', color: (design.accent_color || '#a5b4fc') + '99', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>💳 القيمة</div>
                      <div style={{ fontSize: '0.78rem', color: design.text_color || '#fff', fontWeight: 700 }}>50 USD</div>
                    </div>
                  </div>

                  {/* Perforated line */}
                  <div style={{ borderTop: `2px dashed ${design.primary_color || '#6C63FF'}30`, margin: '0 -2px 14px', position: 'relative' }} />
                </div>

                {/* QR Stub */}
                <div style={{ background: 'rgba(0,0,0,0.2)', borderTop: `1px solid ${design.primary_color || '#6C63FF'}18`, padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ background: 'white', borderRadius: 8, padding: 6, flexShrink: 0 }}>
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=PREVIEW&bgcolor=ffffff&color=000000&margin=4" alt="QR" style={{ width: 90, height: 90, display: 'block' }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.62rem', color: design.accent_color || '#a5b4fc', letterSpacing: '0.08em', marginBottom: 6, wordBreak: 'break-all' }}>TKT-PREVIEW-001</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{design.footer_text || 'أبرز هذه التذكرة عند الدخول'}</div>
                    <div style={{ fontSize: '0.65rem', color: design.primary_color || '#6C63FF', fontWeight: 700, marginTop: 5 }}>امسح رمز QR للتحقق ←</div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ background: `linear-gradient(90deg, ${design.primary_color || '#6C63FF'}15, transparent, ${design.primary_color || '#6C63FF'}15)`, borderTop: `1px solid ${design.primary_color || '#6C63FF'}18`, padding: '10px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: design.accent_color || '#a5b4fc', fontWeight: 600 }}>{design.header_title || 'اسم الحدث'}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)' }}>TKT-PREVIEW-001</span>
                </div>
              </div>

              {/* Open full preview */}
              <a href={`${API_BASE}/api/events/${eventId}/tickets-design/preview`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.75rem', padding: '0.55rem', background: 'rgba(108,99,255,0.07)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '0.5rem', textDecoration: 'none', color: '#a5b4fc', fontSize: '0.8rem', fontWeight: 600 }}>
                🔍 فتح معاينة التذكرة الكاملة في تبويب جديد
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
