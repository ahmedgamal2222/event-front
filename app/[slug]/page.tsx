import type { Metadata } from 'next';
import EventLandingClient from './Client';

export const metadata: Metadata = {
  title: 'S3 Summit 2026 – قمة الشركات الناشئة السورية',
  description: 'ثلاثة أيام من الإلهام، التواصل، والابتكار — لبناء مستقبل ريادة الأعمال في سوريا. ٢٥–٢٧ ديسمبر ٢٠٢٦',
  openGraph: {
    title: 'S3 Summit 2026',
    description: 'قمة الشركات الناشئة السورية · دمشق · ديسمبر ٢٠٢٦',
  },
};

export default function EventPage() {
  return <EventLandingClient />;
}
