'use client';
import { useState, useCallback, useRef } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev';

async function uploadMedia(file: File, token: string, onProgress?: (p: number) => void): Promise<{ url: string; category: string; originalName: string }> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append('file', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/api/uploads/media`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    if (onProgress) xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round(e.loaded * 100 / e.total)); };
    xhr.onload = () => {
      try { const d = JSON.parse(xhr.responseText); if (d.success) resolve(d); else reject(new Error(d.error || 'Upload failed')); }
      catch { reject(new Error('Server error')); }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(fd);
  });
}

// ─── Block Types ──────────────────────────────────────────────────────────────
export type BlockType =
  | 'h1' | 'h2' | 'h3'
  | 'p' | 'quote'
  | 'image' | 'video'
  | 'button' | 'buttons'
  | 'divider' | 'spacer'
  | 'alert'
  | 'card_row'
  | 'file'
  | 'columns2'
  | 'html';

export interface Block {
  id: string;
  type: BlockType;
  // Common
  content?: string;
  content2?: string; // for columns
  // Heading/text
  align?: 'right' | 'center' | 'left';
  color?: string;
  // Image
  src?: string;
  alt?: string;
  width?: string;
  radius?: string;
  // Button
  text?: string;
  href?: string;
  bg?: string;
  textColor?: string;
  // Buttons (array of {text, href, bg})
  buttons?: { text: string; href: string; bg: string }[];
  // Alert
  alertType?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  // Card row: array of {emoji, title, desc}
  cards?: { emoji: string; title: string; desc: string }[];
  // Spacer
  height?: string;
  // Video
  videoUrl?: string;
  // File
  fileName?: string;
  fileUrl?: string;
  // Divider
  dividerStyle?: 'solid' | 'dashed' | 'dotted';
}

// ─── Block Palette definition ─────────────────────────────────────────────────
const PALETTE: { type: BlockType; icon: string; label: string; group: string }[] = [
  { type: 'h1',       icon: 'H1',  label: 'عنوان رئيسي',    group: 'نصوص' },
  { type: 'h2',       icon: 'H2',  label: 'عنوان ثانوي',    group: 'نصوص' },
  { type: 'h3',       icon: 'H3',  label: 'عنوان فرعي',     group: 'نصوص' },
  { type: 'p',        icon: '¶',   label: 'فقرة نصية',      group: 'نصوص' },
  { type: 'quote',    icon: '❝',   label: 'اقتباس',         group: 'نصوص' },
  { type: 'image',    icon: '🖼',   label: 'صورة',           group: 'وسائط' },
  { type: 'video',    icon: '▶',   label: 'فيديو',          group: 'وسائط' },
  { type: 'file',     icon: '📎',   label: 'ملف تحميل',     group: 'وسائط' },
  { type: 'button',   icon: '⬜',   label: 'زر',             group: 'عناصر' },
  { type: 'buttons',  icon: '⬜⬜',  label: 'مجموعة أزرار',  group: 'عناصر' },
  { type: 'alert',    icon: '⚠️',   label: 'تنبيه / ملاحظة', group: 'عناصر' },
  { type: 'card_row', icon: '🃏',   label: 'بطاقات ميزات',  group: 'عناصر' },
  { type: 'columns2', icon: '⧉',   label: 'عمودان',         group: 'تخطيط' },
  { type: 'divider',  icon: '—',   label: 'خط فاصل',        group: 'تخطيط' },
  { type: 'spacer',   icon: '↕',   label: 'مسافة فارغة',   group: 'تخطيط' },
  { type: 'html',     icon: '</>', label: 'HTML مخصص',      group: 'متقدم' },
];

function genId() { return Math.random().toString(36).substring(2, 9); }

function defaultBlock(type: BlockType): Block {
  const id = genId();
  switch (type) {
    case 'h1': return { id, type, content: 'عنوان الصفحة الرئيسي', align: 'right', color: '' };
    case 'h2': return { id, type, content: 'عنوان القسم', align: 'right', color: '' };
    case 'h3': return { id, type, content: 'عنوان فرعي', align: 'right', color: '' };
    case 'p':  return { id, type, content: 'أكتب نصك هنا...', align: 'right' };
    case 'quote': return { id, type, content: 'نص الاقتباس هنا', align: 'right' };
    case 'image': return { id, type, src: '', alt: 'صورة', width: '100%', radius: '8px' };
    case 'video': return { id, type, videoUrl: '' };
    case 'file': return { id, type, fileName: 'اسم الملف', fileUrl: '', content: 'اضغط لتحميل الملف' };
    case 'button': return { id, type, text: 'اضغط هنا', href: '#', bg: '#6C63FF', textColor: '#fff' };
    case 'buttons': return { id, type, buttons: [{ text: 'الزر الأول', href: '#', bg: '#6C63FF' }, { text: 'الزر الثاني', href: '#', bg: 'transparent' }] };
    case 'alert': return { id, type, alertType: 'info', title: 'ملاحظة', content: 'محتوى التنبيه هنا' };
    case 'card_row': return { id, type, cards: [{ emoji: '🚀', title: 'الميزة الأولى', desc: 'وصف الميزة هنا' }, { emoji: '💡', title: 'الميزة الثانية', desc: 'وصف الميزة هنا' }, { emoji: '🎯', title: 'الميزة الثالثة', desc: 'وصف الميزة هنا' }] };
    case 'columns2': return { id, type, content: 'محتوى العمود الأيمن', content2: 'محتوى العمود الأيسر' };
    case 'divider': return { id, type, dividerStyle: 'solid', color: 'rgba(108,99,255,0.3)' };
    case 'spacer': return { id, type, height: '32px' };
    case 'html': return { id, type, content: '<p>أكتب كود HTML هنا...</p>' };
    default: return { id, type, content: '' };
  }
}

// ─── Block Renderer (used in both editor and preview) ─────────────────────────
export function renderBlock(block: Block, primaryColor = '#6C63FF'): string {
  switch (block.type) {
    case 'h1': return `<h1 style="font-size:2rem;font-weight:900;color:${block.color || '#ffffff'};text-align:${block.align || 'right'};margin:0 0 1rem">${block.content}</h1>`;
    case 'h2': return `<h2 style="font-size:1.5rem;font-weight:700;color:${block.color || '#ffffff'};text-align:${block.align || 'right'};margin:0 0 0.75rem;padding-bottom:0.4rem;border-bottom:1px solid rgba(108,99,255,0.25)">${block.content}</h2>`;
    case 'h3': return `<h3 style="font-size:1.15rem;font-weight:700;color:${block.color || '#a5b4fc'};text-align:${block.align || 'right'};margin:0 0 0.5rem">${block.content}</h3>`;
    case 'p':  return `<p style="font-size:0.95rem;color:#d1d5db;line-height:1.9;text-align:${block.align || 'right'};margin:0 0 1rem">${block.content}</p>`;
    case 'quote': return `<blockquote style="border-right:4px solid ${primaryColor};padding:1rem 1.25rem;margin:1.25rem 0;background:rgba(108,99,255,0.08);border-radius:0 8px 8px 0;color:#d1d5db;font-size:1rem;line-height:1.8;font-style:italic;text-align:${block.align || 'right'}">${block.content}</blockquote>`;
    case 'image': return block.src ? `<div style="text-align:center;margin:1rem 0"><img src="${block.src}" alt="${block.alt || ''}" style="max-width:${block.width || '100%'};width:100%;height:auto;border-radius:${block.radius || '8px'};display:inline-block"></div>` : '';
    case 'video': {
      if (!block.videoUrl) return '';
      const yt = block.videoUrl.includes('youtube.com') || block.videoUrl.includes('youtu.be');
      const vm = block.videoUrl.includes('vimeo.com');
      if (yt) { const vid = block.videoUrl.split('v=')[1]?.split('&')[0] || block.videoUrl.split('/').pop(); return `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin:1rem 0"><iframe src="https://www.youtube.com/embed/${vid}" style="position:absolute;top:0;left:0;width:100%;height:100%" allowfullscreen></iframe></div>`; }
      if (vm) { return `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin:1rem 0"><iframe src="https://player.vimeo.com/video/${block.videoUrl.split('/').pop()}" style="position:absolute;top:0;left:0;width:100%;height:100%" allowfullscreen></iframe></div>`; }
      return `<video src="${block.videoUrl}" controls style="width:100%;border-radius:12px;margin:1rem 0"></video>`;
    }
    case 'file': return `<a href="${block.fileUrl || '#'}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.75rem 1.25rem;background:rgba(108,99,255,0.15);border:1px solid rgba(108,99,255,0.4);border-radius:0.6rem;color:#a5b4fc;text-decoration:none;font-weight:600;font-size:0.9rem;margin:0.5rem 0">📎 ${block.fileName || block.content || 'تحميل الملف'}</a>`;
    case 'button': return `<div style="text-align:center;margin:1rem 0"><a href="${block.href || '#'}" style="display:inline-block;padding:0.75rem 2rem;background:${block.bg || primaryColor};color:${block.textColor || '#fff'};border-radius:8px;text-decoration:none;font-weight:700;font-size:0.95rem">${block.text}</a></div>`;
    case 'buttons': return `<div style="display:flex;flex-wrap:wrap;gap:0.75rem;justify-content:center;margin:1rem 0">${(block.buttons || []).map(b => `<a href="${b.href || '#'}" style="padding:0.65rem 1.5rem;background:${b.bg || primaryColor};color:white;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.9rem;border:2px solid ${b.bg === 'transparent' ? 'rgba(108,99,255,0.5)' : b.bg}">${b.text}</a>`).join('')}</div>`;
    case 'alert': {
      const colors = { info: { bg: 'rgba(59,130,246,0.1)', border: '#3b82f6', icon: 'ℹ️', text: '#93c5fd' }, success: { bg: 'rgba(16,185,129,0.1)', border: '#10b981', icon: '✅', text: '#86efac' }, warning: { bg: 'rgba(245,158,11,0.1)', border: '#f59e0b', icon: '⚠️', text: '#fcd34d' }, danger: { bg: 'rgba(239,68,68,0.1)', border: '#ef4444', icon: '🚨', text: '#fca5a5' } };
      const c = colors[block.alertType || 'info'];
      return `<div style="background:${c.bg};border-right:4px solid ${c.border};border-radius:0 8px 8px 0;padding:1rem 1.25rem;margin:1rem 0"><div style="font-weight:700;color:${c.text};margin-bottom:4px">${c.icon} ${block.title || ''}</div><div style="color:#d1d5db;font-size:0.9rem;line-height:1.7">${block.content}</div></div>`;
    }
    case 'card_row': return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1rem;margin:1rem 0">${(block.cards || []).map(card => `<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(108,99,255,0.2);border-radius:12px;padding:1.25rem;text-align:center"><div style="font-size:2rem;margin-bottom:0.5rem">${card.emoji}</div><div style="color:white;font-weight:700;margin-bottom:0.3rem">${card.title}</div><div style="color:#94a3b8;font-size:0.82rem;line-height:1.6">${card.desc}</div></div>`).join('')}</div>`;
    case 'columns2': return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin:1rem 0"><div style="color:#d1d5db;font-size:0.95rem;line-height:1.8">${block.content}</div><div style="color:#d1d5db;font-size:0.95rem;line-height:1.8">${block.content2}</div></div>`;
    case 'divider': return `<hr style="border:none;border-top:1px ${block.dividerStyle || 'solid'} ${block.color || 'rgba(108,99,255,0.3)'};margin:1.5rem 0">`;
    case 'spacer': return `<div style="height:${block.height || '32px'}"></div>`;
    case 'html': return block.content || '';
    default: return '';
  }
}

export function blocksToHtml(blocks: Block[], primaryColor = '#6C63FF'): string {
  return blocks.map(b => renderBlock(b, primaryColor)).join('\n');
}

export function htmlToBlocks(html: string): Block[] {
  if (!html?.trim()) return [];
  // If it starts with '[' it's already JSON blocks
  if (html.trim().startsWith('[')) {
    try { return JSON.parse(html); } catch { /* fall through */ }
  }
  // Wrap legacy HTML in a single html block
  return [{ id: genId(), type: 'html', content: html }];
}

// ─── Inline Block Editor ──────────────────────────────────────────────────────
function BlockEditor({ block, onChange, primaryColor, token }: { block: Block; onChange: (b: Block) => void; primaryColor: string; token?: string }) {
  const set = (k: keyof Block, v: any) => onChange({ ...block, [k]: v });
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);

  const inputStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(108,99,255,0.25)', borderRadius: 6, padding: '0.45rem 0.7rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.85rem', colorScheme: 'dark' };
  const labelStyle: React.CSSProperties = { fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginBottom: 3 };

  const doUpload = async (file: File, onUrl: (url: string, name?: string, cat?: string) => void) => {
    if (!token) return;
    setUploading(true); setUploadPct(0);
    try {
      const result = await uploadMedia(file, token, p => setUploadPct(p));
      onUrl(result.url, result.originalName, result.category);
    } catch (e: any) {
      alert('فشل الرفع: ' + e.message);
    }
    setUploading(false); setUploadPct(0);
  };

  const uploadBtn = (accept: string, onUrl: (url: string, name?: string, cat?: string) => void, label = '📤 رفع من الجهاز') =>
    token ? (
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.7rem', background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: '0.4rem', color: '#a5b4fc', fontSize: '0.78rem', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
        {uploading ? `⏳ ${uploadPct}%` : label}
        <input type="file" accept={accept} hidden disabled={uploading}
          onChange={e => { const f = e.target.files?.[0]; if (f) doUpload(f, onUrl); e.target.value = ''; }} />
        {uploading && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'rgba(108,99,255,0.2)', borderRadius: 1 }}><div style={{ height: '100%', background: '#6C63FF', width: `${uploadPct}%`, transition: 'width 0.2s' }} /></div>}
      </label>
    ) : null;

  switch (block.type) {
    case 'h1': case 'h2': case 'h3': case 'p': case 'quote':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div><label style={labelStyle}>النص</label>
            <textarea rows={block.type === 'p' ? 4 : 2} style={{ ...inputStyle, resize: 'vertical', fontFamily: block.type === 'html' ? 'monospace' : 'inherit' }}
              value={block.content || ''} onChange={e => set('content', e.target.value)} /></div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ flex: 1 }}><label style={labelStyle}>المحاذاة</label>
              <select style={inputStyle} value={block.align || 'right'} onChange={e => set('align', e.target.value)}>
                <option value="right">يمين</option><option value="center">وسط</option><option value="left">يسار</option>
              </select></div>
            <div><label style={labelStyle}>اللون</label>
              <input type="color" value={block.color || (block.type === 'h3' ? '#a5b4fc' : '#ffffff')}
                onChange={e => set('color', e.target.value)}
                style={{ width: 44, height: 34, borderRadius: 6, border: 'none', cursor: 'pointer' }} /></div>
          </div>
        </div>
      );

    case 'image':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div>
            <label style={labelStyle}>رابط الصورة</label>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <input style={{ ...inputStyle, flex: 1 }} value={block.src || ''} onChange={e => set('src', e.target.value)} placeholder="https://..." dir="ltr" />
              {block.src && <button onClick={() => set('src', '')} style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid #ef444440', borderRadius: 4, padding: '0.3rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>}
            </div>
            <div style={{ marginTop: '0.4rem' }}>{uploadBtn('image/*', url => set('src', url), '🖼 رفع صورة من الجهاز')}</div>
          </div>
          <div><label style={labelStyle}>نص بديل (alt)</label>
            <input style={inputStyle} value={block.alt || ''} onChange={e => set('alt', e.target.value)} /></div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ flex: 1 }}><label style={labelStyle}>العرض</label>
              <input style={inputStyle} value={block.width || '100%'} onChange={e => set('width', e.target.value)} placeholder="100% أو 400px" dir="ltr" /></div>
            <div style={{ flex: 1 }}><label style={labelStyle}>زوايا مدورة</label>
              <input style={inputStyle} value={block.radius || '8px'} onChange={e => set('radius', e.target.value)} placeholder="8px" dir="ltr" /></div>
          </div>
          {block.src && <img src={block.src} alt="" style={{ maxWidth: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: Number(block.radius) || 8 }} />}
        </div>
      );

    case 'video':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div><label style={labelStyle}>رابط الفيديو (YouTube / Vimeo / مباشر)</label>
            <input style={inputStyle} value={block.videoUrl || ''} onChange={e => set('videoUrl', e.target.value)} placeholder="https://www.youtube.com/watch?v=..." dir="ltr" /></div>
          <div style={{ marginTop: '0.2rem' }}>{uploadBtn('video/*', url => set('videoUrl', url), '🎬 رفع فيديو من الجهاز')}</div>
          <p style={{ color: '#64748b', fontSize: '0.72rem', margin: 0 }}>أو الصق رابط YouTube / Vimeo للتضمين التلقائي</p>
        </div>
      );

    case 'file':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div><label style={labelStyle}>رابط الملف</label>
            <input style={inputStyle} value={block.fileUrl || ''} onChange={e => set('fileUrl', e.target.value)} placeholder="https://..." dir="ltr" /></div>
          <div>{uploadBtn('.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt', (url, name) => { set('fileUrl', url); if (name && !block.fileName) set('fileName', name); }, '📎 رفع ملف من الجهاز')}</div>
          <div><label style={labelStyle}>اسم الملف (يظهر للزائر)</label>
            <input style={inputStyle} value={block.fileName || ''} onChange={e => set('fileName', e.target.value)} /></div>
        </div>
      );

    case 'button':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div><label style={labelStyle}>نص الزر *</label>
            <input style={inputStyle} value={block.text || ''} onChange={e => set('text', e.target.value)} /></div>
          <div><label style={labelStyle}>الرابط</label>
            <input style={inputStyle} value={block.href || '#'} onChange={e => set('href', e.target.value)} dir="ltr" /></div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div><label style={labelStyle}>لون الخلفية</label>
              <input type="color" value={block.bg || primaryColor} onChange={e => set('bg', e.target.value)} style={{ width: 44, height: 34, borderRadius: 6, border: 'none', cursor: 'pointer' }} /></div>
            <div><label style={labelStyle}>لون النص</label>
              <input type="color" value={block.textColor || '#ffffff'} onChange={e => set('textColor', e.target.value)} style={{ width: 44, height: 34, borderRadius: 6, border: 'none', cursor: 'pointer' }} /></div>
          </div>
        </div>
      );

    case 'buttons':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={labelStyle}>الأزرار</label>
          {(block.buttons || []).map((btn, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <input style={inputStyle} value={btn.text} onChange={e => { const b = [...(block.buttons||[])]; b[i] = { ...b[i], text: e.target.value }; set('buttons', b); }} placeholder="نص الزر" />
              <input style={inputStyle} value={btn.href} onChange={e => { const b = [...(block.buttons||[])]; b[i] = { ...b[i], href: e.target.value }; set('buttons', b); }} placeholder="رابط" dir="ltr" />
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input type="color" value={btn.bg || primaryColor} onChange={e => { const b = [...(block.buttons||[])]; b[i] = { ...b[i], bg: e.target.value }; set('buttons', b); }} style={{ width: 36, height: 30, borderRadius: 4, border: 'none', cursor: 'pointer' }} />
                <button onClick={() => { const b = (block.buttons||[]).filter((_,j) => j !== i); set('buttons', b); }}
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid #ef444440', borderRadius: 4, padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}>حذف</button>
              </div>
            </div>
          ))}
          <button onClick={() => set('buttons', [...(block.buttons||[]), { text: 'زر جديد', href: '#', bg: primaryColor }])}
            style={{ background: 'rgba(108,99,255,0.15)', color: '#a5b4fc', border: '1px dashed rgba(108,99,255,0.4)', borderRadius: 6, padding: '0.4rem', cursor: 'pointer', fontSize: '0.82rem' }}>
            + إضافة زر
          </button>
        </div>
      );

    case 'alert':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div><label style={labelStyle}>نوع التنبيه</label>
            <select style={inputStyle} value={block.alertType || 'info'} onChange={e => set('alertType', e.target.value as any)}>
              <option value="info">ℹ️ معلومة (أزرق)</option>
              <option value="success">✅ نجاح (أخضر)</option>
              <option value="warning">⚠️ تحذير (أصفر)</option>
              <option value="danger">🚨 خطر (أحمر)</option>
            </select></div>
          <div><label style={labelStyle}>العنوان</label>
            <input style={inputStyle} value={block.title || ''} onChange={e => set('title', e.target.value)} /></div>
          <div><label style={labelStyle}>المحتوى</label>
            <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={block.content || ''} onChange={e => set('content', e.target.value)} /></div>
        </div>
      );

    case 'card_row':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={labelStyle}>البطاقات</label>
          {(block.cards || []).map((card, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input style={{ ...inputStyle, width: 50 }} value={card.emoji} onChange={e => { const c=[...(block.cards||[])]; c[i]={...c[i],emoji:e.target.value}; set('cards',c); }} placeholder="🚀" />
                <input style={{ ...inputStyle, flex: 1 }} value={card.title} onChange={e => { const c=[...(block.cards||[])]; c[i]={...c[i],title:e.target.value}; set('cards',c); }} placeholder="العنوان" />
                <button onClick={() => set('cards', (block.cards||[]).filter((_,j)=>j!==i))}
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid #ef444440', borderRadius: 4, padding: '0 0.4rem', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
              </div>
              <textarea rows={2} style={{ ...inputStyle, resize: 'vertical' }} value={card.desc} onChange={e => { const c=[...(block.cards||[])]; c[i]={...c[i],desc:e.target.value}; set('cards',c); }} placeholder="الوصف" />
            </div>
          ))}
          <button onClick={() => set('cards', [...(block.cards||[]), { emoji: '✨', title: 'عنوان جديد', desc: 'الوصف هنا' }])}
            style={{ background: 'rgba(108,99,255,0.15)', color: '#a5b4fc', border: '1px dashed rgba(108,99,255,0.4)', borderRadius: 6, padding: '0.4rem', cursor: 'pointer', fontSize: '0.82rem' }}>
            + إضافة بطاقة
          </button>
        </div>
      );

    case 'columns2':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div><label style={labelStyle}>العمود الأيمن (HTML مدعوم)</label>
            <textarea rows={4} style={{ ...inputStyle, resize: 'vertical' }} value={block.content || ''} onChange={e => set('content', e.target.value)} /></div>
          <div><label style={labelStyle}>العمود الأيسر (HTML مدعوم)</label>
            <textarea rows={4} style={{ ...inputStyle, resize: 'vertical' }} value={block.content2 || ''} onChange={e => set('content2', e.target.value)} /></div>
        </div>
      );

    case 'divider':
      return (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ flex: 1 }}><label style={labelStyle}>النمط</label>
            <select style={inputStyle} value={block.dividerStyle || 'solid'} onChange={e => set('dividerStyle', e.target.value as any)}>
              <option value="solid">صلب</option><option value="dashed">متقطع</option><option value="dotted">نقاط</option>
            </select></div>
          <div><label style={labelStyle}>اللون</label>
            <input type="color" value={block.color || '#6C63FF'} onChange={e => set('color', e.target.value)} style={{ width: 44, height: 34, borderRadius: 6, border: 'none', cursor: 'pointer', marginTop: 3 }} /></div>
        </div>
      );

    case 'spacer':
      return (
        <div><label style={labelStyle}>الارتفاع</label>
          <input style={inputStyle} value={block.height || '32px'} onChange={e => set('height', e.target.value)} placeholder="32px" dir="ltr" /></div>
      );

    case 'html':
      return (
        <div>
          <label style={labelStyle}>كود HTML مخصص</label>
          <textarea rows={8} style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical', lineHeight: 1.5 }}
            value={block.content || ''} onChange={e => set('content', e.target.value)} />
        </div>
      );

    default: return null;
  }
}

// ─── Main PageBuilder Component ───────────────────────────────────────────────
interface PageBuilderProps {
  initialBlocks?: Block[];
  onChange: (blocks: Block[], html: string) => void;
  primaryColor?: string;
  token?: string;
}

export default function PageBuilder({ initialBlocks = [], onChange, primaryColor = '#6C63FF', token }: PageBuilderProps) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'edit' | 'preview' | 'html'>('edit');
  const [htmlSrc, setHtmlSrc] = useState('');
  const [showPalette, setShowPalette] = useState(false);
  const paletteRef = useRef<HTMLDivElement>(null);

  const update = useCallback((newBlocks: Block[]) => {
    setBlocks(newBlocks);
    onChange(newBlocks, blocksToHtml(newBlocks, primaryColor));
  }, [onChange, primaryColor]);

  const addBlock = (type: BlockType) => {
    const b = defaultBlock(type);
    update([...blocks, b]);
    setSelectedId(b.id);
    setShowPalette(false);
  };

  const updateBlock = (updated: Block) => {
    update(blocks.map(b => b.id === updated.id ? updated : b));
  };

  const deleteBlock = (id: string) => {
    update(blocks.filter(b => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const moveUp = (id: string) => {
    const i = blocks.findIndex(b => b.id === id);
    if (i <= 0) return;
    const nb = [...blocks];
    [nb[i-1], nb[i]] = [nb[i], nb[i-1]];
    update(nb);
  };

  const moveDown = (id: string) => {
    const i = blocks.findIndex(b => b.id === id);
    if (i >= blocks.length - 1) return;
    const nb = [...blocks];
    [nb[i], nb[i+1]] = [nb[i+1], nb[i]];
    update(nb);
  };

  const duplicate = (id: string) => {
    const b = blocks.find(b => b.id === id);
    if (!b) return;
    const clone = { ...b, id: genId() };
    const i = blocks.findIndex(b => b.id === id);
    const nb = [...blocks.slice(0, i+1), clone, ...blocks.slice(i+1)];
    update(nb);
  };

  const applyHtmlSrc = () => {
    const bs = htmlToBlocks(htmlSrc);
    update(bs);
    setMode('edit');
  };

  const selectedBlock = blocks.find(b => b.id === selectedId);
  const groups = [...new Set(PALETTE.map(p => p.group))];

  const btnStyle = (active: boolean, color = '#6C63FF') => ({
    padding: '0.35rem 0.85rem', borderRadius: '0.35rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
    background: active ? color : 'rgba(255,255,255,0.06)', color: active ? 'white' : '#94a3b8',
  } as React.CSSProperties);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, fontFamily: 'Cairo, sans-serif' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.75rem', background: '#0f0d24', borderRadius: '0.75rem 0.75rem 0 0', borderBottom: '1px solid rgba(108,99,255,0.2)', flexWrap: 'wrap' }}>
        <button style={btnStyle(mode === 'edit')} onClick={() => setMode('edit')}>✏️ تحرير</button>
        <button style={btnStyle(mode === 'preview')} onClick={() => setMode('preview')}>👁️ معاينة</button>
        <button style={btnStyle(mode === 'html', '#374151')} onClick={() => { setHtmlSrc(blocksToHtml(blocks, primaryColor)); setMode('html'); }}>{'</>'} HTML</button>
        <div style={{ flex: 1 }} />
        <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{blocks.length} عنصر</span>
        {mode === 'edit' && (
          <button
            onClick={() => setShowPalette(!showPalette)}
            style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.4rem 1rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
            ＋ إضافة عنصر
          </button>
        )}
      </div>

      {/* Block Palette Dropdown */}
      {showPalette && mode === 'edit' && (
        <div ref={paletteRef} style={{ background: '#13102a', border: '1px solid rgba(108,99,255,0.3)', borderTop: 'none', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {groups.map(group => (
            <div key={group}>
              <div style={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{group}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {PALETTE.filter(p => p.group === group).map(p => (
                  <button key={p.type} onClick={() => addBlock(p.type)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', padding: '0.6rem 0.85rem', background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.25)', borderRadius: '0.5rem', cursor: 'pointer', minWidth: 72, transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(108,99,255,0.25)'; e.currentTarget.style.borderColor = primaryColor; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(108,99,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(108,99,255,0.25)'; }}>
                    <span style={{ fontSize: '1.1rem', color: '#a5b4fc' }}>{p.icon}</span>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main area */}
      <div style={{ display: 'flex', minHeight: 400, border: '1px solid rgba(108,99,255,0.15)', borderTop: showPalette ? 'none' : undefined, borderRadius: showPalette ? '0 0 0.75rem 0.75rem' : '0 0 0.75rem 0.75rem', overflow: 'hidden' }}>

        {/* HTML source mode */}
        {mode === 'html' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', background: '#0d0b1a', gap: '0.75rem' }}>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0 }}>⚠️ تعديل HTML مباشرة — بعد الحفظ سيتحول كل شيء لبلوك HTML واحد.</p>
            <textarea
              style={{ flex: 1, minHeight: 400, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 8, padding: '1rem', color: '#d1d5db', fontFamily: 'monospace', fontSize: '0.82rem', resize: 'vertical', lineHeight: 1.6, outline: 'none' }}
              value={htmlSrc} onChange={e => setHtmlSrc(e.target.value)} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={applyHtmlSrc} style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: 6, padding: '0.5rem 1.25rem', cursor: 'pointer', fontWeight: 700 }}>✅ تطبيق</button>
              <button onClick={() => setMode('edit')} style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: 'none', borderRadius: 6, padding: '0.5rem 1.25rem', cursor: 'pointer' }}>إلغاء</button>
            </div>
          </div>
        )}

        {/* Preview mode */}
        {mode === 'preview' && (
          <div style={{ flex: 1, padding: '2rem', background: '#0d0b1a', overflowY: 'auto', direction: 'rtl' }}
            dangerouslySetInnerHTML={{ __html: blocksToHtml(blocks, primaryColor) || '<p style="color:#475569;text-align:center;padding:3rem">الصفحة فارغة — اضغط تحرير لإضافة محتوى</p>' }} />
        )}

        {/* Edit mode */}
        {mode === 'edit' && (
          <>
            {/* Canvas */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', background: '#0d0b1a', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {blocks.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, color: '#475569', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📄</div>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>الصفحة فارغة</p>
                  <p style={{ margin: '0.3rem 0 1rem', fontSize: '0.8rem' }}>اضغط "إضافة عنصر" لبدء البناء</p>
                  <button onClick={() => setShowPalette(true)}
                    style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: 8, padding: '0.6rem 1.5rem', cursor: 'pointer', fontWeight: 700 }}>
                    ＋ إضافة أول عنصر
                  </button>
                </div>
              )}
              {blocks.map((block, i) => {
                const isSelected = selectedId === block.id;
                const palEntry = PALETTE.find(p => p.type === block.type);
                return (
                  <div key={block.id}
                    onClick={() => setSelectedId(block.id)}
                    style={{ border: `2px solid ${isSelected ? primaryColor : 'rgba(255,255,255,0.06)'}`, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s', background: isSelected ? 'rgba(108,99,255,0.05)' : 'transparent' }}>
                    {/* Block header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0.75rem', background: isSelected ? 'rgba(108,99,255,0.15)' : 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${isSelected ? 'rgba(108,99,255,0.3)' : 'rgba(255,255,255,0.05)'}` }}>
                      <span style={{ color: isSelected ? '#a5b4fc' : '#64748b', fontSize: '0.72rem', fontWeight: 600 }}>
                        {palEntry?.icon} {palEntry?.label}
                      </span>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {[
                          { label: '↑', action: () => { moveUp(block.id); }, title: 'تحريك لأعلى' },
                          { label: '↓', action: () => { moveDown(block.id); }, title: 'تحريك لأسفل' },
                          { label: '⧉', action: () => duplicate(block.id), title: 'نسخ' },
                          { label: '✕', action: () => deleteBlock(block.id), title: 'حذف', danger: true },
                        ].map(btn => (
                          <button key={btn.label} title={btn.title}
                            onClick={e => { e.stopPropagation(); btn.action(); }}
                            style={{ background: btn.danger ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)', color: btn.danger ? '#fca5a5' : '#94a3b8', border: 'none', borderRadius: 4, width: 24, height: 24, cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Block mini preview */}
                    <div style={{ padding: '0.6rem 0.9rem', direction: 'rtl', fontSize: '0.85rem', pointerEvents: 'none' }}
                      dangerouslySetInnerHTML={{ __html: renderBlock(block, primaryColor) }} />
                  </div>
                );
              })}

              {/* Add block at bottom */}
              {blocks.length > 0 && (
                <button onClick={() => setShowPalette(!showPalette)}
                  style={{ border: '1px dashed rgba(108,99,255,0.35)', borderRadius: 8, padding: '0.6rem', background: 'transparent', color: '#6C63FF', cursor: 'pointer', fontSize: '0.82rem', width: '100%' }}>
                  ＋ إضافة عنصر
                </button>
              )}
            </div>

            {/* Right panel - block editor */}
            <div style={{ width: 280, borderLeft: '1px solid rgba(108,99,255,0.15)', background: '#13102a', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {selectedBlock ? (
                <div style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 700, color: 'white', fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>{PALETTE.find(p => p.type === selectedBlock.type)?.icon}</span>
                    <span>{PALETTE.find(p => p.type === selectedBlock.type)?.label}</span>
                  </div>
                  <BlockEditor block={selectedBlock} onChange={updateBlock} primaryColor={primaryColor} token={token} />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569', padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👆</div>
                  <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.6 }}>اضغط على أي عنصر في الصفحة لتعديله</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
