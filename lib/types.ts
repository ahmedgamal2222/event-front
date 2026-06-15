// lib/types.ts
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
