'use client';
import { useState, useEffect, useCallback } from 'react';
import { fetchCountriesAdmin, createCountry, updateCountry, deleteCountry } from '@/lib/api';

const S = {
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.88rem', colorScheme: 'dark' } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 } as React.CSSProperties),
  del: { background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440', borderRadius: '0.4rem', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.78rem' } as React.CSSProperties,
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '0.8rem', padding: '1.25rem' } as React.CSSProperties,
  label: { fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem', display: 'block', fontWeight: 600 } as React.CSSProperties,
};

interface Country { id: number; name_ar: string; name_en?: string; sort_order: number; is_active: number; }

export default function AdminCountries({ eventId, token }: { eventId: number; token: string }) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editNameEn, setEditNameEn] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [showBulk, setShowBulk] = useState(false);

  const showMsg = (msg: string, isErr = false) => {
    if (isErr) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const load = useCallback(async () => {
    try { setLoading(true); const r = await fetchCountriesAdmin(eventId, token); setCountries(r.data || []); }
    catch { setCountries([]); } finally { setLoading(false); }
  }, [eventId, token]);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!newName.trim()) return;
    try {
      await createCountry(eventId, { name_ar: newName.trim(), name_en: newNameEn.trim() || null, sort_order: countries.length }, token);
      setNewName(''); setNewNameEn('');
      showMsg('✅ تمت الإضافة');
      load();
    } catch (e: any) { showMsg(e.message, true); }
  };

  const addBulk = async () => {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;
    try {
      for (let i = 0; i < lines.length; i++) {
        const parts = lines[i].split('|');
        await createCountry(eventId, {
          name_ar: parts[0].trim(),
          name_en: parts[1]?.trim() || null,
          sort_order: countries.length + i
        }, token);
      }
      setBulkText(''); setShowBulk(false);
      showMsg(`✅ تمت إضافة ${lines.length} دولة`);
      load();
    } catch (e: any) { showMsg(e.message, true); }
  };

  const save = async (id: number) => {
    try {
      await updateCountry(eventId, id, { name_ar: editName, name_en: editNameEn || null }, token);
      setEditId(null);
      showMsg('✅ تم التحديث');
      load();
    } catch (e: any) { showMsg(e.message, true); }
  };

  const toggle = async (c: Country) => {
    try {
      await updateCountry(eventId, c.id, { is_active: c.is_active ? 0 : 1 }, token);
      load();
    } catch (e: any) { showMsg(e.message, true); }
  };

  const del = async (id: number) => {
    if (!confirm('حذف هذه الدولة؟')) return;
    try { await deleteCountry(eventId, id, token); showMsg('✅ تم الحذف'); load(); }
    catch (e: any) { showMsg(e.message, true); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', margin: 0 }}>🌍 قائمة الدول</h1>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button style={S.btn('#374151')} onClick={() => setShowBulk(!showBulk)}>📋 إضافة جماعية</button>
        </div>
      </div>

      <div style={{ background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '0.6rem', padding: '0.75rem', fontSize: '0.82rem', color: '#94a3b8' }}>
        💡 تظهر هذه الدول للمسجلين عند اختيار <strong style={{ color: '#a5b4fc' }}>خارج سوريا</strong> في حقل المدينة. يمكنك إخفاء أي دولة دون حذفها.
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef444440', borderRadius: '0.5rem', padding: '0.75rem', color: '#fca5a5' }}>❌ {error}</div>}
      {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.5rem', padding: '0.75rem', color: '#86efac' }}>{success}</div>}

      {/* Add single */}
      <div style={{ ...S.card, display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={S.label}>اسم الدولة (عربي) *</label>
          <input style={S.inp} value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()} placeholder="مثال: تركيا" />
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <label style={S.label}>الاسم (English)</label>
          <input style={S.inp} value={newNameEn} onChange={e => setNewNameEn(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()} placeholder="Turkey" dir="ltr" />
        </div>
        <button style={S.btn()} onClick={add} disabled={!newName.trim()}>+ إضافة</button>
      </div>

      {/* Bulk add */}
      {showBulk && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: '0.5rem', fontSize: '0.88rem' }}>📋 إضافة جماعية</div>
          <p style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
            كل سطر = دولة. صيغة: <code style={{ color: '#a5b4fc' }}>الاسم العربي | English Name</code> (الإنجليزي اختياري)
          </p>
          <textarea rows={8} style={{ ...S.inp, fontFamily: 'monospace', resize: 'vertical' }} dir="rtl"
            value={bulkText} onChange={e => setBulkText(e.target.value)}
            placeholder={'المملكة العربية السعودية | Saudi Arabia\nالإمارات | UAE\nمصر | Egypt'} />
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem' }}>
            <button style={S.btn()} onClick={addBulk} disabled={!bulkText.trim()}>
              + إضافة {bulkText.split('\n').filter(l => l.trim()).length} دولة
            </button>
            <button style={S.btn('#374151')} onClick={() => setShowBulk(false)}>إلغاء</button>
          </div>
        </div>
      )}

      {loading ? <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>⏳ جار التحميل...</div>
        : countries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8', ...S.card }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🌍</div>
            <p>لا توجد دول بعد. أضف دول ليختار منها المسجلون خارج سوريا.</p>
          </div>
        ) : (
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>{countries.length} دولة • {countries.filter(c => c.is_active).length} ظاهرة</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {countries.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.5rem', borderRadius: '0.4rem', background: c.is_active ? 'rgba(255,255,255,0.03)' : 'rgba(239,68,68,0.04)', border: `1px solid ${c.is_active ? 'rgba(108,99,255,0.1)' : 'rgba(239,68,68,0.1)'}` }}>
                  {editId === c.id ? (
                    <>
                      <input style={{ ...S.inp, flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.82rem' }} value={editName} onChange={e => setEditName(e.target.value)} />
                      <input style={{ ...S.inp, flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.82rem' }} value={editNameEn} onChange={e => setEditNameEn(e.target.value)} dir="ltr" placeholder="English" />
                      <button style={{ ...S.btn('#10b981'), padding: '0.25rem 0.6rem', fontSize: '0.75rem' }} onClick={() => save(c.id)}>✓</button>
                      <button style={{ ...S.btn('#374151'), padding: '0.25rem 0.6rem', fontSize: '0.75rem' }} onClick={() => setEditId(null)}>✕</button>
                    </>
                  ) : (
                    <>
                      <span style={{ flex: 1, color: c.is_active ? 'white' : '#64748b', fontSize: '0.88rem' }}>{c.name_ar}</span>
                      {c.name_en && <span style={{ color: '#64748b', fontSize: '0.75rem', minWidth: 80 }}>{c.name_en}</span>}
                      <button onClick={() => toggle(c)} style={{ ...S.btn(c.is_active ? '#374151' : '#10b981'), padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}>
                        {c.is_active ? '👁 إخفاء' : '👁 إظهار'}
                      </button>
                      <button onClick={() => { setEditId(c.id); setEditName(c.name_ar); setEditNameEn(c.name_en || ''); }} style={{ ...S.btn('#3b82f6'), padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}>✏️</button>
                      <button style={S.del} onClick={() => del(c.id)}>🗑</button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
