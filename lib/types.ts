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
  logo_position?: 'navbar' | 'footer' | 'both';
  archive_link_enabled?: boolean;
  archive_link_label?:   string;
  archive_link_position?: 'navbar' | 'footer' | 'both' | 'none';
  ticket_instructions?: TicketInstructions;
  show_theme_toggle?: boolean; // إظهار زر تبديل الثيم في الناف بار
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
