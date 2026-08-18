'use client';
import { useState, useEffect, useRef } from 'react';
import { uploadMedia } from '../../../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev';

const S = {
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem', colorScheme: 'dark' } as React.CSSProperties,
  btn: (color = '#6C63FF', ghost = false) => ({ background: ghost ? 'transparent' : color, color: ghost ? '#94a3b8' : 'white', border: ghost ? '1px solid rgba(255,255,255,0.15)' : 'none', borderRadius: '0.5rem', padding: '0.5rem 1.2rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap' } as React.CSSProperties),
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '1rem', padding: '1.25rem' } as React.CSSProperties,
  label: { fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block' } as React.CSSProperties,
};

interface ThemeColors {
  primary?: string; primary_dark?: string; accent?: string;
  bg_dark?: string; bg_card?: string; text?: string; text_muted?: string; heading?: string;
  navbar_bg_dark?: string; navbar_bg_light?: string; navbar_blur?: string; navbar_border?: string;
  // ── الوضع النهاري ──
  bg_light?: string; bg_card_light?: string; text_light?: string; text_muted_light?: string;
  heading_light?: string; border_light?: string; panel_light?: string; footer_bg_light?: string;
  event_nav_bg_light?: string; option_bg_light?: string;
  // ── الأحجام (الخطوط) ──
  fs_hero?: number; fs_hero_sub?: number; fs_section?: number; fs_card_title?: number;
  fs_body?: number; fs_small?: number; fs_nav?: number;
  // ── خلفيات الأقسام ──
  section_hero_bg?: string; section_stats_bg?: string; section_about_bg?: string;
  section_agenda_bg?: string; section_speakers_bg?: string; section_video_bg?: string;
  section_venue_bg?: string; section_faq_bg?: string; section_sponsors_bg?: string;
  section_register_bg?: string; section_tickets_bg?: string; section_tickets_bg_light?: string;
  // ── الشعار ──
    logo_navbar_height?: number; logo_hero_height?: number; logo_bg?: string; logo_padding?: number; logo_radius?: number;
  // ─── Hero background (managed in its own editor tab) ──────────────────────────
  hero_bg_type?: 'none' | 'image' | 'video' | 'youtube';
  hero_bg_image?: string; hero_bg_video?: string; hero_bg_youtube?: string;
  hero_bg_overlay?: string; hero_bg_pos?: string; hero_align?: 'center'|'right'|'left'; hero_y?: 'center'|'top'|'bottom';
  // ─── الأزرار والتدرجات ───
  btn_primary_bg?: string; btn_primary_bg2?: string; btn_primary_color?: string;
  btn_outline_color?: string; btn_radius?: number;
  btn_primary_hover?: string; btn_outline_hover?: string; link_hover?: string;
  btn_gradient_angle?: number;
  gradient_text_from?: string; gradient_text_to?: string; gradient_text_enabled?: string;
  // ─── تموضع الأقسام (حشوة padding علوية/سفلية/يمنى/يسرى لكل سكشن) ───
  section_hero_pad_top?: number; section_hero_pad_bottom?: number; section_hero_pad_left?: number; section_hero_pad_right?: number;
  section_stats_pad_top?: number; section_stats_pad_bottom?: number; section_stats_pad_left?: number; section_stats_pad_right?: number;
  section_about_pad_top?: number; section_about_pad_bottom?: number; section_about_pad_left?: number; section_about_pad_right?: number;
  section_agenda_pad_top?: number; section_agenda_pad_bottom?: number; section_agenda_pad_left?: number; section_agenda_pad_right?: number;
  section_speakers_pad_top?: number; section_speakers_pad_bottom?: number; section_speakers_pad_left?: number; section_speakers_pad_right?: number;
  section_video_pad_top?: number; section_video_pad_bottom?: number; section_video_pad_left?: number; section_video_pad_right?: number;
  section_venue_pad_top?: number; section_venue_pad_bottom?: number; section_venue_pad_left?: number; section_venue_pad_right?: number;
  section_faq_pad_top?: number; section_faq_pad_bottom?: number; section_faq_pad_left?: number; section_faq_pad_right?: number;
  section_sponsors_pad_top?: number; section_sponsors_pad_bottom?: number; section_sponsors_pad_left?: number; section_sponsors_pad_right?: number;
  section_register_pad_top?: number; section_register_pad_bottom?: number; section_register_pad_left?: number; section_register_pad_right?: number;
  section_tickets_pad_top?: number; section_tickets_pad_bottom?: number; section_tickets_pad_left?: number; section_tickets_pad_right?: number;
  // ─── لون نهاية التدرج لكل سكشن (اختياري) ───
  section_hero_bg2?: string; section_stats_bg2?: string; section_about_bg2?: string;
  section_agenda_bg2?: string; section_speakers_bg2?: string; section_video_bg2?: string;
  section_venue_bg2?: string; section_faq_bg2?: string; section_sponsors_bg2?: string;
  section_register_bg2?: string; section_tickets_bg2?: string;
}

const BASE_THEME: ThemeColors = {
  primary: '#6C63FF', primary_dark: '#4f46e5', accent: '#f59e0b',
  bg_dark: '#0d0b1a', bg_card: '#13102a', text: '#e2e8f0', text_muted: '#94a3b8', heading: '#ffffff',
  navbar_bg_dark: 'rgba(13,11,26,0.88)', navbar_bg_light: 'rgba(255,255,255,0.98)', navbar_blur: 'on', navbar_border: 'rgba(108,99,255,0.25)',
  bg_light: '#ffffff', bg_card_light: '#ffffff', text_light: '#0f172a', text_muted_light: '#475569',
  heading_light: '#0f172a', border_light: 'rgba(108,99,255,0.16)', panel_light: '#ffffff',
  footer_bg_light: '#f8fafc', event_nav_bg_light: '#ffffff', option_bg_light: '#ffffff',
  section_tickets_bg_light: '#ffffff',
  fs_hero: 72, fs_hero_sub: 30, fs_section: 32, fs_card_title: 17, fs_body: 16, fs_small: 13, fs_nav: 14,
  section_hero_bg: 'transparent', section_stats_bg: 'transparent', section_about_bg: 'transparent',
  section_agenda_bg: 'rgba(108,99,255,0.03)', section_speakers_bg: 'transparent',
  section_video_bg: 'rgba(108,99,255,0.04)', section_venue_bg: 'rgba(0,0,0,0.3)',
  section_faq_bg: 'rgba(108,99,255,0.03)', section_sponsors_bg: 'rgba(108,99,255,0.03)',
  section_register_bg: 'transparent', section_tickets_bg: '#0d0b1a',
  logo_navbar_height: 56, logo_hero_height: 100, logo_bg: 'rgba(255,255,255,0.95)', logo_padding: 8, logo_radius: 12,
  // ── خلفية الـ Hero ──
  hero_bg_type: 'none', hero_bg_overlay: 'rgba(13,11,26,0.55)', hero_bg_pos: 'center',
  hero_align: 'center', hero_y: 'center',
  // ── الأزرار والتدرجات (افتراضات) ──
  btn_primary_bg: '#6C63FF', btn_primary_bg2: '#4f46e5', btn_primary_color: '#ffffff',
  btn_outline_color: '#6C63FF', btn_radius: 8,
  btn_primary_hover: '#5a4bf0', btn_outline_hover: '#6C63FF', link_hover: '#6C63FF',
  btn_gradient_angle: 135,
  gradient_text_from: '#6C63FF', gradient_text_to: '#f59e0b', gradient_text_enabled: '1',
  // ── تموضع الأقسام (حشوات افتراضية) ──
  section_hero_pad_top: 128, section_hero_pad_bottom: 80, section_hero_pad_left: 24, section_hero_pad_right: 24,
  section_stats_pad_top: 80, section_stats_pad_bottom: 80, section_stats_pad_left: 24, section_stats_pad_right: 24,
  section_about_pad_top: 80, section_about_pad_bottom: 80, section_about_pad_left: 24, section_about_pad_right: 24,
  section_agenda_pad_top: 80, section_agenda_pad_bottom: 80, section_agenda_pad_left: 24, section_agenda_pad_right: 24,
  section_speakers_pad_top: 80, section_speakers_pad_bottom: 80, section_speakers_pad_left: 24, section_speakers_pad_right: 24,
  section_video_pad_top: 80, section_video_pad_bottom: 80, section_video_pad_left: 24, section_video_pad_right: 24,
  section_venue_pad_top: 80, section_venue_pad_bottom: 80, section_venue_pad_left: 24, section_venue_pad_right: 24,
  section_faq_pad_top: 80, section_faq_pad_bottom: 80, section_faq_pad_left: 24, section_faq_pad_right: 24,
  section_sponsors_pad_top: 64, section_sponsors_pad_bottom: 64, section_sponsors_pad_left: 24, section_sponsors_pad_right: 24,
  section_register_pad_top: 80, section_register_pad_bottom: 80, section_register_pad_left: 24, section_register_pad_right: 24,
  section_tickets_pad_top: 80, section_tickets_pad_bottom: 80, section_tickets_pad_left: 24, section_tickets_pad_right: 24,
};
const PRESETS: { name: string; emoji: string; colors: ThemeColors }[] = [
  { name: 'البنفسجي', emoji: '🟣', colors: { primary:'#6C63FF', primary_dark:'#4f46e5', accent:'#f59e0b', bg_dark:'#0d0b1a', bg_card:'#13102a', text:'#e2e8f0', text_muted:'#94a3b8', heading:'#ffffff', navbar_bg_dark:'rgba(13,11,26,0.88)', navbar_bg_light:'rgba(255,255,255,0.98)', navbar_blur:'on', navbar_border:'rgba(108,99,255,0.25)', heading_light:'#0f172a', text_light:'#0f172a', text_muted_light:'#475569', bg_light:'#f5f6fc' } },
  { name: 'الأزرق', emoji: '🔵', colors: { primary:'#2563eb', primary_dark:'#1d4ed8', accent:'#f59e0b', bg_dark:'#0a0f1e', bg_card:'#111827', text:'#e2e8f0', text_muted:'#9ca3af', heading:'#ffffff', navbar_bg_dark:'rgba(10,15,30,0.9)', navbar_bg_light:'#ffffff', navbar_blur:'on', navbar_border:'rgba(37,99,235,0.25)', heading_light:'#0f172a', text_light:'#0f172a', text_muted_light:'#475569', bg_light:'#f8fafc' } },
  { name: 'الأخضر', emoji: '🟢', colors: { primary:'#10b981', primary_dark:'#059669', accent:'#f59e0b', bg_dark:'#0a1a14', bg_card:'#0f2119', text:'#d1fae5', text_muted:'#6ee7b7', heading:'#ecfdf5', navbar_bg_dark:'rgba(10,26,20,0.9)', navbar_bg_light:'#f0fdf4', navbar_blur:'on', navbar_border:'rgba(16,185,129,0.25)', heading_light:'#064e3b', text_light:'#111827', text_muted_light:'#4b5563', bg_light:'#f8fdfb' } },
  { name: 'الذهبي', emoji: '🟡', colors: { primary:'#d97706', primary_dark:'#b45309', accent:'#6C63FF', bg_dark:'#0f0c02', bg_card:'#1c1703', text:'#fef3c7', text_muted:'#fcd34d', heading:'#fffbeb', navbar_bg_dark:'rgba(15,12,2,0.9)', navbar_bg_light:'#fffbeb', navbar_blur:'off', navbar_border:'rgba(217,119,6,0.3)', heading_light:'#451a03', text_light:'#1f2937', text_muted_light:'#57534e', bg_light:'#fff9eb' } },
  { name: 'الوردي', emoji: '🩷', colors: { primary:'#ec4899', primary_dark:'#db2777', accent:'#8b5cf6', bg_dark:'#160a12', bg_card:'#1f0e1b', text:'#fce7f3', text_muted:'#f9a8d4', heading:'#fdf2f8', navbar_bg_dark:'rgba(22,10,18,0.9)', navbar_bg_light:'#fdf2f8', navbar_blur:'on', navbar_border:'rgba(236,72,153,0.25)', heading_light:'#831843', text_light:'#1f2937', text_muted_light:'#6b7280', bg_light:'#fdf4fa' } },
  { name: 'الرمادي', emoji: '⚫', colors: { primary:'#6b7280', primary_dark:'#4b5563', accent:'#3b82f6', bg_dark:'#111827', bg_card:'#1f2937', text:'#f9fafb', text_muted:'#9ca3af', heading:'#ffffff', navbar_bg_dark:'rgba(17,24,39,0.95)', navbar_bg_light:'#f9fafb', navbar_blur:'off', navbar_border:'rgba(107,114,128,0.25)', heading_light:'#111827', text_light:'#1f2937', text_muted_light:'#4b5563', bg_light:'#f9fafb' } },
  // ── لوحة الألوان المعتمدة للعلامة التجارية: Deep Teal + Emerald + Accent Gold + White ──
  { name: 'التيل العميق (تركواز)', emoji: '🏷️', colors: {
    primary:'#14b8a6', primary_dark:'#0f766e', accent:'#D4AF37',
    bg_dark:'#052e33', bg_card:'#0b4248', text:'#e6f7f5', text_muted:'#7fb8b1', heading:'#ffffff',
    navbar_bg_dark:'rgba(5,46,51,0.92)', navbar_bg_light:'rgba(255,255,255,0.98)', navbar_blur:'on',
    navbar_border:'rgba(20,184,166,0.35)', heading_light:'#052e33', text_light:'#0f172a',
    text_muted_light:'#475569', bg_light:'#f0fbfa', bg_card_light:'#ffffff', border_light:'rgba(20,184,166,0.25)', panel_light:'#ffffff', footer_bg_light:'#e6f7f5', event_nav_bg_light:'#ffffff', option_bg_light:'#ffffff',
    btn_primary_bg:'#0f766e', btn_primary_bg2:'#0d9488', btn_primary_hover:'#0f766e',
    btn_outline_color:'#0f766e', btn_outline_hover:'#0f766e', link_hover:'#0f766e',
    gradient_text_from:'#2dd4bf', gradient_text_to:'#D4AF37', gradient_text_enabled:'0',
    section_tickets_bg:'#04282d', section_tickets_bg_light:'#ffffff',
    section_agenda_bg:'rgba(20,184,166,0.06)', section_video_bg:'rgba(20,184,166,0.05)',
    section_faq_bg:'rgba(20,184,166,0.05)', section_sponsors_bg:'rgba(212,175,55,0.06)',
  } },
  { name: 'الزمردي الفاخر', emoji: '💎', colors: { primary:'#10b981', primary_dark:'#047857', accent:'#D4AF37', bg_dark:'#04140e', bg_card:'#0a2419', text:'#d1fae5', text_muted:'#6ee7b7', heading:'#ffffff', navbar_bg_dark:'rgba(4,20,14,0.92)', navbar_bg_light:'rgba(255,255,255,0.98)', navbar_blur:'on', navbar_border:'rgba(16,185,129,0.35)', heading_light:'#022c22', text_light:'#0f172a', text_muted_light:'#475569', bg_light:'#f0fdf9', btn_primary_hover:'#047857', btn_outline_hover:'#047857', link_hover:'#047857', gradient_text_enabled:'0' } },
  { name: 'الأسود الذهبي', emoji: '🖤', colors: { primary:'#D4AF37', primary_dark:'#b8962e', accent:'#e5e7eb', bg_dark:'#0b0b0d', bg_card:'#17171b', text:'#f5efe0', text_muted:'#9ca3af', heading:'#ffffff', navbar_bg_dark:'rgba(11,11,13,0.92)', navbar_bg_light:'#ffffff', navbar_blur:'off', navbar_border:'rgba(212,175,55,0.4)', heading_light:'#111111', text_light:'#111827', text_muted_light:'#4b5563', bg_light:'#fbfaf6', gradient_text_enabled:'0' } },
];

const DARK_FIELDS: { key: keyof ThemeColors; label: string }[] = [
  { key: 'primary', label: 'اللون الرئيسي' },
  { key: 'primary_dark', label: 'الرئيسي (hover)' },
  { key: 'accent', label: 'لون التمييز' },
  { key: 'bg_dark', label: 'خلفية الصفحة' },
  { key: 'bg_card', label: 'خلفية البطاقات' },
  { key: 'heading', label: 'لون العناوين' },
  { key: 'text', label: 'لون النص' },
  { key: 'text_muted', label: 'النص الخافت' },
  { key: 'navbar_bg_dark', label: 'خلفية الناف (ليلي)' },
  { key: 'navbar_border', label: 'حدود الناف بار' },
  // ── ألوان التحويم (hover) ──
  { key: 'btn_primary_hover', label: 'الزر الرئيسي عند التحويم' },
  { key: 'btn_outline_hover', label: 'الزر الثانوي عند التحويم' },
  { key: 'link_hover', label: 'الروابط عند التحويم' },
];

const LIGHT_FIELDS: { key: keyof ThemeColors; label: string }[] = [
  { key: 'bg_light', label: 'خلفية الصفحة' },
  { key: 'heading_light', label: 'لون العناوين' },
  { key: 'text_light', label: 'لون النص' },
  { key: 'text_muted_light', label: 'النص الخافت' },
  { key: 'bg_card_light', label: 'خلفية البطاقات' },
  { key: 'border_light', label: 'لون الحدود' },
  { key: 'panel_light', label: 'خلفية الحقول' },
  { key: 'footer_bg_light', label: 'خلفية الفوتر' },
  { key: 'event_nav_bg_light', label: 'شريط التنقل العلوي' },
  { key: 'navbar_bg_light', label: 'خلفية الناف (نهاري)' },
  { key: 'option_bg_light', label: 'خيارات القوائم المنسدلة' },
];

const SECTION_FIELDS: { key: keyof ThemeColors; label: string }[] = [
  { key: 'section_hero_bg', label: 'الـ Hero' },
  { key: 'section_stats_bg', label: 'الإحصائيات' },
  { key: 'section_about_bg', label: 'عن الفعالية' },
  { key: 'section_agenda_bg', label: 'البرنامج' },
  { key: 'section_speakers_bg', label: 'المتحدثون' },
  { key: 'section_video_bg', label: 'الفيديو التعريفي' },
  { key: 'section_venue_bg', label: 'مكان الحدث' },
  { key: 'section_faq_bg', label: 'الأسئلة الشائعة' },
  { key: 'section_sponsors_bg', label: 'الشركاء والرعاة' },
  { key: 'section_register_bg', label: 'التسجيل' },
  { key: 'section_tickets_bg', label: 'قسم التذاكر (ليلي)' },
  { key: 'section_tickets_bg_light', label: 'قسم التذاكر (نهاري)' },
];

const FS_FIELDS: { key: keyof ThemeColors; label: string; min: number; max: number }[] = [
  { key: 'fs_hero', label: 'العنوان الرئيسي الضخم (S3)', min: 24, max: 140 },
  { key: 'fs_hero_sub', label: 'اسم الحدث في الـ Hero', min: 14, max: 60 },
  { key: 'fs_section', label: 'عناوين الأقسام', min: 14, max: 60 },
  { key: 'fs_card_title', label: 'عناوين البطاقات', min: 12, max: 40 },
  { key: 'fs_body', label: 'النص العام', min: 10, max: 30 },
  { key: 'fs_small', label: 'النصوص الصغيرة', min: 8, max: 24 },
  { key: 'fs_nav', label: 'روابط شريط التنقل', min: 8, max: 24 },
];

const LOGO_FIELDS: { key: keyof ThemeColors; label: string; min: number; max: number }[] = [
  { key: 'logo_navbar_height', label: 'ارتفاع الشعار في الناف (px)', min: 24, max: 140 },
  { key: 'logo_hero_height', label: 'ارتفاع الشعار في الـ Hero (px)', min: 40, max: 300 },
  { key: 'logo_padding', label: 'الحشوة حول الشعار (px)', min: 0, max: 40 },
  { key: 'logo_radius', label: 'استدارة زوايا الشعار (px)', min: 0, max: 40 },
];

// ── حقول الأزرار والتدرجات (Gradient) ──
const BUTTON_FIELDS: { key: keyof ThemeColors; label: string }[] = [
  { key: 'btn_primary_bg', label: 'خلفية الزر الرئيسي (بداية التدرج)' },
  { key: 'btn_primary_bg2', label: 'خلفية الزر الرئيسي (نهاية التدرج)' },
  { key: 'btn_primary_color', label: 'لون نص الزر الرئيسي' },
  { key: 'btn_outline_color', label: 'نص/حدود الزر الثانوي' },
  { key: 'btn_primary_hover', label: 'الزر الرئيسي عند التحويم' },
  { key: 'btn_outline_hover', label: 'الزر الثانوي عند التحويم' },
  { key: 'link_hover', label: 'الروابط عند التحويم' },
];

const GRADIENT_FIELDS: { key: keyof ThemeColors; label: string }[] = [
  { key: 'gradient_text_from', label: 'تدرج العناوين (من)' },
  { key: 'gradient_text_to', label: 'تدرج العناوين (إلى)' },
];

// بيانات كل سكشن — تُستخدم في تبويب «تخصيص الأقسام» (خلفية + تدرج + حشوات)
const SECTIONS_META: { key: string; label: string; bgKey: keyof ThemeColors; bg2Key: keyof ThemeColors; defPadTop: number; defPadBottom: number }[] = [
  { key: 'hero', label: 'الـ Hero', bgKey: 'section_hero_bg', bg2Key: 'section_hero_bg2', defPadTop: 128, defPadBottom: 80 },
  { key: 'stats', label: 'الإحصائيات', bgKey: 'section_stats_bg', bg2Key: 'section_stats_bg2', defPadTop: 80, defPadBottom: 80 },
  { key: 'about', label: 'عن الفعالية', bgKey: 'section_about_bg', bg2Key: 'section_about_bg2', defPadTop: 80, defPadBottom: 80 },
  { key: 'agenda', label: 'البرنامج', bgKey: 'section_agenda_bg', bg2Key: 'section_agenda_bg2', defPadTop: 80, defPadBottom: 80 },
  { key: 'speakers', label: 'المتحدثون', bgKey: 'section_speakers_bg', bg2Key: 'section_speakers_bg2', defPadTop: 80, defPadBottom: 80 },
  { key: 'video', label: 'الفيديو التعريفي', bgKey: 'section_video_bg', bg2Key: 'section_video_bg2', defPadTop: 80, defPadBottom: 80 },
  { key: 'venue', label: 'مكان الحدث', bgKey: 'section_venue_bg', bg2Key: 'section_venue_bg2', defPadTop: 80, defPadBottom: 80 },
  { key: 'faq', label: 'الأسئلة الشائعة', bgKey: 'section_faq_bg', bg2Key: 'section_faq_bg2', defPadTop: 80, defPadBottom: 80 },
  { key: 'sponsors', label: 'الشركاء والرعاة', bgKey: 'section_sponsors_bg', bg2Key: 'section_sponsors_bg2', defPadTop: 64, defPadBottom: 64 },
  { key: 'register', label: 'التسجيل', bgKey: 'section_register_bg', bg2Key: 'section_register_bg2', defPadTop: 80, defPadBottom: 80 },
  { key: 'tickets', label: 'التذاكر', bgKey: 'section_tickets_bg', bg2Key: 'section_tickets_bg2', defPadTop: 80, defPadBottom: 80 },
];

function ColorPicker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', borderRadius: '0.6rem', padding: '0.65rem 0.85rem' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{ width: 34, height: 34, borderRadius: '0.4rem', background: value || '#6C63FF', border: '2px solid rgba(255,255,255,0.15)', overflow: 'hidden', cursor: 'pointer' }}>
          <input type="color" value={value || '#6C63FF'} onChange={e => onChange(e.target.value)}
            style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer', border: 'none', padding: 0 }} />
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: 'white', fontWeight: 600, fontSize: '0.8rem' }}>{label}</div>
      </div>
      <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
        style={{ ...S.inp, width: 110, textAlign: 'center', fontSize: '0.72rem', padding: '0.25rem 0.35rem', direction: 'ltr', fontFamily: 'monospace' }} />
    </div>
  );
}

function SizeControl({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '0.6rem', padding: '0.65rem 0.85rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ color: 'white', fontWeight: 600, fontSize: '0.8rem' }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
            style={{ width: 120, accentColor: '#6C63FF' }} />
          <input type="number" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
            style={{ ...S.inp, width: 62, textAlign: 'center', fontSize: '0.78rem', padding: '0.25rem 0.3rem', direction: 'ltr' }} />
          <span style={{ color: '#64748b', fontSize: '0.72rem' }}>px</span>
        </div>
      </div>
    </div>
  );
}

interface Props { eventId: number; eventSlug: string; token: string; currentPrimaryColor?: string; save: (fn: () => Promise<void>) => void; saving: boolean; }
export default function AdminThemeBuilder({ eventId, eventSlug, token, currentPrimaryColor, save, saving }: Props) {
  const [colors, setColors] = useState<ThemeColors>({ ...BASE_THEME, primary: currentPrimaryColor || BASE_THEME.primary || '#6C63FF' });
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<'dark' | 'light' | 'sections' | 'gradient' | 'fonts' | 'logo' | 'hero' | 'preview'>('dark');
  const [secSel, setSecSel] = useState('hero');
  const [previewMode, setPreviewMode] = useState<'dark' | 'light'>('dark');
  const [previewSrc, setPreviewSrc] = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveAllRef = useRef<(() => void) | null>(null);

  // ── المحرر المباشر داخل المعاينة (اضغط على أي عنصر وعدّله) ──
  // التعديلات تصل هنا من iframe المعاينة عبر postMessage وتُدمج عند الحفظ فقط،
  // حتى لا يُعاد تحميل المعاينة أثناء الكتابة داخل صندوق المحرر.
  const [editDirectly, setEditDirectly] = useState(false);
  const [directColors, setDirectColors] = useState<Record<string, string | number>>({});
  const [directText, setDirectText] = useState<Record<string, string>>({});
  const [directDir, setDirectDir] = useState<'rtl' | 'ltr'>('rtl');

  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      const m = ev.data;
      if (!m || typeof m !== 'object' || m.source !== 'event-theme-editor') return;
      if (m.colors && typeof m.colors === 'object') {
        setDirectColors(prev => ({ ...prev, ...m.colors }));
      }
      if (m.text && typeof m.text === 'object') setDirectText(prev => ({ ...prev, ...m.text }));
      if (m.direction === 'rtl' || m.direction === 'ltr') setDirectDir(m.direction);
            if (m.mode === 'light' || m.mode === 'dark') setPreviewMode(m.mode);
      // زر "💾 حفظ التعديلات" داخل المعاينة → استدعاء الخزن الموحد للوحة الأدمن
      if (m.saveDirect === true) { saveAllRef.current?.(); }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load current saved theme from the event
  useEffect(() => {
    if (!token || !eventSlug) return;
    fetch(`${API_BASE}/api/events/${eventSlug}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => {
        if (d.data?.site_config) {
          try {
            const sc = JSON.parse(d.data.site_config);
            if (sc.theme_colors) setColors(prev => ({ ...prev, ...sc.theme_colors }));
            else if (d.data.primary_color) setColors(prev => ({ ...prev, primary: d.data.primary_color }));
          } catch {}
        } else if (d.data?.primary_color) setColors(prev => ({ ...prev, primary: d.data.primary_color }));
        setLoaded(true);
      }).catch(() => setLoaded(true));
  }, [eventSlug, token]);

  const setValue = (k: keyof ThemeColors, v: string | number) => setColors(c => ({ ...c, [k]: v }));

  // Real preview: the actual event page reads ?theme_preview & ?theme_mode
  const buildPreviewUrl = (mode: 'dark' | 'light') => {
    const params = new URLSearchParams();
    // دمج الألوان من لوحة الثيم + التعديلات المباشرة داخل المعاينة
    const merged = { ...colors, ...directColors };
    params.set('theme_preview', JSON.stringify(merged));
    params.set('theme_mode', mode);
    if (directText && Object.keys(directText).length > 0) params.set('theme_text', JSON.stringify(directText));
    if (directDir && directDir !== 'rtl') params.set('theme_dir', directDir);
    if (editDirectly) params.set('edit', '1');
    return `/${eventSlug}?${params.toString()}`;
  };

  // Debounced refresh of the live preview while editing (typing/dragging)
  useEffect(() => {
    if (tab !== 'preview' || !eventSlug) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setPreviewSrc(buildPreviewUrl(previewMode)), 450);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors, tab, previewMode, editDirectly, eventSlug]);

  const saveAll = () => save(async () => {
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    const eventRes = await fetch(`${API_BASE}/api/events/${eventSlug}`, { headers });
    const eventData = await eventRes.json();
    let sc: any = {};
    if (eventData.data?.site_config) { try { sc = JSON.parse(eventData.data.site_config); } catch {} }
    // حفظ ألوان الثيم بما فيها التعديلات المباشرة + النصوص + الاتجاه
    sc.theme_colors = { ...colors, ...directColors };
    if (directText && Object.keys(directText).length > 0) {
      sc.editable_text = { ...(sc.editable_text || {}), ...directText };
    }
    if (directDir && directDir !== 'rtl') sc.page_direction = directDir;
    const res = await fetch(`${API_BASE}/api/events/${eventId}`, {
      method: 'PUT', headers, body: JSON.stringify({ primary_color: colors.primary, site_config: sc }),
    });
        if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || 'فشل الحفظ');
    }
  });

  // احرص on saveAll المحدّث عند كل رندر بحيث المستمع postMessage (مرفق مرة واحدة)
  // يستدعي آخر إصدار — مع الوثائق الألوان/الخطوط/المحاذاة الحية — ولا يتلف بالإغلاق.
  useEffect(() => { saveAllRef.current = saveAll; });

  const applyPreset = (p: ThemeColors) => setColors(prev => ({ ...BASE_THEME, ...prev, ...p }));
  const resetTheme = () => setColors({ ...BASE_THEME });

  if (!loaded) return <p style={{ color: '#94a3b8' }}>جار التحميل...</p>;

  const TABS: { key: typeof tab; label: string }[] = [
    { key: 'dark',    label: '🌙 الوضع الليلي' },
    { key: 'light',   label: '☀️ الوضع النهاري' },
    { key: 'sections',label: '🧱 القسام (سكشن سكشن)' },
    { key: 'gradient', label: '🎨 الأزرار والتدرجات' },
    { key: 'fonts',   label: '✍️ حجم الخطوط' },
    { key: 'logo',    label: '🖼️ الشعار' },
    { key: 'hero',    label: '🎬 خلفية الـ Hero' },
    { key: 'preview', label: '👁️ معاينة حية' },
  ];
const activeFields = tab === 'dark' ? DARK_FIELDS : tab === 'light' ? LIGHT_FIELDS : SECTION_FIELDS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'white', margin: 0 }}>🎨 الثيم والألوان</h1>
          <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: 4 }}>
            تحكم كامل بألوان الصفحة (ليلي/نهاري) · أحجام الخطوط · خلفيات الأقسام · أبعاد الشعار — مع معاينة حية حقيقية
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button style={S.btn('#374151', true)} onClick={resetTheme} disabled={saving}>↺ إعادة الضبط</button>
          <button style={S.btn()} onClick={saveAll} disabled={saving}>
            {saving ? 'جاري الحفظ...' : '💾 حفظ الثيم'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '0.45rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', border: 'none',
            background: tab === t.key ? '#6C63FF' : 'rgba(255,255,255,0.07)', color: tab === t.key ? 'white' : '#94a3b8',
            transition: 'all 0.15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Presets */}
      <div style={S.card}>
        <h3 style={{ color: 'white', fontWeight: 700, marginBottom: 12, fontSize: '0.95rem' }}>🎭 ثيمات جاهزة (كاملة — ليلي ونهاري)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))', gap: 8 }}>
          {PRESETS.map((p, pi) => (
            <button key={p.name} onClick={() => applyPreset(p.colors)} style={{
              background: p.colors.bg_dark, border: `2px solid ${colors.primary === p.colors.primary ? (p.colors.primary || '#6C63FF') : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '0.75rem', padding: '0.75rem', cursor: 'pointer', textAlign: 'right', transition: 'border-color 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = p.colors.primary || '#6C63FF')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = colors.primary === p.colors.primary ? (p.colors.primary || '#6C63FF') : 'rgba(255,255,255,0.08)')}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                {[p.colors.primary, p.colors.accent, p.colors.bg_card_light, p.colors.bg_dark].map((col, i) => (
                  <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: col || '#333', flexShrink: 0 }} />
                ))}
              </div>
              <div style={{ color: p.colors.heading || '#fff', fontSize: '0.78rem', fontWeight: 600 }}>{p.emoji} {p.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Colors tabs (dark / light) ── */}
      {(tab === 'dark' || tab === 'light') && (
        <div style={S.card}>
          <h3 style={{ color: 'white', fontWeight: 700, marginBottom: 12, fontSize: '0.95rem' }}>
            {tab === 'dark' ? '🌙 ألوان الوضع الليلي' : '☀️ ألوان الوضع النهاري'}
          </h3>
          {tab === 'light' && (
            <p style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: 12 }}>
              هذه الألوان تتطبق تلقائياً فقط عندما يبدل الزائر الثيم إلى النهاري — لا تؤثر على الوضع الليلي.
            </p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {activeFields.map(({ key, label }) => (
              <ColorPicker key={key as string} label={label} value={(colors[key] as string) || ''} onChange={v => setValue(key, v)} />
            ))}
          </div>
        </div>
      )}

      {/* ── Sections tab — كل سكشن على حدة (خلفية + تدرج + حشوات precise) ── */}
      {tab === 'sections' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={S.card}>
            <h3 style={{ color: 'white', fontWeight: 700, marginBottom: 4, fontSize: '0.95rem' }}>🧱 تخصيص الأقسام (سكشن سكشن)</h3>
            <p style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: 12 }}>
              اختر القسم ثم عدّل خلفيته (لون أو تدرّج) وحرّكه باتجاهاته الأربعة بدقة بالبكسل (الحشوة padding العلوية / السفلية / اليمنى / اليسرى).
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {SECTIONS_META.map(s => (
                <button key={s.key} onClick={() => setSecSel(s.key)} style={{
                  padding: '0.35rem 0.75rem', borderRadius: '0.45rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, border: 'none',
                  background: secSel === s.key ? '#6C63FF' : 'rgba(255,255,255,0.07)', color: secSel === s.key ? 'white' : '#94a3b8',
                }}>
                  {s.label}
                </button>
              ))}
            </div>
            {(() => {
              const s = SECTIONS_META.find(x => x.key === secSel) || SECTIONS_META[0];
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(255,255,255,0.03)', borderRadius: '0.7rem', padding: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                    <ColorPicker label={`خلفية قسم «${s.label}»`} value={(colors[s.bgKey] as string) || ''} onChange={v => setValue(s.bgKey, v)} />
                    <ColorPicker label={`لون نهاية التدرج (اختياري — يتجاهل لو أُفرغ)`} value={(colors[s.bg2Key] as string) || ''} onChange={v => setValue(s.bg2Key, v)} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                    <SizeControl label="الحشوة العلوية (px)" min={0} max={220} value={(colors[`section_${s.key}_pad_top` as keyof ThemeColors] as number) ?? s.defPadTop} onChange={v => setValue(`section_${s.key}_pad_top` as keyof ThemeColors, v)} />
                    <SizeControl label="الحشوة السفلية (px)" min={0} max={220} value={(colors[`section_${s.key}_pad_bottom` as keyof ThemeColors] as number) ?? s.defPadBottom} onChange={v => setValue(`section_${s.key}_pad_bottom` as keyof ThemeColors, v)} />
                    <SizeControl label="الحشوة اليمنى (px)" min={0} max={160} value={(colors[`section_${s.key}_pad_right` as keyof ThemeColors] as number) ?? 24} onChange={v => setValue(`section_${s.key}_pad_right` as keyof ThemeColors, v)} />
                    <SizeControl label="الحشوة اليسرى (px)" min={0} max={160} value={(colors[`section_${s.key}_pad_left` as keyof ThemeColors] as number) ?? 24} onChange={v => setValue(`section_${s.key}_pad_left` as keyof ThemeColors, v)} />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    💡 يمكنك أيضاً الضغط على أي قسم داخل «👁️ المعاينة الحية» مع تفعيل «✏️ التعديل المباشر» وتعديل الحشوات والألوان والاتجاهات مباشرةً على الصفحة نفسها.
                  </div>
                </div>
              );
            })()}
          </div>
          <div style={S.card}>
            <h3 style={{ color: 'white', fontWeight: 700, marginBottom: 12, fontSize: '0.95rem' }}>جميع خلفيات الأقسام (نظرة عامة)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {SECTION_FIELDS.map(({ key, label }) => (
                <ColorPicker key={key as string} label={label} value={(colors[key] as string) || ''} onChange={v => setValue(key, v)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Buttons & Gradients tab ── */}
      {tab === 'gradient' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={S.card}>
            <h3 style={{ color: 'white', fontWeight: 700, marginBottom: 4, fontSize: '0.95rem' }}>🎨 الأزرار (تدرج + hover + استدارة)</h3>
            <p style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: 12 }}>
              تحكم كامل بتدرج خلفية الأزرار الرئيسية (من ← إلى + الزاوية) ولون كل زر عند التحويم (hover) ولون الروابط عند التحويم.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
              {BUTTON_FIELDS.map(({ key, label }) => (
                <ColorPicker key={key as string} label={label} value={(colors[key] as string) || ''} onChange={v => setValue(key, v)} />
              ))}
            </div>
            <SizeControl label="زاوية التدرج (deg)" min={0} max={360} value={(colors.btn_gradient_angle as number) ?? 135} onChange={v => setValue('btn_gradient_angle', v)} />
            <div style={{ marginTop: 10 }}>
              <SizeControl label="استدارة زوايا الأزرار (px)" min={0} max={40} value={(colors.btn_radius as number) ?? 8} onChange={v => setValue('btn_radius', v)} />
            </div>
          </div>
          <div style={S.card}>
            <h3 style={{ color: 'white', fontWeight: 700, marginBottom: 4, fontSize: '0.95rem' }}>🌈 تدرج العناوين (Gradient Text)</h3>
            <p style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: 12 }}>
              الثيمات الجاهزة للعلامة التجارية «بدون تدرج نصوص». يمكنك تفعيل تدرج عناوين الصفحة أو إيقافه وتخصيص لونيه.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              {(['1', '0'] as const).map(v => (
                <button key={v} onClick={() => setValue('gradient_text_enabled', v)} style={{
                  padding: '0.4rem 1rem', borderRadius: '0.45rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', border: 'none',
                  background: String(colors.gradient_text_enabled ?? '1') === v ? '#6C63FF' : 'rgba(255,255,255,0.07)',
                  color: String(colors.gradient_text_enabled ?? '1') === v ? 'white' : '#94a3b8',
                }}>
                  {v === '1' ? '✅ تدرج مفعّل' : '🚫 بدون تدرج (لون ثابت)'}
                </button>
              ))}
            </div>
            {String(colors.gradient_text_enabled ?? '1') === '1' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                {GRADIENT_FIELDS.map(({ key, label }) => (
                  <ColorPicker key={key as string} label={label} value={(colors[key] as string) || ''} onChange={v => setValue(key, v)} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Fonts tab ── */}
      {tab === 'fonts' && (
        <div style={S.card}>
          <h3 style={{ color: 'white', fontWeight: 700, marginBottom: 4, fontSize: '0.95rem' }}>✍️ أحجام الخطوط</h3>
          <p style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: 12 }}>
            تتحكم هذه الأبعاد بجميع الخطوط الرئيسية في صفحة الحدث (العناوين، النصوص، أزرار التنقل).
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FS_FIELDS.map(f => (
              <SizeControl key={f.key as string} label={f.label} min={f.min} max={f.max}
                value={(colors[f.key] as number) ?? 16} onChange={v => setValue(f.key, v)} />
            ))}
          </div>
        </div>
      )}
{/* ── Logo tab ── */}
      {tab === 'logo' && (
        <div style={S.card}>
          <h3 style={{ color: 'white', fontWeight: 700, marginBottom: 4, fontSize: '0.95rem' }}>🖼️ تحكم الشعار</h3>
          <p style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: 12 }}>
            أبعاد الشعار في الناف بار والـ Hero، مع خلفيته وحشوته في الوضع الليلي. (الشعار نفسه يُرفع من تبويب «محتوى الصفحة»)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            {LOGO_FIELDS.map(f => (
              <SizeControl key={f.key as string} label={f.label} min={f.min} max={f.max}
                value={(colors[f.key] as number) ?? 0} onChange={v => setValue(f.key, v)} />
            ))}
          </div>
          <div style={{ maxWidth: 420 }}>
            <ColorPicker label="خلفية الشعار في الناف (ليلي)" value={(colors.logo_bg || 'rgba(255,255,255,0.95)')} onChange={v => setValue('logo_bg', v)} />
          </div>
        </div>
      )}

      {/* ── Hero Background tab (image / video / youtube / external) ── */}
      {tab === 'hero' && (
        <HeroBgEditor
          colors={colors as any}
          setValue={setValue}
          token={token}
        />
      )}

      {/* ── Live preview tab ── */}
      {tab === 'preview' && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
            <div>
              <h3 style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>👁️ معاينة حية — صفحة الحدث الحقيقية بالثيم الحالي</h3>
              <p style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 4 }}>
                تعرض صفحة الحدث الفعلية ببياناتها الحقيقية مع تطبيق كل التغييرات مباشرة (قبل الحفظ). يتم التحديث تلقائياً أثناء التعديل.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.06)', padding: 4, borderRadius: '0.5rem' }}>
                <button onClick={() => setPreviewMode('dark')} style={{
                  padding: '0.35rem 0.9rem', borderRadius: '0.4rem', cursor: 'pointer', border: 'none', fontWeight: 600, fontSize: '0.82rem',
                  background: previewMode === 'dark' ? '#6C63FF' : 'transparent', color: previewMode === 'dark' ? 'white' : '#94a3b8',
                }}>🌙 ليلي</button>
                <button onClick={() => setPreviewMode('light')} style={{
                  padding: '0.35rem 0.9rem', borderRadius: '0.4rem', cursor: 'pointer', border: 'none', fontWeight: 600, fontSize: '0.82rem',
                  background: previewMode === 'light' ? '#6C63FF' : 'transparent', color: previewMode === 'light' ? 'white' : '#94a3b8',
                }}>☀️ نهاري</button>
              </div>
              <button
                onClick={() => setEditDirectly(v => !v)}
                style={{
                  padding: '0.35rem 0.9rem', borderRadius: '0.4rem', cursor: 'pointer', border: 'none', fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap',
                  background: editDirectly ? '#f59e0b' : 'rgba(255,255,255,0.07)',
                  color: editDirectly ? '#1a1500' : '#94a3b8',
                  boxShadow: editDirectly ? '0 2px 10px rgba(245,158,11,0.4)' : 'none',
                }}
              >
                {editDirectly ? '✏️ التعديل المباشر مفعّل' : '✏️ تفعيل التعديل المباشر'}
              </button>
              <button style={S.btn('#6C63FF', true)} onClick={() => window.open(buildPreviewUrl(previewMode), '_blank')}>
                ↗ فتح المعاينة في تبويب جديد
              </button>
            </div>
          </div>

          {editDirectly && (
            <div style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.45)', borderRadius: '0.6rem', padding: '0.6rem 0.9rem', marginBottom: 10, color: '#fcd34d', fontSize: '0.8rem', lineHeight: 1.6 }}>
              <strong>✏️ وضع التعديل المباشر</strong> — اضغط على أي عنصر داخل المعاينة (نص، زر، شعار، خلفية قسم) لتغيير نصّه أو لونه أو حجمه أو اتجاهه، وسيُنقل التعديل تلقائياً للوحة. اضغط على «💾 حفظ الثيم» لتثبيت كل شيء على الموقع الحقيقي.
            </div>
          )}

          <div style={{ border: '1px solid rgba(108,99,255,0.2)', borderRadius: '0.75rem', overflow: 'hidden', background: '#0a0915' }}>
            {previewSrc ? (
              <iframe
                key={previewSrc}
                src={previewSrc}
                title="Live theme preview"
                style={{ width: '100%', height: 640, border: 'none', background: '#0d0b1a' }}
              />
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                جاري تجهيز المعاينة...
              </div>
            )}
          </div>
          <p style={{ color: '#475569', fontSize: '0.75rem', marginTop: 10, textAlign: 'center' }}>
            💡 إذا لم يظهر الشعار في المعاينة تأكد من رفعه في تبويب «محتوى الصفحة» (شعار الصفحة) وأضغط حفظ الثيم لتثبيت التغييرات على الموقع الحقيقي.
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HeroBgEditor — إعداد خلفية الـ Hero: صورة مرفوعة / صورة خارجية / فيديو مرفوع
// / فيديو يوتيوب / رابط خارجي، مع التغطية الشفافة وتحديد الموضع والاتجاهات.
// ─────────────────────────────────────────────────────────────────────────────
function HeroBgUploadBtn({ accept, label, uploadingLabel, onUploaded, maxMB, token }: {
  accept: string; label: string; uploadingLabel: string; maxMB: number; token: string; onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxMB * 1024 * 1024) {
      alert(`حجم الملف كبير جداً. الحد الأقصى: ${maxMB}MB`);
      e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      const { url } = await uploadMedia(file, token);
      onUploaded(url);
    } catch (err: any) {
      alert('تعذّر رفع الملف: ' + (err?.message || 'خطأ غير معروف'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };
  return (
    <label style={{ ...S.btn('#1a2744'), margin: 0, cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.7 : 1, textAlign: 'center' }}>
      {uploading ? uploadingLabel : label}
      <input type="file" accept={accept} onChange={onChange} disabled={uploading} style={{ display: 'none' }} />
    </label>
  );
}

const HERO_POSITIONS = [
  { value: 'center', label: 'منتصف' },
  { value: 'top', label: 'أعلى' },
  { value: 'bottom', label: 'أسفل' },
  { value: 'left', label: 'يسار' },
  { value: 'right', label: 'يمين' },
];

function HeroBgEditor({ colors, setValue, token }: {
  colors: Record<string, string | number | undefined>;
  setValue: (k: any, v: any) => void;
  token: string;
}) {
  const type = (colors.hero_bg_type as string) || 'none';
  const image = (colors.hero_bg_image as string) || '';
  const video = (colors.hero_bg_video as string) || '';
  const youtube = (colors.hero_bg_youtube as string) || '';
  const overlay = (colors.hero_bg_overlay as string) || 'rgba(13,11,26,0.55)';
  const pos = (colors.hero_bg_pos as string) || 'center';
  const align = (colors.hero_align as string) || 'center';
  const y = (colors.hero_y as string) || 'center';

  const youtubeEmbed = (src: string) => {
    const m = (src || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
    const id = m ? m[1] : (src || '').trim();
    return id ? `https://www.youtube.com/embed/${id}` : '';
  };

  return (
    <div style={S.card}>
      <h3 style={{ color: 'white', fontWeight: 700, marginBottom: 4, fontSize: '0.95rem' }}>🎬 خلفية الـ Hero (أعلى الصفحة)</h3>
      <p style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: 14, lineHeight: 1.7 }}>
        اختر خلفية لقسم الـ Hero: <strong style={{ color: '#a5b4fc' }}>صورة</strong> مرفوعة من جهازك أو <strong style={{ color: '#a5b4fc' }}>خارجية</strong>،
        <strong style={{ color: '#a5b4fc' }}> فيديو</strong> مرفوع أو <strong style={{ color: '#a5b4fc' }}>يوتيوب</strong> أو أي رابط خارجي.
        تظهر النتيجة فوراً في تبويب «معاينة حية».
      </p>

      <div style={{ marginBottom: 14 }}>
        <label style={{ ...S.label, color: '#94a3b8' }}>نوع الخلفية</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
          {([
            ['none', 'بدون خلفية'],
            ['image', '🖼️ صورة'],
            ['video', '🎞️ فيديو'],
            ['youtube', '▶️ يوتيوب'],
          ] as const).map(([val, label]) => (
            <button key={val} onClick={() => setValue('hero_bg_type', val)} style={{
              padding: '0.6rem', borderRadius: '0.55rem', cursor: 'pointer', border: type === val ? '1.5px solid #6C63FF' : '1px solid rgba(255,255,255,0.1)',
              background: type === val ? 'rgba(108,99,255,0.22)' : 'rgba(255,255,255,0.05)', color: type === val ? 'white' : '#94a3b8', fontWeight: 600, fontSize: '0.82rem',
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {(type === 'image' || type === 'video' || type === 'youtube') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {type === 'image' && (
            <>
              <div>
                <label style={{ ...S.label, color: '#94a3b8' }}>رابط الصورة (خارجي أو مرفوع)</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input value={image} onChange={e => setValue('hero_bg_image', e.target.value)} placeholder="https://example.com/bg.jpg أو /uploads/..." style={{ ...S.inp, maxWidth: 460 }} />
                  <HeroBgUploadBtn accept="image/*" label="📤 رفع صورة من الجهاز" uploadingLabel="جار الرفع..." maxMB={15} token={token} onUploaded={url => setValue('hero_bg_image', url)} />
                </div>
              </div>
              {image && (
                <div style={{ borderRadius: '0.6rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', background: '#0d0b1a', maxWidth: 520 }}>
                  <img src={image} alt="معاينة خلفية الـ Hero" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
                </div>
              )}
            </>
          )}

          {type === 'video' && (
            <>
              <div>
                <label style={{ ...S.label, color: '#94a3b8' }}>رابط الفيديو المباشر (mp4 / webm — يُشغَّل تلقائياً وبلا صوت)</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input value={video} onChange={e => setValue('hero_bg_video', e.target.value)} placeholder="https://example.com/hero.mp4 أو /uploads/..." style={{ ...S.inp, maxWidth: 460 }} />
                  <HeroBgUploadBtn accept="video/*" label="📤 رفع فيديو من الجهاز" uploadingLabel="⏳ جار رفع الفيديو..." maxMB={200} token={token} onUploaded={url => setValue('hero_bg_video', url)} />
                </div>
                <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: 4 }}>الفيديو يعمل كخلفية بلا صوت وبتكرار تلقائي حتى تنتقل الشاشة إلى الأقسام التالية.</div>
              </div>
              {video && (
                <video src={video} muted autoPlay loop playsInline style={{ width: '100%', maxWidth: 520, maxHeight: 220, borderRadius: '0.6rem', border: '1px solid rgba(255,255,255,0.12)', background: '#0d0b1a' }} />
              )}
            </>
          )}

          {type === 'youtube' && (
            <>
              <div>
                <label style={{ ...S.label, color: '#94a3b8' }}>رابط يوتيوب أو معرّف الفيديو</label>
                <input value={youtube} onChange={e => setValue('hero_bg_youtube', e.target.value)} placeholder="https://www.youtube.com/watch?v=VIDEO_ID أو VIDEO_ID"
                  dir="ltr" style={{ ...S.inp, maxWidth: 460 }} />
                <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: 4 }}>يمكن لصق رابط `youtube.com/watch` أو `youtu.be` أو أي رابط يدعم التضمين.</div>
              </div>
              {youtubeEmbed(youtube) && (
                <div style={{ borderRadius: '0.6rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', maxWidth: 520, aspectRatio: '16/9', background: '#0d0b1a' }}>
                  <iframe src={youtubeEmbed(youtube) + '?autoplay=0&mute=1&controls=1&rel=0'} title="معاينة يوتيوب" style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen />
                </div>
              )}
            </>
          )}

          {/* التغطية الشفافة + الموضع + الاتجاهات */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, background: 'rgba(0,0,0,0.2)', borderRadius: '0.6rem', padding: 12 }}>
            <div style={{ maxWidth: 460 }}>
              <ColorPicker label="لون التغطية الشفافة فوق الخلفية (وضوح النص)" value={overlay} onChange={v => setValue('hero_bg_overlay', v)} />
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {['rgba(13,11,26,0.55)', 'rgba(13,11,26,0.75)', 'rgba(13,11,26,0.35)', 'transparent'].map(o => (
                  <button key={o} onClick={() => setValue('hero_bg_overlay', o)} style={{
                    padding: '0.25rem 0.6rem', borderRadius: '0.35rem', cursor: 'pointer', border: overlay === o ? '1.5px solid #6C63FF' : '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.05)', color: overlay === o ? 'white' : '#94a3b8', fontSize: '0.7rem',
                  }}>
                    {o === 'transparent' ? 'بدون تغطية' : o}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ ...S.label, color: '#94a3b8' }}>موضع الصورة/الفيديو في الخلفية</label>
              <select value={pos} onChange={e => setValue('hero_bg_pos', e.target.value)} style={S.inp}>
                {HERO_POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ ...S.label, color: '#94a3b8' }}>محاذاة محتوى الـ Hero</label>
              <select value={align} onChange={e => setValue('hero_align', e.target.value)} style={S.inp}>
                <option value="center">وسط</option>
                <option value="right">يمين</option>
                <option value="left">يسار</option>
              </select>
            </div>
            <div>
              <label style={{ ...S.label, color: '#94a3b8' }}>موقع المحتوى عمودياً</label>
              <select value={y} onChange={e => setValue('hero_y', e.target.value)} style={S.inp}>
                <option value="center">وسط</option>
                <option value="top">أعلى</option>
                <option value="bottom">أسفل</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}