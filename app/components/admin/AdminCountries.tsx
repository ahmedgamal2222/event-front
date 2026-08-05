'use client';
import { useState, useEffect, useCallback } from 'react';
import { fetchCountriesAdmin, createCountry, updateCountry, deleteCountry } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev';

const S = {
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.88rem', colorScheme: 'dark' } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 } as React.CSSProperties),
  del: { background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440', borderRadius: '0.4rem', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.78rem' } as React.CSSProperties,
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '0.8rem', padding: '1.25rem' } as React.CSSProperties,
  label: { fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.25rem', display: 'block', fontWeight: 600 } as React.CSSProperties,
};

interface Country { id: number; name_ar: string; name?: string; code?: string; cities?: string; sort_order: number; is_active: number; }

export default function AdminCountries({ eventId, token }: { eventId: number; token: string }) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [newCity, setNewCity] = useState<Record<number, string>>({});
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Country>>({});
  const [newForm, setNewForm] = useState({ name_ar: '', name: '', code: '' });
  const [msg, setMsg] = useState({ text: '', err: false });

  const notify = (text: string, err = false) => {
    setMsg({ text, err });
    setTimeout(() => setMsg({ text: '', err: false }), 3000);
  };

  const load = useCallback(async () => {
    try { setLoading(true); const r = await fetchCountriesAdmin(eventId, token); setCountries(r.data || []); }
    catch { setCountries([]); } finally { setLoading(false); }
  }, [eventId, token]);

  useEffect(() => { load(); }, [load]);

  const getCities = (co: Country): string[] => {
    if (!co.cities) return [];
    try { return JSON.parse(co.cities); } catch { return []; }
  };

  const seed = async () => {
    setSeeding(true);
    try {
      const res = await fetch(`${API}/api/events/${eventId}/countries/seed`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (d.success) {
        notify(d.inserted > 0
          ? `✅ تم إضافة ${d.inserted} دولة من أصل ${d.total}`
          : `ℹ️ جميع الدول (${d.total}) موجودة بالفعل في القائمة`
        );
        load(); // reload to show countries
      } else notify(d.error || 'حدث خطأ', true);
    } catch (e: any) { notify(e.message, true); }
    setSeeding(false);
  };

  const addCountry = async () => {
    if (!newForm.name_ar.trim()) return;
    try {
      await createCountry(eventId, { ...newForm, sort_order: countries.length }, token);
      setNewForm({ name_ar: '', name: '', code: '' });
      notify('✅ تمت الإضافة'); load();
    } catch (e: any) { notify(e.message, true); }
  };

  const saveCountry = async (id: number) => {
    try {
      await updateCountry(eventId, id, editForm, token);
      setEditId(null); notify('✅ تم التحديث'); load();
    } catch (e: any) { notify(e.message, true); }
  };

  const toggle = async (co: Country) => {
    try { await updateCountry(eventId, co.id, { is_active: co.is_active ? 0 : 1 }, token); load(); }
    catch (e: any) { notify(e.message, true); }
  };

  const del = async (id: number) => {
    if (!confirm('حذف هذه الدولة نهائياً؟')) return;
    try { await deleteCountry(eventId, id, token); notify('✅ تم الحذف'); load(); }
    catch (e: any) { notify(e.message, true); }
  };

  const addCity = async (co: Country) => {
    const city = (newCity[co.id] || '').trim();
    if (!city) return;
    const cities = [...getCities(co), city];
    try {
      await updateCountry(eventId, co.id, { cities: JSON.stringify(cities) }, token);
      setNewCity(p => ({ ...p, [co.id]: '' })); load();
    } catch (e: any) { notify(e.message, true); }
  };

  const removeCity = async (co: Country, city: string) => {
    const cities = getCities(co).filter(c => c !== city);
    try { await updateCountry(eventId, co.id, { cities: JSON.stringify(cities) }, token); load(); }
    catch (e: any) { notify(e.message, true); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', margin: 0 }}>🌍 الدول والمدن</h1>
          <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 4 }}>تظهر عند اختيار "خارج سوريا" في فورم التسجيل</p>
        </div>
        <button style={S.btn('#10b981')} onClick={seed} disabled={seeding}>
          {seeding ? '⏳ جاري الإضافة...' : '🌐 إضافة 50 دولة تلقائياً'}
        </button>
      </div>

      {msg.text && (
        <div style={{ background: msg.err ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${msg.err ? '#ef444440' : 'rgba(16,185,129,0.3)'}`, borderRadius: '0.5rem', padding: '0.75rem', color: msg.err ? '#fca5a5' : '#86efac' }}>
          {msg.text}
        </div>
      )}

      {/* Add new country */}
      <div style={{ ...S.card, display: 'grid', gridTemplateColumns: '1fr 1fr 80px auto', gap: '0.5rem', alignItems: 'flex-end' }}>
        <div>
          <label style={S.label}>الاسم بالعربية *</label>
          <input style={S.inp} value={newForm.name_ar} onChange={e => setNewForm(f => ({ ...f, name_ar: e.target.value }))} placeholder="مثال: تركيا" />
        </div>
        <div>
          <label style={S.label}>الاسم بالإنجليزية</label>
          <input style={S.inp} value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} placeholder="Turkey" dir="ltr" />
        </div>
        <div>
          <label style={S.label}>الكود</label>
          <input style={S.inp} value={newForm.code} onChange={e => setNewForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="TR" dir="ltr" />
        </div>
        <button style={{ ...S.btn(), alignSelf: 'flex-end' }} onClick={addCountry} disabled={!newForm.name_ar.trim()}>+ إضافة</button>
      </div>

      {/* Countries list */}
      {loading ? <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>⏳ جار التحميل...</div>
        : countries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', ...S.card }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🌍</div>
            <p style={{ marginBottom: '1rem' }}>لا توجد دول بعد.</p>
            <button style={S.btn('#10b981')} onClick={seed}>إضافة 50 دولة تلقائياً</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
              {countries.length} دولة • {countries.filter(c => c.is_active).length} ظاهرة
            </div>
            {countries.map(co => {
              const cities = getCities(co);
              const isExpanded = expanded === co.id;
              return (
                <div key={co.id} style={{ ...S.card, padding: '0.75rem 1rem', borderColor: co.is_active ? 'rgba(108,99,255,0.15)' : 'rgba(239,68,68,0.15)' }}>
                  {editId === co.id ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px auto auto', gap: '0.4rem', alignItems: 'center' }}>
                      <input style={{ ...S.inp, padding: '0.3rem 0.5rem' }} value={editForm.name_ar||''} onChange={e => setEditForm(f => ({ ...f, name_ar: e.target.value }))} />
                      <input style={{ ...S.inp, padding: '0.3rem 0.5rem' }} value={editForm.name||''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} dir="ltr" />
                      <input style={{ ...S.inp, padding: '0.3rem 0.5rem' }} value={editForm.code||''} onChange={e => setEditForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} dir="ltr" />
                      <button style={{ ...S.btn('#10b981'), padding: '0.25rem 0.7rem' }} onClick={() => saveCountry(co.id)}>✓</button>
                      <button style={{ ...S.btn('#374151'), padding: '0.25rem 0.7rem' }} onClick={() => setEditId(null)}>✕</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {co.code && <span style={{ fontSize: '0.7rem', background: 'rgba(108,99,255,0.2)', color: '#a5b4fc', padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>{co.code}</span>}
                      <span style={{ flex: 1, color: co.is_active ? 'white' : '#64748b', fontWeight: 600, fontSize: '0.9rem' }}>{co.name_ar}</span>
                      {co.name && <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{co.name}</span>}
                      <span style={{ fontSize: '0.72rem', color: cities.length > 0 ? '#10b981' : '#475569', flexShrink: 0 }}>
                        🏙 {cities.length} {cities.length === 1 ? 'مدينة' : 'مدن'}
                      </span>
                      <button onClick={() => setExpanded(isExpanded ? null : co.id)}
                        style={{ ...S.btn('#374151'), padding: '0.2rem 0.6rem', fontSize: '0.72rem', flexShrink: 0 }}>
                        {isExpanded ? '▲ إخفاء' : '▼ المدن'}
                      </button>
                      <button onClick={() => toggle(co)} style={{ ...S.btn(co.is_active ? '#374151' : '#10b981'), padding: '0.2rem 0.5rem', fontSize: '0.72rem', flexShrink: 0 }}>
                        {co.is_active ? 'إخفاء' : 'إظهار'}
                      </button>
                      <button onClick={() => { setEditId(co.id); setEditForm({ name_ar: co.name_ar, name: co.name||'', code: co.code||'' }); }}
                        style={{ ...S.btn('#3b82f6'), padding: '0.2rem 0.5rem', fontSize: '0.72rem', flexShrink: 0 }}>✏️</button>
                      <button style={{ ...S.del, flexShrink: 0 }} onClick={() => del(co.id)}>🗑</button>
                    </div>
                  )}

                  {/* Cities panel */}
                  {isExpanded && (
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(108,99,255,0.12)' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.6rem' }}>
                        {cities.map(city => (
                          <span key={city} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.25)', color: '#c4b5fd', fontSize: '0.78rem', padding: '0.2rem 0.6rem', borderRadius: 99 }}>
                            {city}
                            <button onClick={() => removeCity(co, city)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem', lineHeight: 1, padding: 0 }}>×</button>
                          </span>
                        ))}
                        {cities.length === 0 && <span style={{ color: '#475569', fontSize: '0.78rem' }}>لا توجد مدن — أضف أدناه</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <input style={{ ...S.inp, flex: 1, padding: '0.3rem 0.6rem', fontSize: '0.82rem' }}
                          value={newCity[co.id] || ''}
                          onChange={e => setNewCity(p => ({ ...p, [co.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && addCity(co)}
                          placeholder="اسم المدينة..." />
                        <button style={{ ...S.btn(), padding: '0.3rem 0.8rem', fontSize: '0.78rem' }} onClick={() => addCity(co)}>+ مدينة</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}