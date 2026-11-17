'use client';
// app/components/PublicFormField.tsx – renders one dynamic form field
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

export default function PublicFormField({ field, value, onChange }: { field: any; value: any; onChange: (v: any) => void }) {
  const f = field || {};
  const required = !!f.required;

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
