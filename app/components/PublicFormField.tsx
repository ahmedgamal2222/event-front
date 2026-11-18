'use client';
// app/components/PublicFormField.tsx – renders one dynamic form field
import { useState } from 'react';
import { uploadFormFile } from '../../lib/api';

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(148,163,184,0.28)',
  borderRadius: '0.6rem',
  padding: '0.7rem 0.9rem',
  color: 'var(--text, #e8eefc)',
  fontSize: '0.95rem',
  outline: 'none',
  fontFamily: 'inherit',
  colorScheme: 'dark',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.85rem',
  color: 'var(--text-muted, #9fb0c9)',
  marginBottom: '0.35rem',
  fontWeight: 700,
};

export default function PublicFormField({ field, value, onChange, slug }: { field: any; value: any; onChange: (v: any) => void; slug?: string }) {
  const [uploading, setUploading] = useState(false);
  const [fileErr, setFileErr] = useState('');
  const f = field || {};
  const required = !!f.required;

  if (f.type === 'file') {
    return (
      <div>
        <label style={labelStyle}>{f.label}{required ? ' *' : ''}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <label style={{ ...inputStyle, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', textAlign: 'center' }}>
            {uploading ? '⏳ جارٍ الرفع...' : (value ? '🔄 تغيير الصورة' : '📤 رفع صورة الشعار')}
            <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploading}
              onChange={async e => {
                const file = e.target.files?.[0];
                if (!file) return;
                setFileErr(''); setUploading(true);
                try { const url = await uploadFormFile(slug || '', file); onChange(url); }
                catch (err: any) { setFileErr(err?.message || 'فشل رفع الصورة'); }
                setUploading(false);
                e.target.value = '';
              }} />
          </label>
          {value && (
            <img src={value} alt="logo" style={{ width: 58, height: 58, objectFit: 'contain', borderRadius: 8, background: '#fff', border: '1px solid rgba(148,163,184,.3)' }} />
          )}
        </div>
        {f.placeholder && !value && <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted, #9fb0c9)', marginTop: 4 }}>{f.placeholder}</span>}
        {fileErr && <span style={{ display: 'block', fontSize: '0.75rem', color: '#fca5a5', marginTop: 4 }}>❌ {fileErr}</span>}
        {value && <span style={{ display: 'block', fontSize: '0.72rem', color: '#86efac', marginTop: 4 }}>✅ تم رفع الصورة</span>}
      </div>
    );
  }

  if (f.type === 'checkbox') {
    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text, #e8eefc)', fontSize: '0.9rem', paddingTop: '0.4rem' }}>
        <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} style={{ width: 17, height: 17, accentColor: '#14b8a6' }} />
        {f.label}{required ? ' *' : ''}
      </label>
    );
  }

  const type = f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'url' ? 'url' : 'text';
  const ltr = type === 'email' || type === 'tel' || type === 'url' || type === 'number';

  return (
    <>
      <label style={labelStyle}>{f.label}{required ? ' *' : ''}</label>
      {f.type === 'textarea' ? (
        <textarea className="pf-input" style={{ ...inputStyle, minHeight: 96 }} required={required} placeholder={f.placeholder || ''} value={value || ''} onChange={e => onChange(e.target.value)} />
      ) : f.type === 'select' ? (
        <select className="pf-input" style={inputStyle} required={required} value={value || ''} onChange={e => onChange(e.target.value)}>
          <option value="">اختر...</option>
          {(f.options || []).map((o: string) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          className="pf-input"
          style={inputStyle}
          type={type}
          required={required}
          placeholder={f.placeholder || ''}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          dir={ltr ? 'ltr' : 'rtl'}
        />
      )}
    </>
  );
}
