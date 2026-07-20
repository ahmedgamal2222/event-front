'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchStats, fetchRegistrations, updateRegistration, deleteRegistration,
  fetchEvent, updateEvent,
  fetchSpeakers, createSpeaker, updateSpeaker, deleteSpeaker,
  fetchSponsors, createSponsor, updateSponsor, deleteSponsor,
  fetchFaqs, createFaq, deleteFaq,
  fetchAgenda, createAgendaDay, updateAgendaDay,
  createAgendaSession, updateAgendaSession, deleteAgendaSession,
  uploadImage, uploadFile, uploadMedia, deleteImage,
  fetchVenueGalleryAdmin, createVenueMedia, updateVenueMedia, deleteVenueMedia,
  clearApiCacheFor,
  fetchArticlesAdmin, createArticle, updateArticle, deleteArticle,
  updateAdminProfile,
} from '../../../lib/api';
import AdminTickets from '../../../app/components/admin/AdminTickets';
import AdminSupport from '../../../app/components/admin/AdminSupport';
import AdminPixels from '../../../app/components/admin/AdminPixels';
import AdminEmailSettings from '../../../app/components/admin/AdminEmailSettings';
import AdminTerms from '../../../app/components/admin/AdminTerms';
import AdminPages from '../../../app/components/admin/AdminPages';
import AdminPayments from '../../../app/components/admin/AdminPayments';
import AdminCampaigns from '../../../app/components/admin/AdminCampaigns';
import RichEditor from '../../../app/components/admin/RichEditor';
import AdminCountries from '../../../app/components/admin/AdminCountries';
import AdminEvents from '../../../app/components/admin/AdminEvents';
import AdminCRMContacts from '../../../app/components/admin/AdminCRMContacts';
import AdminCRMRegistrations from '../../../app/components/admin/AdminCRMRegistrations';
import AdminCRMPayments from '../../../app/components/admin/AdminCRMPayments';
import AdminCRMTasks from '../../../app/components/admin/AdminCRMTasks';
import AdminCRMSponsorships from '../../../app/components/admin/AdminCRMSponsorships';
import type { FormConfig, SiteConfig } from '../../../lib/types';

function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : ''; }

const STATUS_STYLES: Record<string, { bg: string; label: string }> = {
  pending:    { bg: '#f59e0b', label: 'قيد الانتظار' },
  approved:   { bg: '#10b981', label: 'مقبول' },
  paid:       { bg: '#06b6d4', label: 'تم الدفع' },
  rejected:   { bg: '#ef4444', label: 'مرفوض' },
  waitlisted: { bg: '#8b5cf6', label: 'قائمة الانتظار' },
  cancelled:  { bg: '#6b7280', label: 'ملغى' },
  checked_in: { bg: '#8b5cf6', label: 'حضر فعلاً' },
};
const TYPE_LABELS: Record<string, string> = {
  startup: '🚀 ناشئة', general: '👤 عام', investor: '💼 مستثمر',
  speaker: '🎙️ متحدث', sponsor: '🏅 راعي', media: '📹 إعلام',
};
const SESSION_TYPES = ['keynote','talk','workshop','panel','networking','break','competition'];
const SPONSOR_TIERS = ['platinum','gold','silver','bronze','media'];
const TABS = [
  // القسم الرئيسي
  { key: 'overview',         label: '📊 نظرة عامة',         group: 'رئيسي' },
  { key: 'events_mgmt',      label: '🗂 الأحداث والأرشيف',   group: 'رئيسي' },
  { key: 'profile',          label: '👤 إعدادات الأدمن',     group: 'رئيسي' },
  // إدارة التسجيلات والمبيعات (موحّد)
  { key: 'registrations',    label: '📋 التسجيلات',          group: 'المبيعات' },
  { key: 'payments',         label: '💳 المدفوعات',          group: 'المبيعات' },
  { key: 'tickets',          label: '🎫 التذاكر',            group: 'المبيعات' },
  // CRM المتكامل
  { key: 'crm_contacts',     label: '👥 جهات الاتصال',       group: 'CRM' },
  { key: 'crm_tasks',        label: '✅ المهام والمتابعة',   group: 'CRM' },
  { key: 'crm_escalated',    label: '🔺 المصعّدات',          group: 'CRM' },
  { key: 'crm_sponsorships', label: '🤝 خط الرعايات',        group: 'CRM' },
  // إدارة الحدث
  { key: 'event',            label: '⚙️ معلومات الحدث',     group: 'الحدث' },
  { key: 'video',            label: '🎬 الفيديو التعريفي',   group: 'الحدث' },
  { key: 'siteconfig',       label: '🎨 محتوى الصفحة',      group: 'الحدث' },
  { key: 'formconfig',       label: '📝 فورم التسجيل',      group: 'الحدث' },
  { key: 'countries',        label: '🌍 قائمة الدول',        group: 'الحدث' },
  // إدارة المحتوى
  { key: 'agenda',           label: '📅 البرنامج',           group: 'المحتوى' },
  { key: 'speakers',         label: '🎙️ المتحدثون',          group: 'المحتوى' },
  { key: 'venue',            label: '📸 معرض الصور',          group: 'المحتوى' },
  { key: 'sponsors',         label: '🏅 الرعاة (الموقع)',    group: 'المحتوى' },
  { key: 'faqs',             label: '❓ الأسئلة الشائعة',    group: 'المحتوى' },
  { key: 'articles',         label: '📝 المقالات',            group: 'المحتوى' },
  { key: 'pages',            label: '📄 الصفحات الثابتة',    group: 'المحتوى' },
  // الدعم والتتبع
  { key: 'support',          label: '💬 الدعم الفني',        group: 'الدعم' },
  { key: 'pixels',           label: '📊 البكسل والتتبع',     group: 'الدعم' },
  { key: 'email',            label: '📧 إعدادات البريد',     group: 'الدعم' },
  { key: 'terms',            label: '⚖️ الشروط والأحكام',   group: 'الدعم' },
  { key: 'campaigns',        label: '📧 الحملات البريدية',   group: 'الدعم' },
] as const;
type Tab = typeof TABS[number]['key'];

const S = {
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem', colorScheme: 'dark' } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 } as React.CSSProperties),
  del: { background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440', borderRadius: '0.4rem', padding: '0.35rem 0.7rem', cursor: 'pointer', fontSize: '0.8rem' } as React.CSSProperties,
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '1rem', padding: '1.25rem' } as React.CSSProperties,
  label: { fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block' } as React.CSSProperties,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={S.label}>{label}</label>{children}</div>;
}
function SaveBtn({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return <button style={S.btn()} onClick={onClick} disabled={loading}>{loading ? 'جار الحفظ...' : 'حفظ'}</button>;
}

function HelpBox({ title, children, icon = 'ℹ️' }: { title: string; children: React.ReactNode; icon?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ marginBottom: 12 }}>
      <button
        onClick={() => setShow(!show)}
        style={{
          background: 'rgba(59,130,246,0.1)',
          border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: '0.5rem',
          padding: '0.7rem 1rem',
          color: '#3b82f6',
          cursor: 'pointer',
          width: '100%',
          textAlign: 'right',
          fontSize: '0.9rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>{icon} {title}</span>
        <span style={{ transform: show ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
      </button>
      {show && (
        <div style={{
          background: 'rgba(59,130,246,0.05)',
          border: '1px solid rgba(59,130,246,0.15)',
          borderTop: 'none',
          borderRadius: '0 0 0.5rem 0.5rem',
          padding: '1rem',
          fontSize: '0.85rem',
          color: '#e0e7ff',
          lineHeight: 1.6,
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

function ImageUploadField({ onUploaded, maxSizeMB = 3, token }: { onUploaded: (value: string) => void; maxSizeMB?: number; token: string }) {
  const [uploading, setUploading] = useState(false);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('الملف يجب أن يكون صورة');
      e.target.value = '';
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`حجم الصورة يجب ألا يتجاوز ${maxSizeMB}MB`);
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const { url } = await uploadImage(file, token);
      onUploaded(url);
    } catch (err: any) {
      alert('فشل رفع الصورة: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
      <label style={{ ...S.btn('#1a2744'), margin: 0, cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.7 : 1 }}>
        {uploading ? 'جار الرفع على R2...' : 'رفع من الجهاز'}
        <input type="file" accept="image/*" onChange={onChange} disabled={uploading} style={{ display: 'none' }} />
      </label>
      <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>JPG/PNG/WebP حتى {maxSizeMB}MB</span>
    </div>
  );
}

// ── MediaUploadField — for images AND videos (venue gallery) ──────────────────
function MediaUploadField({ mediaType, onUploaded, token }: { mediaType: 'image' | 'video'; onUploaded: (url: string) => void; token: string }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/') || mediaType === 'video';
    const maxMB = isVideo ? 200 : 15;
    if (file.size > maxMB * 1024 * 1024) {
      alert(`حجم الملف كبير جداً. الحد الأقصى: ${maxMB}MB`);
      e.target.value = '';
      return;
    }

    setUploading(true);
    setProgress(isVideo ? '⏳ جار رفع الفيديو (قد يستغرق بعض الوقت)...' : '⏳ جار الرفع...');
    try {
      const { url } = await uploadMedia(file, token);
      onUploaded(url);
      setProgress('');
    } catch (err: any) {
      alert('فشل الرفع: ' + (err.message || 'خطأ غير معروف'));
      setProgress('');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const accept = mediaType === 'video' ? 'video/mp4,video/webm,video/mov,video/avi,video/*' : 'image/*';
  const label  = mediaType === 'video' ? '🎬 رفع فيديو من الجهاز' : '🖼️ رفع صورة من الجهاز';
  const hint   = mediaType === 'video' ? 'MP4/WebM/MOV حتى 200MB' : 'JPG/PNG/WebP حتى 15MB';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <label style={{ ...S.btn(mediaType === 'video' ? '#0c4a6e' : '#1a2744'), margin: 0, cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
        {uploading ? (progress || '⏳ جار الرفع...') : label}
        <input type="file" accept={accept} onChange={onChange} disabled={uploading} style={{ display: 'none' }} />
      </label>
      <span style={{ color: '#64748b', fontSize: '0.7rem' }}>{hint}</span>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [eventId, setEventId] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  // Derived: slug of the currently selected event
  const eventSlug = events.find(e => e.id === eventId)?.slug ;
  const eventLabel = events.find(e => e.id === eventId)?.name_ar || events.find(e => e.id === eventId)?.name || '';

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev';

  useEffect(() => {
    const t = getToken();
    if (!t) { router.replace('/admin'); return; }
    setToken(t);
    // Load all events for selector
    fetch(`${API_BASE}/api/events/all`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.length > 0) {
          setEvents(d.data);
          // Default to first published/draft event (not archived)
          const active = d.data.find((e: any) => ['published','draft','open','live'].includes(e.status));
          if (active) setEventId(active.id);
          else setEventId(d.data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const save = async (fn: () => Promise<any>) => {
    setSaving(true);
    try { 
      await fn();
      showToast('✅ تم الحفظ بنجاح');
    }
    catch (e: any) { showToast('❌ ' + (e.message || 'حدث خطأ')); }
    finally { setSaving(false); }
  };

  const logout = () => { localStorage.removeItem('admin_token'); router.replace('/admin'); };

  // Group tabs by category
  const groupedTabs = TABS.reduce((acc, tab) => {
    const group = (tab as any).group || 'أخرى';
    if (!acc[group]) acc[group] = [];
    acc[group].push(tab);
    return acc;
  }, {} as Record<string, any[]>);

  const tabGroups = ['رئيسي', 'المبيعات', 'CRM', 'الحدث', 'المحتوى', 'الدعم'] as const;

  return (
    <div style={{ minHeight: '100vh', background: '#0d0b1a', color: '#e2e8f0', fontFamily: 'Cairo,sans-serif', direction: 'rtl', display: 'flex', flexDirection: 'row' }}>
      {/* Sidebar */}
      <aside style={{ width: '280px', background: 'rgba(19,16,42,0.95)', borderLeft: '1px solid rgba(108,99,255,0.15)', height: '100vh', position: 'sticky', top: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Sidebar Header */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(108,99,255,0.15)' }}>
          <h2 style={{ fontWeight: 900, fontSize: '1.1rem', margin: 0 }}>
            <span style={{ color: '#6C63FF' }}>⚙️</span> Admin Panel
          </h2>
          {/* Event Selector — shows always so admin knows which event they're editing */}
          {events.length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <label style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>🗂 الحدث النشط</label>
              {events.length === 1 ? (
                <div style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.25)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', color: 'white', fontSize: '0.85rem' }}>
                  {events[0].name_ar || events[0].name}
                  <span style={{ marginRight: '0.4rem', fontSize: '0.65rem', color: events[0].status === 'published' ? '#34d399' : '#94a3b8' }}>
                    ● {events[0].status === 'published' ? 'منشور' : events[0].status === 'draft' ? 'مسودة' : events[0].status}
                  </span>
                </div>
              ) : (
                <select
                  value={eventId}
                  onChange={e => setEventId(Number(e.target.value))}
                  style={{
                    width: '100%',
                    background: 'rgba(13,11,26,0.95)',
                    border: '1px solid rgba(108,99,255,0.4)',
                    borderRadius: '0.5rem',
                    padding: '0.55rem 0.75rem',
                    color: 'white',
                    fontSize: '0.85rem',
                    outline: 'none',
                    cursor: 'pointer',
                    colorScheme: 'dark',
                    boxShadow: '0 2px 8px rgba(108,99,255,0.2)',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#6C63FF')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(108,99,255,0.4)')}
                >
                  {events.map(ev => {
                    const statusIcon = ev.status === 'published' ? '🟢' : ev.status === 'archived' ? '🔴' : '🟡';
                    const statusLabel = ev.status === 'archived' ? ' (أرشيف)' : ev.status === 'draft' ? ' (مسودة)' : '';
                    return (
                      <option key={ev.id} value={ev.id}>
                        {statusIcon} {ev.name_ar || ev.name}{statusLabel}
                      </option>
                    );
                  })}
                </select>
              )}
              {events.length > 1 && (
                <div style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: '#6b7280', textAlign: 'center' }}>
                  {events.length} أحداث — كل التبويبات تعمل على الحدث المختار
                </div>
              )}
            </div>
          )}
        </div>

        {/* Menu Groups */}
        <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
          {tabGroups.map(groupName => {
            const tabs = groupedTabs[groupName];
            if (!tabs) return null;
            return (
              <div key={groupName} style={{ marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6C63FF', padding: '0.75rem 1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {groupName}
                </div>
                {tabs.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key as Tab)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: 'none',
                      background: activeTab === t.key ? 'rgba(108,99,255,0.25)' : 'transparent',
                      color: activeTab === t.key ? 'white' : '#94a3b8',
                      textAlign: 'right',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s',
                      borderRight: activeTab === t.key ? '3px solid #6C63FF' : '3px solid transparent',
                      fontWeight: activeTab === t.key ? 600 : 400,
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== t.key) {
                        (e.target as HTMLButtonElement).style.background = 'rgba(108,99,255,0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== t.key) {
                        (e.target as HTMLButtonElement).style.background = 'transparent';
                      }
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(108,99,255,0.15)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <a href={`/${eventSlug}`} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '0.85rem', color: '#3b82f6', textDecoration: 'none', padding: '0.5rem', textAlign: 'center', background: 'rgba(59,130,246,0.1)', borderRadius: '0.4rem', border: '1px solid rgba(59,130,246,0.2)', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(59,130,246,0.1)')}
          >
            👁️ عرض الحدث
          </a>
          <button onClick={logout}
            style={{ fontSize: '0.85rem', color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '0.5rem', borderRadius: '0.4rem', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
          >
            🚪 خروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Header */}
        <header style={{ background: 'rgba(19,16,42,0.9)', borderBottom: '1px solid rgba(108,99,255,0.15)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: 'white' }}>
              {TABS.find(t => t.key === activeTab)?.label || 'Dashboard'}
            </h1>
            {events.length > 0 && (
              <span style={{ background: 'rgba(108,99,255,0.15)', color: '#818cf8', fontSize: '0.75rem', padding: '3px 10px', borderRadius: '2rem', fontWeight: 600 }}>
                {eventLabel}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <a href={`/${eventSlug}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: '#94a3b8', textDecoration: 'none' }}>عرض ↗</a>
          </div>
        </header>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
          {activeTab === 'overview'      && <OverviewTab key={eventId} eventId={eventId} token={token} />}
          {activeTab === 'event'         && <EventTab key={eventId} eventId={eventId} eventSlug={eventSlug} token={token} save={save} saving={saving} />}
          {activeTab === 'video'         && <VideoTab key={eventId} eventId={eventId} eventSlug={eventSlug} token={token} save={save} saving={saving} />}
          {activeTab === 'registrations' && <RegistrationsTab key={eventId} eventId={eventId} eventSlug={eventSlug} token={token} router={router} />}
          {activeTab === 'speakers'      && <SpeakersTab key={eventId} eventId={eventId} token={token} save={save} saving={saving} showToast={showToast} />}
          {activeTab === 'venue'         && <VenueGalleryTab key={eventId} eventId={eventId} token={token} showToast={showToast} />}
          {activeTab === 'agenda'        && <AgendaTab key={eventId} eventId={eventId} token={token} save={save} saving={saving} showToast={showToast} />}
          {activeTab === 'sponsors'      && <SponsorsTab key={eventId} eventId={eventId} token={token} save={save} saving={saving} showToast={showToast} />}
          {activeTab === 'faqs'          && <FaqsTab key={eventId} eventId={eventId} token={token} save={save} saving={saving} showToast={showToast} />}
          {activeTab === 'formconfig'    && <FormConfigTab key={eventId} eventId={eventId} eventSlug={eventSlug} token={token} save={save} saving={saving} />}
          {activeTab === 'siteconfig'    && <SiteConfigTab key={eventId} eventId={eventId} eventSlug={eventSlug} token={token} save={save} saving={saving} />}
          {activeTab === 'tickets'       && <AdminTickets key={eventId} eventId={eventId} token={token} />}
          {activeTab === 'support'       && <AdminSupport key={eventId} eventId={eventId} token={token} />}
          {activeTab === 'pixels'        && <AdminPixels key={eventId} eventId={eventId} token={token} />}
          {activeTab === 'email'         && <AdminEmailSettings key={eventId} eventId={eventId} token={token} />}
          {activeTab === 'articles'      && <ArticlesTab key={eventId} eventId={eventId} token={token} showToast={showToast} />}
          {activeTab === 'terms'         && <AdminTerms key={eventId} eventId={eventId} token={token} />}
          {activeTab === 'pages'         && <AdminPages key={eventId} eventId={eventId} token={token} />}
          {activeTab === 'profile'       && <ProfileTab token={token} showToast={showToast} />}
          {activeTab === 'payments'      && <AdminPayments key={eventId} eventId={eventId} token={token} />}
          {activeTab === 'campaigns'     && <AdminCampaigns key={eventId} eventId={eventId} token={token} />}
          {activeTab === 'countries'     && <AdminCountries key={eventId} eventId={eventId} token={token} />}
          {activeTab === 'events_mgmt'   && <AdminEvents token={token} />}
          {/* CRM Tabs */}
          {activeTab === 'crm_contacts'      && <AdminCRMContacts key={eventId} token={token} apiBase={process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev'} />}
          {activeTab === 'crm_tasks'         && <AdminCRMTasks key={eventId} token={token} apiBase={process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev'} eventId={eventId} />}
          {activeTab === 'crm_escalated'     && <AdminCRMTasks key={`esc-${eventId}`} token={token} apiBase={process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev'} eventId={eventId} mode="escalated" />}
          {activeTab === 'crm_sponsorships'  && <AdminCRMSponsorships key={eventId} token={token} apiBase={process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev'} eventId={eventId} />}
        </div>

        {/* Toast Notification */}
        {toast && (
          <div style={{ position: 'fixed', bottom: 24, left: 24, background: '#1a1730', border: '1px solid rgba(108,99,255,0.4)', borderRadius: 8, padding: '0.75rem 1.5rem', zIndex: 999, fontSize: '0.9rem', color: 'white', maxWidth: '300px' }}>
            {toast}
          </div>
        )}
      </main>
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────
function OverviewTab({ eventId, token }: { eventId: number; token: string }) {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => { if (token) fetchStats(eventId).then((r: any) => setStats(r.data)).catch(() => {}); }, [token]);
  const cards = [
    { v: stats?.total_registrations || 0, l: 'إجمالي التسجيلات', c: '#6C63FF', i: '📋' },
    { v: stats?.approved_count || 0,      l: 'المقبولون',          c: '#10b981', i: '✅' },
    { v: stats?.paid_count || 0,          l: 'تم الدفع',           c: '#06b6d4', i: '💳' },
    { v: stats?.pending_count || 0,       l: 'قيد الانتظار',       c: '#f59e0b', i: '⏳' },
    { v: stats?.startup_count || 0,       l: 'شركات ناشئة',        c: '#8b5cf6', i: '🚀' },
    { v: stats?.investor_count || 0,      l: 'مستثمرون',           c: '#0ea5e9', i: '💼' },
    { v: stats?.speaker_count || 0,       l: 'متحدثون',            c: '#ec4899', i: '🎙️' },
    { v: stats?.general_count || 0,       l: 'حضور عام',           c: '#6b7280', i: '👤' },
  ];
  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '1.5rem' }}>نظرة عامة</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 14 }}>
        {cards.map(({ v, l, c, i }) => (
          <div key={l} style={S.card}>
            <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{i}</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: c }}>{v}</div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Event Info ────────────────────────────────────────────────────────────────
function EventTab({ eventId, eventSlug, token, save, saving }: any) {
  const [form, setForm] = useState<any>({});
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!token || !eventSlug) return;
    fetchEvent(eventSlug).then((r: any) => { setForm(r.data); setLoaded(true); }).catch(() => {});
  }, [token]);
  if (!loaded) return <p style={{ color: '#94a3b8' }}>جار التحميل...</p>;
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const fields: Array<{ key: string; label: string; type?: string; textarea?: boolean }> = [
    { key: 'name',           label: 'اسم الحدث (EN)' },
    { key: 'name_ar',        label: 'اسم الحدث (AR)' },
    { key: 'tagline',        label: 'الشعار (EN)' },
    { key: 'tagline_ar',     label: 'الشعار (AR)' },
    { key: 'description_ar', label: 'الوصف (AR)', textarea: true },
    { key: 'location_ar',    label: 'الموقع (AR)' },
    { key: 'start_date',     label: 'تاريخ البداية', type: 'date' },
    { key: 'end_date',       label: 'تاريخ النهاية', type: 'date' },
    { key: 'max_attendees',  label: 'الحد الأقصى للحضور', type: 'number' },
    { key: 'email',          label: 'البريد الإلكتروني', type: 'email' },
    { key: 'twitter',        label: 'تويتر' },
    { key: 'instagram',      label: 'انستغرام' },
    { key: 'linkedin',       label: 'لينكدإن' },
    { key: 'primary_color',  label: 'اللون الرئيسي', type: 'color' },
  ];
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white' }}>معلومات الحدث</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <label style={S.label}>حالة التسجيل</label>
            <select value={form.registration_open ? '1' : '0'} onChange={e => set('registration_open', e.target.value === '1')}
              style={{ ...S.inp, width: 'auto', padding: '0.4rem 0.7rem' }}>
              <option value="1">مفتوح ✅</option>
              <option value="0">مغلق 🔒</option>
            </select>
          </div>
          <div>
            <label style={S.label}>حالة الحدث</label>
            <select value={form.status || 'draft'} onChange={e => set('status', e.target.value)}
              style={{ ...S.inp, width: 'auto', padding: '0.4rem 0.7rem' }}>
              <option value="draft">مسودة</option>
              <option value="published">منشور</option>
              <option value="archived">مؤرشف</option>
            </select>
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <SaveBtn loading={saving} onClick={() => save(async () => {
              await updateEvent(eventId, form, token);
              // Clear client cache for this event's slug so next load gets fresh data
              clearApiCacheFor(`/api/events/${eventSlug}`);
              clearApiCacheFor('/api/events');
            })} />
          </div>
        </div>
      </div>
      <div style={{ ...S.card, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {fields.map(({ key, label, type, textarea }) => (
          <div key={key} style={textarea ? { gridColumn: '1/-1' } : {}}>
            <Field label={label}>
              {textarea
                ? <textarea value={form[key] || ''} onChange={e => set(key, e.target.value)} rows={3} style={{ ...S.inp, resize: 'vertical' }} />
                : <input type={type || 'text'} value={form[key] || ''} onChange={e => set(key, e.target.value)}
                    style={{ ...S.inp, ...(type === 'color' ? { padding: '0.2rem', height: 42, cursor: 'pointer' } : {}) }} />
              }
            </Field>
          </div>
        ))}
        
        {/* <HelpBox title="شرح الشعارات والصور" icon="🖼️">
          <div style={{ display: 'grid', gap: 10 }}>
            <div>
              <strong style={{ color: '#fff' }}>📸 صورة الغلاف:</strong> صورة خلفية الحدث الرئيسية (تظهر في البريد والتطبيق)
            </div>
            <div>
              <strong style={{ color: '#fff' }}>🏢 شعار الحدث:</strong> شعار الحدث الرسمي (يظهر في النماذج والرسائل البريدية والإشعارات)
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '4px', marginTop: '8px' }}>
              <strong style={{ color: '#60a5fa' }}>ملاحظة:</strong> هناك أيضاً شعار منفصل لمحتوى الصفحة الرئيسية في قسم "محتوى الصفحة" يظهر فقط للزوار
            </div>
          </div>
        </HelpBox> */}

        {/* Cover image and logo hidden temporarily */}
        {false && <div>
          <Field label="صورة الغلاف">
            {form.cover_image && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <img src={form.cover_image} alt="cover" style={{ height: 60, borderRadius: 4, objectFit: 'cover' }} />
                <button style={{ ...S.del, whiteSpace: 'nowrap' }} onClick={() => set('cover_image', '')}>✕ حذف</button>
              </div>
            )}
            <input value={form.cover_image || ''} onChange={e => set('cover_image', e.target.value)} style={S.inp} />
          </Field>
          <ImageUploadField onUploaded={(value) => set('cover_image', value)} maxSizeMB={4} token={token} />
        </div>}
        {false && <div>
          <Field label="شعار الحدث">
            {form.logo && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <img src={form.logo} alt="logo" style={{ height: 60, borderRadius: 4, objectFit: 'contain', background: 'rgba(255,255,255,0.05)', padding: 4 }} />
                <button style={{ ...S.del, whiteSpace: 'nowrap' }} onClick={() => set('logo', '')}>✕ حذف</button>
              </div>
            )}
            <input value={form.logo || ''} onChange={e => set('logo', e.target.value)} style={S.inp} />
          </Field>
          <ImageUploadField onUploaded={(value) => set('logo', value)} maxSizeMB={3} token={token} />
        </div>}
      </div>
    </div>
  );
}

// ── Registrations ─────────────────────────────────────────────────────────────
// ── Registrations ─────────────────────────────────────────────────────────────
function RegistrationsTab({ eventId, eventSlug, token, router }: any) {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<any>(null);
  const [cfg, setCfg] = useState<any>(null);
  const limit = 20;

  // Load form config - reload every time registrations tab is opened
  const loadCfg = () => {
    if (!token || !eventSlug) return;
    fetchEvent(eventSlug).then((r: any) => {
      if (r.data?.form_config) {
        try { setCfg(JSON.parse(r.data.form_config)); } catch { setCfg(null); }
      }
    }).catch(() => {});
  };

  useEffect(() => {
    loadCfg();
  }, [token, eventSlug]);

  // Get available types from form config
  const availableTypes = cfg?.enabled_types || ['startup', 'general'];
  const typeLabels = cfg?.type_labels || TYPE_LABELS;

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (filterStatus) p.set('status', filterStatus);
      if (filterType)   p.set('type', filterType);
      if (search)       p.set('search', search);
      p.set('limit', String(limit));
      p.set('offset', String(page * limit));
      const res: any = await fetchRegistrations(eventId, token, p.toString());
      setRegistrations(res.data || []); setTotal(res.total || 0);
    } catch (e: any) {
      if (e.message?.includes('Unauthorized')) router.replace('/admin');
    }
    setLoading(false);
  }, [token, filterStatus, filterType, search, page]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (id: number, status: string) => {
    // Optimistic update - update UI immediately
    setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    if (selected?.id === id) setSelected((s: any) => s ? { ...s, status } : null);
    try {
      await updateRegistration(eventId, id, { status }, token);
      clearApiCacheFor(`/api/events/${eventId}/registrations`);

      // When marked as paid → auto-create a payment record in payment_orders
      if (status === 'paid') {
        const reg = registrations.find(r => r.id === id) || selected;
        if (reg) {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev'}/api/events/${eventId}/payments/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              registration_id: id,
              amount: 0,               // Admin can update actual amount in payments tab
              currency: 'USD',
              status: 'paid',
              customer_name: reg.full_name || reg.name || '',
              customer_email: reg.email || '',
              customer_phone: reg.phone || '',
              notes: `تأكيد دفع يدوي — ${reg.reg_type || reg.registration_type || 'عام'}`,
            }),
          }).catch(() => {}); // Non-blocking
        }
      }
    } catch (e: any) {
      load();
      alert('❌ خطأ في تحديث الحالة: ' + e.message);
    }
  };

  const deleteReg = async (id: number) => {
    if (!confirm('هل تريد حذف هذا التسجيل؟')) return;
    try {
      await deleteRegistration(eventId, id, token);
      load();
      if (selected?.id === id) setSelected(null);
    } catch (e: any) {
      alert('❌ خطأ: ' + e.message);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, { bg: string; color: string }> = {
      startup:   { bg: '#6C63FF', color: '#C7D2FE' },
      investor:  { bg: '#10b981', color: '#86EFAC' },
      speaker:   { bg: '#ec4899', color: '#F472B6' },
      sponsor:   { bg: '#0ea5e9', color: '#7DD3FC' },
      general:   { bg: '#8b5cf6', color: '#D8B4FE' },
      media:     { bg: '#f59e0b', color: '#FED7AA' },
    };
    return colors[type] || { bg: '#6b7280', color: '#E5E7EB' };
  };

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white' }}>التسجيلات <span style={{ color: '#94a3b8', fontSize: '1rem' }}>({total})</span></h1>
        </div>
        
        <HelpBox title="ما هي التسجيلات؟" icon="📋">
          <div style={{ display: 'grid', gap: 10 }}>
            <div>
              <strong style={{ color: '#fff' }}>التسجيلات:</strong> هي الأشخاص الذين تسجلوا للحضور في الحدث من خلال النموذج
            </div>
            <div>
              <strong style={{ color: '#fff' }}>🔍 البحث:</strong> ابحث بالاسم أو البريد الإلكتروني
            </div>
            <div>
              <strong style={{ color: '#fff' }}>📊 الفلاتر:</strong>
              <ul style={{ margin: '6px 0 0 20px', color: '#e0e7ff' }}>
                <li><strong>الحالة:</strong> قيد الانتظار / مقبول / مرفوض / في قائمة الانتظار / ملغى</li>
                <li><strong>النوع:</strong> شركة ناشئة / حضور عام / مستثمر / متحدث / راعي / إعلام</li>
              </ul>
            </div>
            <div>
              <strong style={{ color: '#fff' }}>✏️ تغيير الحالة:</strong> اختر الحالة من القائمة لكل تسجيل
            </div>
          </div>
        </HelpBox>

        <div style={{ ...S.card, display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <input placeholder="بحث..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} style={{ ...S.inp, width: 180 }} />
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0); }} style={{ ...S.inp, width: 140 }}>
            <option value="">كل الحالات</option>
            {Object.entries(STATUS_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(0); }} style={{ ...S.inp, width: 160 }}>
            <option value="">كل الأنواع</option>
            {availableTypes.map((t: string) => (
              <option key={t} value={t}>{typeLabels[t as keyof typeof typeLabels] || t}</option>
            ))}
          </select>
        </div>
        <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['الاسم','البريد','النوع','الوصف','المدينة','الحالة','التاريخ','تغيير الحالة'].map(h => (
                    <th key={h} style={{ textAlign: 'right', padding: '0.65rem 0.85rem', color: '#94a3b8', fontWeight: 600, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>جار التحميل...</td></tr>
                ) : registrations.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>لا توجد تسجيلات</td></tr>
                ) : registrations.map(reg => {
                  const st = STATUS_STYLES[reg.status] || STATUS_STYLES.pending;
                  const typeLabel = typeLabels[reg.type as keyof typeof typeLabels] || reg.type;
                  const typeColor = getTypeColor(reg.type);
                  return (
                    <tr key={reg.id} onClick={() => setSelected(reg)}
                      style={{ borderTop: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', background: selected?.id === reg.id ? 'rgba(108,99,255,0.1)' : 'transparent' }}>
                      <td style={{ padding: '0.7rem 0.85rem', borderRight: '1px solid rgba(255,255,255,0.03)' }}>{reg.name}</td>
                      <td style={{ padding: '0.7rem 0.85rem', borderRight: '1px solid rgba(255,255,255,0.03)', fontSize: '0.78rem' }}>{reg.email}</td>
                      <td style={{ padding: '0.7rem 0.85rem', borderRight: '1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{ display: 'inline-block', background: `${typeColor.bg}20`, color: typeColor.color, padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 500 }}>
                          {typeLabel}
                        </span>
                      </td>
                      <td style={{ padding: '0.7rem 0.85rem', borderRight: '1px solid rgba(255,255,255,0.03)', fontSize: '0.78rem', color: '#94a3b8' }}>{reg.work_field || reg.participation_reason?.substring(0, 30) || '—'}</td>
                      <td style={{ padding: '0.7rem 0.85rem', borderRight: '1px solid rgba(255,255,255,0.03)' }}>{reg.city}</td>
                      <td style={{ padding: '0.7rem 0.85rem', borderRight: '1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{ background: st.bg, color: 'white', padding: '0.2rem 0.5rem', borderRadius: 3, fontSize: '0.72rem' }}>{st.label}</span>
                      </td>
                      <td style={{ padding: '0.6rem 0.85rem', color: '#94a3b8', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{new Date(reg.created_at).toLocaleDateString('ar')}</td>
                      <td style={{ padding: '0.6rem 0.85rem' }} onClick={e => e.stopPropagation()}>
                        <select value={reg.status} onChange={e => changeStatus(reg.id, e.target.value)}
                          style={{ ...S.inp, width: 'auto', padding: '0.25rem 0.4rem', fontSize: '0.72rem' }}>
                          {Object.entries(STATUS_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {total > limit && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{page * limit + 1}–{Math.min((page + 1) * limit, total)} من {total}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ ...S.btn('#1a1730'), opacity: page === 0 ? 0.4 : 1, border: '1px solid rgba(255,255,255,0.1)' }}>السابق</button>
                <button disabled={(page + 1) * limit >= total} onClick={() => setPage(p => p + 1)} style={{ ...S.btn('#1a1730'), opacity: (page + 1) * limit >= total ? 0.4 : 1, border: '1px solid rgba(255,255,255,0.1)' }}>التالي</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {selected && (
        <div style={{ ...S.card, width: 280, flexShrink: 0, alignSelf: 'flex-start', position: 'sticky', top: 62 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>التفاصيل</span>
            <button onClick={() => setSelected(null)} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
          {([['الاسم',selected.name],['البريد',selected.email],['النوع',typeLabels[selected.type as keyof typeof typeLabels] || selected.type],['الهاتف',selected.phone||'—'],['المدينة',selected.city||'—'],['مجال العمل',selected.work_field||'—'],['سبب المشاركة',selected.participation_reason||'—'],['التاريخ',new Date(selected.created_at).toLocaleDateString('ar')]] as [string,string][]).map(([k,v]) => (
            <div key={k} style={{ marginBottom: 6 }}>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{k}: </span>
              <span style={{ fontSize: '0.82rem', color: 'white' }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop: 10 }}>
            <label style={S.label}>تغيير الحالة</label>
            <select value={selected.status} onChange={e => { changeStatus(selected.id, e.target.value); setSelected((s: any) => ({ ...s, status: e.target.value })); }} style={S.inp}>
              {Object.entries(STATUS_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button onClick={() => changeStatus(selected.id, 'approved')} style={{ flex: 1, ...S.btn('#10b98130'), color: '#10b981', border: '1px solid #10b98140' }}>✅ قبول</button>
            <button onClick={() => changeStatus(selected.id, 'paid')} style={{ flex: 1, ...S.btn('#06b6d430'), color: '#06b6d4', border: '1px solid #06b6d440' }}>💳 تم الدفع</button>
            <button onClick={() => changeStatus(selected.id, 'rejected')} style={{ flex: 1, ...S.btn('#ef444420'), color: '#ef4444', border: '1px solid #ef444440' }}>❌ رفض</button>
          </div>
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => deleteReg(selected.id)} style={{ ...S.del, width: '100%', textAlign: 'center', justifyContent: 'center' }}>🗑️ حذف</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Speakers ──────────────────────────────────────────────────────────────────
function SpeakersTab({ eventId, token, save, saving, showToast }: any) {
  const [speakers, setSpeakers] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const blank = { name: '', name_ar: '', title_ar: '', company: '', bio_ar: '', bio_extended: '', achievements: '', linkedin_url: '', twitter_url: '', photo_url: '', is_featured: false, is_surprise: false, sort_order: 0 };
  const [form, setForm] = useState<any>(blank);

  const load = () => {
    if (token) {
      clearApiCacheFor(`/api/events/${eventId}/speakers`);
      fetchSpeakers(eventId).then((r: any) => setSpeakers(r.data || [])).catch(() => {});
    }
  };
  useEffect(() => { load(); }, [token]);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const saveItem = () => save(async () => {
    if (editing) await updateSpeaker(eventId, editing.id, form, token);
    else         await createSpeaker(eventId, form, token);
    clearApiCacheFor(`/api/events/${eventId}/speakers`);
    setEditing(null); setAdding(false); setForm(blank); load();
  });

  const del = async (id: number) => {
    if (!confirm('حذف المتحدث؟')) return;
    // Optimistic UI update
    setSpeakers(prev => prev.filter(s => s.id !== id));
    try {
      await deleteSpeaker(eventId, id, token);
      showToast('✅ تم الحذف');
      clearApiCacheFor(`/api/events/${eventId}/speakers`);
    } catch (e: any) {
      showToast('❌ ' + e.message);
      load(); // revert on error
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white' }}>المتحدثون ({speakers.length})</h1>
        {!adding && <button style={S.btn()} onClick={() => { setAdding(true); setEditing(null); setForm(blank); }}>+ إضافة متحدث</button>}
      </div>

      {adding && (
        <div style={{ ...S.card, marginBottom: 16 }}>
          <h3 style={{ color: 'white', marginBottom: 12 }}>{editing ? 'تعديل متحدث' : 'إضافة متحدث'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="الاسم (EN)"><input value={form.name} onChange={e => set('name', e.target.value)} style={S.inp} /></Field>
            <Field label="الاسم (AR)"><input value={form.name_ar||''} onChange={e => set('name_ar', e.target.value)} style={S.inp} /></Field>
            <Field label="المسمى (AR)"><input value={form.title_ar||''} onChange={e => set('title_ar', e.target.value)} style={S.inp} /></Field>
            <Field label="الشركة"><input value={form.company||''} onChange={e => set('company', e.target.value)} style={S.inp} /></Field>
            <div>
              <Field label="رابط الصورة">
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <input value={form.photo_url||''} onChange={e => set('photo_url', e.target.value)} style={{ ...S.inp, flex: 1 }} />
                  {form.photo_url && <button style={{ ...S.del, whiteSpace: 'nowrap' }} onClick={() => set('photo_url', '')}>✕ حذف</button>}
                </div>
              </Field>
              <ImageUploadField onUploaded={(value) => set('photo_url', value)} maxSizeMB={3} token={token} />
            </div>
            <Field label="الترتيب"><input type="number" value={form.sort_order||0} onChange={e => set('sort_order', +e.target.value)} style={S.inp} /></Field>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="النبذة (AR)"><textarea value={form.bio_ar||''} onChange={e => set('bio_ar', e.target.value)} rows={2} style={{ ...S.inp, resize: 'vertical' }} /></Field>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="السيرة التفصيلية (تظهر عند الضغط على المتحدث)"><textarea value={form.bio_extended||''} onChange={e => set('bio_extended', e.target.value)} rows={3} style={{ ...S.inp, resize: 'vertical' }} placeholder="تفاصيل إضافية عن المتحدث..." /></Field>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="الإنجازات (كل إنجاز في سطر)"><textarea value={form.achievements||''} onChange={e => set('achievements', e.target.value)} rows={3} style={{ ...S.inp, resize: 'vertical' }} placeholder="إنجاز 1&#10;إنجاز 2&#10;إنجاز 3" /></Field>
            </div>
            <Field label="رابط LinkedIn"><input value={form.linkedin_url||''} onChange={e => set('linkedin_url', e.target.value)} style={S.inp} placeholder="https://linkedin.com/in/..." /></Field>
            <Field label="رابط Twitter/X"><input value={form.twitter_url||''} onChange={e => set('twitter_url', e.target.value)} style={S.inp} placeholder="https://twitter.com/..." /></Field>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e2e8f0', cursor: 'pointer', fontSize: '0.88rem' }}>
              <input type="checkbox" checked={!!form.is_featured} onChange={e => set('is_featured', e.target.checked)} /> متحدث مميز
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e2e8f0', cursor: 'pointer', fontSize: '0.88rem' }}>
              <input type="checkbox" checked={!!form.is_surprise} onChange={e => set('is_surprise', e.target.checked)} /> مفاجأة
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <SaveBtn loading={saving} onClick={saveItem} />
            <button style={S.del} onClick={() => { setAdding(false); setEditing(null); setForm(blank); }}>إلغاء</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
        {speakers.map(sp => (
          <div key={sp.id} style={S.card}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
              {sp.photo_url
                ? <img src={sp.photo_url} alt={sp.name_ar} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(108,99,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>🎙️</div>
              }
              <div>
                <div style={{ color: 'white', fontWeight: 700, fontSize: '0.92rem' }}>{sp.name_ar || sp.name}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{sp.title_ar}</div>
                <div style={{ color: '#6C63FF', fontSize: '0.72rem' }}>{sp.company}</div>
                {sp.is_featured ? <span style={{ fontSize: '0.65rem', background: '#6C63FF30', color: '#6C63FF', padding: '0.1rem 0.35rem', borderRadius: 4 }}>⭐ مميز</span> : null}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={S.btn('#1a2744')} onClick={() => { setEditing(sp); setAdding(true); setForm({ ...sp, is_featured: !!sp.is_featured, is_surprise: !!sp.is_surprise }); }}>تعديل</button>
              <button style={S.del} onClick={() => del(sp.id)}>حذف</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Agenda ────────────────────────────────────────────────────────────────────
function AgendaTab({ eventId, token, save, saving, showToast }: any) {
  const [agenda, setAgenda] = useState<any[]>([]);
  const [speakers, setSpeakers] = useState<any[]>([]);
  const [addingDay, setAddingDay] = useState(false);
  const [dayForm, setDayForm] = useState({ day_number: 1, date: '', label: '', label_en: '' });
  const [editingDay, setEditingDay] = useState<any>(null);
  const [dayEditForm, setDayEditForm] = useState<any>({});
  const [sessionState, setSessionState] = useState<{ dayId: number | null; editing: any }>({ dayId: null, editing: null });
  const [sessionForm, setSessionForm] = useState<any>({});

  const load = () => {
    if (!token) return;
    clearApiCacheFor(`/api/events/${eventId}/agenda`);
    fetchAgenda(eventId).then((r: any) => setAgenda(r.data || [])).catch(() => {});
    fetchSpeakers(eventId).then((r: any) => setSpeakers(r.data || [])).catch(() => {});
  };
  useEffect(() => { load(); }, [token]);

  const blankSession = (dayId: number) => ({ day_id: dayId, time_start: '', time_end: '', title_ar: '', description_ar: '', session_type: 'talk', speaker_id: '', sort_order: 0 });
  const set = (k: string, v: any) => setSessionForm((f: any) => ({ ...f, [k]: v }));

  const saveSession = () => save(async () => {
    const body = {
      ...sessionForm,
      day_id: Number(sessionForm.day_id),
      speaker_id: sessionForm.speaker_id ? Number(sessionForm.speaker_id) : null,
    };
    if (sessionState.editing) await updateAgendaSession(eventId, sessionState.editing.id, body, token);
    else                       await createAgendaSession(eventId, body, token);
    clearApiCacheFor(`/api/events/${eventId}/agenda`);
    setSessionState({ dayId: null, editing: null }); load();
  });

  const delSession = async (id: number) => {
    if (!confirm('حذف الجلسة؟')) return;
    try { await deleteAgendaSession(eventId, id, token); clearApiCacheFor(`/api/events/${eventId}/agenda`); showToast('✅ تم الحذف'); load(); }
    catch (e: any) { showToast('❌ ' + e.message); }
  };

  const saveDay = () => save(async () => {
    await createAgendaDay(eventId, dayForm, token);
    setAddingDay(false); setDayForm({ day_number: 1, date: '', label: '', label_en: '' }); load();
  });

  const saveDayEdit = () => save(async () => {
    await updateAgendaDay(eventId, editingDay.id, dayEditForm, token);
    setEditingDay(null); load();
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white' }}>البرنامج</h1>
        <button style={S.btn()} onClick={() => setAddingDay(true)}>+ يوم جديد</button>
      </div>

      <HelpBox title="إدارة البرنامج والتواريخ" icon="📅">
        <div style={{ display: 'grid', gap: 10 }}>
          <div>
            <strong style={{ color: '#fff' }}>الخطوة 1: إضافة أيام</strong>
            <p style={{ margin: '4px 0 0 0' }}>اضغط "يوم جديد" وأدخل التاريخ (مثال: 2026-12-25) والتسمية (مثال: اليوم الأول)</p>
          </div>
          <div>
            <strong style={{ color: '#fff' }}>الخطوة 2: إضافة جلسات</strong>
            <p style={{ margin: '4px 0 0 0' }}>اضغط "جلسة جديدة" تحت كل يوم وأدخل: الوقت (09:00)، العنوان، النوع (محاضرة/ورشة/...)، والمتحدث</p>
          </div>
          <div>
            <strong style={{ color: '#fff' }}>✏️ تعديل التاريخ:</strong>
            <p style={{ margin: '4px 0 0 0' }}>لتعديل تاريخ اليوم: اضغط على اليوم واعدل حقل التاريخ، ثم اضغط حفظ</p>
          </div>
          <div>
            <strong style={{ color: '#fff' }}>🔄 تحريك الجلسات:</strong>
            <p style={{ margin: '4px 0 0 0' }}>لنقل جلسة من يوم لآخر: اضغط "تعديل" وغير "اليوم" من القائمة المنسدلة</p>
          </div>
        </div>
      </HelpBox>

      {addingDay && (
        <div style={{ ...S.card, marginBottom: 16 }}>
          <h3 style={{ color: 'white', marginBottom: 12 }}>إضافة يوم</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="رقم اليوم"><input type="number" value={dayForm.day_number} onChange={e => setDayForm(f => ({ ...f, day_number: +e.target.value }))} style={S.inp} /></Field>
            <Field label="التاريخ"><input type="date" value={dayForm.date} onChange={e => setDayForm(f => ({ ...f, date: e.target.value }))} style={S.inp} /></Field>
            <Field label="التسمية (AR)"><input value={dayForm.label} onChange={e => setDayForm(f => ({ ...f, label: e.target.value }))} style={S.inp} /></Field>
            <Field label="التسمية (EN)"><input value={dayForm.label_en} onChange={e => setDayForm(f => ({ ...f, label_en: e.target.value }))} style={S.inp} /></Field>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <SaveBtn loading={saving} onClick={saveDay} />
            <button style={S.del} onClick={() => setAddingDay(false)}>إلغاء</button>
          </div>
        </div>
      )}

      {agenda.map((day: any) => (
        <div key={day.id} style={{ ...S.card, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ color: 'white', fontWeight: 700 }}>{day.label} — {day.date}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={S.btn()} onClick={() => { setEditingDay(day); setDayEditForm({ date: day.date, label: day.label, label_en: day.label_en, day_number: day.day_number }); }}>📅 تعديل التاريخ</button>
              <button style={S.btn()} onClick={() => { setSessionState({ dayId: day.id, editing: null }); setSessionForm(blankSession(day.id)); }}>+ جلسة</button>
            </div>
          </div>

          {editingDay?.id === day.id && (
            <div style={{ background: 'rgba(108,99,255,0.07)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 8, padding: 12, marginBottom: 10 }}>
              <h3 style={{ color: 'white', marginBottom: 12 }}>تعديل تاريخ اليوم</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="التاريخ"><input type="date" value={dayEditForm.date||''} onChange={e => setDayEditForm((f: any) => ({ ...f, date: e.target.value }))} style={S.inp} /></Field>
                <Field label="رقم اليوم"><input type="number" value={dayEditForm.day_number||0} onChange={e => setDayEditForm((f: any) => ({ ...f, day_number: +e.target.value }))} style={S.inp} /></Field>
                <Field label="التسمية (AR)"><input value={dayEditForm.label||''} onChange={e => setDayEditForm((f: any) => ({ ...f, label: e.target.value }))} style={S.inp} /></Field>
                <Field label="التسمية (EN)"><input value={dayEditForm.label_en||''} onChange={e => setDayEditForm((f: any) => ({ ...f, label_en: e.target.value }))} style={S.inp} /></Field>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <SaveBtn loading={saving} onClick={saveDayEdit} />
                <button style={S.del} onClick={() => setEditingDay(null)}>إلغاء</button>
              </div>
            </div>
          )}

          {sessionState.dayId === day.id && (
            <div style={{ background: 'rgba(108,99,255,0.07)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 8, padding: 12, marginBottom: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="اليوم">
                  <select value={sessionForm.day_id||day.id} onChange={e => set('day_id', Number(e.target.value))} style={S.inp}>
                    {agenda.map((d: any) => <option key={d.id} value={d.id}>{d.label || `اليوم ${d.day_number}`}</option>)}
                  </select>
                </Field>
                <div />
                <Field label="وقت البداية"><input type="time" value={sessionForm.time_start||''} onChange={e => set('time_start', e.target.value)} style={S.inp} /></Field>
                <Field label="وقت النهاية"><input type="time" value={sessionForm.time_end||''} onChange={e => set('time_end', e.target.value)} style={S.inp} /></Field>
                <Field label="العنوان (AR)"><input value={sessionForm.title_ar||''} onChange={e => set('title_ar', e.target.value)} style={S.inp} /></Field>
                <Field label="نوع الجلسة">
                  <select value={sessionForm.session_type||'talk'} onChange={e => set('session_type', e.target.value)} style={S.inp}>
                    {SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="المتحدث">
                  <select value={sessionForm.speaker_id||''} onChange={e => set('speaker_id', e.target.value)} style={S.inp}>
                    <option value="">— بدون متحدث —</option>
                    {speakers.map((sp: any) => <option key={sp.id} value={sp.id}>{sp.name_ar||sp.name}</option>)}
                  </select>
                </Field>
                <Field label="الترتيب"><input type="number" value={sessionForm.sort_order||0} onChange={e => set('sort_order', +e.target.value)} style={S.inp} /></Field>
                <div style={{ gridColumn: '1/-1' }}>
                  <Field label="الوصف (AR)"><textarea value={sessionForm.description_ar||''} onChange={e => set('description_ar', e.target.value)} rows={2} style={{ ...S.inp, resize: 'vertical' }} /></Field>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <SaveBtn loading={saving} onClick={saveSession} />
                <button style={S.del} onClick={() => setSessionState({ dayId: null, editing: null })}>إلغاء</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(day.sessions || []).map((s: any) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '0.45rem 0.7rem', flexWrap: 'wrap' }}>
                <span style={{ color: '#6C63FF', fontSize: '0.75rem', minWidth: 90 }}>{s.time_start}–{s.time_end}</span>
                <span style={{ background: 'rgba(108,99,255,0.2)', color: '#a78bfa', fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: 4 }}>{s.session_type}</span>
                <span style={{ color: 'white', flex: 1, fontSize: '0.83rem' }}>{s.title_ar}</span>
                {s.speaker_name && <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{s.speaker_name}</span>}
                <button style={S.btn('#1a2744')} onClick={() => { setSessionState({ dayId: day.id, editing: s }); setSessionForm({ ...s, speaker_id: s.speaker_id||'' }); }}>تعديل</button>
                <button style={S.del} onClick={() => delSession(s.id)}>حذف</button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Video Tab ─────────────────────────────────────────────────────────────────
function VideoTab({ eventId, eventSlug, token, save, saving }: any) {
  const [form, setForm] = useState({ intro_video_url: '', intro_video_thumbnail: '', show_intro_video: false });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!token || !eventSlug) return;
    fetchEvent(eventSlug)
      .then((res: any) => {
        const ev = res?.data;
        if (ev) {
          setForm({
            intro_video_url: ev.intro_video_url || '',
            intro_video_thumbnail: ev.intro_video_thumbnail || '',
            show_intro_video: !!ev.show_intro_video,
          });
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [token, eventSlug]);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const saveVideo = () => save(async () => {
    await updateEvent(eventId, form, token);
  });

  if (!loaded) return <div style={{ color: '#94a3b8', padding: 20 }}>جار التحميل...</div>;

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', marginBottom: '1.5rem' }}>🎬 الفيديو التعريفي</h1>
      <div style={{ ...S.card, marginBottom: 16 }}>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 16, lineHeight: 1.6 }}>
          أضف فيديو تعريفي يظهر في الصفحة الرئيسية. يدعم روابط YouTube أو Vimeo أو رابط مباشر للفيديو.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="رابط الفيديو (YouTube/Vimeo/Direct)">
            <input
              value={form.intro_video_url}
              onChange={e => set('intro_video_url', e.target.value)}
              style={S.inp}
              placeholder="https://youtube.com/watch?v=... أو https://vimeo.com/..."
            />
          </Field>
          <Field label="صورة المعاينة (Thumbnail) - اختياري">
            <input
              value={form.intro_video_thumbnail}
              onChange={e => set('intro_video_thumbnail', e.target.value)}
              style={S.inp}
              placeholder="https://..."
            />
          </Field>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#e2e8f0', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input
              type="checkbox"
              checked={form.show_intro_video}
              onChange={e => set('show_intro_video', e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#6C63FF' }}
            />
            <span>عرض الفيديو في الصفحة الرئيسية</span>
          </label>
        </div>
        {form.intro_video_url && (
          <div style={{ marginTop: 16, padding: 12, background: 'rgba(108,99,255,0.08)', borderRadius: 8, border: '1px solid rgba(108,99,255,0.2)' }}>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 8 }}>معاينة:</p>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 8, overflow: 'hidden' }}>
              {form.intro_video_url.includes('youtube.com') || form.intro_video_url.includes('youtu.be') ? (
                <iframe
                  src={form.intro_video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                  allowFullScreen
                />
              ) : (
                <video src={form.intro_video_url} controls style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
              )}
            </div>
          </div>
        )}
        <div style={{ marginTop: 16 }}>
          <SaveBtn loading={saving} onClick={saveVideo} />
        </div>
      </div>
    </div>
  );
}

// ── Venue Gallery Tab ─────────────────────────────────────────────────────────
function VenueGalleryTab({ eventId, token, showToast }: any) {
  const [gallery, setGallery] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const blank = { media_url: '', media_type: 'image', title: '', description: '', sort_order: 0 };
  const [form, setForm] = useState<any>(blank);

  const load = () => {
    if (token) fetchVenueGalleryAdmin(eventId, token).then((r: any) => setGallery(r.data || [])).catch(() => {});
  };
  useEffect(() => { load(); }, [token]);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const saveItem = async () => {
    if (!form.media_url) { showToast('❌ الرابط مطلوب'); return; }
    setSaving(true);
    try {
      await createVenueMedia(eventId, form, token);
      showToast('✅ تم الإضافة');
      setAdding(false);
      setForm(blank);
      load();
    } catch (e: any) {
      showToast('❌ ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: number) => {
    if (!confirm('حذف هذا العنصر من المعرض؟')) return;
    try {
      await deleteVenueMedia(eventId, id, token);
      showToast('✅ تم الحذف');
      load();
    } catch (e: any) { showToast('❌ ' + e.message); }
  };

  const toggleActive = async (item: any) => {
    try {
      await updateVenueMedia(eventId, item.id, { is_active: !item.is_active }, token);
      showToast(item.is_active ? 'تم الإخفاء' : 'تم الإظهار');
      load();
    } catch (e: any) { showToast('❌ ' + e.message); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white' }}>📸 معرض صور المؤتمر ({gallery.filter((g:any) => g.is_active).length} نشط)</h1>
        {!adding && <button style={S.btn()} onClick={() => { setAdding(true); setForm(blank); }}>+ إضافة صورة/فيديو</button>}
      </div>

      {adding && (
        <div style={{ ...S.card, marginBottom: 16 }}>
          <h3 style={{ color: 'white', marginBottom: 12 }}>إضافة عنصر للمعرض</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="نوع الوسيط">
                <select value={form.media_type} onChange={e => set('media_type', e.target.value)} style={{ ...S.inp }}>
                  <option value="image">🖼️ صورة</option>
                  <option value="video">🎬 فيديو</option>
                </select>
              </Field>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="رابط الصورة/الفيديو *">
                <input value={form.media_url} onChange={e => set('media_url', e.target.value)} style={S.inp} placeholder="https://..." />
              </Field>
              {/* Unified media upload — supports both images and videos */}
              <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <MediaUploadField
                  mediaType={form.media_type}
                  onUploaded={(v) => set('media_url', v)}
                  token={token}
                />
              </div>
            </div>
            <Field label="العنوان (اختياري)"><input value={form.title||''} onChange={e => set('title', e.target.value)} style={S.inp} placeholder="القاعة الرئيسية..." /></Field>
            <Field label="الترتيب"><input type="number" value={form.sort_order||0} onChange={e => set('sort_order', +e.target.value)} style={S.inp} /></Field>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button style={S.btn()} onClick={saveItem} disabled={saving}>{saving ? 'جار الحفظ...' : 'حفظ'}</button>
            <button style={S.del} onClick={() => { setAdding(false); setForm(blank); }}>إلغاء</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
        {gallery.map(item => (
          <div key={item.id} style={{ ...S.card, padding: '0.75rem', opacity: item.is_active ? 1 : 0.5 }}>
            <div style={{ position: 'relative', aspectRatio: '16/9', background: '#0d0b1a', borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
              {item.media_type === 'video' ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1730', color: 'white', fontSize: '2rem' }}>▶</div>
              ) : (
                <img src={item.media_url} alt={item.title||''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
              <div style={{ position: 'absolute', top: 4, right: 4, background: '#6C63FF', color: 'white', fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4 }}>
                {item.media_type === 'video' ? '🎬' : '🖼️'}
              </div>
            </div>
            {item.title && <p style={{ color: '#e2e8f0', fontSize: '0.8rem', marginBottom: 6, fontWeight: 500 }}>{item.title}</p>}
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={{ ...S.btn(item.is_active ? '#374151' : '#10b981'), fontSize: '0.75rem', padding: '0.3rem 0.6rem' }} onClick={() => toggleActive(item)}>
                {item.is_active ? 'إخفاء' : 'إظهار'}
              </button>
              <button style={{ ...S.del, fontSize: '0.75rem' }} onClick={() => del(item.id)}>حذف</button>
            </div>
          </div>
        ))}
        {gallery.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
            لا توجد صور أو فيديوهات بعد. أضف أول عنصر للمعرض.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sponsors ──────────────────────────────────────────────────────────────────
function SponsorsTab({ eventId, token, save, saving, showToast }: any) {
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const blank = { name: '', logo_url: '', website: '', tier: 'silver', sort_order: 0 };
  const [form, setForm] = useState<any>(blank);

  const load = () => {
    if (token) {
      clearApiCacheFor(`/api/events/${eventId}/sponsors`);
      fetchSponsors(eventId).then((r: any) => setSponsors(r.data || [])).catch(() => {});
    }
  };
  useEffect(() => { load(); }, [token]);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const saveItem = () => save(async () => {
    if (editing) await updateSponsor(eventId, editing.id, form, token);
    else         await createSponsor(eventId, form, token);
    clearApiCacheFor(`/api/events/${eventId}/sponsors`);
    setEditing(null); setAdding(false); setForm(blank); load();
  });

  const del = async (id: number) => {
    if (!confirm('حذف الراعي؟')) return;
    try { await deleteSponsor(eventId, id, token); clearApiCacheFor(`/api/events/${eventId}/sponsors`); showToast('✅ تم الحذف'); load(); }
    catch (e: any) { showToast('❌ ' + e.message); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white' }}>الرعاة ({sponsors.length})</h1>
        {!adding && <button style={S.btn()} onClick={() => { setAdding(true); setEditing(null); setForm(blank); }}>+ إضافة راعي</button>}
      </div>
      {adding && (
        <div style={{ ...S.card, marginBottom: 16 }}>
          <h3 style={{ color: 'white', marginBottom: 12 }}>{editing ? 'تعديل راعي' : 'إضافة راعي'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="الاسم"><input value={form.name} onChange={e => set('name', e.target.value)} style={S.inp} /></Field>
            <Field label="مستوى الرعاية">
              <select value={form.tier} onChange={e => set('tier', e.target.value)} style={S.inp}>
                {SPONSOR_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <div>
              <Field label="رابط الشعار"><input value={form.logo_url||''} onChange={e => set('logo_url', e.target.value)} style={S.inp} /></Field>
              <ImageUploadField onUploaded={(value) => set('logo_url', value)} maxSizeMB={3} token={token} />
            </div>
            <Field label="الموقع الإلكتروني"><input value={form.website||''} onChange={e => set('website', e.target.value)} style={S.inp} /></Field>
            <Field label="الترتيب"><input type="number" value={form.sort_order||0} onChange={e => set('sort_order', +e.target.value)} style={S.inp} /></Field>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <SaveBtn loading={saving} onClick={saveItem} />
            <button style={S.del} onClick={() => { setAdding(false); setEditing(null); setForm(blank); }}>إلغاء</button>
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
        {sponsors.map(sp => (
          <div key={sp.id} style={S.card}>
            {sp.logo_url && <img src={sp.logo_url} alt={sp.name} style={{ height: 44, objectFit: 'contain', marginBottom: 8 }} />}
            <div style={{ color: 'white', fontWeight: 700 }}>{sp.name}</div>
            <div style={{ color: '#f59e0b', fontSize: '0.75rem', marginBottom: 4 }}>{sp.tier}</div>
            {sp.website && <a href={sp.website} target="_blank" style={{ color: '#6C63FF', fontSize: '0.72rem' }}>{sp.website}</a>}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button style={S.btn('#1a2744')} onClick={() => { setEditing(sp); setAdding(true); setForm({ ...sp }); }}>تعديل</button>
              <button style={S.del} onClick={() => del(sp.id)}>حذف</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── FAQs ──────────────────────────────────────────────────────────────────────
function FaqsTab({ eventId, token, save, saving, showToast }: any) {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ question_ar: '', answer_ar: '', sort_order: 0 });

  const load = () => {
    if (token) {
      clearApiCacheFor(`/api/events/${eventId}/faqs`);
      fetchFaqs(eventId).then((r: any) => setFaqs(r.data || [])).catch(() => {});
    }
  };
  useEffect(() => { load(); }, [token]);

  const saveItem = () => save(async () => {
    await createFaq(eventId, form, token);
    clearApiCacheFor(`/api/events/${eventId}/faqs`);
    setAdding(false); setForm({ question_ar: '', answer_ar: '', sort_order: 0 }); load();
  });

  const del = async (id: number) => {
    if (!confirm('حذف السؤال؟')) return;
    try { await deleteFaq(eventId, id, token); clearApiCacheFor(`/api/events/${eventId}/faqs`); showToast('✅ تم الحذف'); load(); }
    catch (e: any) { showToast('❌ ' + e.message); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white' }}>الأسئلة الشائعة ({faqs.length})</h1>
        {!adding && <button style={S.btn()} onClick={() => setAdding(true)}>+ إضافة سؤال</button>}
      </div>
      {adding && (
        <div style={{ ...S.card, marginBottom: 16 }}>
          <h3 style={{ color: 'white', marginBottom: 12 }}>إضافة سؤال</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Field label="السؤال"><input value={form.question_ar} onChange={e => setForm(f => ({ ...f, question_ar: e.target.value }))} style={S.inp} /></Field>
            <Field label="الجواب"><textarea value={form.answer_ar} onChange={e => setForm(f => ({ ...f, answer_ar: e.target.value }))} rows={3} style={{ ...S.inp, resize: 'vertical' }} /></Field>
            <Field label="الترتيب"><input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: +e.target.value }))} style={{ ...S.inp, width: 100 }} /></Field>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <SaveBtn loading={saving} onClick={saveItem} />
            <button style={S.del} onClick={() => setAdding(false)}>إلغاء</button>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {faqs.map((faq: any, i: number) => (
          <div key={faq.id} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'white', fontWeight: 600, marginBottom: 4 }}>{i + 1}. {faq.question_ar}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.6 }}>{faq.answer_ar}</div>
            </div>
            <button style={S.del} onClick={() => del(faq.id)}>حذف</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Form Config ───────────────────────────────────────────────────────────────
const ALL_REG_TYPES = ['startup','general','investor','speaker','sponsor','media'];
const TYPE_LABEL_DEFAULTS: Record<string,string> = {
  startup:'🚀 شركة ناشئة', general:'👤 حضور عام', investor:'💼 مستثمر',
  speaker:'🎙️ متحدث', sponsor:'🏅 راعي', media:'📹 إعلام',
};
const DEFAULT_CFG: FormConfig = {
  enabled_types: ['startup','general'],
  form_title: 'سجّل في القمة', form_subtitle: 'كن جزءاً من أكبر تجمع لريادة الأعمال',
  show_phone: true, require_phone: false, show_city: true, require_city: false,
  show_motivation: false, motivation_label: 'لماذا تريد الحضور؟',
  terms_text: 'أوافق على الشروط والأحكام وسياسة الخصوصية',
  cities: ['دمشق','حلب','حمص','اللاذقية','طرطوس','حماة','دير الزور','الرقة','القامشلي','إدلب','درعا','خارج سوريا'],
  sectors: ['تكنولوجيا المعلومات','التجارة الإلكترونية','التعليم','الصحة','التمويل والدفع','الزراعة','الطاقة','التصنيع','الخدمات اللوجستية','أخرى'],
  stages: ['فكرة','نموذج أولي MVP','مرحلة مبكرة','نمو','توسع'],
  type_labels: { ...TYPE_LABEL_DEFAULTS },
  extra_fields: [
    { key: 'work_field', label: 'مجال العمل أو الاهتمام', type: 'text' as const, placeholder: 'مثل: تقنية، تعليم، طب...', required: false, for_types: ['general','investor','speaker','media'] },
    { key: 'participation_reason', label: 'لماذا تريد المشاركة في القمة؟', type: 'textarea' as const, placeholder: 'شاركنا بدوافعك...', required: false, for_types: ['general','investor'] },
  ],
};

function FormConfigTab({ eventId, eventSlug, token, save, saving }: any) {
  const [cfg, setCfg] = useState<FormConfig>({ ...DEFAULT_CFG });
  const [loaded, setLoaded] = useState(false);
  const [newCity, setNewCity] = useState('');
  const [newSector, setNewSector] = useState('');
  const [newStage, setNewStage] = useState('');
  const [newFieldOptions, setNewFieldOptions] = useState<Record<number,string>>({});

  useEffect(() => {
    if (!token || !eventSlug) return;
    fetchEvent(eventSlug).then((r: any) => {
      if (r.data?.form_config) {
        try { setCfg({ ...DEFAULT_CFG, ...JSON.parse(r.data.form_config) }); } catch {}
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [token, eventSlug]);

  const set = (k: keyof FormConfig, v: any) => setCfg(f => ({ ...f, [k]: v }));
  const setLabel = (type: string, v: string) => setCfg(f => ({ ...f, type_labels: { ...f.type_labels, [type]: v } }));
  const toggleType = (t: string) => {
    const cur = cfg.enabled_types || [];
    set('enabled_types', cur.includes(t) ? cur.filter((x: string) => x !== t) : [...cur, t]);
  };
  const removeItem = (key: 'cities'|'sectors'|'stages', val: string) =>
    set(key, (cfg[key] as string[]).filter(x => x !== val));
  const addItem = (key: 'cities'|'sectors'|'stages', val: string, clearFn: () => void) => {
    if (!val.trim()) return;
    set(key, [...(cfg[key] as string[]), val.trim()]);
    clearFn();
  };

  // Extra fields helpers
  const setField = (i: number, k: string, v: any) =>
    setCfg(f => ({ ...f, extra_fields: (f.extra_fields||[]).map((ef, idx) => idx === i ? { ...ef, [k]: v } : ef) }));
  const toggleFieldType = (i: number, t: string) =>
    setCfg(f => ({ ...f, extra_fields: (f.extra_fields||[]).map((ef, idx) => idx === i ? { ...ef, for_types: ef.for_types.includes(t) ? ef.for_types.filter(x => x !== t) : [...ef.for_types, t] } : ef) }));
  const addFieldOption = (i: number) => {
    const val = (newFieldOptions[i] || '').trim();
    if (!val) return;
    setField(i, 'options', [...((cfg.extra_fields||[])[i]?.options||[]), val]);
    setNewFieldOptions(p => ({ ...p, [i]: '' }));
  };
  const removeFieldOption = (i: number, opt: string) =>
    setField(i, 'options', ((cfg.extra_fields||[])[i]?.options||[]).filter(o => o !== opt));
  const addExtraField = () => setCfg(f => ({ ...f, extra_fields: [...(f.extra_fields||[]), { key: `field_${Date.now()}`, label: 'حقل جديد', type: 'text' as const, placeholder: '', required: false, for_types: ['general'] }] }));
  const removeExtraField = (i: number) => setCfg(f => ({ ...f, extra_fields: (f.extra_fields||[]).filter((_, idx) => idx !== i) }));

  const saveAll = () => save(async () => {
    await updateEvent(eventId, { form_config: cfg }, token);
    clearApiCacheFor(`/api/events/${eventSlug}`);
    clearApiCacheFor('/api/events');
  });

  if (!loaded) return <p style={{ color: '#94a3b8' }}>جار التحميل...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white' }}>📝 إعدادات فورم التسجيل</h1>
        <SaveBtn loading={saving} onClick={saveAll} />
      </div>

      {/* نصوص عامة */}
      <div style={{ ...S.card, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <h3 style={{ color: 'white', fontWeight: 700, gridColumn: '1/-1', marginBottom: 4 }}>النصوص العامة</h3>
        <Field label="عنوان قسم التسجيل"><input value={cfg.form_title} onChange={e => set('form_title', e.target.value)} style={S.inp} /></Field>
        <Field label="الوصف تحت العنوان"><input value={cfg.form_subtitle} onChange={e => set('form_subtitle', e.target.value)} style={S.inp} /></Field>
        <div style={{ gridColumn: '1/-1' }}>
          <Field label="نص الشروط والأحكام"><input value={cfg.terms_text} onChange={e => set('terms_text', e.target.value)} style={S.inp} /></Field>
        </div>
      </div>

      {/* أنواع التسجيل */}
      <div style={S.card}>
        <h3 style={{ color: 'white', fontWeight: 700, marginBottom: 12 }}>أنواع التسجيل المتاحة</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          {ALL_REG_TYPES.map(t => {
            const enabled = (cfg.enabled_types || []).includes(t);
            return (
              <button key={t} onClick={() => toggleType(t)}
                style={{ padding: '0.4rem 1rem', borderRadius: 6, border: `1px solid ${enabled ? '#6C63FF' : 'rgba(255,255,255,0.15)'}`, background: enabled ? 'rgba(108,99,255,0.25)' : 'transparent', color: enabled ? 'white' : '#94a3b8', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                {TYPE_LABEL_DEFAULTS[t]}
              </button>
            );
          })}
        </div>
        <h4 style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 8 }}>تخصيص تسميات الأنواع</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {ALL_REG_TYPES.map(t => (
            <Field key={t} label={TYPE_LABEL_DEFAULTS[t]}>
              <input value={cfg.type_labels?.[t] || ''} onChange={e => setLabel(t, e.target.value)} style={S.inp} />
            </Field>
          ))}
        </div>
      </div>

      {/* الحقول */}
      <div style={{ ...S.card, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <h3 style={{ color: 'white', fontWeight: 700, gridColumn: '1/-1', marginBottom: 4 }}>الحقول وإعداداتها</h3>
        {[
          { key: 'show_phone' as const, reqKey: 'require_phone' as const, label: 'رقم الهاتف' },
          { key: 'show_city' as const, reqKey: 'require_city' as const, label: 'المدينة' },
        ].map(({ key, reqKey, label }) => (
          <div key={key} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'white', fontSize: '0.9rem' }}>{label}</span>
            <div style={{ display: 'flex', gap: 14 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={!!cfg[key]} onChange={e => set(key, e.target.checked)} /> إظهار
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={!!cfg[reqKey]} onChange={e => set(reqKey, e.target.checked)} /> إلزامي
              </label>
            </div>
          </div>
        ))}
        <div style={{ gridColumn: '1/-1', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: cfg.show_motivation ? 10 : 0 }}>
            <span style={{ color: 'white', fontSize: '0.9rem' }}>سؤال إضافي (الدوافع)</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={!!cfg.show_motivation} onChange={e => set('show_motivation', e.target.checked)} /> إظهار
            </label>
          </div>
          {cfg.show_motivation && <Field label="نص السؤال"><input value={cfg.motivation_label} onChange={e => set('motivation_label', e.target.value)} style={S.inp} /></Field>}
        </div>
      </div>

      {/* القوائم */}
      {([
        { key: 'cities' as const, label: 'قائمة المدن', newVal: newCity, setNew: setNewCity },
        { key: 'sectors' as const, label: 'قطاعات العمل (للشركات الناشئة)', newVal: newSector, setNew: setNewSector },
        { key: 'stages' as const, label: 'مراحل الشركة', newVal: newStage, setNew: setNewStage },
      ]).map(({ key, label, newVal, setNew }) => (
        <div key={key} style={S.card}>
          <h3 style={{ color: 'white', fontWeight: 700, marginBottom: 10 }}>{label}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {(cfg[key] as string[]).map(item => (
              <span key={item} style={{ background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.25)', borderRadius: 6, padding: '0.25rem 0.6rem', fontSize: '0.82rem', color: 'white', display: 'flex', alignItems: 'center', gap: 5 }}>
                {item}
                <button onClick={() => removeItem(key, item)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: 0 }}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={newVal} onChange={e => setNew(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(key, newVal, () => setNew('')); } }}
              placeholder="أضف عنصراً جديداً..." style={{ ...S.inp, flex: 1 }} />
            <button style={S.btn()} onClick={() => addItem(key, newVal, () => setNew(''))}>إضافة</button>
          </div>
        </div>
      ))}

      {/* حقول مخصصة */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ color: 'white', fontWeight: 700 }}>حقول مخصصة إضافية</h3>
          <button style={S.btn()} onClick={addExtraField}>+ حقل جديد</button>
        </div>
        {(cfg.extra_fields||[]).length === 0 && <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>لا توجد حقول مضافة بعد.</p>}
        {(cfg.extra_fields||[]).map((ef, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '0.9rem', marginBottom: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <Field label="مفتاح الحقل (key - بالإنجليزية)">
                <input value={ef.key} onChange={e => setField(i, 'key', e.target.value.replace(/\s/g,'_').toLowerCase())} style={S.inp} placeholder="work_field" />
              </Field>
              <Field label="التسمية العربية">
                <input value={ef.label} onChange={e => setField(i, 'label', e.target.value)} style={S.inp} />
              </Field>
              <Field label="نوع الحقل">
                <select value={ef.type} onChange={e => setField(i, 'type', e.target.value)} style={S.inp}>
                  <option value="text">نص قصير</option>
                  <option value="textarea">نص طويل</option>
                  <option value="select">قائمة اختيار</option>
                </select>
              </Field>
              <Field label="نص التوضيح (placeholder)">
                <input value={ef.placeholder||''} onChange={e => setField(i, 'placeholder', e.target.value)} style={S.inp} />
              </Field>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#e2e8f0', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={ef.required} onChange={e => setField(i, 'required', e.target.checked)} /> إلزامي
              </label>
              <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>يظهر في:</span>
              {ALL_REG_TYPES.map(t => (
                <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 4, color: ef.for_types.includes(t) ? 'white' : '#94a3b8', fontSize: '0.78rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={ef.for_types.includes(t)} onChange={() => toggleFieldType(i, t)} /> {TYPE_LABEL_DEFAULTS[t]}
                </label>
              ))}
            </div>
            {ef.type === 'select' && (
              <div style={{ marginBottom: 8 }}>
                <label style={S.label}>خيارات القائمة</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                  {(ef.options||[]).map(opt => (
                    <span key={opt} style={{ background: 'rgba(108,99,255,0.2)', borderRadius: 5, padding: '0.2rem 0.5rem', fontSize: '0.8rem', color: 'white', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {opt}
                      <button onClick={() => removeFieldOption(i, opt)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>×</button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={newFieldOptions[i]||''} onChange={e => setNewFieldOptions(p => ({ ...p, [i]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFieldOption(i); } }}
                    placeholder="أضف خياراً..." style={{ ...S.inp, flex: 1 }} />
                  <button style={S.btn()} onClick={() => addFieldOption(i)}>إضافة</button>
                </div>
              </div>
            )}
            <button style={S.del} onClick={() => removeExtraField(i)}>حذف الحقل</button>
          </div>
        ))}
      </div>

      <div style={{ paddingBottom: 8 }}>
        <SaveBtn loading={saving} onClick={saveAll} />
      </div>
    </div>
  );
}

// ── Site Config ───────────────────────────────────────────────────────────────
const DEFAULT_SITE_CFG: SiteConfig = {
  hero_abbr: 'S3',
  hero_btn_primary: '🚀 سجّل شركتك الناشئة',
  hero_btn_secondary: 'حضور عام',
  stats: [
    { label: 'أيام من الإلهام', field: 'days_count', fallback: 3 },
    { label: 'شركة ناشئة',      field: 'startup_count', fallback: 50 },
    { label: 'متحدث متميز',     field: 'speaker_count', fallback: 20 },
    { label: 'مشارك',           field: 'total_registrations', fallback: 500 },
  ],
  about_badge: 'عن الفعالية',
  about_title: 'لماذا S³ Summit؟',
  about_cards: [
    { emoji: '🚀', title: 'إطلاق الأفكار',    desc: 'منصة لعرض شركاتك الناشئة أمام مستثمرين وشركاء من سوريا والمنطقة العربية' },
    { emoji: '🤝', title: 'التواصل والشبكات', desc: 'فرصة ذهبية للتواصل مع رواد أعمال، مستثمرين، وخبراء في الاقتصاد الرقمي' },
    { emoji: '💡', title: 'ورش عمل مكثفة',   desc: 'جلسات تدريبية متخصصة في بناء المنتج، التسويق الرقمي، وجذب التمويل' },
    { emoji: '🏆', title: 'مسابقة الشركات',  desc: 'تنافس أفضل الشركات الناشئة السورية للفوز بجوائز وفرص تمويل حقيقية' },
  ],
  logo_url: '',
  logo_position: 'navbar',
  archive_link_enabled: true,
  archive_link_label: '🗂 النسخ السابقة',
  archive_link_position: 'both',
};
const STAT_FIELDS = ['days_count','startup_count','speaker_count','total_registrations','approved_count','investor_count'];

function cloneDefaultSiteConfig(): SiteConfig {
  return {
    ...DEFAULT_SITE_CFG,
    stats: DEFAULT_SITE_CFG.stats.map(s => ({ ...s })),
    about_cards: DEFAULT_SITE_CFG.about_cards.map(c => ({ ...c })),
  };
}

function normalizeSiteConfig(raw: any): SiteConfig {
  const base = cloneDefaultSiteConfig();
  if (!raw || typeof raw !== 'object') return base;
  return {
    ...base,
    ...raw,
    stats: Array.isArray(raw.stats)
      ? raw.stats.filter((s: any) => s && typeof s.label === 'string' && typeof s.field === 'string').map((s: any) => ({
          label: s.label,
          field: s.field,
          fallback: Number.isFinite(Number(s.fallback)) ? Number(s.fallback) : 0,
        }))
      : base.stats,
    about_cards: Array.isArray(raw.about_cards)
      ? raw.about_cards.filter((c: any) => c && typeof c.title === 'string').map((c: any) => ({
          emoji: c.emoji || '✨',
          title: c.title,
          desc: c.desc || '',
        }))
      : base.about_cards,
    logo_url: typeof raw.logo_url === 'string' ? raw.logo_url : base.logo_url,
    logo_position: ['navbar', 'footer', 'both'].includes(raw.logo_position) ? raw.logo_position : base.logo_position,
    archive_link_enabled:  raw.archive_link_enabled  !== undefined ? !!raw.archive_link_enabled  : true,
    archive_link_label:    typeof raw.archive_link_label === 'string' ? raw.archive_link_label : '🗂 النسخ السابقة',
    archive_link_position: ['navbar','footer','both','none'].includes(raw.archive_link_position) ? raw.archive_link_position : 'both',
  };
}

function SiteConfigTab({ eventId, eventSlug, token, save, saving }: any) {
  const [sc, setSc] = useState<SiteConfig>(cloneDefaultSiteConfig());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!token || !eventSlug) return;
    fetchEvent(eventSlug).then((r: any) => {
      if (r.data?.site_config) {
        try { setSc(normalizeSiteConfig(JSON.parse(r.data.site_config))); }
        catch {}
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [token, eventSlug]);

  const set = (k: keyof SiteConfig, v: any) => setSc(f => ({ ...f, [k]: v }));
  const setStat = (i: number, k: string, v: any) => setSc(f => ({ ...f, stats: f.stats.map((s, idx) => idx === i ? { ...s, [k]: v } : s) }));
  const setCard = (i: number, k: string, v: string) => setSc(f => ({ ...f, about_cards: f.about_cards.map((c, idx) => idx === i ? { ...c, [k]: v } : c) }));
  const addCard = () => setSc(f => ({ ...f, about_cards: [...f.about_cards, { emoji: '✨', title: 'عنوان جديد', desc: 'وصف البطاقة' }] }));
  const removeCard = (i: number) => setSc(f => ({ ...f, about_cards: f.about_cards.filter((_, idx) => idx !== i) }));
  const addStat = () => setSc(f => ({ ...f, stats: [...f.stats, { label: 'إحصاء جديد', field: 'total_registrations', fallback: 0 }] }));
  const removeStat = (i: number) => setSc(f => ({ ...f, stats: f.stats.filter((_, idx) => idx !== i) }));
  const saveAll = () => save(async () => {
    await updateEvent(eventId, { site_config: sc }, token);
    clearApiCacheFor(`/api/events/${eventSlug}`);
    clearApiCacheFor('/api/events');
  });

  if (!loaded) return <p style={{ color: '#94a3b8' }}>جار التحميل...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white' }}>🎨 محتوى الصفحة الرئيسية</h1>
        <SaveBtn loading={saving} onClick={saveAll} />
      </div>

      <HelpBox title="شرح محتوى الصفحة الرئيسية" icon="📖">
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <strong style={{ color: '#fff' }}>📌 هذا القسم يتحكم بما يراه الزوار على الصفحة الرئيسية للحدث</strong>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '4px' }}>
            <strong style={{ color: '#60a5fa' }}>الشعارات الثلاثة:</strong>
            <ul style={{ margin: '6px 0 0 20px', color: '#e0e7ff' }}>
              <li><strong>شعار الحدث:</strong> في "معلومات الحدث" - يظهر في النماذس والبريد</li>
              <li><strong>شعار الصفحة:</strong> هنا - يظهر في الـ Navbar/Footer للزوار فقط</li>
              <li><strong>صورة الغلاف:</strong> في "معلومات الحدث" - خلفية الحدث الرئيسية</li>
            </ul>
          </div>
          <div>
            <strong style={{ color: '#fff' }}>🎯 أقسام الصفحة الرئيسية:</strong>
            <ul style={{ margin: '6px 0 0 20px', color: '#e0e7ff' }}>
              <li><strong>Hero:</strong> القسم الأول مع اسم الحدث والأزرار</li>
              <li><strong>الإحصائيات:</strong> أرقام (عدد الحضور، الشركات، إلخ)</li>
              <li><strong>عن الحدث:</strong> بطاقات توضح فوائد الحدث</li>
              <li><strong>الشعار:</strong> شعار الحدث (الـ Logo) في الـ navbar و/أو footer</li>
            </ul>
          </div>
        </div>
      </HelpBox>

      {/* Hero */}
      <div style={{ ...S.card, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <h3 style={{ color: 'white', fontWeight: 700, gridColumn: '1/-1', marginBottom: 4 }}>قسم الـ Hero (أعلى الصفحة)</h3>
        <Field label="الاختصار الكبير (مثل S3)">
          <input value={sc.hero_abbr} onChange={e => set('hero_abbr', e.target.value)} style={S.inp} />
        </Field>
        <div />
        <Field label="نص الزر الرئيسي">
          <input value={sc.hero_btn_primary} onChange={e => set('hero_btn_primary', e.target.value)} style={S.inp} />
        </Field>
        <Field label="نص الزر الثانوي (فارغ = مخفي)">
          <input value={sc.hero_btn_secondary} onChange={e => set('hero_btn_secondary', e.target.value)} style={S.inp} placeholder="اتركه فارغاً للإخفاء" />
        </Field>
      </div>

      {/* Stats */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ color: 'white', fontWeight: 700 }}>الإحصائيات</h3>
          <button style={S.btn()} onClick={addStat}>+ إضافة</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sc.stats.map((s, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px auto', gap: 8, alignItems: 'end' }}>
              <Field label="التسمية"><input value={s.label} onChange={e => setStat(i, 'label', e.target.value)} style={S.inp} /></Field>
              <Field label="مصدر البيانات">
                <select value={s.field} onChange={e => setStat(i, 'field', e.target.value)} style={S.inp}>
                  {STAT_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </Field>
              <Field label="القيمة الافتراضية"><input type="number" value={s.fallback} onChange={e => setStat(i, 'fallback', +e.target.value)} style={S.inp} /></Field>
              <button style={{ ...S.del, alignSelf: 'flex-end' }} onClick={() => removeStat(i)}>حذف</button>
            </div>
          ))}
        </div>
      </div>

      {/* About */}
      <div style={S.card}>
        <h3 style={{ color: 'white', fontWeight: 700, marginBottom: 12 }}>قسم "عن الفعالية"</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <Field label="الشارة (النص الصغير فوق العنوان)">
            <input value={sc.about_badge} onChange={e => set('about_badge', e.target.value)} style={S.inp} />
          </Field>
          <Field label="العنوان الكبير">
            <input value={sc.about_title} onChange={e => set('about_title', e.target.value)} style={S.inp} />
          </Field>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h4 style={{ color: '#94a3b8', fontSize: '0.82rem' }}>البطاقات الأربع ({sc.about_cards.length})</h4>
          <button style={S.btn()} onClick={addCard}>+ بطاقة جديدة</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
          {sc.about_cards.map((card, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ width: 58, flexShrink: 0 }}>
                  <label style={S.label}>إيموجي</label>
                  <input value={card.emoji} onChange={e => setCard(i, 'emoji', e.target.value)} style={{ ...S.inp, fontSize: '1.3rem', textAlign: 'center', padding: '0.3rem' }} maxLength={4} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={S.label}>العنوان</label>
                  <input value={card.title} onChange={e => setCard(i, 'title', e.target.value)} style={S.inp} />
                </div>
              </div>
              <Field label="الوصف">
                <textarea value={card.desc} onChange={e => setCard(i, 'desc', e.target.value)} rows={2} style={{ ...S.inp, resize: 'vertical' }} />
              </Field>
              <button style={S.del} onClick={() => removeCard(i)}>حذف البطاقة</button>
            </div>
          ))}
        </div>
      </div>

      {/* Logo */}
      <div style={S.card}>
        <h3 style={{ color: 'white', fontWeight: 700, marginBottom: 12 }}>الشعار (للصفحة الرئيسية)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <Field label="رابط الشعار">
              {sc.logo_url && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <img src={sc.logo_url} alt="logo" style={{ height: 60, borderRadius: 4, objectFit: 'contain', background: 'rgba(255,255,255,0.05)', padding: 4 }} />
                  <button style={{ ...S.del, whiteSpace: 'nowrap' }} onClick={() => set('logo_url', '')}>✕ حذف</button>
                </div>
              )}
              <input value={sc.logo_url || ''} onChange={e => set('logo_url', e.target.value)} style={S.inp} />
            </Field>
            <ImageUploadField onUploaded={(value) => set('logo_url', value)} maxSizeMB={3} token={token} />
          </div>
          <Field label="مكان الشعار">
            <select value={sc.logo_position || 'navbar'} onChange={e => set('logo_position', e.target.value as any)} style={S.inp}>
              <option value="navbar">🔝 في الـ Navbar فقط</option>
              <option value="footer">🔙 في الـ Footer فقط</option>
              <option value="both">↕️ في الاثنين</option>
            </select>
          </Field>
        </div>
      </div>

      {/* Archive Link Settings */}
      <div style={S.card}>
        <h3 style={{ color: 'white', fontWeight: 700, marginBottom: 6 }}>🗂 رابط أرشيف الأحداث</h3>
        <p style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: 14, lineHeight: 1.6 }}>
          رابط يوجّه الزوار إلى صفحة <strong style={{ color: '#a5b4fc' }}>/archive</strong> التي تعرض جميع نسخ الحدث السابقة والقادمة.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '0.75rem', border: `1px solid ${sc.archive_link_enabled ? 'rgba(108,99,255,0.35)' : 'rgba(255,255,255,0.06)'}` }}>
              <div onClick={() => set('archive_link_enabled', !sc.archive_link_enabled)}
                style={{ width: 38, height: 22, borderRadius: 11, background: sc.archive_link_enabled ? '#6C63FF' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'background 0.2s', flexShrink: 0, border: `1px solid ${sc.archive_link_enabled ? '#6C63FF' : 'rgba(255,255,255,0.2)'}` }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: sc.archive_link_enabled ? 19 : 2, transition: 'left 0.2s' }} />
              </div>
              <div>
                <div style={{ color: sc.archive_link_enabled ? 'white' : '#64748b', fontSize: '0.88rem', fontWeight: 600 }}>
                  {sc.archive_link_enabled ? '✅ الرابط مفعّل' : '❌ الرابط مخفي'}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: 2 }}>
                  {sc.archive_link_enabled ? 'يظهر للزوار في الموقع' : 'لن يرى الزوار أي رابط للأرشيف'}
                </div>
              </div>
            </label>
          </div>
          <Field label="نص الرابط الذي يراه الزوار">
            <input value={sc.archive_link_label ?? '🗂 النسخ السابقة'} onChange={e => set('archive_link_label', e.target.value)} style={S.inp} placeholder="🗂 النسخ السابقة" />
            <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: '0.25rem' }}>يمكن تضمين إيموجي في النص</div>
          </Field>
          <Field label="مكان ظهور الرابط">
            <select value={sc.archive_link_position || 'both'} onChange={e => set('archive_link_position', e.target.value as any)} style={S.inp}>
              <option value="none">🚫 مخفي (لا يظهر)</option>
              <option value="navbar">🔝 في الـ Navbar فقط</option>
              <option value="footer">🔙 في الـ Footer فقط</option>
              <option value="both">↕️ في الاثنين (Navbar + Footer)</option>
            </select>
          </Field>
        </div>
        {/* Preview */}
        {sc.archive_link_enabled && sc.archive_link_position !== 'none' && (
          <div style={{ marginTop: 12, background: 'rgba(108,99,255,0.06)', borderRadius: 8, padding: '0.7rem 1rem', border: '1px solid rgba(108,99,255,0.15)', fontSize: '0.78rem' }}>
            <span style={{ color: '#a5b4fc', fontWeight: 700 }}>معاينة: </span>
            <span style={{ color: '#94a3b8' }}>سيظهر الرابط </span>
            <strong style={{ color: '#a5b4fc' }}>"{sc.archive_link_label || '🗂 النسخ السابقة'}"</strong>
            <span style={{ color: '#94a3b8' }}>
              {sc.archive_link_position === 'navbar' ? ' في الـ Navbar فقط' : sc.archive_link_position === 'footer' ? ' في الـ Footer فقط' : ' في الـ Navbar والـ Footer'}
            </span>
            <span style={{ color: '#64748b' }}> ← يوجّه إلى /archive</span>
          </div>
        )}
      </div>

      <div style={{ paddingBottom: 8 }}><SaveBtn loading={saving} onClick={saveAll} /></div>
    </div>
  );
}

// ── Articles ──────────────────────────────────────────────────────────────────
function ProfileTab({ token, showToast }: { token: string; showToast: (m: string) => void }) {
  const [form, setForm] = useState({ current_password: '', new_email: '', new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (form.new_password && form.new_password !== form.confirm_password) {
      showToast('❌ كلمة المرور الجديدة غير متطابقة');
      return;
    }
    if (!form.new_email && !form.new_password) {
      showToast('❌ أدخل بريداً جديداً أو كلمة سر جديدة');
      return;
    }
    setLoading(true);
    try {
      await updateAdminProfile({
        current_password: form.current_password,
        new_email: form.new_email || undefined,
        new_password: form.new_password || undefined,
      }, token);
      showToast('✅ تم التحديث بنجاح');
      setForm({ current_password: '', new_email: '', new_password: '', confirm_password: '' });
    } catch (e: any) { showToast('❌ ' + e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 520 }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', marginBottom: '1.5rem' }}>👤 إعدادات الأدمن</h1>
      <div style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Field label="كلمة المرور الحالية *">
          <input type="password" style={S.inp} value={form.current_password} onChange={e => setForm(f => ({ ...f, current_password: e.target.value }))} placeholder="أدخل كلمة المرور الحالية للتحقق" />
        </Field>
        <div style={{ borderTop: '1px solid rgba(108,99,255,0.15)', paddingTop: '0.75rem' }}>
          <p style={{ fontSize: '0.8rem', color: '#6C63FF', fontWeight: 600, marginBottom: '0.75rem' }}>✉️ تغيير البريد الإلكتروني</p>
          <Field label="البريد الجديد (اتركه فارغاً إذا لم تريد تغييره)">
            <input type="email" style={S.inp} value={form.new_email} onChange={e => setForm(f => ({ ...f, new_email: e.target.value }))} placeholder="admin@example.com" dir="ltr" />
          </Field>
        </div>
        <div style={{ borderTop: '1px solid rgba(108,99,255,0.15)', paddingTop: '0.75rem' }}>
          <p style={{ fontSize: '0.8rem', color: '#6C63FF', fontWeight: 600, marginBottom: '0.75rem' }}>🔑 تغيير كلمة المرور</p>
          <Field label="كلمة المرور الجديدة (اتركها فارغة إذا لم تريد تغييرها)">
            <input type="password" style={S.inp} value={form.new_password} onChange={e => setForm(f => ({ ...f, new_password: e.target.value }))} placeholder="6 أحرف على الأقل" />
          </Field>
          <div style={{ marginTop: '0.75rem' }}>
            <Field label="تأكيد كلمة المرور الجديدة">
              <input type="password" style={S.inp} value={form.confirm_password} onChange={e => setForm(f => ({ ...f, confirm_password: e.target.value }))} placeholder="أعد كتابة كلمة المرور الجديدة" />
            </Field>
          </div>
        </div>
        <button style={S.btn()} onClick={handleSave} disabled={loading || !form.current_password}>
          {loading ? 'جار الحفظ...' : '💾 حفظ التغييرات'}
        </button>
      </div>
    </div>
  );
}

function ArticlesTab({ eventId, token, showToast }: any) {
  const [articles, setArticles] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [contentMode, setContentMode] = useState<'code' | 'preview'>('code');
  const blank = {
    title: '', title_ar: '', slug: '',
    excerpt: '', excerpt_ar: '',
    content: '', content_ar: '',
    cover_image: '', author_name: 'S3 Summit Team',
    category: 'general', tags: '', status: 'draft',
    meta_title: '', meta_description: '',
    file_attachment: '', file_attachment_name: '',
  };
  const [form, setForm] = useState<any>(blank);

  const ARTICLES_PATH = `/api/events/${eventId}/articles/admin/all`;

  const load = () => {
    if (token) {
      clearApiCacheFor(ARTICLES_PATH);
      fetchArticlesAdmin(eventId, token).then((r: any) => setArticles(r.data || [])).catch(() => {});
    }
  };
  useEffect(() => { load(); }, [token]);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const generateSlug = (title: string) =>
    title.toLowerCase().trim()
      .replace(/[\u0600-\u06FF]/g, (c) => c) // keep arabic
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\u0600-\u06FF-]/g, '')
      .slice(0, 80);

  const saveItem = async () => {
    const titleVal = form.title_ar || form.title;
    const contentVal = form.content_ar || form.content;
    if (!titleVal || !contentVal || !form.slug) {
      showToast('❌ العنوان (عربي) والمحتوى والرابط مطلوبة');
      return;
    }
    // Ensure title/content are always filled (use Arabic if English missing)
    const payload = {
      ...form,
      title: form.title || form.title_ar,
      content: form.content || form.content_ar,
      file_attachment: form.file_attachment || null,
      file_attachment_name: form.file_attachment_name || null,
    };
    setSaving(true);
    try {
      if (editing) {
        await updateArticle(eventId, editing.id, payload, token);
        showToast('✅ تم تحديث المقال');
      } else {
        await createArticle(eventId, payload, token);
        showToast('✅ تم إنشاء المقال');
      }
      clearApiCacheFor(ARTICLES_PATH);
      setAdding(false); setEditing(null); setForm(blank); load();
    } catch (e: any) {
      showToast('❌ ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: number) => {
    if (!confirm('حذف المقال نهائياً؟')) return;
    setArticles(prev => prev.filter(a => a.id !== id));
    try {
      await deleteArticle(eventId, id, token);
      clearApiCacheFor(ARTICLES_PATH);
      showToast('✅ تم الحذف');
    }
    catch (e: any) { showToast('❌ ' + e.message); load(); }
  };

  const toggleStatus = async (article: any) => {
    const newStatus = article.status === 'published' ? 'draft' : 'published';
    setArticles(prev => prev.map(a => a.id === article.id ? { ...a, status: newStatus } : a));
    try {
      await updateArticle(eventId, article.id, { status: newStatus }, token);
      clearApiCacheFor(ARTICLES_PATH);
    }
    catch { load(); }
  };

  const CATEGORIES = [
    { value: 'general', label: 'عام' },
    { value: 'startup', label: 'شركات ناشئة' },
    { value: 'investor', label: 'استثمار' },
    { value: 'tech', label: 'تكنولوجيا' },
    { value: 'news', label: 'أخبار' },
    { value: 'interview', label: 'مقابلات' },
  ];
  const CATEGORY_AR: Record<string, string> = Object.fromEntries(CATEGORIES.map(c => [c.value, c.label]));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', margin: 0 }}>📝 المقالات ({articles.length})</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '4px 0 0' }}>
            المقالات المنشورة تظهر على: <a href="/blog" target="_blank" style={{ color: '#6C63FF' }}>/blog</a>
          </p>
        </div>
        {!adding && <button style={S.btn()} onClick={() => { setAdding(true); setEditing(null); setForm(blank); }}>+ مقال جديد</button>}
      </div>

      {adding && (
        <div style={{ ...S.card, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ color: 'white', margin: 0 }}>{editing ? 'تعديل مقال' : 'مقال جديد'}</h3>
            <button style={S.del} onClick={() => { setAdding(false); setEditing(null); setForm(blank); }}>✕ إغلاق</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="العنوان العربي *">
              <input value={form.title_ar||''} onChange={e => { set('title_ar', e.target.value); if (!form.slug) set('slug', generateSlug(e.target.value)); }} style={S.inp} />
            </Field>
            <Field label="العنوان الإنجليزي">
              <input value={form.title||''} onChange={e => set('title', e.target.value)} style={S.inp} placeholder="English title" />
            </Field>
            <Field label="رابط المقال (slug) *">
              <input value={form.slug||''} onChange={e => set('slug', e.target.value)} style={S.inp} placeholder="article-url-slug" dir="ltr" />
            </Field>
            <Field label="الكاتب">
              <input value={form.author_name||''} onChange={e => set('author_name', e.target.value)} style={S.inp} />
            </Field>
            <Field label="التصنيف">
              <select value={form.category||'general'} onChange={e => set('category', e.target.value)} style={S.inp}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="الحالة">
              <select value={form.status||'draft'} onChange={e => set('status', e.target.value)} style={S.inp}>
                <option value="draft">مسودة</option>
                <option value="published">منشور</option>
              </select>
            </Field>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="المقتطف (وصف قصير)">
                <textarea value={form.excerpt_ar||''} onChange={e => set('excerpt_ar', e.target.value)} rows={2} style={{ ...S.inp, resize: 'vertical' }} placeholder="وصف قصير يظهر في قائمة المقالات ومحركات البحث..." />
              </Field>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ ...S.label, marginBottom: 6 }}>محتوى المقال *</label>
              <RichEditor
                value={form.content_ar || ''}
                onChange={html => set('content_ar', html)}
                token={token}
                placeholder="اكتب محتوى المقال هنا..."
                minHeight={320}
                showPreview
              />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <Field label="📎 ملف مرفق (PDF، كتاب، تقرير...)">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <input value={form.file_attachment||''} onChange={e => set('file_attachment', e.target.value)} style={{ ...S.inp, flex: 1 }} placeholder="رابط الملف أو ارفع ملف..." dir="ltr" />
                  {form.file_attachment && <button style={S.del} onClick={() => { set('file_attachment', ''); set('file_attachment_name', ''); }}>✕</button>}
                </div>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: '0.4rem', color: '#a5b4fc', cursor: fileUploading ? 'not-allowed' : 'pointer', fontSize: '0.82rem' }}>
                  {fileUploading ? '⏳ جار الرفع...' : '📤 رفع ملف'}
                  <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" hidden disabled={fileUploading}
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setFileUploading(true);
                      try {
                        const result = await uploadFile(file, token);
                        set('file_attachment', result.url);
                        set('file_attachment_name', result.originalName);
                        showToast('✅ تم رفع الملف');
                      } catch (err: any) { showToast('❌ ' + err.message); }
                      finally { setFileUploading(false); e.target.value = ''; }
                    }} />
                </label>
                {form.file_attachment_name && <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginRight: 8 }}>📎 {form.file_attachment_name}</span>}
              </Field>
            </div>
            <Field label="صورة الغلاف">
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <input value={form.cover_image||''} onChange={e => set('cover_image', e.target.value)} style={{ ...S.inp, flex: 1 }} placeholder="https://..." dir="ltr" />
                {form.cover_image && <button style={{ ...S.del, whiteSpace: 'nowrap' }} onClick={() => set('cover_image', '')}>✕</button>}
              </div>
              <ImageUploadField onUploaded={v => set('cover_image', v)} maxSizeMB={5} token={token} />
            </Field>
            <Field label="الوسوم (tags) - مفصولة بفاصلة">
              <input value={form.tags||''} onChange={e => set('tags', e.target.value)} style={S.inp} placeholder="ريادة, تكنولوجيا, سوريا" />
            </Field>
            <div style={{ gridColumn: '1/-1', borderTop: '1px solid rgba(108,99,255,0.15)', paddingTop: 10, marginTop: 4 }}>
              <p style={{ color: '#6C63FF', fontSize: '0.8rem', fontWeight: 600, marginBottom: 8 }}>🔍 SEO</p>
            </div>
            <Field label="عنوان SEO">
              <input value={form.meta_title||''} onChange={e => set('meta_title', e.target.value)} style={S.inp} placeholder="يُترك فارغاً لاستخدام العنوان الرئيسي" />
            </Field>
            <Field label="وصف SEO (meta description)">
              <input value={form.meta_description||''} onChange={e => set('meta_description', e.target.value)} style={S.inp} placeholder="يُترك فارغاً لاستخدام المقتطف" />
            </Field>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button style={S.btn()} onClick={saveItem} disabled={saving}>{saving ? 'جار الحفظ...' : editing ? 'تحديث' : 'نشر المقال'}</button>
          </div>
        </div>
      )}

      {articles.length === 0 && !adding && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          لا توجد مقالات بعد. أنشئ أول مقال لتحسين ظهور الموقع في محركات البحث.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
        {articles.map(article => (
          <div key={article.id} style={{ ...S.card, padding: '1rem' }}>
            {article.cover_image && (
              <img src={article.cover_image} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, marginBottom: 10 }} />
            )}
            {/* Title + Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
              <h3 style={{ color: 'white', fontWeight: 700, fontSize: '0.92rem', margin: 0, flex: 1, lineHeight: 1.4 }}>
                {article.title_ar || article.title}
              </h3>
              <span style={{
                fontSize: '0.68rem', padding: '2px 8px', borderRadius: 20, flexShrink: 0, whiteSpace: 'nowrap',
                background: article.status === 'published' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                color: article.status === 'published' ? '#86efac' : '#fcd34d'
              }}>{article.status === 'published' ? '✅ منشور' : '📝 مسودة'}</span>
            </div>
            {/* Meta info */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 20, background: 'rgba(108,99,255,0.15)', color: '#a5b4fc' }}>
                {CATEGORY_AR[article.category] || article.category}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>👁 {article.views || 0} مشاهدة</span>
              {article.published_at && (
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {new Date(article.published_at).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button style={{ ...S.btn('#1a1740'), fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                onClick={() => {
                  setEditing(article);
                  setAdding(true);
                  const contentAr = article.content_ar || article.content || '';
                  const titleAr = article.title_ar || article.title || '';
                  setForm({
                    title: article.title || '',
                    title_ar: titleAr,
                    slug: article.slug || '',
                    excerpt: article.excerpt || '',
                    excerpt_ar: article.excerpt_ar || article.excerpt || '',
                    content: article.content || '',
                    content_ar: contentAr,
                    cover_image: article.cover_image || '',
                    author_name: article.author_name || 'S3 Summit Team',
                    author_avatar: article.author_avatar || '',
                    category: article.category || 'general',
                    tags: article.tags || '',
                    status: article.status || 'draft',
                    meta_title: article.meta_title || '',
                    meta_description: article.meta_description || '',
                    file_attachment: article.file_attachment || '',
                    file_attachment_name: article.file_attachment_name || '',
                  });
                }}>
                ✏️ تعديل
              </button>
              <button style={{ ...S.btn(article.status === 'published' ? '#92400e' : '#065f46'), fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                onClick={() => toggleStatus(article)}>
                {article.status === 'published' ? '📝 إخفاء' : '🚀 نشر'}
              </button>
              {article.status === 'published' && (
                <a href={`/blog?article=${article.slug}`} target="_blank" rel="noopener noreferrer"
                  style={{ ...S.btn('#0c4a6e'), fontSize: '0.75rem', padding: '0.3rem 0.6rem', textDecoration: 'none' }}>
                  👁️ عرض
                </a>
              )}
              <button style={{ ...S.del, fontSize: '0.75rem' }} onClick={() => del(article.id)}>🗑️ حذف</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
