import type { Metadata } from 'next';
import EventLandingClient from './Client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev';

// Generate static paths for all published events
export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_BASE}/api/events`, { cache: 'no-store' });
    const data = await res.json();
    if (data.success && data.data?.length > 0) {
      return (data.data as any[]).map((e: any) => ({ slug: e.slug }));
    }
  } catch {}
  // Fallback to known slugs
  return [{ slug: 's3-summit-2026' }, { slug: 's3-summit2027' }];
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const res = await fetch(`${API_BASE}/api/events/${params.slug}`, { cache: 'no-store' });
    const data = await res.json();
    if (data.success && data.data) {
      const event = data.data;
      return {
        title: event.name_ar || event.name || 'الحدث',
        description: event.tagline_ar || event.description_ar || '',
        openGraph: {
          title: event.name_ar || event.name,
          description: event.tagline_ar || '',
          images: event.cover_image ? [event.cover_image] : [],
        },
      };
    }
  } catch {}
  return {
    title: 'S3 Summit 2026 – قمة الشركات الناشئة السورية',
    description: 'ثلاثة أيام من الإلهام، التواصل، والابتكار — لبناء مستقبل ريادة الأعمال في سوريا.',
  };
}

export default function EventPage({ params }: { params: { slug: string } }) {
  return <EventLandingClient slug={params.slug} />;
}

