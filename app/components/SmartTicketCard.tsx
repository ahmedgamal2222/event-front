// app/components/SmartTicketCard.tsx
'use client';

import { useState, useEffect } from 'react';

export interface SmartTicketData {
  ticketCode: string;
  fullName: string;
  companyName?: string;
  registrationType: 'startup' | 'member' | 'general';
  eventName: string;
  eventDate: string;
  email: string;
}

export default function SmartTicketCard({ data, onDownload }: { data: SmartTicketData; onDownload?: () => void }) {
  const [showQR, setShowQR] = useState(false);

  // Generate a simple QR code placeholder (in production, use qr-code library)
  const generateQRImage = (text: string) => {
    // For now, we'll use a data URL-based approach
    // In production, integrate with 'qrcode' package
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(text)}`;
  };

  const qrUrl = generateQRImage(data.ticketCode);

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        {/* 3D Ticket Card */}
        <div
          className="perspective rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: `linear-gradient(135deg, #6C63FF 0%, #4C5FD5 50%, #2A2E8F 100%)`,
            boxShadow: '0 20px 60px rgba(108, 99, 255, 0.3), inset -2px -2px 5px rgba(0,0,0,0.1)',
            transform: 'perspective(1200px) rotateY(-5deg) rotateX(5deg)',
            transition: 'transform 0.3s ease'
          }}
        >
          <div className="p-8 text-white space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs opacity-75 tracking-wider uppercase">إدخال دخول</p>
                <p className="text-xs opacity-75 mt-1">EVENT PASS</p>
              </div>
              <div className="text-3xl font-black opacity-20">🎫</div>
            </div>

            <div className="border-t border-b border-white border-opacity-20 py-4 space-y-3">
              {/* Name */}
              <div>
                <p className="text-xs opacity-75 mb-1">الاسم</p>
                <p className="text-xl font-bold">{data.fullName}</p>
              </div>

              {/* Company (if startup) */}
              {data.companyName && (
                <div>
                  <p className="text-xs opacity-75 mb-1">الشركة</p>
                  <p className="font-semibold">{data.companyName}</p>
                </div>
              )}

              {/* Event Name */}
              <div>
                <p className="text-xs opacity-75 mb-1">الحدث</p>
                <p className="font-semibold">{data.eventName}</p>
              </div>

              {/* Type Badge */}
              <div className="flex gap-2">
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)'
                  }}
                >
                  {data.registrationType === 'startup' ? '🚀 Startup' : '👤 Attendee'}
                </span>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="text-center">
              {showQR ? (
                <div className="bg-white p-4 rounded-lg">
                  <img
                    src={qrUrl}
                    alt="Ticket QR Code"
                    className="w-full h-auto"
                  />
                  <p className="text-xs text-gray-600 mt-2">رمز الدخول</p>
                </div>
              ) : (
                <div className="bg-white bg-opacity-20 p-4 rounded-lg text-center">
                  <p className="text-xs opacity-75">اضغط لإظهار رمز الدخول</p>
                  <button
                    onClick={() => setShowQR(true)}
                    className="mt-2 px-4 py-2 rounded-lg bg-white text-purple-600 text-xs font-semibold hover:bg-opacity-90 transition-all"
                  >
                    عرض رمز QR
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white border-opacity-20 pt-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs opacity-75">رقم التذكرة</p>
                  <p className="font-mono text-sm font-bold tracking-wider">{data.ticketCode}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-75">التاريخ</p>
                  <p className="text-xs font-semibold">{new Date(data.eventDate).toLocaleDateString('ar-SA')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          <button
            onClick={() => window.print()}
            className="w-full py-3 px-4 rounded-lg bg-[var(--bg-card)] text-white font-semibold border border-[var(--border)] hover:border-[var(--primary)] transition-all"
          >
            🖨️ طباعة التذكرة
          </button>

          {onDownload && (
            <button
              onClick={onDownload}
              className="w-full py-3 px-4 rounded-lg bg-[var(--primary)] text-white font-semibold hover:opacity-90 transition-all"
            >
              ⬇️ تحميل البطاقة
            </button>
          )}

          <div className="p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-center text-sm text-[var(--text-muted)]">
            <p>💡 احفظ هذه البطاقة للدخول إلى الحدث</p>
            <p className="text-xs mt-1">تم إرسال نسخة إلى: {data.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
