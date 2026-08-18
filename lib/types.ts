// lib/types.ts
export interface TicketInstructions {
  startup_step1_title?: string;
  startup_step1_desc?: string;
  startup_step2_title?: string;
  startup_step2_desc?: string;
  startup_step3_title?: string;
  startup_step3_desc?: string;
  startup_step4_title?: string;
  startup_step4_desc?: string;
  startup_note?: string;
  general_confirm_title?: string;
  general_confirm_desc?: string;
  general_ticket_title?: string;
  general_ticket_desc?: string;
  general_note?: string;
  close_btn_text?: string;
  startup_success_title?: string;
  general_success_title?: string;
  custom_messages?: Array<{ id?: string | number; text: string }>;
}

export interface ThemeColors {
  primary?: string;
  primary_dark?: string;
  accent?: string;
  bg_dark?: string;
  bg_card?: string;
  text?: string;
  text_muted?: string;
  heading?: string;
  navbar_bg_dark?: string;  // خلفية الناف بار في الوضع الليلي
  navbar_bg_light?: string; // خلفية الناف بار في الوضع النهاري
  navbar_blur?: string;     // 'on' | 'off'

  // ── ألوان الوضع النهاري (تتطبق فقط عند data-theme="light") ──────────────
  bg_light?: string;              // خلفية صفحة الحدث (نهاري)
  bg_card_light?: string;         // خلفية البطاقات (نهاري)
  text_light?: string;            // لون النص العام (نهاري)
  text_muted_light?: string;      // النص الخافت (نهاري)
  heading_light?: string;         // لون العناوين (نهاري)
  border_light?: string;          // لون الحدود (نهاري)
  panel_light?: string;           // خلفية الحقول/الألواح (نهاري)
  footer_bg_light?: string;       // خلفية الفوتر (نهاري)
  event_nav_bg_light?: string;    // خلفية شريط التنقل العلوي (نهاري)
     option_bg_light?: string;       // خلفية خيارات الـ select (نهاري)

   // ── الخط العام + محاذاة العناوين (تحكم مباشر من داخل المعاينة) ──
   font_family?: string;   // 'cairo' | 'tajawal' | 'inter' | 'amiri' | 'system' | 'mono' (أو سلسلة CSS)
   text_align?: string;     // 'center' | 'left' | 'right' — محاذاة العناوين الرئيسية

  // ─── أحجام الخطوط (بالبكسل) ──────────────────────────────────────────────
  fs_hero?: number;        // العنوان الرئيسي الضخم (Hero)
  fs_hero_sub?: number;    // العنوان الفرعي في الـ Hero
  fs_section?: number;     // عناوين الأقسام
  fs_card_title?: number;  // عناوين البطاقات
  fs_body?: number;        // النص العام للصفحة
  fs_small?: number;       // النصوص الصغيرة
  fs_nav?: number;         // روابط شريط التنقل

  // ─── خلفيات الأقسام ──────────────────────────────────────────────────────
  section_hero_bg?: string;
  section_stats_bg?: string;
  section_about_bg?: string;
  section_agenda_bg?: string;
  section_speakers_bg?: string;
  section_video_bg?: string;
  section_venue_bg?: string;
  section_faq_bg?: string;
  section_sponsors_bg?: string;
  section_register_bg?: string;
  section_tickets_bg?: string;
  section_tickets_bg_light?: string; // خلفية قسم التذاكر في الوضع النهاري

  // ─── الشعار (الأبعاد والمظهر) ────────────────────────────────────────────
  logo_navbar_height?: number; // ارتفاع الشعار في شريط التنقل (px)
  logo_hero_height?: number;    // أقصى ارتفاع الشعار في الـ Hero (px)
  logo_bg?: string;             // خلفية الشعار في الناف (ليلي)
  logo_padding?: number;        // الحشوة حول الشعار (px)
  logo_radius?: number;         // استدارة زوايا الشعار (px)

  // ─── خلفية الـ Hero (صورة / فيديو / يوتيوب / رابط خارجي) ─────────────────
  hero_bg_type?: 'none' | 'image' | 'video' | 'youtube'; // نوع خلفية الـ Hero
  hero_bg_image?: string;    // رابط صورة الخلفية (مرفوعة من الجهاز أو رابط خارجي)
  hero_bg_video?: string;    // رابط فيديو الخلفية (ملف مباشر mp4/webm...)
  hero_bg_youtube?: string;  // رابط يوتيوب كامل أو معرّف الفيديو فقط
  hero_bg_overlay?: string;  // لون التغطية الشفافة فوق الخلفية لضمان وضوح النص
  hero_bg_pos?: string;      // موضع الصورة/الفيديو في الخلفية e.g. 'center' | 'top' | 'bottom'
  hero_align?: 'center' | 'right' | 'left'; // محاذاة محتوى الـ Hero
  hero_y?: 'center' | 'top' | 'bottom';     // تموضع المحتوى عمودياً داخل الـ Hero

  // ─── أزرار الصفحة ──────────────────────────────────────────────────────────
  btn_primary_bg?: string;      // خلفية الزر الرئيسي (بداية التدرج)
  btn_primary_bg2?: string;     // خلفية الزر الرئيسي (نهاية التدرج)
  btn_primary_color?: string;   // لون نص الزر الرئيسي
  btn_outline_color?: string;   // لون نص/حدود الزر الثانوي
  btn_radius?: number;          // استدارة زوايا الأزرار (px)

  // ─── ألوان التحويم (hover) في جميع العناصر ─────────────────────────────────
  btn_primary_hover?: string;   // خلفية الزر الرئيسي عند التحويم
  btn_outline_hover?: string;   // خلفية الزر الثانوي عند التحويم
  link_hover?: string;          // لون الروابط عند التحويم

  // ─── التدرجات (Gradient) ───────────────────────────────────────────────────
  btn_gradient_angle?: number;  // زاوية تدرج خلفية الأزرار (deg)
  gradient_text_from?: string;  // بداية تدرج العناوين المتدرجة
  gradient_text_to?: string;    // نهاية تدرج العناوين المتدرجة
  gradient_text_enabled?: string; // '1' تفعيل تدرج النصوص | '0' إيقافه

  // ─── تموضع الأقسام (حشوة padding لكل سكشن بشكل مستقل) ─────────────────────
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
  // ─── لون نهاية التدرج لكل سكشن (اختياري — لجعل خلفية القسم تدرجية) ─────────
  section_hero_bg2?: string; section_stats_bg2?: string; section_about_bg2?: string;
  section_agenda_bg2?: string; section_speakers_bg2?: string; section_video_bg2?: string;
  section_venue_bg2?: string; section_faq_bg2?: string; section_sponsors_bg2?: string;
  section_register_bg2?: string; section_tickets_bg2?: string;

  // ─── اتجاه الصفحة (RTL / LTR) ──────────────────────────────────────────────
  page_direction?: 'rtl' | 'ltr';
}

export interface SiteConfig {
  hero_abbr: string;
  hero_btn_primary: string;
  hero_btn_secondary: string;
  stats: Array<{ label: string; field: string; fallback: number }>;
  about_badge: string;
  about_title: string;
  about_cards: Array<{ emoji: string; icon?: string; title: string; desc: string }>;
  logo_url?: string;
  theme_colors?: ThemeColors;
  logo_position?: 'navbar' | 'footer' | 'both';
  archive_link_enabled?: boolean;
  archive_link_label?:   string;
  archive_link_position?: 'navbar' | 'footer' | 'both' | 'none';
  ticket_instructions?: TicketInstructions;
  show_theme_toggle?: boolean; // إظهار زر تبديل الثيم في الناف بار
  default_theme?: 'dark' | 'light'; // الوضع الافتراضي للزوار الجدد
  editable_text?: Record<string, string>; // نصوص معدّلة مباشرة من معاينة المُحرر
  page_direction?: 'rtl' | 'ltr';        // اتجاه الصفحة (يُعدَّل من المعاينة المباشرة)
}

export interface ExtraField {
  key: string;           // مفتاح الحقل (يُرسل للـ API)
  label: string;         // التسمية العربية
  type: 'text' | 'textarea' | 'select';
  placeholder?: string;
  required: boolean;
  options?: string[];    // للـ select فقط
  for_types: string[];   // أنواع التسجيل التي يظهر فيها
}

export interface FormConfig {
  enabled_types: string[];
  form_title: string;
  form_subtitle: string;
  show_phone: boolean;
  require_phone: boolean;
  show_city: boolean;
  require_city: boolean;
  show_motivation: boolean;
  motivation_label: string;
  terms_text: string;
  cities: string[];
  sectors: string[];
  stages: string[];
  type_labels: Record<string, string>;
  extra_fields: ExtraField[];
}

export interface Event {
  id: number;
  slug: string;
  name: string;
  name_ar: string;
  tagline: string;
  tagline_ar: string;
  description_ar: string;
  location_ar: string;
  country: string;
  city: string;
  start_date: string;
  end_date: string;
  cover_image: string | null;
  logo: string | null;
  primary_color: string;
  status: 'draft' | 'published' | 'archived';
  registration_open: number;
  max_attendees: number | null;
  email: string;
  twitter: string;
  instagram: string;
  linkedin: string;
  form_config: string | null;
  site_config: string | null;
  intro_video_url: string | null;
  intro_video_thumbnail: string | null;
  show_intro_video: number | null;
}

export interface Speaker {
  id: number;
  name: string;
  name_ar: string;
  title_ar: string;
  company: string;
  bio: string;
  bio_ar: string;
  bio_extended: string | null;
  achievements: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  photo_url: string | null;
  sort_order: number;
  is_featured: number;
  is_surprise: number;
}

export interface VenueMedia {
  id: number;
  media_url: string;
  media_type: 'image' | 'video';
  title: string | null;
  description: string | null;
  sort_order: number;
}

export interface AgendaSession {
  id: number;
  day_id: number;
  time_start: string;
  time_end: string;
  title_ar: string;
  description_ar: string;
  session_type: string;
  speaker_name?: string;
  speaker_title?: string;
  speaker_company?: string;
  speaker_photo?: string;
}

export interface AgendaDay {
  id: number;
  day_number: number;
  date: string;
  label: string;
  sessions: AgendaSession[];
}

export interface Stats {
  total_registrations: number;
  approved_count: number;
  startup_count: number;
  speaker_count: number;
  days_count: number;
}

export interface Sponsor {
  id: number;
  name: string;
  logo_url: string | null;
  website: string | null;
  tier: string;
  sort_order: number;
}

export interface Faq {
  id: number;
  question_ar: string;
  answer_ar: string;
}

export interface Registration {
  id: number;
  event_id: number;
  reg_type: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  company_name: string;
  sector: string;
  stage: string;
  team_size: string;
  website: string;
  description: string;
  status: string;
  ticket_code: string;
  created_at: string;
}

// ── Tickets ────────────────────────────────────────────────────────────────────

export interface TicketFeature {
  icon: string;    // SVG key e.g. 'check', 'ticket', 'certificate', 'bag'...
  title: string;   // العنوان الرئيسي للميزة
  desc?: string;   // شرح/وصف اختياري
}

export interface TicketType {
  id: number;
  name_ar: string;
  name_en: string;
  description?: string;
  price_per_unit: number;
  duration_type: 'single_day' | 'three_days' | 'full_event' | 'custom_days';
  custom_days?: number;
  day_numbers?: string;
  quantity_available: number;
  quantity_sold: number;
  is_active: number;
  sort_order: number;
  features?: TicketFeature[] | string; // supports both new rich format and old string[]
}

export interface Ticket {
  id: number;
  event_id: number;
  ticket_type_id: number;
  registration_id?: number;
  email: string;
  name: string;
  ticket_number: string;
  qr_code?: string;
  valid_from?: string;
  valid_to?: string;
  day_numbers?: string;
  status: 'available' | 'used' | 'expired' | 'cancelled';
  purchased_at: string;
  used_at?: string;
}

// ── Support ────────────────────────────────────────────────────────────────────

export interface SupportMessage {
  id: number;
  event_id: number;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  category: 'general' | 'technical' | 'registration' | 'ticketing' | 'other';
  status: 'new' | 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  admin_response?: string;
  admin_name?: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
}

// ── Pixels ─────────────────────────────────────────────────────────────────────

export interface PixelTracking {
  facebook_pixel_id?: string;
  facebook_pixel_code?: string;
  linkedin_pixel_id?: string;
  linkedin_pixel_code?: string;
  twitter_pixel_id?: string;
  twitter_pixel_code?: string;
  gtag_id?: string;
  gtag_code?: string;
  custom_pixel_code?: string;
}
