'use client';
/**
 * RichEditor — Professional WYSIWYG editor usable across the whole site.
 * Features:
 *  - Formatting toolbar (Bold, Italic, Underline, H2, H3, Lists, Link, Image, Color, Align)
 *  - Toggle between WYSIWYG mode and raw HTML source
 *  - Live preview pane (optional)
 *  - File/image upload from device (optional, requires token)
 *  - Dark theme matching the admin panel
 */
import { useRef, useState, useEffect, useCallback } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev';

interface RichEditorProps {
  value: string;                   // HTML string
  onChange: (html: string) => void;
  token?: string;                  // If provided, enables media upload
  placeholder?: string;
  minHeight?: number;
  showPreview?: boolean;
}

// ─── Toolbar button helper ────────────────────────────────────────────────────
const TB: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#d1d5db',
  borderRadius: '0.3rem',
  padding: '0.25rem 0.55rem',
  cursor: 'pointer',
  fontSize: '0.82rem',
  fontWeight: 600,
  lineHeight: 1.2,
  minWidth: 28,
  textAlign: 'center' as const,
};
const TB_ACTIVE: React.CSSProperties = { ...TB, background: 'rgba(108,99,255,0.3)', color: '#a5b4fc', borderColor: 'rgba(108,99,255,0.5)' };

// ─── CSS injected once ────────────────────────────────────────────────────────
const EDITOR_CSS = `
.re-editor[contenteditable] { outline: none; }
.re-editor[contenteditable]:empty::before { content: attr(data-placeholder); color: #475569; pointer-events: none; }
.re-editor h2 { font-size:1.4rem;font-weight:700;color:#fff;border-bottom:1px solid rgba(108,99,255,0.25);padding-bottom:.3rem;margin:.75rem 0 .4rem }
.re-editor h3 { font-size:1.1rem;font-weight:700;color:#a5b4fc;margin:.6rem 0 .3rem }
.re-editor p  { color:#d1d5db;line-height:1.9;margin:.3rem 0 .6rem }
.re-editor ul,.re-editor ol { color:#d1d5db;padding-right:1.5rem;margin:.3rem 0 .75rem }
.re-editor li { margin-bottom:.25rem;line-height:1.7 }
.re-editor strong { color:#fff }
.re-editor em { color:#c4b5fd }
.re-editor u  { text-decoration-color:#6C63FF }
.re-editor a  { color:#6C63FF;text-decoration:underline }
.re-editor blockquote { border-right:4px solid #6C63FF;padding:.75rem 1rem;margin:.75rem 0;background:rgba(108,99,255,0.08);border-radius:0 8px 8px 0;color:#d1d5db }
.re-editor img { max-width:100%;border-radius:8px;margin:.5rem 0 }
.re-editor hr  { border:none;border-top:1px solid rgba(108,99,255,0.3);margin:1rem 0 }
.re-editor code { background:rgba(255,255,255,0.1);padding:.1rem .35rem;border-radius:4px;font-family:monospace;font-size:.88em }
.re-editor table { border-collapse:collapse;width:100%;margin:.75rem 0 }
.re-editor td,.re-editor th { border:1px solid rgba(108,99,255,0.25);padding:.5rem .75rem;color:#d1d5db;text-align:right }
.re-editor th { background:rgba(108,99,255,0.1);font-weight:700;color:#a5b4fc }
`;

function exec(cmd: string, value?: string) {
  document.execCommand(cmd, false, value);
}

function insertHtmlAtCaret(html: string) {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const el = document.createElement('div');
  el.innerHTML = html;
  const frag = document.createDocumentFragment();
  let last: Node | undefined;
  let node: ChildNode | null;
  while ((node = el.firstChild)) { last = frag.appendChild(node); }
  range.insertNode(frag);
  if (last) {
    const r = range.cloneRange();
    r.setStartAfter(last);
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);
  }
}

export default function RichEditor({ value, onChange, token, placeholder = 'ابدأ الكتابة هنا...', minHeight = 260, showPreview = false }: RichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'visual' | 'html'>('visual');
  const [htmlSrc, setHtmlSrc] = useState(value || '');
  const [preview, setPreview] = useState(showPreview);
  const [uploading, setUploading] = useState(false);
  const [linkPrompt, setLinkPrompt] = useState(false);
  const [linkUrl, setLinkUrl] = useState('https://');
  const [linkText, setLinkText] = useState('');
  const [tablePrompt, setTablePrompt] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const savedRange = useRef<Range | null>(null);

  // Inject CSS once
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!document.getElementById('re-css')) {
      const style = document.createElement('style');
      style.id = 're-css';
      style.textContent = EDITOR_CSS;
      document.head.appendChild(style);
    }
  }, []);

  // Sync initial value → editor
  useEffect(() => {
    if (editorRef.current && mode === 'visual') {
      const cur = editorRef.current.innerHTML;
      if (cur !== (value || '')) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value, mode]);

  const onInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      setHtmlSrc(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const saveRange = () => {
    const sel = window.getSelection();
    if (sel?.rangeCount) savedRange.current = sel.getRangeAt(0).cloneRange();
  };

  const restoreRange = () => {
    if (!savedRange.current) return;
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(savedRange.current);
  };

  const applyHtmlSrc = () => {
    if (editorRef.current) {
      editorRef.current.innerHTML = htmlSrc;
      onChange(htmlSrc);
    }
    setMode('visual');
  };

  // ── Upload helpers ────────────────────────────────────────────────────────
  const uploadImage = async (file: File) => {
    if (!token) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const r = await fetch(`${API_BASE}/api/uploads/image`, {
        method: 'POST', body: fd, headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (d.url) {
        editorRef.current?.focus();
        restoreRange();
        exec('insertImage', d.url);
        onInput();
      }
    } catch { /* ignore */ }
    setUploading(false);
  };

  const uploadFile = async (file: File) => {
    if (!token) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const r = await fetch(`${API_BASE}/api/uploads/file`, {
        method: 'POST', body: fd, headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (d.url) {
        editorRef.current?.focus();
        restoreRange();
        insertHtmlAtCaret(`<a href="${d.url}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:rgba(108,99,255,0.15);border:1px solid rgba(108,99,255,0.4);border-radius:8px;color:#a5b4fc;text-decoration:none;font-weight:600">📎 ${d.originalName || file.name}</a>`);
        onInput();
      }
    } catch { /* ignore */ }
    setUploading(false);
  };

  // ── Insert table ──────────────────────────────────────────────────────────
  const insertTable = () => {
    const headers = Array.from({ length: tableCols }, (_, i) => `<th>عمود ${i + 1}</th>`).join('');
    const cells = Array.from({ length: tableCols }, () => `<td>&nbsp;</td>`).join('');
    const rows = Array.from({ length: tableRows }, () => `<tr>${cells}</tr>`).join('');
    editorRef.current?.focus();
    restoreRange();
    insertHtmlAtCaret(`<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`);
    onInput();
    setTablePrompt(false);
  };

  // ── Insert link ───────────────────────────────────────────────────────────
  const insertLink = () => {
    editorRef.current?.focus();
    restoreRange();
    if (linkText) {
      insertHtmlAtCaret(`<a href="${linkUrl}">${linkText}</a>`);
    } else {
      exec('createLink', linkUrl);
    }
    onInput();
    setLinkPrompt(false);
    setLinkUrl('https://'); setLinkText('');
  };

  const btnStyle = (active = false) => active ? TB_ACTIVE : TB;

  const TOOLBAR_GROUPS = [
    {
      label: 'تنسيق',
      items: [
        { label: 'B', title: 'عريض', action: () => exec('bold') },
        { label: 'I', title: 'مائل', action: () => exec('italic'), style: { fontStyle: 'italic' } },
        { label: 'U', title: 'خط تحت', action: () => exec('underline'), style: { textDecoration: 'underline' } },
        { label: 'S', title: 'خط في المنتصف', action: () => exec('strikeThrough'), style: { textDecoration: 'line-through' } },
      ],
    },
    {
      label: 'عناوين',
      items: [
        { label: 'H2', title: 'عنوان ثانوي', action: () => exec('formatBlock', 'h2') },
        { label: 'H3', title: 'عنوان فرعي', action: () => exec('formatBlock', 'h3') },
        { label: '¶', title: 'فقرة', action: () => exec('formatBlock', 'p') },
        { label: '"', title: 'اقتباس', action: () => exec('formatBlock', 'blockquote') },
        { label: '<>', title: 'كود', action: () => exec('formatBlock', 'pre') },
      ],
    },
    {
      label: 'قوائم',
      items: [
        { label: '≡', title: 'قائمة نقطية', action: () => exec('insertUnorderedList') },
        { label: '№', title: 'قائمة مرقمة', action: () => exec('insertOrderedList') },
        { label: '→', title: 'زيادة مسافة', action: () => exec('indent') },
        { label: '←', title: 'إزالة مسافة', action: () => exec('outdent') },
      ],
    },
    {
      label: 'محاذاة',
      items: [
        { label: '≡R', title: 'يمين', action: () => exec('justifyRight') },
        { label: '≡C', title: 'وسط', action: () => exec('justifyCenter') },
        { label: '≡L', title: 'يسار', action: () => exec('justifyLeft') },
      ],
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid rgba(108,99,255,0.25)', borderRadius: '0.6rem', overflow: 'hidden', direction: 'rtl' }}>
      {/* ── Mode bar ── */}
      <div style={{ display: 'flex', gap: '0.3rem', padding: '0.4rem 0.6rem', background: '#0f0d24', borderBottom: '1px solid rgba(108,99,255,0.15)', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => setMode('visual')} style={btnStyle(mode === 'visual')}>✏️ مرئي</button>
        <button onClick={() => { setHtmlSrc(editorRef.current?.innerHTML || value || ''); setMode('html'); }} style={btnStyle(mode === 'html')}>{'</>'} HTML</button>
        <button onClick={() => setPreview(!preview)} style={btnStyle(preview)}>👁 معاينة</button>
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 0.2rem' }} />
        {token && (
          <>
            <label title="رفع صورة" style={{ ...TB, cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.5 : 1 }}>
              {uploading ? '⏳' : '🖼'}
              <input type="file" accept="image/*" hidden disabled={uploading}
                onChange={e => { const f = e.target.files?.[0]; if (f) { saveRange(); uploadImage(f); } e.target.value = ''; }} />
            </label>
            <label title="رفع ملف PDF/Doc" style={{ ...TB, cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.5 : 1 }}>
              {uploading ? '⏳' : '📎'}
              <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt" hidden disabled={uploading}
                onChange={e => { const f = e.target.files?.[0]; if (f) { saveRange(); uploadFile(f); } e.target.value = ''; }} />
            </label>
            <label title="رفع فيديو" style={{ ...TB, cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.5 : 1 }}>
              {uploading ? '⏳' : '🎬'}
              <input type="file" accept="video/*" hidden disabled={uploading}
                onChange={async e => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setUploading(true);
                  try {
                    const fd = new FormData(); fd.append('file', f);
                    const r = await fetch(`${API_BASE}/api/uploads/file`, { method: 'POST', body: fd, headers: { Authorization: `Bearer ${token}` } });
                    const d = await r.json();
                    if (d.url) {
                      editorRef.current?.focus(); restoreRange();
                      insertHtmlAtCaret(`<video src="${d.url}" controls style="width:100%;border-radius:8px;margin:.5rem 0"></video>`);
                      onInput();
                    }
                  } catch { /* ignore */ }
                  setUploading(false); e.target.value = '';
                }} />
            </label>
            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 0.2rem' }} />
          </>
        )}
        <button title="رابط" style={TB} onClick={() => { saveRange(); setLinkText(window.getSelection()?.toString() || ''); setLinkPrompt(true); }}>🔗</button>
        <button title="جدول" style={TB} onClick={() => { saveRange(); setTablePrompt(true); }}>⊞</button>
        <button title="خط أفقي" style={TB} onClick={() => { exec('insertHorizontalRule'); onInput(); }}>—</button>
        <div style={{ flex: 1 }} />
        <button title="تراجع" style={TB} onClick={() => { exec('undo'); onInput(); }}>↩</button>
        <button title="إعادة" style={TB} onClick={() => { exec('redo'); onInput(); }}>↪</button>
      </div>

      {/* ── Formatting toolbar ── */}
      {mode === 'visual' && (
        <div style={{ display: 'flex', gap: '0.15rem', padding: '0.35rem 0.6rem', background: '#13102a', borderBottom: '1px solid rgba(108,99,255,0.1)', flexWrap: 'wrap', alignItems: 'center' }}>
          {TOOLBAR_GROUPS.map((g, gi) => (
            <span key={gi} style={{ display: 'flex', gap: '0.15rem', alignItems: 'center' }}>
              {gi > 0 && <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)', margin: '0 0.15rem', display: 'inline-block' }} />}
              {g.items.map(item => (
                <button key={item.label} title={item.title} style={{ ...TB, ...(item.style || {}) }}
                  onMouseDown={e => { e.preventDefault(); item.action(); if (editorRef.current) { onInput(); editorRef.current.focus(); } }}>
                  {item.label}
                </button>
              ))}
            </span>
          ))}
          {/* Text color */}
          <span style={{ display: 'flex', gap: '0.15rem', alignItems: 'center' }}>
            <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)', margin: '0 0.15rem', display: 'inline-block' }} />
            <span title="لون النص" style={{ ...TB, display: 'inline-flex', alignItems: 'center', gap: 2, padding: '0.15rem 0.35rem' }}>
              A
              <input type="color" defaultValue="#ffffff"
                onChange={e => { exec('foreColor', e.target.value); onInput(); }}
                style={{ width: 18, height: 18, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }} />
            </span>
            <span title="لون الخلفية" style={{ ...TB, display: 'inline-flex', alignItems: 'center', gap: 2, padding: '0.15rem 0.35rem' }}>
              🎨
              <input type="color" defaultValue="#6C63FF"
                onChange={e => { exec('hiliteColor', e.target.value); onInput(); }}
                style={{ width: 18, height: 18, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }} />
            </span>
          </span>
          <span style={{ display: 'flex', gap: '0.15rem', alignItems: 'center' }}>
            <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)', margin: '0 0.15rem', display: 'inline-block' }} />
            <button title="مسح التنسيق" style={TB} onMouseDown={e => { e.preventDefault(); exec('removeFormat'); onInput(); }}>✕</button>
          </span>
        </div>
      )}

      {/* ── Link prompt ── */}
      {linkPrompt && (
        <div style={{ background: '#1a1830', padding: '0.75rem', borderBottom: '1px solid rgba(108,99,255,0.2)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://example.com"
            style={{ ...TB, padding: '0.3rem 0.6rem', background: 'rgba(255,255,255,0.07)', flex: 2, minWidth: 200, textAlign: 'left', fontFamily: 'monospace' }} dir="ltr" />
          <input value={linkText} onChange={e => setLinkText(e.target.value)} placeholder="نص الرابط (اختياري)"
            style={{ ...TB, padding: '0.3rem 0.6rem', background: 'rgba(255,255,255,0.07)', flex: 1, minWidth: 120 }} />
          <button onClick={insertLink} style={{ ...TB_ACTIVE, padding: '0.3rem 0.8rem' }}>إدراج 🔗</button>
          <button onClick={() => setLinkPrompt(false)} style={{ ...TB, padding: '0.3rem 0.6rem', color: '#fca5a5' }}>✕</button>
        </div>
      )}

      {/* ── Table prompt ── */}
      {tablePrompt && (
        <div style={{ background: '#1a1830', padding: '0.75rem', borderBottom: '1px solid rgba(108,99,255,0.2)', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>⊞ جدول:</span>
          <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            صفوف
            <input type="number" value={tableRows} onChange={e => setTableRows(Number(e.target.value))} min={1} max={20}
              style={{ ...TB, width: 50, padding: '0.25rem 0.4rem', textAlign: 'center', background: 'rgba(255,255,255,0.07)' }} />
          </label>
          <label style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            أعمدة
            <input type="number" value={tableCols} onChange={e => setTableCols(Number(e.target.value))} min={1} max={10}
              style={{ ...TB, width: 50, padding: '0.25rem 0.4rem', textAlign: 'center', background: 'rgba(255,255,255,0.07)' }} />
          </label>
          <button onClick={insertTable} style={{ ...TB_ACTIVE, padding: '0.3rem 0.8rem' }}>إدراج ⊞</button>
          <button onClick={() => setTablePrompt(false)} style={{ ...TB, padding: '0.3rem 0.6rem', color: '#fca5a5' }}>✕</button>
        </div>
      )}

      {/* ── Main area (editor | preview | html) ── */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Editor / HTML source */}
        <div style={{ flex: preview ? '0 0 50%' : 1, borderRight: preview ? '1px solid rgba(108,99,255,0.15)' : 'none' }}>
          {mode === 'visual' ? (
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className="re-editor"
              data-placeholder={placeholder}
              onInput={onInput}
              style={{
                padding: '1rem 1.25rem',
                minHeight,
                background: '#13102a',
                color: '#d1d5db',
                outline: 'none',
                lineHeight: 1.8,
                fontSize: '0.95rem',
                direction: 'rtl',
                overflowY: 'auto',
              }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <textarea
                value={htmlSrc}
                onChange={e => setHtmlSrc(e.target.value)}
                style={{
                  flex: 1, padding: '1rem', background: '#0f0d24', color: '#a5b4fc',
                  border: 'none', outline: 'none', fontFamily: 'monospace', fontSize: '0.82rem',
                  lineHeight: 1.6, resize: 'vertical', minHeight, colorScheme: 'dark',
                }}
                spellCheck={false}
                dir="ltr"
              />
              <div style={{ padding: '0.5rem', background: '#0f0d24', borderTop: '1px solid rgba(108,99,255,0.15)', display: 'flex', gap: '0.4rem' }}>
                <button onClick={applyHtmlSrc} style={{ ...TB_ACTIVE, padding: '0.35rem 0.9rem' }}>✓ تطبيق الكود</button>
                <button onClick={() => setMode('visual')} style={{ ...TB, padding: '0.35rem 0.9rem' }}>إلغاء</button>
              </div>
            </div>
          )}
        </div>

        {/* Live Preview */}
        {preview && (
          <div style={{ flex: '0 0 50%', padding: '1rem 1.25rem', background: '#0d0b1a', overflowY: 'auto', minHeight }}>
            <div style={{ fontSize: '0.7rem', color: '#475569', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              معاينة حقيقية
            </div>
            <div
              className="re-editor"
              style={{ color: '#d1d5db', fontSize: '0.95rem', lineHeight: 1.8, direction: 'rtl' }}
              dangerouslySetInnerHTML={{ __html: editorRef.current?.innerHTML || value || '<span style="color:#475569">لا يوجد محتوى بعد</span>' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
