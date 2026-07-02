'use client';

import { useState, useEffect, useMemo } from 'react';
import { TicketType } from '@/lib/types';
import { fetchTickets, fetchTicketsConfig } from '@/lib/api';

interface TicketsConfigData {
  section_title: string;
  section_subtitle: string;
  section_badge: string;
  feature_1: string;
  feature_2: string;
  feature_3: string;
  info_text: string;
}

export default function TicketsSection({ eventId }: { eventId: number }) {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [config, setConfig] = useState<TicketsConfigData>({
    section_title: 'احصل على تذكرتك الآن',
    section_subtitle: 'خيارات متعددة لتناسب احتياجاتك',
    section_badge: '🎫 التذاكر المتاحة',
    feature_1: 'الدخول الكامل للحدث',
    feature_2: 'حقيبة الحدث والمواد',
    feature_3: 'شهادة حضور رسمية',
    info_text: '💡 هل تحتاج مساعدة؟ تواصل معنا عبر نموذج الدعم الفني',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        if (tickets.length === 0) setLoading(true); // only show loading on first load
        const [ticketsRes, configRes] = await Promise.all([
          fetchTickets(eventId),
          fetchTicketsConfig(eventId),
        ]);
        
        const ticketsData = Array.isArray(ticketsRes?.data) ? ticketsRes.data : [];
        const configData = configRes?.data || null;
        
        setTickets(ticketsData);
        if (configData) setConfig(configData); // only update if we got valid data
      } catch (err) {
        console.error('Error loading tickets section:', err);
        setError(err instanceof Error ? err.message : 'فشل تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId]);

  // Memoize formatted tickets
  const formattedTickets = useMemo(() => {
    return tickets.map(t => ({
      ...t,
      formattedPrice: '$' + t.price_per_unit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    }));
  }, [tickets]);

  if (loading) {
    return null;
  }

  if (!formattedTickets.length) {
    return null;
  }

  const getDurationIcon = (type: string) => {
    switch (type) {
      case 'single_day':
        return '📅';
      case 'three_days':
        return '📆';
      case 'full_event':
        return '🎪';
      case 'custom_days':
        return '🎫';
      default:
        return '🎫';
    }
  };

  const getDurationText = (type: string, customDays?: number) => {
    switch (type) {
      case 'single_day':
        return 'يوم واحد';
      case 'three_days':
        return '3 أيام';
      case 'full_event':
        return 'كل أيام الحدث';
      case 'custom_days':
        return `${customDays} أيام`;
      default:
        return '';
    }
  };

  return (
    <section className="py-20 px-6" style={{ background: '#0d0b1a' }}>
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-3 px-4 py-1.5 rounded-full text-sm font-semibold" style={{ background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.4)', color: '#6C63FF' }}>
            {config.section_badge}
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4" style={{ letterSpacing: '-0.02em' }}>
            {config.section_title}
          </h2>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl mx-auto">
            {config.section_subtitle}
          </p>
        </div>

        {/* Tickets Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formattedTickets.map((ticket, idx) => (
            <div
              key={ticket.id}
              className="group card relative overflow-hidden transition-all duration-300 hover:border-[var(--primary)]"
              style={{
                background: 'rgba(19, 16, 42, 0.8)',
                border: '1px solid rgba(108,99,255,0.15)',
                backdropFilter: 'blur(10px)',
              }}
            >
              {/* Glow Effect */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 50% 50%, rgba(108,99,255,0.1), transparent)`,
                }}
              />

              {/* Content */}
              <div className="relative p-6 flex flex-col h-full">
                {/* Top Section - Icon & Title */}
                <div className="mb-6">
                  <div className="text-4xl mb-3">{getDurationIcon(ticket.duration_type)}</div>
                  <h3 className="text-2xl font-bold text-white mb-2">{ticket.name_ar}</h3>
                  <p className="text-sm text-[var(--text-muted)]">{getDurationText(ticket.duration_type, ticket.custom_days)}</p>
                </div>

                {/* Description */}
                {ticket.description && (
                  <p className="text-sm text-[var(--text-muted)] mb-6 leading-relaxed">{ticket.description}</p>
                )}

                {/* Features */}
                <div className="space-y-3 mb-8 flex-1">
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-[var(--primary)] flex-shrink-0 mt-0.5">✓</span>
                    <span className="text-[var(--text-muted)]">{config.feature_1}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-[var(--primary)] flex-shrink-0 mt-0.5">✓</span>
                    <span className="text-[var(--text-muted)]">{config.feature_2}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-[var(--primary)] flex-shrink-0 mt-0.5">✓</span>
                    <span className="text-[var(--text-muted)]">{config.feature_3}</span>
                  </div>
                </div>

                {/* Price Section */}
                <div
                  className="p-4 rounded-lg transition-all"
                  style={{
                    background: 'rgba(108,99,255,0.1)',
                    border: '1px solid rgba(108,99,255,0.2)',
                  }}
                >
                  <div className="text-xs text-[var(--text-muted)] mb-1">السعر</div>
                  <div className="text-3xl font-black text-white">
                    {ticket.formattedPrice}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-1 opacity-70">
                    لكل شخص {ticket.duration_type === 'custom_days' ? `/ ${ticket.custom_days} أيام` : ''}
                  </div>
                </div>
              </div>


            </div>
          ))}
        </div>

        {/* Info Footer */}
        <div className="mt-16 p-6 rounded-lg" style={{ background: 'rgba(108,99,255,0.05)', border: '1px solid rgba(108,99,255,0.15)' }}>
          <div className="text-center">
            <p className="text-sm text-[var(--text-muted)]">
              {config.info_text}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
