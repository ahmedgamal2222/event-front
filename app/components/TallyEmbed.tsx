'use client';
// app/components/TallyEmbed.tsx
// تضمين نموذج Tally داخل الصفحة بخلفية شفافة وارتفاع ديناميكي (بدون نافذة بيضاء)
import { useEffect, useRef } from 'react';

const TALLY_SCRIPT = 'https://tally.so/widgets/embed.js';

/** يحوّل أي رابط Tally (r/ أو embed/) إلى رابط التضمين الرسمي */
export function tallyEmbedUrl(url: string): string | null {
  const m = String(url || '').match(/tally\.so\/(?:r\/|embed\/)?([A-Za-z0-9]+)/i);
  if (!m) return null;
  return `https://tally.so/embed/${m[1]}?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1`;
}

export default function TallyEmbed({ url, title = 'استمارة التسجيل' }: { url: string; title?: string }) {
  const ref = useRef<HTMLIFrameElement | null>(null);
  const embedUrl = tallyEmbedUrl(url);

  useEffect(() => {
    if (!embedUrl || !ref.current) return;
    const iframe = ref.current;
    // اضمن ظهور النموذج حتى لو لم يعمل سكربت Tally (تحميل مباشر كاحتياط)
    if (!iframe.getAttribute('src')) iframe.setAttribute('src', embedUrl);
    iframe.setAttribute('data-tally-src', embedUrl);
    iframe.style.background = 'transparent';
    iframe.setAttribute('allowtransparency', 'true');

    const loadEmbeds = () => {
      try { (window as any).Tally?.loadEmbeds?.(); } catch {}
    };

    if ((window as any).Tally?.loadEmbeds) { loadEmbeds(); return; }

    let script = document.querySelector(`script[src="${TALLY_SCRIPT}"]`) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.src = TALLY_SCRIPT;
      script.async = true;
      document.body.appendChild(script);
    }
    script.addEventListener('load', loadEmbeds);
    return () => { script?.removeEventListener('load', loadEmbeds); };
  }, [embedUrl]);

  if (!embedUrl) {
    return (
      <div style={{ padding: '1.25rem', borderRadius: '0.75rem', border: '1px dashed rgba(239,68,68,0.4)', color: '#fca5a5', background: 'rgba(239,68,68,0.08)', fontSize: '0.9rem' }}>
        ⚠️ رابط Tally غير صالح — مثال صحيح: https://tally.so/r/Qoe958
      </div>
    );
  }

  return (
    <div style={{ background: 'transparent', borderRadius: '0.9rem', overflow: 'hidden' }}>
      <iframe
        ref={ref}
        src={embedUrl}
        data-tally-src={embedUrl}
        loading="lazy"
        width="100%"
        height={620}
        frameBorder={0}
        marginHeight={0}
        marginWidth={0}
        title={title}
        style={{ width: '100%', minHeight: 620, border: 0, background: 'transparent', display: 'block', colorScheme: 'normal' }}
      />
    </div>
  );
}
