'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { TicketType, TicketFeature } from '@/lib/types';
import { TicketIcon } from './TicketIcons';
import { fetchTickets, fetchTicketsConfig } from '@/lib/api';

interface TicketsConfigData {
  section_title: string;
  section_subtitle: string;
  section_badge: string;
  feature_1: string;
  feature_2: string;
  feature_3: string;
  info_text: string;
  api_features_priority?: boolean; // عرض مزايا التذاكر من الـ API وتجاهل نصوص المعاينة المباشرة (افتراضي: مفعّل)
  global_features?: any[]; // supports string[] and TicketFeature[]
}

// Parse features: supports old string[] and new TicketFeature[]
function parseFeatures(raw: any): TicketFeature[] {
  if (!raw) return [];
  let arr: any[] = [];
  try { arr = typeof raw === 'string' ? JSON.parse(raw) : (Array.isArray(raw) ? raw : []); } catch { return []; }
  return arr.map(item => {
    if (typeof item === 'string') return { icon: 'check', title: item, desc: '' };
    return { icon: item.icon || 'check', title: item.title || item, desc: item.desc || '' };
  });
}

// عرض نص قد يحتوي وسوم <span> ملوّنة (تلوين كل كلمة على حدة)
function RichTextInline({ html, fallback }: { html?: string; fallback?: React.ReactNode }) {
  if (!html || !String(html).trim()) return <>{fallback}</>;
  if (/<[a-z][^>]*>/i.test(String(html))) return <span dangerouslySetInnerHTML={{ __html: String(html) }} />;
  return <>{String(html)}</>;
}

export default function TicketsSection({ eventId, editableText }: { eventId: number; editableText?: Record<string, string> }) {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [ticketsVersion, setTicketsVersion] = useState(0);
  const [config, setConfig] = useState<TicketsConfigData>({
    section_title: 'احصل على تذكرتك الآن',
    section_subtitle: 'خيارات متعددة لتناسب احتياجاتك',
    section_badge: '🎫 التذاكر المتاحة',
    feature_1: 'الدخول الكامل للحدث',
    feature_2: 'حقيبة الحدث والمواد',
    feature_3: 'شهادة حضور رسمية',
    info_text: '💡 هل تحتاج مساعدة؟ تواصل معنا عبر نموذج الدعم الفني',
    api_features_priority: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        if (tickets.length === 0) setLoading(true);
        
        // Validate eventId before fetching
        if (!eventId || isNaN(eventId)) {
          throw new Error('Invalid event ID');
        }
        
        const [ticketsRes, configRes] = await Promise.all([
          fetchTickets(eventId, true),
          fetchTicketsConfig(eventId),
        ]);
        
        const ticketsData = Array.isArray(ticketsRes?.data) ? ticketsRes.data : [];
        const configData = configRes?.data || null;
        
        setTickets(ticketsData);
        if (configData) setConfig(configData);
      } catch (err) {
        console.error('Error loading tickets section:', err);
        setError(err instanceof Error ? err.message : 'فشل تحميل البيانات');
        // Don't keep loading state on error
        setLoading(false);
      }
    };
    load();
  }, [eventId, ticketsVersion]);

  // Poll tickets every 3s for live updates from admin panel
  useEffect(() => {
    if (!eventId) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetchTickets(eventId, true);
        if (Array.isArray(res?.data)) {
          setTickets(res.data);
          setTicketsVersion(v => v + 1);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(timer);
  }, [eventId]);

  // Listen for ticket refresh events from parent (e.g., when registration modal opens)
  useEffect(() => {
    if (!eventId) return;
    const handler = (e: any) => {
      if (Array.isArray(e.detail)) {
        setTickets(e.detail);
        setTicketsVersion(v => v + 1);
      }
    };
    window.addEventListener('tickets-refresh', handler);
    return () => window.removeEventListener('tickets-refresh', handler);
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
        <section className="tickets-section" data-pad="tickets" data-edit="section-bg" data-label="خلفية قسم التذاكر" data-bg="section_tickets_bg" data-bgmodeaware="1" data-options="transparent" style={{ background: 'var(--section-tickets-bg, var(--bg-dark))', paddingTop: 'var(--sec-tickets-pad-top, 5rem)', paddingBottom: 'var(--sec-tickets-pad-bottom, 5rem)', paddingLeft: 'var(--sec-tickets-pad-left, 1.5rem)', paddingRight: 'var(--sec-tickets-pad-right, 1.5rem)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
                <div className="text-center mb-16">
          {config.section_badge && (
                        <div className="inline-block mb-3 px-4 py-1.5 rounded-full text-sm font-semibold" style={{ background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.4)', color: 'var(--primary)', fontSize: 'var(--fs-small, 13px)' }}
              data-edit="text" data-label="شارة قسم التذاكر" data-text="tickets_badge" data-color="primary" data-size="fs_small" data-min="10" data-max="24">
              <RichTextInline html={editableText?.tickets_badge} fallback={config.section_badge} />
            </div>
          )}
          <h2 className="text-4xl md:text-5xl font-black mb-4 section-title" style={{ letterSpacing: '-0.02em', color: 'var(--heading)' }}
            data-edit="text" data-label="عنوان قسم التذاكر" data-text="tickets_title" data-color="heading" data-size="fs_section" data-min="14" data-max="60">
            <RichTextInline html={editableText?.tickets_title} fallback={config.section_title} />
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}
            data-edit="text" data-label="وصف قسم التذاكر" data-text="tickets_subtitle" data-color="text" data-size="fs_body" data-min="10" data-max="30">
            <RichTextInline html={editableText?.tickets_subtitle} fallback={config.section_subtitle} />
          </p>
        </div>

        {/* Tickets Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formattedTickets.map((ticket, idx) => (
            <div
              key={ticket.id}
              className="group card relative overflow-hidden transition-all duration-300 hover:border-[var(--primary)]"
              data-edit="card" data-label={`بطاقة تذكرة: ${ticket.name_ar} (خلفية + لون/حجم النصوص)`}
              data-bg="bg_card" data-bgmodeaware="1"
              data-colors="heading:لون العنوان,text:لون الوصف,primary:لون السعر" data-sizes="fs_card_title:حجم العنوان:14:40,fs_body:حجم الوصف:10:26"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
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
                  <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--heading)', fontSize: 'var(--fs-card-title, 17px)' }}
                    data-edit="text" data-label="اسم التذكرة" data-text={`ticket_${ticket.id}_name`} data-color="heading" data-size="fs_card_title" data-min="12" data-max="40">
                    <RichTextInline html={editableText?.[`ticket_${ticket.id}_name`]} fallback={ticket.name_ar} />
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}
                    data-edit="text" data-label="مدة التذكرة" data-text={`ticket_${ticket.id}_duration`} data-color="text" data-size="fs_body" data-min="10" data-max="26">
                    <RichTextInline html={editableText?.[`ticket_${ticket.id}_duration`]} fallback={getDurationText(ticket.duration_type, ticket.custom_days)} />
                  </p>
                </div>

                {/* Description */}
                {ticket.description && (
                  <p className="text-sm text-[var(--text-muted)] mb-6 leading-relaxed" data-edit="text" data-label="وصف التذكرة" data-text={`ticket_${ticket.id}_desc`} data-color="text" data-size="fs_body" data-min="10" data-max="26">
                    <RichTextInline html={editableText?.[`ticket_${ticket.id}_desc`]} fallback={ticket.description} />
                  </p>
                )}

                {/* Features - rich display with icon + title + desc */}
                <div className="space-y-3 mb-8 flex-1">
                  {(() => {
                    const perks = parseFeatures(ticket.features);
                    const globalFeatures: TicketFeature[] = [
                      ...([config.feature_1, config.feature_2, config.feature_3].filter(Boolean).map(f => ({ icon: 'check', title: f as string, desc: '' }))),
                      ...((config.global_features || []).map((f: any) => typeof f === 'string' ? { icon: 'check', title: f, desc: '' } : f as TicketFeature)),
                    ].filter((v, i, arr) => arr.findIndex(x => x.title === v.title) === i);

                    const displayFeatures = perks.length > 0 ? perks : globalFeatures;
                    if (displayFeatures.length === 0) return null;

                    return displayFeatures.map((feat, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '0.6rem',
                        background: 'var(--feature-bg, rgba(16,185,129,0.05))',
                        border: '1px solid var(--feature-border, rgba(16,185,129,0.15))',
                        transition: 'background 0.2s',
                      }}>
                        {/* Icon */}
                        <div style={{
                          width: 32, height: 32, borderRadius: '0.4rem', flexShrink: 0,
                          background: 'var(--feature-icon-bg, rgba(16,185,129,0.15))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginTop: 1,
                        }}>
                          <TicketIcon iconKey={feat.icon} size={16} color="var(--feature-icon-color, #10b981)" />
                        </div>
                                                {/* Text */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div className="font-semibold" style={{ color: 'var(--heading)', fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.3 }} data-edit="text" data-label="ميزة تذكرة" data-text={`feat_${ticket.id}_${i}`} data-color="heading" data-size="fs_body" data-min="10" data-max="24">
                            {/* عند تفعيل «مزايا من الـ API» تُعرض ميزة التذكرة القادمة من الـ API دائماً
                                ويُتجاهَل أي نص قديم محفوظ من «الثيم والألوان ← التعديل المباشر» */}
                            <RichTextInline html={config.api_features_priority === false ? editableText?.[`feat_${ticket.id}_${i}`] : undefined} fallback={feat.title} />
                          </div>
                          {feat.desc && (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem', marginTop: '0.2rem', lineHeight: 1.4 }}>{feat.desc}</div>
                          )}
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                {/* Price Section */}
                <div
                  className="p-4 rounded-lg transition-all"
                  style={{
                    background: 'var(--price-section-bg, rgba(108,99,255,0.1))',
                    border: '1px solid var(--price-section-border, rgba(108,99,255,0.2))',
                  }}
                >
                                    <div className="text-xs text-[var(--text-muted)] mb-1" style={{ fontWeight: 500 }} data-edit="text" data-label="نص السعر" data-text="tickets_price_label" data-color="text" data-size="fs_small" data-min="8" data-max="18">
                    <RichTextInline html={editableText?.tickets_price_label} fallback={'السعر'} />
                  </div>
                  <div className="text-3xl font-black" style={{ color: 'var(--heading)' }}>
                    {ticket.formattedPrice}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-1" style={{ fontWeight: 500 }}>
                     لكل شخص {ticket.duration_type === 'custom_days' ? `/ ${ticket.custom_days} أيام` : ''}
                  </div>
                </div>
              </div>


            </div>
          ))}
        </div>

        {/* Info Footer */}
        <div className="mt-16 p-6 rounded-lg" style={{ background: 'var(--panel)', border: '1px solid var(--panel-border)' }}>
                    <div className="text-center">
            <p className="text-sm text-[var(--text-muted)]" data-edit="text" data-label="نص المساعدة في التذاكر" data-text="tickets_info" data-color="text" data-size="fs_body" data-min="10" data-max="24">
              <RichTextInline html={editableText?.tickets_info} fallback={config.info_text} />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
