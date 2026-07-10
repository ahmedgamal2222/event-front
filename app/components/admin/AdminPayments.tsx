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

export default function AdminPayments({ eventId, token }: { eventId: number; token: string }) {
  const [tab, setTab] = useState<'settings' | 'orders'>('settings');
  const [settings, setSettings] = useState<any>({
    payments_enabled: 0, gateway: 'shamcash', currency: 'USD',
    shamcash_merchant_id: '', shamcash_api_key: '', shamcash_secret_key: '',
    shamcash_sandbox: 1, payment_title: 'إتمام الدفع',
    payment_subtitle: 'ادفع بأمان عبر شام كاش',
    success_message: 'تم الدفع بنجاح! شكراً لك.',
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const showMsg = (msg: string, isErr = false) => {
    if (isErr) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 3500);
  };

  useEffect(() => {
    fetch(`${API_BASE}/api/events/${eventId}/payments/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(d => { if (d.data) setSettings((s: any) => ({ ...s, ...d.data })); }).catch(() => {});
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

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      await fetch(`${API_BASE}/api/events/${eventId}/payments/orders/${orderId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      loadOrders();
      showMsg(status === 'paid' ? '✅ تم تأكيد الدفع وقبول التسجيل' : '✅ تم التحديث');
    } catch (e: any) { showMsg(e.message, true); }
  };

  const tabStyle = (active: boolean) => ({
    padding: '0.5rem 1.25rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem',
    background: active ? '#6C63FF' : 'rgba(255,255,255,0.05)', color: active ? 'white' : '#94a3b8',
  } as React.CSSProperties);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', margin: 0 }}>💳 إدارة المدفوعات</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={tabStyle(tab === 'settings')} onClick={() => setTab('settings')}>⚙️ الإعدادات</button>
          <button style={tabStyle(tab === 'orders')} onClick={() => setTab('orders')}>📋 الطلبات</button>
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

          {ordersLoading ? <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>⏳ جار التحميل...</div>
            : orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', ...S.card }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💳</div>
                <p>لا توجد طلبات دفع بعد</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {orders.map(order => {
                  const st = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
                  return (
                    <div key={order.id} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div style={{ minWidth: 200 }}>
                        <div style={{ fontWeight: 700, color: 'white', fontSize: '0.92rem' }}>{order.customer_name}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{order.customer_email}</div>
                        <div style={{ fontFamily: 'monospace', color: '#6C63FF', fontSize: '0.75rem', marginTop: 4 }}>{order.order_ref}</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>${order.amount}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{order.currency}</div>
                      </div>
                      <div>
                        <span style={{ padding: '0.25rem 0.75rem', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, background: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4 }}>
                          {new Date(order.created_at).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      {order.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button onClick={() => updateOrderStatus(order.id, 'paid')} style={{ ...S.btn('#10b981'), fontSize: '0.78rem', padding: '0.3rem 0.7rem' }}>✅ تأكيد الدفع</button>
                          <button onClick={() => updateOrderStatus(order.id, 'cancelled')} style={{ background: 'rgba(239,68,68,0.12)', color: '#fca5a5', border: '1px solid #ef444440', borderRadius: '0.3rem', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem' }}>إلغاء</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      )}
    </div>
  );
}
