'use client';

import { useState, useEffect } from 'react';
import { TicketType } from '@/lib/types';
import { fetchTickets } from '@/lib/api';

export default function TicketsSection({ eventId }: { eventId: number }) {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchTickets(eventId);
        setTickets(res.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tickets');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId]);

  if (loading) {
    return <div className="text-center py-12">جاري التحميل...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-600">خطأ: {error}</div>;
  }

  if (tickets.length === 0) {
    return null;
  }

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

  const getAvailableCount = (ticket: TicketType) => {
    return ticket.quantity_available - ticket.quantity_sold;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">التذاكر</h2>
          <p className="text-gray-600 text-lg">احجز تذكرتك الآن واستمتع بالحدث</p>
        </div>

        {/* Tickets Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map((ticket) => {
            const available = getAvailableCount(ticket);
            const soldPercentage = (ticket.quantity_sold / ticket.quantity_available) * 100;

            return (
              <div
                key={ticket.id}
                className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow overflow-hidden border border-gray-100"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">{ticket.name_ar}</h3>
                  <div className="text-3xl font-bold mb-1">
                    {formatPrice(ticket.price_per_unit)}
                  </div>
                  <p className="text-blue-100 text-sm">
                    {getDurationText(ticket.duration_type, ticket.custom_days)}
                  </p>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Description */}
                  {ticket.description && (
                    <p className="text-gray-600 text-sm mb-4">{ticket.description}</p>
                  )}

                  {/* Availability */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">التوفر</span>
                      <span className={`text-sm font-bold ${available > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {available > 0 ? `${available} متاح` : 'نفذت'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(soldPercentage, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {ticket.quantity_sold} / {ticket.quantity_available} مباعة
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-6 text-sm text-gray-600">
                    <li className="flex items-center">
                      <span className="text-blue-600 ml-2">✓</span>
                      الدخول إلى جميع الجلسات
                    </li>
                    <li className="flex items-center">
                      <span className="text-blue-600 ml-2">✓</span>
                      الحصول على حقيبة الحدث
                    </li>
                    <li className="flex items-center">
                      <span className="text-blue-600 ml-2">✓</span>
                      شهادة حضور رسمية
                    </li>
                  </ul>

                  {/* CTA Button */}
                  <button
                    disabled={available <= 0}
                    className={`w-full py-3 rounded-lg font-bold transition-all ${
                      available > 0
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg active:scale-95'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {available > 0 ? 'احجز الآن' : 'نفذت'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="mt-12 bg-blue-50 border-l-4 border-blue-600 p-6 rounded">
          <h4 className="font-bold text-blue-900 mb-2">معلومات التذاكر</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• يمكنك استخدام تذكرتك عند بوابات الدخول</li>
            <li>• ستتلقى رسالة تأكيد على بريدك الإلكتروني</li>
            <li>• يمكنك تحميل التذكرة من حسابك</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
