'use client';
import { useState, useEffect, useCallback } from 'react';
import { fetchPagesAdmin, createPage, updatePage, deletePage } from '@/lib/api';
import PageBuilder, { Block, blocksToHtml, htmlToBlocks } from './PageBuilder';

const S = {
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem', colorScheme: 'dark' } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 } as React.CSSProperties),
  del: { background: '#ef444420', color: '#ef4444', border: '1px solid #ef444440', borderRadius: '0.4rem', padding: '0.35rem 0.7rem', cursor: 'pointer', fontSize: '0.8rem' } as React.CSSProperties,
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '0.8rem', padding: '1.25rem' } as React.CSSProperties,
  label: { fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block', fontWeight: 600 } as React.CSSProperties,
};

const POSITIONS = [
  { value: 'footer', label: '📌 الفوتر فقط' },
  { value: 'nav', label: '🔗 الناف بار فقط' },
  { value: 'both', label: '📍 الناف + الفوتر' },
  { value: 'hidden', label: '👁️ مخفي' },
];

interface Page {
  id: number; slug: string; title: string; title_ar?: string;
  content?: string; content_ar?: string;
  position: string; sort_order: number; is_published: number;
}

export default function AdminPages({ eventId, token }: { eventId: number; token: string }) {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Page | null>(null);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  // Builder state
  const [pageBlocks, setPageBlocks] = useState<Block[]>([]);
  const [pageHtml, setPageHtml] = useState('');

  const emptyPage = () => ({ id: 0, slug: '', title: '', title_ar: '', content: '', content_ar: '', position: 'footer', sort_order: 0, is_published: 1 });

  const emptyForm = () => ({ id: 0, slug: '', title: '', title_ar: '', content: '', content_ar: '', position: 'footer', sort_order: 0, is_published: 1 });

  const load = useCallback(async () => {
    try { setLoading(true); const res = await fetchPagesAdmin(eventId, token); setPages(res.data || []); }
    catch { setPages([]); } finally { setLoading(false); }
  }, [eventId, token]);

  useEffect(() => { load(); }, [load]);

  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  const handleSave = async () => {
    if (!editing) return;
    setError('');
    const payload = {
      ...editing,
      content_ar: pageHtml || editing.content_ar,
      content: pageHtml || editing.content,
    };
    try {
      if (creating) {
        await createPage(eventId, payload, token);
        showSuccess('✅ تم إنشاء الصفحة');
      } else {
        await updatePage(eventId, editing.id, payload, token);
        showSuccess('✅ تم الحفظ');
      }
      setEditing(null); setCreating(false); setPageBlocks([]); setPageHtml('');
      load();
    } catch (e: any) { setError(e.message || 'فشل الحفظ'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل تريد حذف هذه الصفحة؟')) return;
    try { await deletePage(eventId, id, token); showSuccess('✅ تم الحذف'); load(); }
    catch (e: any) { setError(e.message); }
  };

  const posLabel = (pos: string) => POSITIONS.find(p => p.value === pos)?.label || pos;

  const startEdit = (page: Page) => {
    setEditing(page);
    setCreating(false);
    const blocks = page.content_ar ? htmlToBlocks(page.content_ar) : [];
    setPageBlocks(blocks);
    setPageHtml(page.content_ar || '');
  };

  const startCreate = () => {
    setEditing(emptyPage());
    setCreating(true);
    setPageBlocks([]);
    setPageHtml('');
  };

  if (editing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => { setEditing(null); setCreating(false); }} style={S.btn('#374151')}>← رجوع</button>
          <h2 style={{ color: 'white', margin: 0, fontSize: '1.2rem' }}>
            {creating ? '➕ صفحة جديدة' : `✏️ ${editing.title_ar || editing.title}`}
          </h2>
          <div style={{ flex: 1 }} />
          <button style={{ ...S.btn(), padding: '0.5rem 1.5rem' }} onClick={handleSave}>💾 حفظ</button>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef444440', borderRadius: '0.5rem', padding: '0.75rem', color: '#fca5a5' }}>❌ {error}</div>}

        {/* Page settings */}
        <div style={S.card}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div><label style={S.label}>العنوان (عربي) *</label>
              <input style={S.inp} value={editing.title_ar || ''} dir="rtl"
                onChange={e => setEditing(p => p ? { ...p, title_ar: e.target.value, title: e.target.value } : p)} placeholder="عنوان الصفحة" /></div>
            <div><label style={S.label}>Slug (رابط الصفحة) *</label>
              <input style={S.inp} value={editing.slug} dir="ltr"
                onChange={e => setEditing(p => p ? { ...p, slug: e.target.value.toLowerCase().replace(/\s+/g,'-') } : p)} placeholder="about-us" /></div>
            <div><label style={S.label}>الموضع</label>
              <select style={S.inp} value={editing.position}
                onChange={e => setEditing(p => p ? { ...p, position: e.target.value } : p)}>
                {POSITIONS.map(pos => <option key={pos.value} value={pos.value}>{pos.label}</option>)}
              </select></div>
            <div><label style={S.label}>الترتيب</label>
              <input type="number" style={S.inp} value={editing.sort_order}
                onChange={e => setEditing(p => p ? { ...p, sort_order: Number(e.target.value) } : p)} /></div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.75rem', color: '#94a3b8', fontSize: '0.85rem' }}>
            <input type="checkbox" checked={editing.is_published === 1}
              onChange={e => setEditing(p => p ? { ...p, is_published: e.target.checked ? 1 : 0 } : p)}
              style={{ accentColor: '#6C63FF' }} />
            منشورة (ظاهرة للزوار)
          </label>
        </div>

        {/* Page Builder */}
        <PageBuilder
          key={editing.id}
          initialBlocks={pageBlocks}
          primaryColor="#6C63FF"
          token={token}
          onChange={(blocks, html) => {
            setPageBlocks(blocks);
            setPageHtml(html);
          }}
        />

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={{ ...S.btn(), padding: '0.6rem 2rem' }} onClick={handleSave}>💾 حفظ الصفحة</button>
          <button style={S.btn('#374151')} onClick={() => { setEditing(null); setCreating(false); }}>إلغاء</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', margin: 0 }}>📄 الصفحات الثابتة</h1>
        <button style={S.btn()} onClick={startCreate}>➕ صفحة جديدة</button>
      </div>

      {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef444440', borderRadius: '0.5rem', padding: '0.75rem', color: '#fca5a5' }}>❌ {error}</div>}
      {success && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '0.5rem', padding: '0.75rem', color: '#86efac' }}>{success}</div>}

      <div style={{ background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '0.8rem', padding: '1rem', fontSize: '0.85rem', color: '#94a3b8' }}>
        💡 ابنِ صفحاتك بالسحب والإفلات — لا تحتاج أي معرفة بالبرمجة. الصفحات تظهر في الفوتر أو الناف بار حسب الإعداد.
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>جار التحميل...</div>
        : pages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', background: '#13102a', borderRadius: '0.8rem', border: '1px solid rgba(108,99,255,0.1)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
            <p style={{ margin: '0 0 1rem' }}>لا توجد صفحات بعد</p>
            <button style={S.btn()} onClick={startCreate}>➕ إنشاء أول صفحة</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pages.map(page => (
              <div key={page.id} style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>{page.title_ar || page.title}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: 12, background: 'rgba(108,99,255,0.15)', color: '#a5b4fc' }}>/{page.slug}</span>
                    <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: 12, background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>{posLabel(page.position)}</span>
                    <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: 12, background: page.is_published ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.1)', color: page.is_published ? '#86efac' : '#fca5a5' }}>
                      {page.is_published ? '✅ منشورة' : '❌ مخفية'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button style={S.btn()} onClick={() => startEdit(page)}>✏️ تعديل</button>
                  <button style={S.del} onClick={() => handleDelete(page.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
