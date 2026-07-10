'use client';
import { useState, useEffect } from 'react';
import { fetchTerms, updateTerms } from '@/lib/api';

const S = {
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem', colorScheme: 'dark' } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 } as React.CSSProperties),
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '0.8rem', padding: '1.25rem' } as React.CSSProperties,
  label: { fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block', fontWeight: 600 } as React.CSSProperties,
};

export default function AdminTerms({ eventId, token }: { eventId: number; token: string }) {
  const [form, setForm] = useState({ terms_content: '', privacy_content: '', show_in_footer: 1 });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');

  useEffect(() => {
    fetchTerms(eventId).then(res => {
      if (res.data) setForm({ terms_content: res.data.terms_content || '', privacy_content: res.data.privacy_content || '', show_in_footer: res.data.show_in_footer ?? 1 });
    }).catch(() => {});
  }, [eventId]);

  const handleSave = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      await updateTerms(eventId, form, token);
      setSuccess('✅ تم الحفظ بنجاح');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e.message || 'فشل الحفظ');
    } finally { setLoading(false); }
  };

  const tabStyle = (active: boolean) => ({
    padding: '0.5rem 1.25rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem',
    background: active ? '#6C63FF' : 'rgba(255,255,255,0.05)', color: active ? 'white' : '#94a3b8',
  } as React.CSSProperties);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', margin: 0 }}>⚖️ الشروط والأحكام</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.show_in_footer === 1}
              onChange={e => setForm(f => ({ ...f, show_in_footer: e.target.checked ? 1 : 0 }))}
              style={{ accentColor: '#6C63FF', width: 16, height: 16 }} />
            عرض روابط في الفوتر
          </label>
          <button style={S.btn()} onClick={handleSave} disabled={loading}>{loading ? 'جار الحفظ...' : 'حفظ'}</button>
        </div>
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', padding: '0.75rem', color: '#fca5a5' }}>❌ {error}</div>}
      {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.5rem', padding: '0.75rem', color: '#86efac' }}>{success}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(108,99,255,0.15)', paddingBottom: '0.75rem' }}>
        <button style={tabStyle(activeTab === 'terms')} onClick={() => setActiveTab('terms')}>📋 الشروط والأحكام</button>
        <button style={tabStyle(activeTab === 'privacy')} onClick={() => setActiveTab('privacy')}>🔒 سياسة الخصوصية</button>
      </div>

      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <label style={S.label}>{activeTab === 'terms' ? 'نص الشروط والأحكام (HTML مدعوم)' : 'نص سياسة الخصوصية (HTML مدعوم)'}</label>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>يمكنك استخدام &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;strong&gt;, &lt;a&gt; ...</span>
        </div>
        <textarea
          rows={20}
          style={{ ...S.inp, fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.6, resize: 'vertical' }}
          value={activeTab === 'terms' ? form.terms_content : form.privacy_content}
          onChange={e => setForm(f => activeTab === 'terms' ? { ...f, terms_content: e.target.value } : { ...f, privacy_content: e.target.value })}
          placeholder={activeTab === 'terms' ? '<h2>الشروط والأحكام</h2>\n<p>نص الشروط هنا...</p>' : '<h2>سياسة الخصوصية</h2>\n<p>نص السياسة هنا...</p>'}
          dir="rtl"
        />

        {/* Preview */}
        {(activeTab === 'terms' ? form.terms_content : form.privacy_content) && (
          <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(108,99,255,0.15)', paddingTop: '1rem' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.5rem' }}>معاينة:</div>
            <div style={{ color: '#d1d5db', lineHeight: 1.8, fontSize: '0.9rem' }}
              dangerouslySetInnerHTML={{ __html: activeTab === 'terms' ? form.terms_content : form.privacy_content }} />
          </div>
        )}
      </div>
    </div>
  );
}
