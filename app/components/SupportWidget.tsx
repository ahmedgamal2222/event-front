'use client';

import { useState, useRef, useEffect } from 'react';
import { submitSupportMessage } from '@/lib/api';

interface SupportWidgetProps {
  eventId: number;
  primaryColor?: string;
}

export default function SupportWidget({ eventId, primaryColor = '#2563eb' }: SupportWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    category: 'general',
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        if (isOpen && !submitted) {
          // Don't close if form has unsaved data
          if (formData.name || formData.email || formData.message) {
            return;
          }
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, submitted, formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await submitSupportMessage(eventId, formData);
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '', category: 'general' });
      
      // Auto close after 3 seconds
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الإرسال. حاول مجددا');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div ref={widgetRef} className="fixed bottom-6 left-6 z-40 font-arabic md:left-auto md:right-6 md:z-40">
      {/* Support Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (submitted) setSubmitted(false);
        }}
        className="w-16 h-16 rounded-full shadow-lg hover:shadow-2xl transition-all transform hover:scale-110 flex items-center justify-center text-white text-2xl relative group"
        style={{ backgroundColor: primaryColor }}
        title="الدعم الفني"
      >
        <span className="text-3xl">💬</span>
        
        {/* Notification Dot */}
        <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>

        {/* Tooltip */}
        <div className="absolute bottom-20 right-0 bg-gray-900 text-white px-3 py-2 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          اتصل بنا
        </div>
      </button>

      {/* Chat Widget */}
      {isOpen && (
        <div
          className="absolute bottom-24 right-0 w-80 md:w-96 bg-white rounded-2xl shadow-2xl overflow-hidden"
          style={{ borderTop: `4px solid ${primaryColor}` }}
        >
          {/* Header */}
          <div className="p-4 text-white" style={{ backgroundColor: primaryColor }}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">الدعم الفني</h3>
                <p className="text-sm opacity-90">نحن هنا لمساعدتك 🙂</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-2xl hover:opacity-75 transition-opacity"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {submitted ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✓</div>
                <h4 className="font-bold text-green-600 mb-2">شكرا لك!</h4>
                <p className="text-gray-600 text-sm">
                  تم استقبال رسالتك بنجاح سنتواصل معك قريبا
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                    {error}
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    الاسم *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
                    placeholder="اسمك الكامل"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    البريد الإلكتروني *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
                    placeholder="your@email.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    الهاتف (اختياري)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
                    placeholder="+966 5x xxxx xxxx"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    الفئة
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
                  >
                    <option value="general">عام</option>
                    <option value="technical">تقني</option>
                    <option value="registration">التسجيل</option>
                    <option value="ticketing">التذاكر</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    الموضوع *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
                    placeholder="موضوع الرسالة"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    الرسالة *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none text-gray-900"
                    placeholder="اكتب رسالتك هنا..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ backgroundColor: primaryColor }}
                  className="w-full text-white font-bold py-2 rounded transition-all hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                >
                  {isSubmitting ? 'جاري الإرسال...' : 'إرسال الرسالة'}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  سيتم الرد عليك في أقرب وقت
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
