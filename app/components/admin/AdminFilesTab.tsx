'use client';
import { useState } from 'react';

// نقطة رفع آمنة من الأدمن — تخزن في R2 تحت files/ وتُخدَم من s3syria.com/files/*
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev';
const SITE = 'https://s3syria.com';

const S = {
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem', colorScheme: 'dark' } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.5rem 1.1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 } as React.CSSProperties),
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '1rem', padding: '1.25rem' } as React.CSSProperties,
  label: { fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block' } as React.CSSProperties,
};

export default function AdminFilesUpload({ token, showToast }: { token?: string; showToast?: (m: string) => void }) {
  const [fileName, setFileName] = useState('program2026.pdf'); // الاسم النهائي للرابط
  const [folder, setFolder] = useState('files');
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState('');
  const [progress, setProgress] = useState(0);

  const toast = (m: string) => { if (showToast) showToast(m); };

  const doUpload = async () => {
    const fileInput = document.getElementById('mxFilePicker') as HTMLInputElement | null;
    const file = fileInput?.files?.[0];
    if (!file) return toast('❌ اختر ملفاً أولاً');

    const cleanName = (fileName || file.name).replace(/[^a-zA-Z0-9._-]+/g, '-');
    const finalName = cleanName.indexOf('.') === -1 ? `${cleanName}.${(file.name.split('.').pop() || 'file')}` : cleanName;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('path', folder || 'files');
    fd.append('filename', finalName);

    setUploading(true); setProgress(10); setUrl('');
    try {
      const res = await fetch(`${API_BASE}/api/uploads/file`, { method: 'POST', body: fd, headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const data = await res.json();
      if (!data.success || !res.ok) throw new Error(data.error || 'فشل الرفع');
      const finalUrl = `${SITE}/${folder}/${finalName}`.replace(/\/+/g, '/').replace(':/', '://');
      setUrl(finalUrl);
      setProgress(100);
      toast('✅ تم رفع الملف، الرابط جاهز');
    } catch (e: any) {
      toast('❌ ' + e.message);
    } finally { setUploading(false); if (fileInput) fileInput.value = ''; }
  };

  const copyLink = () => { if (url) { navigator.clipboard?.writeText(url); toast('📋 تم نسخ الرابط'); } };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', margin: 0 }}>📂 الملفات العامة</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '4px 0 0' }}>
            ارفع ملفاً وسيظهر فوراً برابطك الخاص — لا يرتبط بأي صفحة تلقائياً.
          </p>
        </div>
      </div>

      <div style={{ ...S.card }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={S.label}>اسم الملف النهائي (اختياري)</label>
            <input style={S.inp} value={fileName} onChange={e => setFileName(e.target.value)} placeholder="program2026.pdf" dir="ltr" />
          </div>
          <div>
            <label style={S.label}>المجلد داخل النطاق</label>
            <input style={S.inp} value={folder} onChange={e => setFolder(e.target.value)} placeholder="files" dir="ltr" />
          </div>
        </div>

        <label style={S.label}>الملف</label>
        <input
          id="mxFilePicker"
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.txt,.csv,.png,.jpg,.jpeg,.gif,.webp,.svg,.mp4,.webm,.mov,.mp3,.wav"
          style={{ display: 'none' }}
        />
        <button onClick={() => (document?.getElementById('mxFilePicker') as HTMLInputElement)?.click()} style={{ ...S.btn('transparent'), border: '1px dashed rgba(108,99,255,0.5)', color: '#a5b4fc', padding: '0.8rem', background: 'rgba(108,99,255,0.08)' }}>
          {uploading ? `⏳ جار الرفع... ${progress}%` : '📄 اختر ملفاً من الجهاز'}
        </button>

        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button onClick={doUpload} disabled={uploading} style={{ ...S.btn(), flex: 1, width: '100%' }}>
            {uploading ? 'الرفع...' : '📤 رفع الملف الآن'}
          </button>
        </div>

        {uploading && <div style={{ height: 6, background: 'rgba(108,99,255,0.2)', width: `${progress}%`, borderRadius: 3, marginTop: 10, transition: 'width .2s' }} />}
      </div>

      {url && (
        <div style={{ ...S.card, borderColor: 'rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.07)', marginTop: 16 }}>
          <label style={S.label}>✅ الرابط العام الجاهز للاستخدام:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: '0.5rem', padding: '0.6rem 0.9rem', color: '#a5b4fc', direction: 'ltr', overflowWrap: 'anywhere' }}>
            <code style={{ flex: 1, color: '#86efac', wordBreak: 'break-all' }}>{url}</code>
            <button onClick={copyLink} style={S.btn('#10b981')}>📋 نسخ</button>
          </div>
        </div>
      )}
    </div>
  );
}