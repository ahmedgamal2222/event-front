'use client';
// app/components/admin/AdminForms.tsx – Independent Forms Builder
import { useCallback, useEffect, useState } from 'react';
import {
  fetchFormsAdmin, createForm, updateForm, deleteForm,
  fetchFormSubmissions, deleteFormSubmission,
} from '@/lib/api';

const S = {
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(108,99,255,0.25)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem', colorScheme: 'dark' } as React.CSSProperties,
  label: { fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block', fontWeight: 600 } as React.CSSProperties,
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '0.8rem', padding: '1.25rem' } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 } as React.CSSProperties),
  del: { background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440', borderRadius: '0.4rem', padding: '0.35rem 0.7rem', cursor: 'pointer', fontSize: '0.8rem' } as React.CSSProperties,
  small: { background: 'rgba(255,255,255,0.07)', color: '#c7d2fe', border: '1px solid rgba(108,99,255,0.3)', borderRadius: '0.4rem', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.78rem' } as React.CSSProperties,
};

const FIELD_TYPES = [
  { value: 'text', label: 'نص' },
  { value: 'email', label: 'بريد إلكتروني' },
  { value: 'tel', label: 'هاتف' },
  { value: 'number', label: 'رقم' },
  { value: 'textarea', label: 'نص طويل' },
  { value: 'select', label: 'قائمة اختيار' },
  { value: 'checkbox', label: 'مربع موافقة' },
  { value: 'date', label: 'تاريخ' },
  { value: 'url', label: 'رابط' },
];

const defaultFields = () => ([
  { key: 'full_name', label: 'الاسم', type: 'text', required: true, placeholder: 'أدخل اسمك الكامل', options: [], width: 'half' },
  { key: 'email', label: 'البريد الإلكتروني', type: 'email', required: true, placeholder: 'example@email.com', options: [], width: 'half' },
  { key: 'organization', label: 'المؤسسة', type: 'text', required: false, placeholder: 'اسم المؤسسة / الشركة', options: [], width: 'half' },
  { key: 'phone', label: 'رقم الهاتف', type: 'tel', required: false, placeholder: '+963 9xx xxx xxx', options: [], width: 'half' },
  { key: 'participation_type', label: 'نوع المشاركة', type: 'select', required: true, placeholder: '', options: ['حضور', 'متحدث', 'راعي', 'إعلام', 'متطوع'], width: 'full' },
]);

const emptyForm = () => ({
  id: 0, title: '', description: '', slug: '',
  submit_label: 'إرسال', success_message: '✅ تم إرسال الاستمارة بنجاح، شكراً لك!',
  is_published: 1, fields: defaultFields(),
});

export default function AdminForms({ eventId, token, eventSlug, showToast }: { eventId: number; token: string; eventSlug?: string; showToast?: (m: string) => void }) {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewing, setViewing] = useState<any | null>(null);
  const [subs, setSubs] = useState<any[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);

  const notify = (m: string) => { setSuccess(m); if (showToast) showToast(m); setTimeout(() => setSuccess(''), 2500); };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchFormsAdmin(eventId, token);
      setForms(res.data || []);
    } catch { setForms([]); } finally { setLoading(false); }
  }, [eventId, token]);

  useEffect(() => { load(); }, [load]);

  const startCreate = () => { setError(''); setEditing(emptyForm()); setCreating(true); setViewing(null); };
  const startEdit = (f: any) => {
    setError('');
    setEditing({ ...f, fields: (f.fields && f.fields.length ? f.fields : defaultFields()) });
    setCreating(false);
    setViewing(null);
  };

  const setField = (i: number, k: string, v: any) => {
    setEditing((p: any) => {
      const fields = [...(p.fields || [])];
      fields[i] = { ...fields[i], [k]: v };
      return { ...p, fields };
    });
  };
  const addField = () => setEditing((p: any) => ({
    ...p,
    fields: [...(p.fields || []), { key: `field_${Date.now()}`, label: 'حقل جديد', type: 'text', required: false, placeholder: '', options: [], width: 'full' }],
  }));
  const removeField = (i: number) => setEditing((p: any) => ({ ...p, fields: (p.fields || []).filter((_: any, idx: number) => idx !== i) }));
  const moveField = (i: number, dir: -1 | 1) => setEditing((p: any) => {
    const fields = [...(p.fields || [])];
    const j = i + dir;
    if (j < 0 || j >= fields.length) return p;
    const tmp = fields[i]; fields[i] = fields[j]; fields[j] = tmp;
    return { ...p, fields };
  });

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.title?.trim()) { setError('عنوان الاستمارة مطلوب'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        title: editing.title,
        slug: editing.slug,
        description: editing.description,
        fields: editing.fields,
        submit_label: editing.submit_label,
        success_message: editing.success_message,
        is_published: editing.is_published,
      };
      if (creating) {
        await createForm(eventId, payload, token);
        notify('✅ تم إنشاء الاستمارة');
      } else {
        await updateForm(eventId, editing.id, payload, token);
        notify('✅ تم حفظ التعديلات');
      }
      setEditing(null); setCreating(false);
      load();
    } catch (e: any) { setError(e?.message || 'فشل الحفظ'); }
    setSaving(false);
  };

  const handleDelete = async (f: any) => {
    if (!confirm(`حذف الاستمارة «${f.title}» وجميع مشاركاتها؟`)) return;
    try { await deleteForm(eventId, f.id, token); notify('🗑️ تم الحذف'); load(); }
    catch (e: any) { setError(e?.message || 'فشل الحذف'); }
  };

  const publicPath = (slug: string) => {
    const dev = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (dev) return `/forms?slug=${encodeURIComponent(slug)}`;
    return eventSlug ? `/${eventSlug}/${slug}` : `/f/${slug}`;
  };

  const copyLink = async (f: any) => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}${publicPath(f.slug)}`;
    try { await navigator.clipboard.writeText(url); notify('🔗 تم نسخ رابط الاستمارة'); }
    catch { prompt('انسخ الرابط:', url); }
  };

  const openSubmissions = async (f: any) => {
    setViewing(f); setSubsLoading(true); setSubs([]);
    try {
      const res = await fetchFormSubmissions(eventId, f.id, token);
      setSubs(res?.data?.submissions || []);
    } catch { setSubs([]); }
    setSubsLoading(false);
  };

  const removeSubmission = async (sid: number) => {
    if (!viewing || !confirm('حذف هذه المشاركة؟')) return;
    try {
      await deleteFormSubmission(eventId, viewing.id, sid, token);
      setSubs(prev => prev.filter((s: any) => s.id !== sid));
      notify('🗑️ تم حذف المشاركة');
      load();
    } catch (e: any) { setError(e?.message || 'فشل الحذف'); }
  };

  const exportCsv = () => {
    if (!viewing) return;
    const fields = viewing.fields || [];
    const header = [...fields.map((f: any) => f.label), 'التاريخ'];
    const rows = subs.map((s: any) => [
      ...fields.map((f: any) => {
        const v = s.data?.[f.key];
        return f.type === 'checkbox' ? (v ? 'نعم' : 'لا') : (v ?? '');
      }),
      new Date(s.created_at).toLocaleString('ar-EG'),
    ]);
    const csv = '\ufeff' + [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${viewing.slug}-submissions.csv`;
    a.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', margin: 0 }}>📝 الاستمارات المستقلة</h1>
          <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>
            أنشئ استمارة، عدّل حقولها، وانسخ رابطها المباشر <code style={{ color: '#a5b4fc' }}>/{eventSlug || 'event-slug'}/slug</code> — بدون أي برمجة.
          </p>
        </div>
        <button style={S.btn()} onClick={startCreate}>➕ استمارة جديدة</button>
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef444440', borderRadius: '0.5rem', padding: '0.75rem', color: '#fca5a5' }}>❌ {error}</div>}
      {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.5rem', padding: '0.75rem', color: '#86efac' }}>{success}</div>}

      {editing && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: 'white', margin: 0, fontSize: '1.05rem' }}>
              {creating ? '➕ استمارة جديدة' : `✏️ تعديل: ${editing.title}`}
            </h3>
            <button style={S.del} onClick={() => { setEditing(null); setCreating(false); }}>إغلاق</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '0.85rem' }}>
            <div>
              <label style={S.label}>عنوان الاستمارة *</label>
              <input style={S.inp} value={editing.title || ''} onChange={e => setEditing((p: any) => ({ ...p, title: e.target.value }))} placeholder="مثال: استمارة المشاركة في القمة" />
            </div>
            <div>
              <label style={S.label}>رابط الاستمارة (Slug)</label>
              <input style={S.inp} dir="ltr" value={editing.slug || ''} onChange={e => setEditing((p: any) => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} placeholder="participation" />
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.7rem', color: '#64748b' }}>الرابط: /{eventSlug || 'event-slug'}/{editing.slug || 'slug'}</p>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={S.label}>الوصف (يظهر أعلى الاستمارة)</label>
              <textarea style={{ ...S.inp, minHeight: 64 }} value={editing.description || ''} onChange={e => setEditing((p: any) => ({ ...p, description: e.target.value }))} placeholder="اكتب وصفاً مختصراً..." />
            </div>
            <div>
              <label style={S.label}>نص زر الإرسال</label>
              <input style={S.inp} value={editing.submit_label || ''} onChange={e => setEditing((p: any) => ({ ...p, submit_label: e.target.value }))} placeholder="إرسال" />
            </div>
            <div>
              <label style={S.label}>رسالة النجاح</label>
              <input style={S.inp} value={editing.success_message || ''} onChange={e => setEditing((p: any) => ({ ...p, success_message: e.target.value }))} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={!!editing.is_published} onChange={e => setEditing((p: any) => ({ ...p, is_published: e.target.checked ? 1 : 0 }))} style={{ accentColor: '#6C63FF' }} />
              منشورة (متاحة للزوار)
            </label>
          </div>

          <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ color: '#c7d2fe', margin: 0, fontSize: '0.95rem' }}>🧩 الحقول ({(editing.fields || []).length})</h4>
            <button style={S.small} onClick={addField}>➕ إضافة حقل</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginTop: '0.75rem' }}>
            {(editing.fields || []).map((f: any, i: number) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(108,99,255,0.18)', borderRadius: '0.6rem', padding: '0.85rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '0.6rem', alignItems: 'end' }}>
                  <div>
                    <label style={S.label}>التسمية</label>
                    <input style={S.inp} value={f.label} onChange={e => setField(i, 'label', e.target.value)} />
                  </div>
                  <div>
                    <label style={S.label}>المفتاح (key)</label>
                    <input style={S.inp} dir="ltr" value={f.key} onChange={e => setField(i, 'key', e.target.value.replace(/[^\w-]/g, ''))} />
                  </div>
                  <div>
                    <label style={S.label}>النوع</label>
                    <select style={S.inp} value={f.type} onChange={e => setField(i, 'type', e.target.value)}>
                      {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>العرض</label>
                    <select style={S.inp} value={f.width || 'full'} onChange={e => setField(i, 'width', e.target.value)}>
                      <option value="full">سطر كامل</option>
                      <option value="half">نصف سطر</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '0.6rem', marginTop: '0.6rem', alignItems: 'end' }}>
                  <div>
                    <label style={S.label}>نص توضيحي (placeholder)</label>
                    <input style={S.inp} value={f.placeholder || ''} onChange={e => setField(i, 'placeholder', e.target.value)} />
                  </div>
                  {f.type === 'select' && (
                    <div>
                      <label style={S.label}>الخيارات (افصل بفاصلة)</label>
                      <input style={S.inp} value={(f.options || []).join(', ')} onChange={e => setField(i, 'options', e.target.value.split(',').map((x: string) => x.trim()).filter(Boolean))} placeholder="حضور, متحدث, راعي" />
                    </div>
                  )}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!f.required} onChange={e => setField(i, 'required', e.target.checked)} style={{ accentColor: '#6C63FF' }} />
                    حقل مطلوب
                  </label>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button style={S.small} onClick={() => moveField(i, -1)} title="أعلى">↑</button>
                    <button style={S.small} onClick={() => moveField(i, 1)} title="أسفل">↓</button>
                    <button style={S.del} onClick={() => removeField(i)}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.1rem' }}>
            <button style={{ ...S.btn(), padding: '0.6rem 2rem', opacity: saving ? 0.6 : 1 }} disabled={saving} onClick={handleSave}>
              {saving ? '⏳ جارٍ الحفظ...' : '💾 حفظ الاستمارة'}
            </button>
            <button style={S.btn('#374151')} onClick={() => { setEditing(null); setCreating(false); }}>إلغاء</button>
          </div>

        </div>
      )}
      {viewing && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: '0.75rem' }}>
            <div>
              <h3 style={{ color: 'white', margin: 0, fontSize: '1.05rem' }}>📥 مشاركات: {viewing.title}</h3>
              <p style={{ margin: '3px 0 0', color: '#94a3b8', fontSize: '0.78rem' }}>{subs.length} مشاركة</p>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button style={S.small} onClick={exportCsv} disabled={!subs.length}>⬇️ تصدير CSV</button>
              <button style={S.small} onClick={() => copyLink(viewing)}>🔗 نسخ الرابط</button>
              <button style={S.del} onClick={() => setViewing(null)}>إغلاق</button>
            </div>
          </div>

          {subsLoading ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>جار التحميل...</p>
          ) : subs.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>لا توجد مشاركات بعد — شارك رابط الاستمارة.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    {(viewing.fields || []).map((f: any) => (
                      <th key={f.key} style={{ textAlign: 'right', padding: '0.5rem', color: '#a5b4fc', borderBottom: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap' }}>{f.label}</th>
                    ))}
                    <th style={{ textAlign: 'right', padding: '0.5rem', color: '#a5b4fc', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>التاريخ</th>
                    <th style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {subs.map((s: any) => (
                    <tr key={s.id}>
                      {(viewing.fields || []).map((f: any) => {
                        const v = s.data?.[f.key];
                        return (
                          <td key={f.key} style={{ padding: '0.5rem', color: '#e2e8f0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            {f.type === 'checkbox' ? (v ? '✅ نعم' : '—') : (v ?? '—')}
                          </td>
                        );
                      })}
                      <td style={{ padding: '0.5rem', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap' }}>
                        {new Date(s.created_at).toLocaleString('ar-EG')}
                      </td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <button style={S.del} onClick={() => removeSubmission(s.id)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>جار التحميل...</p>
      ) : forms.length === 0 ? (
        <div style={{ ...S.card, textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝</div>
          <p style={{ margin: '0 0 1rem' }}>لا توجد استمارات بعد</p>
          <button style={S.btn()} onClick={startCreate}>➕ إنشاء أول استمارة</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {forms.map((f: any) => (
            <div key={f.id} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ minWidth: 240 }}>
                <div style={{ color: 'white', fontWeight: 700, fontSize: '0.98rem' }}>{f.title}</div>
                {f.description && <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: 2 }}>{f.description}</div>}
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: 12, background: 'rgba(108,99,255,0.15)', color: '#a5b4fc' }}>🔗 {publicPath(f.slug)}</span>
                  <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: 12, background: 'rgba(16,185,129,0.15)', color: '#86efac' }}>📥 {f.submissions_count || 0} مشاركة</span>
                  <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: 12, background: f.is_published ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.1)', color: f.is_published ? '#86efac' : '#fca5a5' }}>
                    {f.is_published ? '✅ منشورة' : '❌ مخفية'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                <button style={S.small} onClick={() => copyLink(f)}>🔗 نسخ الرابط</button>
                <button style={S.small} onClick={() => openSubmissions(f)}>📥 المشاركات</button>
                <button style={S.btn()} onClick={() => startEdit(f)}>✏️ تعديل</button>
                <button style={S.del} onClick={() => handleDelete(f)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

