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
    }).then(r => r.json()).then(d => { if (d.data) setSettings((s: any) => ({ ...s, ...d.data })); }).catch(() => {});

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
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: 'white', margin: 0, fontWeight: 700 }}>🔘 تفعيل الدفع الإلكتروني</h3>
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
              <div><label style={S.label}>بوابة الدفع</label>
                <select style={S.inp} value={settings.gateway} onChange={e => setSettings((s: any) => ({ ...s, gateway: e.target.value }))}>
                  <option value="shamcash">🏦 شام كاش (Sham Cash)</option>
                  <option value="manual">📲 تحويل يدوي</option>
                </select></div>
              <div><label style={S.label}>العملة</label>
                <select style={S.inp} value={settings.currency} onChange={e => setSettings((s: any) => ({ ...s, currency: e.target.value }))}>
                  <option value="USD">$ دولار أمريكي</option>
                  <option value="SYP">ل.س ليرة سورية</option>
                  <option value="SAR">﷼ ريال سعودي</option>
                </select></div>
            </div>
          </div>

          {/* Sham Cash credentials */}
          {settings.gateway === 'shamcash' && (
            <div style={S.card}>
              <h3 style={{ color: '#6C63FF', margin: '0 0 1rem', fontWeight: 700, fontSize: '1rem' }}>🏦 بيانات شام كاش</h3>
              <div style={{ background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.82rem', color: '#94a3b8' }}>
                💡 احصل على بيانات الـ API من لوحة تحكم شام كاش للتجار على <strong style={{ color: '#a5b4fc' }}>shamcash.com/merchant</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div><label style={S.label}>Merchant ID</label>
                  <input style={S.inp} value={settings.shamcash_merchant_id || ''} onChange={e => setSettings((s: any) => ({ ...s, shamcash_merchant_id: e.target.value }))} placeholder="مثال: MC-12345" dir="ltr" /></div>
                <div><label style={S.label}>API Key</label>
                  <input style={S.inp} type="password" value={settings.shamcash_api_key || ''} onChange={e => setSettings((s: any) => ({ ...s, shamcash_api_key: e.target.value }))} placeholder="sk_live_..." dir="ltr" /></div>
                <div><label style={S.label}>Secret Key (للـ Webhook)</label>
                  <input style={S.inp} type="password" value={settings.shamcash_secret_key || ''} onChange={e => setSettings((s: any) => ({ ...s, shamcash_secret_key: e.target.value }))} placeholder="whsec_..." dir="ltr" /></div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#94a3b8', fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={!!settings.shamcash_sandbox}
                    onChange={e => setSettings((s: any) => ({ ...s, shamcash_sandbox: e.target.checked ? 1 : 0 }))}
                    style={{ accentColor: '#f59e0b' }} />
                  وضع التجربة (Sandbox) — فعّله للاختبار، أوقفه للإنتاج
                </label>
              </div>
              <div style={{ marginTop: '1rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '0.5rem', padding: '0.75rem', fontSize: '0.8rem', color: '#fcd34d' }}>
                🔗 رابط الـ Webhook لضبطه في شام كاش:<br />
                <code style={{ fontSize: '0.75rem', wordBreak: 'break-all', color: '#a5b4fc' }}>
                  https://event-api.info1703.workers.dev/api/events/{eventId}/payments/webhook
                </code>
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
              <div><label style={S.label}>رسالة النجاح بعد الدفع</label>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Design form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={S.card}>
                <div style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: '0.75rem' }}>🎨 الألوان</div>
                {[
                  { key: 'bg_color', label: 'لون الخلفية' },
                  { key: 'primary_color', label: 'اللون الرئيسي' },
                  { key: 'text_color', label: 'لون النص' },
                  { key: 'accent_color', label: 'اللون المميز' },
                ].map(f => (
                  <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <input type="color" value={design[f.key] || '#000000'}
                      onChange={e => setDesign((d: any) => ({ ...d, [f.key]: e.target.value }))}
                      style={{ width: 36, height: 36, borderRadius: '0.3rem', border: 'none', cursor: 'pointer', background: 'none' }} />
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{f.label}</div>
                      <div style={{ color: 'white', fontSize: '0.78rem', fontFamily: 'monospace' }}>{design[f.key]}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <div style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: '0.75rem' }}>📝 النصوص</div>
                {[
                  { key: 'header_title', label: 'العنوان الرئيسي' },
                  { key: 'header_subtitle', label: 'العنوان الفرعي' },
                  { key: 'footer_text', label: 'نص الفوتر' },
                  { key: 'footer_note', label: 'ملاحظة (اختياري)' },
                  { key: 'email_subject', label: 'موضوع البريد' },
                  { key: 'email_intro', label: 'مقدمة البريد' },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: '0.6rem' }}>
                    <label style={S.label}>{f.label}</label>
                    <input style={S.inp} value={design[f.key] || ''}
                      onChange={e => setDesign((d: any) => ({ ...d, [f.key]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <div style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: '0.75rem' }}>👁️ خيارات العرض</div>
                {[
                  { key: 'show_event_date', label: 'تاريخ الحدث' },
                  { key: 'show_venue', label: 'مكان الحدث' },
                  { key: 'show_registration_type', label: 'نوع التسجيل' },
                  { key: 'show_ticket_number', label: 'رقم التذكرة' },
                ].map(f => (
                  <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.4rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                    <input type="checkbox" checked={!!design[f.key]}
                      onChange={e => setDesign((d: any) => ({ ...d, [f.key]: e.target.checked ? 1 : 0 }))}
                      style={{ accentColor: '#6C63FF' }} />
                    {f.label}
                  </label>
                ))}
              </div>
              <button style={{ ...S.btn(), padding: '0.6rem 2rem' }} onClick={saveDesign} disabled={loading}>
                {loading ? '...' : '💾 حفظ التصميم'}
              </button>
            </div>

            {/* Preview */}
            <div>
              <div style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: '0.75rem', fontSize: '0.85rem' }}>👁️ معاينة التذكرة</div>
              <div style={{ background: design.bg_color, borderRadius: 12, overflow: 'hidden', border: `1px solid ${design.primary_color}50`, fontSize: '0.8rem' }}>
                <div style={{ background: `linear-gradient(135deg, ${design.primary_color}, ${design.primary_color}cc)`, padding: '20px', textAlign: 'center' }}>
                  {design.logo_url && <img src={design.logo_url} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 8px', display: 'block' }} />}
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>{design.header_title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', marginTop: 3 }}>{design.header_subtitle}</div>
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{ fontWeight: 700, color: design.text_color, fontSize: '1rem', marginBottom: 4 }}>محمد أحمد</div>
                  <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: '0.7rem', background: design.primary_color + '25', color: design.accent_color, border: `1px solid ${design.primary_color}50`, marginBottom: 12 }}>🚀 شركة ناشئة</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {design.show_event_date && <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: 8 }}>
                      <div style={{ color: design.accent_color, fontSize: '0.62rem', marginBottom: 2 }}>📅 التاريخ</div>
                      <div style={{ color: design.text_color, fontSize: '0.78rem', fontWeight: 600 }}>ديسمبر 2026</div>
                    </div>}
                    {design.show_venue && <div style={{ background: 'rgba(255,255,255,0.04)', padding: '8px', borderRadius: 8 }}>
                      <div style={{ color: design.accent_color, fontSize: '0.62rem', marginBottom: 2 }}>📍 المكان</div>
                      <div style={{ color: design.text_color, fontSize: '0.78rem', fontWeight: 600 }}>دمشق</div>
                    </div>}
                  </div>
                  <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    <div style={{ width: 80, height: 80, background: 'white', borderRadius: 8, margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#333' }}>QR Code</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: design.accent_color }}>ORD-XXXX-YYYY</div>
                  </div>
                </div>
                <div style={{ borderTop: `1px solid rgba(255,255,255,0.06)`, padding: '10px 16px', textAlign: 'center' }}>
                  <div style={{ color: design.accent_color, fontSize: '0.72rem', fontWeight: 600 }}>{design.footer_text}</div>
                  {design.footer_note && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.62rem', marginTop: 3 }}>{design.footer_note}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
