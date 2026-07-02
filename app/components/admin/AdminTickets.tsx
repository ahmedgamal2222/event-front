'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { TicketType } from '@/lib/types';
import { fetchTickets, createTicketType, updateTicketType, deleteTicketType, fetchTicketsConfig, updateTicketsConfig, clearApiCacheFor } from '@/lib/api';

interface AdminTicketsProps {
  eventId: number;
  token: string;
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

export default function AdminTickets({ eventId, token }: AdminTicketsProps) {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'tickets' | 'config'>('tickets');
  const [configLoading, setConfigLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name_ar: '',
    name_en: '',
    description: '',
    price_per_unit: 0,
    duration_type: 'single_day' as const,
    custom_days: 1,
    sort_order: 0,
  });

  const [configForm, setConfigForm] = useState({
    section_title: 'احصل على تذكرتك الآن',
    section_subtitle: 'خيارات متعددة لتناسب احتياجاتك',
    section_badge: '🎫 التذاكر المتاحة',
    feature_1: 'الدخول الكامل للحدث',
    feature_2: 'حقيبة الحدث والمواد',
    feature_3: 'شهادة حضور رسمية',
    info_text: '💡 هل تحتاج مساعدة؟ تواصل معنا عبر نموذج الدعم الفني',
  });

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
        setConfigForm(res.data);
      }
    } catch (err) {
      console.error('Error loading config:', err);
      // Use defaults
    }
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Ensure all values are defined
      const dataToSend = {
        name_ar: form.name_ar || '',
        name_en: form.name_en || '',
        description: form.description || '',
        price_per_unit: form.price_per_unit ?? 0,
        duration_type: form.duration_type || 'single_day',
        custom_days: form.duration_type === 'custom_days' ? (form.custom_days ?? 1) : null,
        sort_order: form.sort_order ?? 0,
      };

      console.log('📝 Submitting ticket:', dataToSend);

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
      });
      setEditingId(null);
      setIsFormOpen(false);
      
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
    });
    setEditingId(ticket.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد؟')) return;
    try {
      await deleteTicketType(eventId, id, token);
      
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
        <form onSubmit={handleSubmitConfig} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
            <label style={S.label}>الميزة الأولى</label>
            <input type="text" name="feature_1" value={configForm.feature_1} onChange={handleConfigChange} style={S.inp} />
          </div>
          <div>
            <label style={S.label}>الميزة الثانية</label>
            <input type="text" name="feature_2" value={configForm.feature_2} onChange={handleConfigChange} style={S.inp} />
          </div>
          <div>
            <label style={S.label}>الميزة الثالثة</label>
            <input type="text" name="feature_3" value={configForm.feature_3} onChange={handleConfigChange} style={S.inp} />
          </div>
          <div>
            <label style={S.label}>نص المعلومات الإضافية (Footer)</label>
            <textarea name="info_text" value={configForm.info_text} onChange={handleConfigChange} style={{ ...S.inp, minHeight: '80px' }} />
          </div>
          <button type="submit" disabled={configLoading} style={{ ...S.btn('#10b981'), opacity: configLoading ? 0.5 : 1 }} onMouseEnter={(e) => (e.currentTarget.style.background = '#059669')} onMouseLeave={(e) => (e.currentTarget.style.background = '#10b981')}>
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
