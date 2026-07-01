// lib/types.ts
export interface SiteConfig {
  hero_abbr: string;
  hero_btn_primary: string;
  hero_btn_secondary: string;
  stats: Array<{ label: string; field: string; fallback: number }>;
  about_badge: string;
  about_title: string;
  about_cards: Array<{ emoji: string; title: string; desc: string }>;
  logo_url?: string;
  logo_position?: 'navbar' | 'footer' | 'both';
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
}

export interface Speaker {
  id: number;
  name: string;
  name_ar: string;
  title_ar: string;
  company: string;
  bio_ar: string;
  photo_url: string | null;
  sort_order: number;
  is_featured: number;
  is_surprise: number;
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

export interface TicketType {
  id: number;
  name_ar: string;
  name_en: string;
  description?: string;
  price_per_unit: number;
  duration_type: 'single_day' | 'three_days' | 'full_event' | 'custom_days';
  custom_days?: number;
  day_numbers?: string; // JSON array
  quantity_available: number;
  quantity_sold: number;
  is_active: number;
  sort_order: number;
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
