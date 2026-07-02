// app/components/admin/AdminEmailSettings.tsx
'use client';

import { useState, useEffect } from 'react';

interface EmailSettings {
  from_email: string;
  from_name: string;
  admin_email: string;
  admin_name: string;
  send_confirmations: boolean;
  send_admin_notifications: boolean;
  confirmation_message_startup: string;
  confirmation_message_member: string;
}

export default function AdminEmailSettings({ eventId, token: propToken }: { eventId: number; token?: string }) {
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<EmailSettings | null>(null);

  const getToken = () => propToken || (typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : '');

  useEffect(() => {
    loadSettings();
  }, [eventId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch(
        `https://event-api.info1703.workers.dev/api/events/${eventId}/email-settings`,
        { headers: { 'Authorization': `Bearer ${token}`, 'Cache-Control': 'no-store' } }
      );

      if (!response.ok) throw new Error('فشل تحميل الإعدادات');
      const data = await response.json();
      setSettings(data.data);
      setForm(data.data);
    } catch (err: any) {
      setError(err.message || 'خطأ في تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const token = getToken();
      const method = settings?.from_email ? 'PUT' : 'POST';
      const response = await fetch(
        `https://event-api.info1703.workers.dev/api/events/${eventId}/email-settings`,
        {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-store'
          },
          body: JSON.stringify(form)
        }
      );

      if (!response.ok) throw new Error('فشل حفظ الإعدادات');
      setSuccess('✅ تم حفظ إعدادات البريد بنجاح');
      await loadSettings();
    } catch (err: any) {
      setError(err.message || 'خطأ في الحفظ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-[var(--text-muted)]">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">⚙️ إعدادات البريد الإلكتروني</h3>
        <p className="text-[var(--text-muted)] text-sm">تعديل بيانات البريد الإلكتروني وإعدادات الإشعارات</p>
      </div>

      {error && (
        <div className="p-4 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sender Settings */}
        <div className="card">
          <h4 className="text-white font-semibold mb-4">📧 بيانات المرسل</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-2">بريد المرسل *</label>
              <input
                type="email"
                className="input-field"
                required
                value={form?.from_email || ''}
                onChange={e => setForm(f => f ? { ...f, from_email: e.target.value } : null)}
                placeholder="noreply@example.com"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-2">اسم المرسل *</label>
              <input
                type="text"
                className="input-field"
                required
                value={form?.from_name || ''}
                onChange={e => setForm(f => f ? { ...f, from_name: e.target.value } : null)}
                placeholder="S3 Summit"
              />
            </div>
          </div>
        </div>

        {/* Admin Settings */}
        <div className="card">
          <h4 className="text-white font-semibold mb-4">👨‍💼 بيانات الإدارة</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-2">بريد الإدارة *</label>
              <input
                type="email"
                className="input-field"
                required
                value={form?.admin_email || ''}
                onChange={e => setForm(f => f ? { ...f, admin_email: e.target.value } : null)}
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-2">اسم مسؤول الإدارة</label>
              <input
                type="text"
                className="input-field"
                value={form?.admin_name || ''}
                onChange={e => setForm(f => f ? { ...f, admin_name: e.target.value } : null)}
                placeholder="اسم المسؤول"
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card">
          <h4 className="text-white font-semibold mb-4">🔔 إعدادات الإشعارات</h4>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form?.send_confirmations ?? true}
                onChange={e => setForm(f => f ? { ...f, send_confirmations: e.target.checked } : null)}
                className="w-4 h-4 accent-[var(--primary)]"
              />
              <span className="text-[var(--text-muted)]">إرسال رسائل تأكيد التسجيل</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form?.send_admin_notifications ?? true}
                onChange={e => setForm(f => f ? { ...f, send_admin_notifications: e.target.checked } : null)}
                className="w-4 h-4 accent-[var(--primary)]"
              />
              <span className="text-[var(--text-muted)]">إرسال إشعارات الدعم الفني للإدارة</span>
            </label>
          </div>
        </div>

        {/* Custom Messages */}
        <div className="card">
          <h4 className="text-white font-semibold mb-4">💬 الرسائل المخصصة</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-2">رسالة تأكيد الشركات الناشئة</label>
              <textarea
                className="input-field"
                rows={4}
                value={form?.confirmation_message_startup || ''}
                onChange={e => setForm(f => f ? { ...f, confirmation_message_startup: e.target.value } : null)}
                placeholder="تم استلام طلب شركتك بنجاح..."
              />
              <p className="text-xs text-[var(--text-muted)] mt-2">💡 يظهر بعد تسجيل شركة ناشئة</p>
            </div>
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-2">رسالة تأكيد الأعضاء</label>
              <textarea
                className="input-field"
                rows={4}
                value={form?.confirmation_message_member || ''}
                onChange={e => setForm(f => f ? { ...f, confirmation_message_member: e.target.value } : null)}
                placeholder="شكراً لتسجيلك في الحدث..."
              />
              <p className="text-xs text-[var(--text-muted)] mt-2">💡 يظهر بعد تسجيل عضو عام</p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{ opacity: saving ? 0.7 : 1 }}
          >
            {saving ? '💾 جاري الحفظ...' : '💾 حفظ الإعدادات'}
          </button>
          <button
            type="button"
            onClick={loadSettings}
            className="btn-outline"
            disabled={saving}
          >
            ↻ إعادة تحميل
          </button>
        </div>
      </form>
    </div>
  );
}
