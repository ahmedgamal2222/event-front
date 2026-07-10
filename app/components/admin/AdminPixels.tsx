'use client';

import { useState, useEffect } from 'react';
import { updatePixelCodes, fetchPixelCodes } from '@/lib/api';

interface AdminPixelsProps {
  eventId: number;
  token: string;
}

const S = {
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem', colorScheme: 'dark' } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 } as React.CSSProperties),
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '0.8rem', padding: '1.25rem' } as React.CSSProperties,
  label: { fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block', fontWeight: 600 } as React.CSSProperties,
  section: { background: '#13102a', border: '1px solid rgba(108,99,255,0.1)', borderRadius: '0.8rem', padding: '1rem', marginBottom: '1rem' } as React.CSSProperties,
};

const PIXEL_SECTIONS = [
  { id: 'facebook', label: 'Facebook Pixel', icon: '📘', color: '#1877F2' },
  { id: 'linkedin', label: 'LinkedIn Insight Tag', icon: '🔵', color: '#0A66C2' },
  { id: 'twitter', label: 'Twitter Conversion', icon: '𝕏', color: '#000000' },
  { id: 'gtag', label: 'Google Analytics', icon: '📊', color: '#E37400' },
  { id: 'custom', label: 'كود مخصص', icon: '⚙️', color: '#6366F1' },
];

export default function AdminPixels({ eventId, token }: AdminPixelsProps) {
  const [form, setForm] = useState({
    facebook_pixel_id: '',
    facebook_pixel_code: '',
    linkedin_pixel_id: '',
    linkedin_pixel_code: '',
    twitter_pixel_id: '',
    twitter_pixel_code: '',
    gtag_id: '',
    gtag_code: '',
    custom_pixel_code: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState('');

  // Auto-load existing pixel codes on mount
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetchPixelCodes(eventId);
        if (res.data) setForm(prev => ({ ...prev, ...res.data }));
      } catch { /* ignore */ } finally { setLoading(false); }
    };
    load();
  }, [eventId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess('');

    try {
      await updatePixelCodes(eventId, form, token);
      setSuccess('✅ تم حفظ الأكواد بنجاح');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل حفظ الأكواد');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadExisting = async () => {
    try {
      setLoading(true);
      const res = await fetchPixelCodes(eventId);
      if (res.data) {
        setForm(prev => ({ ...prev, ...res.data }));
        setSuccess('✅ تم تحميل الأكواد الموجودة');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل الأكواد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', margin: 0 }}>📊 البكسل والتتبع</h1>
        <button onClick={handleLoadExisting} disabled={loading} style={{ ...S.btn('#3b82f6'), opacity: loading ? 0.5 : 1 }} onMouseEnter={(e) => (e.currentTarget.style.background = '#1d4ed8')} onMouseLeave={(e) => (e.currentTarget.style.background = '#3b82f6')}>
          ⬇️ تحميل الموجود
        </button>
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#fca5a5', fontSize: '0.9rem' }}>❌ {error}</div>}
      {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#86efac', fontSize: '0.9rem' }}>{success}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {PIXEL_SECTIONS.map(section => (
          <div key={section.id} style={S.section}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{section.icon}</span>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', margin: 0 }}>{section.label}</h3>
            </div>

            {section.id === 'custom' ? (
              <div>
                <label style={S.label}>HTML/JavaScript مخصص</label>
                <textarea name="custom_pixel_code" value={form.custom_pixel_code} onChange={handleInputChange} placeholder="أضف أي كود تتبع مخصص هنا..." style={{ ...S.inp, minHeight: '120px' }} />
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>أضف أي كود HTML أو JavaScript إضافي</p>
              </div>
            ) : (
              <>
                <div>
                  <label style={S.label}>{section.id === 'gtag' ? 'Measurement ID' : section.id === 'facebook' ? 'Pixel ID' : section.id === 'linkedin' ? 'Partner ID' : 'Tracking ID'}</label>
                  <input type="text" name={`${section.id}_pixel_id`} value={(form as any)[`${section.id}_pixel_id`]} onChange={handleInputChange} placeholder={section.id === 'gtag' ? 'G-XXXXXXXXXX' : section.id === 'facebook' ? '123456789' : section.id === 'linkedin' ? '123456' : 'abc123'} style={S.inp} />
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>معرّف {section.label} الخاص بك</p>
                </div>

                <div>
                  <label style={S.label}>الكود الكامل</label>
                  <textarea name={`${section.id}_pixel_code`} value={(form as any)[`${section.id}_pixel_code`]} onChange={handleInputChange} placeholder={`<script>...</script>`} style={{ ...S.inp, minHeight: '100px', fontFamily: 'monospace', fontSize: '0.8rem' }} />
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>الكود الكامل من {section.label}</p>
                </div>
              </>
            )}
          </div>
        ))}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" disabled={loading} style={{ ...S.btn('#10b981'), opacity: loading ? 0.5 : 1 }} onMouseEnter={(e) => (e.currentTarget.style.background = '#059669')} onMouseLeave={(e) => (e.currentTarget.style.background = '#10b981')}>
            {loading ? '💾 جاري الحفظ...' : '💾 حفظ الأكواد'}
          </button>
        </div>
      </form>

      <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '0.8rem', padding: '1rem' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#93c5fd', margin: '0 0 0.75rem 0' }}>📝 ملاحظات مهمة:</h4>
        <ul style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.8, margin: 0, paddingLeft: '1.5rem' }}>
          <li>✓ يمكنك لصق الكود الكامل من كل منصة</li>
          <li>✓ ستُدرج جميع الأكواد تلقائياً في رأس الصفحة</li>
          <li>✓ يمكنك استخدام أكثر من بكسل واحد معاً</li>
          <li>✓ تحقق من أن الأكواد تعمل بعد الحفظ</li>
          <li>✓ استخدم الكود المخصص لأي تتبعات إضافية</li>
        </ul>
      </div>
    </div>
  );
}
