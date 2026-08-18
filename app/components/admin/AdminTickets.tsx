'use client';

import { useState, useEffect, useCallback } from 'react';
import { TicketType, TicketFeature } from '@/lib/types';
import { TICKET_ICONS, TicketIcon } from '../TicketIcons';
import { fetchTickets, createTicketType, updateTicketType, deleteTicketType, fetchTicketsConfig, updateTicketsConfig, clearApiCacheFor } from '@/lib/api';

interface AdminTicketsProps {
  eventId: number;
  token: string;
  eventSlug?: string; // camel لمسح النصوص القديمة للتذاكر المحفوظة من المعاينة المباشرة
}

const S = {
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem', colorScheme: 'dark' } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 } as React.CSSProperties),
  btnSmall: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.3rem', padding: '0.3rem 0.7rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 } as React.CSSProperties),
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '0.8rem', padding: '1.25rem' } as React.CSSProperties,
  label: { fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block', fontWeight: 600 } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { background: 'rgba(108,99,255,0.1)', padding: '0.75rem', textAlign: 'right' as const, fontSize: '0.85rem', fontWeight: 600, color: '#6C63FF', borderBottom: '1px solid rgba(108,99,255,0.15)' } as React.CSSProperties,
  td: { padding: '0.75rem', borderBottom: '1px solid rgba(108,99,255,0.1)', color: '#e2e8f0', fontSize: '0.9rem' } as React.CSSProperties,
};

// تحويل المزايا من الصيغة القديمة (string[]) أو الجديدة (TicketFeature[])
function parseFeatures(raw: any): TicketFeature[] {
  if (!raw && raw !== 0) return [];
  let arr: any[] = [];
  try {
    if (typeof raw === 'string') {
      if (!raw.trim() || raw.trim() === '[]') return [];
      arr = JSON.parse(raw);
    } else if (Array.isArray(raw)) {
      arr = raw;
    } else {
      return [];
    }
  } catch { return []; }
  if (!Array.isArray(arr)) return [];
  return arr.filter(Boolean).map(item => {
    if (typeof item === 'string') return { icon: 'check', title: item, desc: '' };
    if (typeof item === 'object' && item !== null) {
      return { icon: item.icon || 'check', title: String(item.title || ''), desc: String(item.desc || '') };
    }
    return null;
  }).filter(Boolean) as TicketFeature[];
}

export default function AdminTickets({ eventId, token, eventSlug }: AdminTicketsProps) {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'tickets' | 'config'>('tickets');
  const [configLoading, setConfigLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState<number | null>(null); // index of feature being edited

  const [form, setForm] = useState({
    name_ar: '',
    name_en: '',
    description: '',
    price_per_unit: 0,
    duration_type: 'single_day' as 'single_day' | 'three_days' | 'full_event' | 'custom_days',
    custom_days: 1,
    sort_order: 0,
    features: [] as TicketFeature[],
  });
  const [newFeature, setNewFeature] = useState<TicketFeature>({ icon: 'check', title: '', desc: '' });

  const [configForm, setConfigForm] = useState({
    section_title: 'احصل على تذكرتك الآن',
    section_subtitle: 'خيارات متعددة لتناسب احتياجاتك',
    section_badge: '🎫 التذاكر المتاحة',
    feature_1: 'الدخول الكامل للحدث',
    feature_2: 'حقيبة الحدث والمواد',
    feature_3: 'شهادة حضور رسمية',
    info_text: '💡 هل تحتاج مساعدة؟ تواصل معنا عبر نموذج الدعم الفني',
    api_features_priority: true, // عرض مزايا التذاكر من الـ API دائماً وتجاهل نصوص المعاينة المباشرة القديمة
    reg_type_mapping: {} as Record<string, number | undefined>,
    global_features: [] as TicketFeature[], // مزايا افتراضية غنية (أيقونة + عنوان + وصف)
  });
  const [newGlobalFeature, setNewGlobalFeature] = useState<TicketFeature>({ icon: 'check', title: '', desc: '' });
  const [showGlobalIconPicker, setShowGlobalIconPicker] = useState<number | 'new' | null>(null);

  useEffect(() => {
    loadTickets();
    loadConfig();
  }, [eventId]);

  const loadTickets = useCallback(async (bypass = false) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchTickets(eventId, bypass);
      setTickets(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل تحميل التذاكر';
      setError(errorMsg);
      console.error('Error loading tickets:', err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetchTicketsConfig(eventId);
      if (res.data) {
        // تحليل global_features لدعم الصيغتين القديمة والجديدة
        const rawGlobal = res.data.global_features;
        const parsedGlobal = Array.isArray(rawGlobal)
          ? rawGlobal.map((f: any) => typeof f === 'string' ? { icon: 'check', title: f, desc: '' } : f)
          : [];
        setConfigForm({ ...res.data, api_features_priority: res.data.api_features_priority !== undefined ? !!res.data.api_features_priority : true, global_features: parsedGlobal });
      }
    } catch (err) {
      console.error('Error loading config:', err);
    }
  }, [eventId]);

  // ── إزالة «تجاوز المعاينة المباشرة» لمزايا/أسماء التذاكر ═══════════════════
  // المشكلة: عند تعديل ميزة من داخل «الثيم والألوان ← وضع التعديل المباشر» تُحفظ
  // كلمة قديمة في site_config.editable_text (feat_* / ticket_*) وتعلي فوق بيانات
  // الـ API حتى بعد تعديلها من «التذاكر». الحل: عند أي حفظ من تبويب التذاكر نحذف
  // هذه النصوص القديمة لنبقى دائماً نعرض البيانات الجديدة القادمة من الـ API.
  const stripTicketTextOverrides = async () => {
    try {
      if (!eventSlug || !token) return;
      const API = process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev';
      const route = `${API}/api/events/${encodeURIComponent(eventSlug)}`;
      const res = await fetch(route, { headers: { Authorization: `Bearer ${token}` } });
      const j: any = await res.json().catch(() => null);
      const scRaw = j?.data?.site_config;
      if (!scRaw) return;
      const sc = typeof scRaw === 'string' ? JSON.parse(scRaw) : scRaw;
      const et: Record<string, string> = sc.editable_text || {};
      let changed = false;
      for (const k of Object.keys(et)) {
        if (k.startsWith('feat_') || k.startsWith('ticket_') || k.startsWith('tickets_')) {
          delete et[k];
          changed = true;
        }
      }
      if (changed) {
        sc.editable_text = et;
        await fetch(`${API}/api/events/${eventId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ site_config: sc }),
        });
      }
      // نقل تحديث فوري لأي صفحة حدث مفتوحة (لا حاجة لإعادة تحميل يدوي)
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('tickets-refresh'));
      clearApiCacheFor(`/api/events/${eventSlug}`);
      clearApiCacheFor(`/api/events/${eventId}`);
      clearApiCacheFor(`/api/events/${eventId}/tickets`);
      clearApiCacheFor(`/api/events/${eventId}/tickets-config`);
    } catch (err) {
      console.error('فشل مسح نصوص التذاكر القديمة:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Ensure all values are defined
      const safeFeatures = Array.isArray(form.features) ? form.features.filter(f => f && f.title) : [];
      const dataToSend = {
        name_ar: form.name_ar || '',
        name_en: form.name_en || '',
        description: form.description || '',
        price_per_unit: form.price_per_unit ?? 0,
        duration_type: form.duration_type || 'single_day',
        custom_days: form.duration_type === 'custom_days' ? (form.custom_days ?? 1) : null,
        sort_order: form.sort_order ?? 0,
        features: safeFeatures,
      };

      if (editingId) {
        await updateTicketType(eventId, editingId, dataToSend, token);
      } else {
        await createTicketType(eventId, dataToSend, token);
      }

      setForm({
        name_ar: '',
        name_en: '',
        description: '',
        price_per_unit: 0,
        duration_type: 'single_day',
        custom_days: 1,
        sort_order: 0,
        features: [],
      });
      setNewFeature({ icon: 'check', title: '', desc: '' });
      setEditingId(null);
      setIsFormOpen(false);
      
      // إزالة النصوص القديمة المحفوظة من المعاينة المباشرة (feat_*/ticket_*)
      await stripTicketTextOverrides();
      
      // Clear in-memory cache and reload directly from server (bypass all caches)
      clearApiCacheFor(`/api/events/${eventId}/tickets`);
      await loadTickets(true);
      
      // Show success message AFTER refresh
      setSuccess(editingId ? '✅ تم التحديث بنجاح' : '✅ تمت الإضافة بنجاح');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل حفظ التذكرة';
      console.error('❌ Submit error:', errorMsg);
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (ticket: TicketType) => {
    setForm({
      name_ar: ticket.name_ar,
      name_en: ticket.name_en,
      description: ticket.description || '',
      price_per_unit: ticket.price_per_unit,
      duration_type: ticket.duration_type,
      custom_days: ticket.custom_days || 1,
      sort_order: ticket.sort_order,
      features: parseFeatures(ticket.features),
    });
    setEditingId(ticket.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد؟')) return;
    try {
      await deleteTicketType(eventId, id, token);
      
      // إزالة النصوص القديمة للتذاكر المحفوظة من المعاينة المباشرة
      await stripTicketTextOverrides();
      
      // Clear cache BEFORE showing message and reloading
      clearApiCacheFor(`/api/events/${eventId}/tickets`);
      await loadTickets(true);
      
      // Show success message AFTER data is loaded
      setSuccess('✅ تم الحذف بنجاح');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل حذف التذكرة');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name.includes('price') || name.includes('custom') || name.includes('sort')
        ? Number(value)
        : value,
    }));
  };

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfigForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setConfigLoading(true);
      await updateTicketsConfig(eventId, configForm, token);
      await stripTicketTextOverrides();
      setSuccess('✅ تم حفظ الإعدادات بنجاح');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل حفظ الإعدادات');
    } finally {
      setConfigLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
      {/* Loading Overlay */}
      {isSubmitting && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(2px)',
        }}>
          <div style={{
            background: '#13102a',
            padding: '2rem',
            borderRadius: '1rem',
            textAlign: 'center',
            border: '1px solid rgba(108,99,255,0.3)',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            <div style={{ color: '#e2e8f0', fontWeight: 600 }}>جاري حفظ التذكرة...</div>
            <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.5rem' }}>يرجى الانتظار</div>
          </div>
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', margin: 0 }}>🎫 إدارة التذاكر</h1>
        {activeTab === 'tickets' && (
          <button
            onClick={() => {
              setEditingId(null);
               setForm({
                name_ar: '',
                name_en: '',
                description: '',
                price_per_unit: 0,
                duration_type: 'single_day',
                custom_days: 1,
                sort_order: 0,
                features: [],
              });
              setIsFormOpen(!isFormOpen);
            }}
            style={S.btn('#10b981')}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#059669')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#10b981')}
          >
            {isFormOpen ? '✕ إلغاء' : '+ إضافة تذكرة جديدة'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(108,99,255,0.15)', paddingBottom: '1rem' }}>
        <button
          onClick={() => setActiveTab('tickets')}
          style={{
            padding: '0.5rem 1rem',
            background: activeTab === 'tickets' ? 'rgba(108,99,255,0.2)' : 'transparent',
            color: activeTab === 'tickets' ? '#6C63FF' : '#94a3b8',
            border: activeTab === 'tickets' ? '1px solid rgba(108,99,255,0.4)' : '1px solid transparent',
            borderRadius: '0.4rem',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            transition: 'all 0.2s',
          }}
        >
          🎫 التذاكر
        </button>
        <button
          onClick={() => setActiveTab('config')}
          style={{
            padding: '0.5rem 1rem',
            background: activeTab === 'config' ? 'rgba(108,99,255,0.2)' : 'transparent',
            color: activeTab === 'config' ? '#6C63FF' : '#94a3b8',
            border: activeTab === 'config' ? '1px solid rgba(108,99,255,0.4)' : '1px solid transparent',
            borderRadius: '0.4rem',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            transition: 'all 0.2s',
          }}
        >
          ⚙️ إعدادات السكشن
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#fca5a5', fontSize: '0.9rem' }}>
          ❌ {error}
        </div>
      )}
      {success && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#86efac', fontSize: '0.9rem' }}>
          {success}
        </div>
      )}

      {/* Config Tab */}
      {activeTab === 'config' && (
        <form onSubmit={handleSubmitConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Section Settings */}
          <div style={S.card}>
            <div style={{ color: '#818cf8', fontWeight: 700, fontSize: '0.88rem', marginBottom: 14 }}>🎨 إعدادات السكشن</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={S.label}>عنوان السكشن الرئيسي</label>
                <input type="text" name="section_title" value={configForm.section_title} onChange={handleConfigChange} style={S.inp} />
              </div>
              <div>
                <label style={S.label}>الوصف الفرعي</label>
                <input type="text" name="section_subtitle" value={configForm.section_subtitle} onChange={handleConfigChange} style={S.inp} />
              </div>
              <div>
                <label style={S.label}>شارة السكشن (Badge)</label>
                <input type="text" name="section_badge" value={configForm.section_badge} onChange={handleConfigChange} placeholder="مثال: 🎫 التذاكر المتاحة" style={S.inp} />
              </div>
              <div>
                <label style={S.label}>نص الفوتر / ملاحظة</label>
                <input type="text" name="info_text" value={configForm.info_text} onChange={handleConfigChange} style={S.inp} />
              </div>
            </div>
          </div>

          {/* مصدر مزايا التذاكر — إصلاح مشكلة التجاوز من المعاينة المباشرة */}
          <div style={{ ...S.card, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setConfigForm(cf => ({ ...cf, api_features_priority: !cf.api_features_priority }))}>
              <input type="checkbox" readOnly checked={configForm.api_features_priority !== false} style={{ width: 18, height: 18, accentColor: '#10b981', cursor: 'pointer' }} />
              <div>
                <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.88rem' }}>مزايا التذاكر من الـ API دائماً</div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 2 }}>
                  عند تفعيله تعرض المزايا (التي تعدّلها هنا أو من بطاقات التذاكر) مباشرةً من الـ API، وتُهمَل النصوص القديمة المحفوظة من «الثيم والألوان ← التعديل المباشر». أطفئه فقط إذا أردت أن تتجاوز تعديلات المعاينة المباشرة بيانات المزايا.
                </div>
              </div>
            </div>
          </div>

          {/* Global Features - Rich Format */}
          <div style={S.card}>
            <div style={{ color: '#818cf8', fontWeight: 700, fontSize: '0.88rem', marginBottom: 4 }}>✨ مزايا التذاكر الافتراضية</div>
            <p style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: 14 }}>
              تظهر على كل تذكرة لا تملك مزايا خاصة. كل ميزة: أيقونة + عنوان + وصف توضيحي.
            </p>

            {/* Existing global features */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {/* Legacy feature_1/2/3 */}
              {[configForm.feature_1, configForm.feature_2, configForm.feature_3].map((f, i) => f ? (
                <div key={`legacy-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.55rem 0.85rem', background: 'rgba(255,255,255,0.04)', borderRadius: '0.5rem', border: '1px solid rgba(108,99,255,0.12)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '0.3rem', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <TicketIcon iconKey="check" size={14} color="#10b981" />
                  </div>
                  <input style={{ ...S.inp, flex: 1, border: 'none', background: 'transparent', padding: 0, fontSize: '0.85rem' }}
                    value={f}
                    onChange={e => { const k = `feature_${i + 1}` as any; setConfigForm(cf => ({ ...cf, [k]: e.target.value })); }} />
                  <button type="button" onClick={() => { const k = `feature_${i + 1}` as any; setConfigForm(cf => ({ ...cf, [k]: '' })); }}
                    style={{ background: 'rgba(239,68,68,0.12)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.3rem', padding: '0.2rem 0.4rem', cursor: 'pointer', fontSize: '0.75rem', flexShrink: 0 }}>✕</button>
                </div>
              ) : null)}

              {/* Rich global_features */}
              {(configForm.global_features || []).map((feat: TicketFeature, i: number) => (
                <div key={`gf-${i}`} style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '0.6rem', padding: '0.75rem', display: 'flex', gap: 10 }}>
                  {/* Icon */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <button type="button"
                      onClick={() => setShowGlobalIconPicker(showGlobalIconPicker === i ? null : i)}
                      style={{ width: 34, height: 34, borderRadius: '0.4rem', background: 'rgba(108,99,255,0.2)', border: '1px solid rgba(108,99,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TicketIcon iconKey={feat.icon} size={16} color="#818cf8" />
                    </button>
                    {showGlobalIconPicker === i && (
                      <div style={{ position: 'absolute', top: 38, right: 0, zIndex: 100, background: '#0d0b1a', border: '1px solid rgba(108,99,255,0.3)', borderRadius: '0.75rem', padding: '0.75rem', width: 260, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                        {Object.entries(TICKET_ICONS).map(([key, ic]) => (
                          <button key={key} type="button" title={ic.label}
                            onClick={() => { setConfigForm(cf => ({ ...cf, global_features: (cf.global_features || []).map((ff: TicketFeature, idx: number) => idx === i ? { ...ff, icon: key } : ff) })); setShowGlobalIconPicker(null); }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '0.35rem', borderRadius: '0.3rem', border: feat.icon === key ? '1px solid #6C63FF' : '1px solid transparent', background: feat.icon === key ? 'rgba(108,99,255,0.2)' : 'transparent', cursor: 'pointer' }}>
                            <TicketIcon iconKey={key} size={16} color="#94a3b8" />
                            <span style={{ fontSize: '0.58rem', color: '#64748b', textAlign: 'center', lineHeight: 1.1 }}>{ic.label.split(' ').slice(1).join(' ')}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <input style={{ ...S.inp, padding: '0.3rem 0.5rem', fontSize: '0.84rem' }}
                      placeholder="عنوان الميزة *" value={feat.title}
                      onChange={e => setConfigForm(cf => ({ ...cf, global_features: (cf.global_features || []).map((ff: TicketFeature, idx: number) => idx === i ? { ...ff, title: e.target.value } : ff) }))} />
                    <input style={{ ...S.inp, padding: '0.3rem 0.5rem', fontSize: '0.78rem' }}
                      placeholder="وصف توضيحي اختياري..." value={feat.desc || ''}
                      onChange={e => setConfigForm(cf => ({ ...cf, global_features: (cf.global_features || []).map((ff: TicketFeature, idx: number) => idx === i ? { ...ff, desc: e.target.value } : ff) }))} />
                  </div>
                  <button type="button"
                    onClick={() => setConfigForm(cf => ({ ...cf, global_features: (cf.global_features || []).filter((_: TicketFeature, idx: number) => idx !== i) }))}
                    style={{ alignSelf: 'flex-start', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', borderRadius: '0.35rem', padding: '0.25rem 0.45rem', cursor: 'pointer', fontSize: '0.75rem', flexShrink: 0 }}>✕</button>
                </div>
              ))}

              {/* Empty state */}
              {[configForm.feature_1, configForm.feature_2, configForm.feature_3].every(f => !f) && (!(configForm.global_features || []).length) && (
                <div style={{ textAlign: 'center', color: '#4b5563', padding: '1.5rem', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '0.5rem', fontSize: '0.82rem' }}>
                  لا توجد مزايا افتراضية بعد
                </div>
              )}
            </div>

            {/* Add new global feature */}
            <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px dashed rgba(16,185,129,0.3)', borderRadius: '0.6rem', padding: '0.75rem' }}>
              <div style={{ color: '#34d399', fontSize: '0.75rem', fontWeight: 600, marginBottom: 8 }}>+ إضافة ميزة افتراضية</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <button type="button" onClick={() => setShowGlobalIconPicker(showGlobalIconPicker === 'new' ? null : 'new')}
                    style={{ width: 34, height: 34, borderRadius: '0.4rem', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TicketIcon iconKey={newGlobalFeature.icon} size={16} color="#34d399" />
                  </button>
                  {showGlobalIconPicker === 'new' && (
                    <div style={{ position: 'absolute', bottom: 38, right: 0, zIndex: 100, background: '#0d0b1a', border: '1px solid rgba(108,99,255,0.3)', borderRadius: '0.75rem', padding: '0.75rem', width: 260, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                      {Object.entries(TICKET_ICONS).map(([key, ic]) => (
                        <button key={key} type="button" title={ic.label}
                          onClick={() => { setNewGlobalFeature(f => ({ ...f, icon: key })); setShowGlobalIconPicker(null); }}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '0.35rem', borderRadius: '0.3rem', border: newGlobalFeature.icon === key ? '1px solid #6C63FF' : '1px solid transparent', background: newGlobalFeature.icon === key ? 'rgba(108,99,255,0.2)' : 'transparent', cursor: 'pointer' }}>
                          <TicketIcon iconKey={key} size={16} color="#94a3b8" />
                          <span style={{ fontSize: '0.58rem', color: '#64748b', textAlign: 'center', lineHeight: 1.1 }}>{ic.label.split(' ').slice(1).join(' ')}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <input style={{ ...S.inp, padding: '0.3rem 0.5rem', fontSize: '0.84rem' }}
                    placeholder="عنوان الميزة..."
                    value={newGlobalFeature.title}
                    onChange={e => setNewGlobalFeature(f => ({ ...f, title: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter' && newGlobalFeature.title.trim()) { e.preventDefault(); setConfigForm(cf => ({ ...cf, global_features: [...(cf.global_features || []), { ...newGlobalFeature }] })); setNewGlobalFeature({ icon: 'check', title: '', desc: '' }); }}} />
                  <input style={{ ...S.inp, padding: '0.3rem 0.5rem', fontSize: '0.78rem' }}
                    placeholder="وصف توضيحي..."
                    value={newGlobalFeature.desc || ''}
                    onChange={e => setNewGlobalFeature(f => ({ ...f, desc: e.target.value }))} />
                </div>
                <button type="button"
                  onClick={() => { if (newGlobalFeature.title.trim()) { setConfigForm(cf => ({ ...cf, global_features: [...(cf.global_features || []), { ...newGlobalFeature }] })); setNewGlobalFeature({ icon: 'check', title: '', desc: '' }); } }}
                  style={S.btn('#10b981')}>+ إضافة</button>
              </div>
            </div>

            {/* Preview */}
            {((configForm.global_features || []).length > 0 || [configForm.feature_1, configForm.feature_2, configForm.feature_3].some(Boolean)) && (
              <div style={{ marginTop: 14, padding: '1rem', background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '0.75rem' }}>
                <div style={{ color: '#818cf8', fontSize: '0.72rem', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>معاينة الميزات</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[...([configForm.feature_1, configForm.feature_2, configForm.feature_3].filter(Boolean).map(t => ({ icon: 'check', title: t, desc: '' }))), ...(configForm.global_features || [])].map((feat: TicketFeature, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '0.5rem 0.75rem', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '0.5rem' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '0.35rem', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <TicketIcon iconKey={feat.icon} size={14} color="#10b981" />
                      </div>
                      <div>
                        <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.84rem' }}>{feat.title}</div>
                        {feat.desc && <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 2 }}>{feat.desc}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reg Type → Ticket Mapping */}
          <div style={S.card}>
            <div style={{ fontWeight: 700, color: '#818cf8', marginBottom: 4, fontSize: '0.88rem' }}>
              🔗 ربط نوع التسجيل بتذكرة محددة
            </div>
            <p style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: '0.75rem' }}>
              عند قبول التسجيل وإرسال رابط الدفع، سيتم تحديد التذكرة تلقائياً بناءً على نوع التسجيل
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { value: 'startup', label: '🚀 شركة ناشئة' },
                { value: 'general', label: '👤 حضور عام' },
                { value: 'investor', label: '💼 مستثمر' },
                { value: 'speaker', label: '🎙️ متحدث' },
                { value: 'sponsor', label: '🏅 راعي' },
                { value: 'media', label: '📹 إعلام' },
              ].map(rt => (
                <div key={rt.value} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem', minWidth: 120 }}>{rt.label}</span>
                  <select
                    value={configForm.reg_type_mapping?.[rt.value] || ''}
                    onChange={e => setConfigForm(f => ({
                      ...f,
                      reg_type_mapping: {
                        ...(f.reg_type_mapping || {}),
                        [rt.value]: e.target.value ? Number(e.target.value) : undefined,
                      }
                    }))}
                    style={{ ...S.inp, flex: 1 }}>
                    <option value="">— بلا تذكرة محددة (أرخص تذكرة)</option>
                    {tickets.map(t => (
                      <option key={t.id} value={t.id}>{t.name_ar} — ${t.price_per_unit}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={configLoading} style={{ ...S.btn('#10b981'), opacity: configLoading ? 0.5 : 1 }}>
            {configLoading ? '💾 جاري الحفظ...' : '💾 حفظ الإعدادات'}
          </button>
        </form>
      )}

      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <>
          {/* Form */}
          {isFormOpen && (
            <form onSubmit={handleSubmit} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={S.label}>الاسم (عربي) *</label>
                  <input type="text" name="name_ar" value={form.name_ar} onChange={handleInputChange} required placeholder="مثال: تذكرة يوم واحد" style={S.inp} />
                </div>
                <div>
                  <label style={S.label}>الاسم (English)</label>
                  <input type="text" name="name_en" value={form.name_en} onChange={handleInputChange} placeholder="Single Day Pass" style={S.inp} />
                </div>
              </div>
              <div>
                <label style={S.label}>الوصف</label>
                <textarea name="description" value={form.description} onChange={handleInputChange} placeholder="وصف قصير للتذكرة..." style={{ ...S.inp, minHeight: '60px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={S.label}>السعر (دولار) $</label>
                  <input type="number" name="price_per_unit" value={form.price_per_unit} onChange={handleInputChange} step="0.01" placeholder="0.00" style={S.inp} />
                </div>
                <div>
                  <label style={S.label}>ترتيب العرض</label>
                  <input type="number" name="sort_order" value={form.sort_order} onChange={handleInputChange} placeholder="0" style={S.inp} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={S.label}>نوع المدة</label>
                  <select name="duration_type" value={form.duration_type} onChange={handleInputChange} style={S.inp}>
                    <option value="single_day">يوم واحد</option>
                    <option value="three_days">3 أيام</option>
                    <option value="full_event">كل أيام الحدث</option>
                    <option value="custom_days">عدد أيام محدد</option>
                  </select>
                </div>
                {form.duration_type === 'custom_days' && (
                  <div>
                    <label style={S.label}>عدد الأيام</label>
                    <input type="number" name="custom_days" value={form.custom_days} onChange={handleInputChange} min="1" placeholder="5" style={S.inp} />
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" disabled={isSubmitting} style={{ ...S.btn('#10b981'), opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }} onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.background = '#059669')} onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.background = '#10b981')}>
                  {isSubmitting ? '⏳ جاري الحفظ...' : (editingId ? '✓ تحديث' : '+ إضافة')}
                </button>
                <button type="button" onClick={() => setIsFormOpen(false)} disabled={isSubmitting} style={{ ...S.btn('#6b7280'), opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }} onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.background = '#4b5563')} onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.background = '#6b7280')}>
                  ✕ إلغاء
                </button>
              </div>
              {/* Features/Perks - Rich Format */}
              <div style={{ borderTop: '1px solid rgba(108,99,255,0.15)', paddingTop: '0.75rem' }}>
                <label style={{ ...S.label, marginBottom: 4 }}>✨ مزايا هذه التذكرة</label>
                <p style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: 12 }}>كل ميزة تملك أيقونة + عنوان + وصف توضيحي اختياري</p>

                {/* Existing features */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                  {(form.features || []).map((feat: TicketFeature, i: number) => (
                    <div key={i} style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '0.6rem', padding: '0.75rem', display: 'flex', gap: 10 }}>
                      {/* Icon picker */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <button type="button"
                          onClick={() => setShowIconPicker(showIconPicker === i ? null : i)}
                          style={{ width: 36, height: 36, borderRadius: '0.4rem', background: 'rgba(108,99,255,0.2)', border: '1px solid rgba(108,99,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                          <TicketIcon iconKey={feat.icon} size={18} color="#818cf8" />
                        </button>
                        {showIconPicker === i && (
                          <div style={{ position: 'absolute', top: 40, right: 0, zIndex: 100, background: '#0d0b1a', border: '1px solid rgba(108,99,255,0.3)', borderRadius: '0.75rem', padding: '0.75rem', width: 280, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                            {Object.entries(TICKET_ICONS).map(([key, ic]) => (
                              <button key={key} type="button" title={ic.label}
                                onClick={() => { setForm(f => ({ ...f, features: f.features.map((ff, idx) => idx === i ? { ...ff, icon: key } : ff) })); setShowIconPicker(null); }}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '0.4rem', borderRadius: '0.4rem', border: feat.icon === key ? '1px solid #6C63FF' : '1px solid transparent', background: feat.icon === key ? 'rgba(108,99,255,0.2)' : 'transparent', cursor: 'pointer' }}>
                                <TicketIcon iconKey={key} size={18} color="#94a3b8" />
                                <span style={{ fontSize: '0.6rem', color: '#64748b', textAlign: 'center', lineHeight: 1.1 }}>{ic.label.split(' ').slice(1).join(' ')}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Content */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <input style={{ ...S.inp, padding: '0.3rem 0.5rem', fontSize: '0.85rem' }}
                          placeholder="عنوان الميزة *" value={feat.title}
                          onChange={e => setForm(f => ({ ...f, features: f.features.map((ff, idx) => idx === i ? { ...ff, title: e.target.value } : ff) }))} />
                        <input style={{ ...S.inp, padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                          placeholder="وصف توضيحي (اختياري)..." value={feat.desc || ''}
                          onChange={e => setForm(f => ({ ...f, features: f.features.map((ff, idx) => idx === i ? { ...ff, desc: e.target.value } : ff) }))} />
                      </div>
                      <button type="button" onClick={() => setForm(f => ({ ...f, features: f.features.filter((_: any, j: number) => j !== i) }))}
                        style={{ alignSelf: 'flex-start', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', borderRadius: '0.35rem', padding: '0.25rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0 }}>✕</button>
                    </div>
                  ))}
                </div>

                {/* Add new feature */}
                <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px dashed rgba(16,185,129,0.3)', borderRadius: '0.6rem', padding: '0.75rem' }}>
                  <div style={{ color: '#34d399', fontSize: '0.78rem', fontWeight: 600, marginBottom: 8 }}>+ إضافة ميزة جديدة</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <button type="button"
                        onClick={() => setShowIconPicker(showIconPicker === -1 ? null : -1)}
                        style={{ width: 36, height: 36, borderRadius: '0.4rem', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TicketIcon iconKey={newFeature.icon} size={18} color="#34d399" />
                      </button>
                      {showIconPicker === -1 && (
                        <div style={{ position: 'absolute', bottom: 40, right: 0, zIndex: 100, background: '#0d0b1a', border: '1px solid rgba(108,99,255,0.3)', borderRadius: '0.75rem', padding: '0.75rem', width: 280, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                          {Object.entries(TICKET_ICONS).map(([key, ic]) => (
                            <button key={key} type="button" title={ic.label}
                              onClick={() => { setNewFeature(f => ({ ...f, icon: key })); setShowIconPicker(null); }}
                              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '0.4rem', borderRadius: '0.4rem', border: newFeature.icon === key ? '1px solid #6C63FF' : '1px solid transparent', background: newFeature.icon === key ? 'rgba(108,99,255,0.2)' : 'transparent', cursor: 'pointer' }}>
                              <TicketIcon iconKey={key} size={18} color="#94a3b8" />
                              <span style={{ fontSize: '0.6rem', color: '#64748b', textAlign: 'center', lineHeight: 1.1 }}>{ic.label.split(' ').slice(1).join(' ')}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <input style={{ ...S.inp, padding: '0.3rem 0.5rem', fontSize: '0.85rem' }}
                        placeholder="عنوان الميزة..." value={newFeature.title}
                        onChange={e => setNewFeature(f => ({ ...f, title: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter' && newFeature.title.trim()) { e.preventDefault(); setForm(f => ({ ...f, features: [...f.features, { ...newFeature }] })); setNewFeature({ icon: 'check', title: '', desc: '' }); }}} />
                      <input style={{ ...S.inp, padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                        placeholder="وصف توضيحي..." value={newFeature.desc || ''}
                        onChange={e => setNewFeature(f => ({ ...f, desc: e.target.value }))} />
                    </div>
                    <button type="button"
                      onClick={() => { if (newFeature.title.trim()) { setForm(f => ({ ...f, features: [...f.features, { ...newFeature }] })); setNewFeature({ icon: 'check', title: '', desc: '' }); } }}
                      style={S.btn('#10b981')}>+ إضافة</button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>⏳ جاري التحميل...</div>
          ) : tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>📭 لا توجد تذاكر حتى الآن</div>
          ) : (
            <div style={{ ...S.card, overflowX: 'auto' }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>الاسم</th>
                    <th style={S.th}>السعر</th>
                    <th style={S.th}>نوع المدة</th>
                    <th style={S.th}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td style={S.td}><strong>{ticket.name_ar}</strong></td>
                      <td style={S.td}>${ticket.price_per_unit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
                      <td style={S.td}>
                        {ticket.duration_type === 'single_day' && '📅 يوم واحد'}
                        {ticket.duration_type === 'three_days' && '📅 3 أيام'}
                        {ticket.duration_type === 'full_event' && '📅 كل الحدث'}
                        {ticket.duration_type === 'custom_days' && `📅 ${ticket.custom_days} أيام`}
                      </td>
                      <td style={{ ...S.td, display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleEdit(ticket)} style={S.btnSmall('#3b82f6')} onMouseEnter={(e) => (e.currentTarget.style.background = '#1d4ed8')} onMouseLeave={(e) => (e.currentTarget.style.background = '#3b82f6')}>
                          ✎ تعديل
                        </button>
                        <button onClick={() => handleDelete(ticket.id)} style={S.btnSmall('#ef4444')} onMouseEnter={(e) => (e.currentTarget.style.background = '#dc2626')} onMouseLeave={(e) => (e.currentTarget.style.background = '#ef4444')}>
                          🗑️ حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
