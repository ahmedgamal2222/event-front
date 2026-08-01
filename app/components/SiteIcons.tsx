'use client';
// app/components/SiteIcons.tsx
// Comprehensive SVG vector icons for the entire site
import { useState, useEffect } from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

const ic = (path: string, viewBox = '0 0 24 24') =>
  ({ size = 20, color = 'currentColor', className, style }: IconProps) => (
    <svg width={size} height={size} viewBox={viewBox} fill="none" stroke={color}
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      className={className} style={style}>
      <path d={path} />
    </svg>
  );

const icFill = (path: string, viewBox = '0 0 24 24') =>
  ({ size = 20, color = 'currentColor', className, style }: IconProps) => (
    <svg width={size} height={size} viewBox={viewBox} fill={color} className={className} style={style}>
      <path d={path} />
    </svg>
  );

// Navigation
export const IconArchive = ic('M21 8v13H3V8M1 3h22v5H1zM10 12h4');
export const IconArrowRight = ic('M5 12h14m-7-7 7 7-7 7');
export const IconArrowLeft = ic('M19 12H5m7 7-7-7 7-7');
export const IconChevronDown = ic('m6 9 6 6 6-6');
export const IconClose = ic('M18 6 6 18M6 6l12 12');
export const IconMenu = ic('M4 6h16M4 12h16M4 18h16');

// Actions
export const IconCalendar = ic('M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z');
export const IconLocation = ic('M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z');
export const IconUsers = ic('M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75');
export const IconSpeaker = ic('M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zm-9 9h2a7 7 0 0 0 14 0h2m-9 7v4m-4 0h8');
export const IconAward = ic('M12 15l-3.09 1.636.59-3.443L7 10.878l3.455-.502L12 7.5l1.545 2.876L17 10.878l-2.5 2.315.59 3.443L12 15zM4 20h16');
export const IconStar = icFill('M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z');

// Theme
export const IconMoon = icFill('M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z');
export const IconSun = ({ size = 20, color = 'currentColor', style }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" style={style}>
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

// Social Media
export const IconX = icFill('M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z');
export const IconInstagram = icFill('M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z');
export const IconLinkedIn = icFill('M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z');
export const IconTikTok = icFill('M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.28 6.28 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.94a8.19 8.19 0 004.79 1.54V7.03a4.85 4.85 0 01-1.02-.34z');
export const IconYouTube = icFill('M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z');
export const IconFacebook = icFill('M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z');
export const IconWhatsApp = icFill('M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z');
export const IconTelegram = icFill('M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z');

// Content
export const IconMic = ic('M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zm-9 9h2a7 7 0 0 0 14 0h2m-9 7v4m-4 0h8');
export const IconBriefcase = ic('M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zm-8-5H8a2 2 0 0 0-2 2v3h12V4a2 2 0 0 0-2-2h-4z');
export const IconRocket = ic('M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zm5.5 0 7-7-3-3-7 7 3 3z M15 2c2 0 4 2 4 4l-2 2-4-4 2-2z');
export const IconCheck = ic('M20 6 9 17l-5-5');
export const IconCheckCircle = ic('M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3');
export const IconEmail = ic('M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm8 7L3 6m18 0-9 5');
export const IconPhone = ic('M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.69h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 10a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z');
export const IconWorld = ic('M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 0c-1.657 0-3 4.03-3 9s1.343 9 3 9m0-18c1.657 0 3 4.03 3 9s-1.343 9-3 9M2 12h20');
export const IconZap = ic('M13 2 3 14h9l-1 8 10-12h-9l1-8z');
export const IconGift = ic('M20 12v10H4V12m16-6H4a2 2 0 0 0-2 2v2h20V8a2 2 0 0 0-2-2zM12 2a3 3 0 0 0-3 3v1h6V5a3 3 0 0 0-3-3z M12 2v22');
export const IconClock = ic('M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0-6V12l4-4');
export const IconTrophy = ic('M8 21H5a2 2 0 0 1-2-2v-1a4 4 0 0 1 4-4h1m8 0h1a4 4 0 0 1 4 4v1a2 2 0 0 1-2 2h-3M12 3v9m0 0a3 3 0 0 1-3 3m3-3a3 3 0 0 0 3 3m-3 0v6');

// Extra content icons (for about cards & features)
export const IconBook = ic('M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z');
export const IconShield = ic('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z');
export const IconHeart = icFill('M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z');
export const IconBulb = ({ size = 20, color = 'currentColor', style, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M9 18h6M10 22h4" />
    <path d="M12 2a6 6 0 0 0-3.6 10.8c.5.4.8 1 .9 1.6l.2 1.6h5l.2-1.6c.1-.6.4-1.2.9-1.6A6 6 0 0 0 12 2z" />
  </svg>
);
export const IconTarget = ({ size = 20, color = 'currentColor', style, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" className={className} style={style}>
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);
export const IconChart = ({ size = 20, color = 'currentColor', style, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="7" rx="0.5" /><rect x="12" y="7" width="3" height="11" rx="0.5" /><rect x="17" y="4" width="3" height="14" rx="0.5" />
  </svg>
);
export const IconHandshake = ic('M11 17l2 2a1 1 0 1 0 3-3m-3 3l-2-2m5-1 2 2a1 1 0 1 0 3-3l-3.5-3.5a2 2 0 0 0-2.8 0L11 12M6 8l-4 4 4 4m1-8 3.5-3.5a2 2 0 0 1 2.8 0L18 8');

// ─── About-card icon registry ───────────────────────────────────────────────
export const ABOUT_ICONS: Record<string, { Icon: (p: IconProps) => React.ReactElement; label: string }> = {
  rocket:    { Icon: IconRocket,      label: 'انطلاق' },
  bulb:      { Icon: IconBulb,        label: 'فكرة' },
  users:     { Icon: IconUsers,       label: 'تواصل' },
  handshake: { Icon: IconHandshake,   label: 'شراكة' },
  trophy:    { Icon: IconTrophy,      label: 'جائزة' },
  award:     { Icon: IconAward,       label: 'وسام' },
  star:      { Icon: IconStar,        label: 'تميّز' },
  target:    { Icon: IconTarget,      label: 'هدف' },
  chart:     { Icon: IconChart,       label: 'نمو' },
  mic:       { Icon: IconMic,         label: 'متحدث' },
  briefcase: { Icon: IconBriefcase,   label: 'أعمال' },
  book:      { Icon: IconBook,        label: 'تعلّم' },
  heart:     { Icon: IconHeart,       label: 'شغف' },
  shield:    { Icon: IconShield,      label: 'موثوقية' },
  gift:      { Icon: IconGift,        label: 'هدية' },
  world:     { Icon: IconWorld,       label: 'عالمي' },
  zap:       { Icon: IconZap,         label: 'طاقة' },
  check:     { Icon: IconCheckCircle, label: 'جودة' },
  calendar:  { Icon: IconCalendar,    label: 'فعالية' },
  speaker:   { Icon: IconSpeaker,     label: 'إعلان' },
  location:  { Icon: IconLocation,    label: 'مكان' },
};

// Fallback: map legacy emojis to a matching vector icon key
export const EMOJI_TO_ICON: Record<string, string> = {
  '🚀': 'rocket', '💡': 'bulb', '🤝': 'handshake', '👥': 'users',
  '🏆': 'trophy', '🥇': 'award', '🏅': 'award', '⭐': 'star', '🌟': 'star', '✨': 'star',
  '🎯': 'target', '📈': 'chart', '📊': 'chart', '🎤': 'mic', '💼': 'briefcase',
  '📚': 'book', '📖': 'book', '❤️': 'heart', '💗': 'heart', '🛡️': 'shield',
  '🎁': 'gift', '🌍': 'world', '🌐': 'world', '⚡': 'zap', '✅': 'check', '☑️': 'check',
  '📅': 'calendar', '📆': 'calendar', '📢': 'speaker', '📍': 'location',
};

// Renders a vector icon from an icon key, falling back to a mapped emoji, then raw emoji
export function AboutIcon({ name, emoji, size = 34, color = 'currentColor' }: { name?: string; emoji?: string; size?: number; color?: string }) {
  const key = name && ABOUT_ICONS[name]
    ? name
    : emoji && EMOJI_TO_ICON[emoji]
      ? EMOJI_TO_ICON[emoji]
      : null;
  if (key) {
    const C = ABOUT_ICONS[key].Icon;
    return <C size={size} color={color} />;
  }
  if (emoji) return <span style={{ fontSize: size, lineHeight: 1 }}>{emoji}</span>;
  const Fallback = ABOUT_ICONS.star.Icon;
  return <Fallback size={size} color={color} />;
}

// ThemeToggle Component
export function ThemeToggle({ isDark, onToggle, size = 38 }: { isDark: boolean; onToggle: () => void; size?: number }) {
  return (
    <button
      onClick={onToggle}
      title={isDark ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي'}
      style={{
        width: size, height: size * 0.58, borderRadius: size * 0.29,
        background: isDark ? 'rgba(108,99,255,0.3)' : 'rgba(245,158,11,0.25)',
        border: `1.5px solid ${isDark ? 'rgba(108,99,255,0.6)' : 'rgba(245,158,11,0.6)'}`,
        cursor: 'pointer', position: 'relative',
        transition: 'all 0.3s ease', flexShrink: 0,
        display: 'inline-flex', alignItems: 'center',
      }}
    >
      {/* Knob */}
      <span style={{
        position: 'absolute',
        width: size * 0.42, height: size * 0.42, borderRadius: '50%',
        background: isDark ? '#818cf8' : '#f59e0b',
        left: isDark ? '2px' : `${size - size * 0.42 - 2}px`,
        top: '50%', transform: 'translateY(-50%)',
        transition: 'left 0.3s ease, background 0.3s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 1px 4px ${isDark ? 'rgba(129,140,248,0.5)' : 'rgba(245,158,11,0.5)'}`,
      }}>
        {isDark
          ? <IconMoon size={size * 0.25} color="white" />
          : <IconSun size={size * 0.25} color="white" />
        }
      </span>
    </button>
  );
}

// Self-contained theme toggle: manages its own dark/light state + persistence.
// Drop it anywhere (e.g. inside the fixed navbar) with no props required.
export function ThemeToggleAuto({ size = 40 }: { size?: number }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('event_theme') : null;
    const dark = saved !== 'light';
    setIsDark(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, []);

  const toggle = () => {
    setIsDark(prev => {
      const next = !prev;
      document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
      try { localStorage.setItem('event_theme', next ? 'dark' : 'light'); } catch {}
      return next;
    });
  };

  return <ThemeToggle isDark={isDark} onToggle={toggle} size={size} />;
}
