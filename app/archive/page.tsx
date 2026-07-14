import type { Metadata } from 'next';
import ArchiveClient from './ArchiveClient';

export const metadata: Metadata = {
  title: 'أرشيف الأحداث — جميع النسخ',
  description: 'استعرض جميع نسخ الأحداث السابقة والحالية والقادمة في مكان واحد.',
};

export default function ArchivePage() {
  return <ArchiveClient />;
}
