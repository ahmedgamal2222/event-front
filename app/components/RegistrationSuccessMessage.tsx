// app/components/RegistrationSuccessMessage.tsx
'use client';

import { useEffect, useState } from 'react';
import SmartTicketCard from './SmartTicketCard';

export interface SuccessMessageProps {
  registrationType: 'startup' | 'member' | 'general';
  fullName: string;
  companyName?: string;
  ticketCode?: string;
  eventId?: number;
  eventName?: string;
  onClose: () => void;
}

export default function RegistrationSuccessMessage({
  registrationType,
  fullName,
  companyName,
  ticketCode = 'TICKET-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
  eventId = 1,
  eventName = 'S3 Summit 2026',
  onClose
}: SuccessMessageProps) {
  const [showTicketCard, setShowTicketCard] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Check if it's a startup registration
  const isStartup = registrationType === 'startup' || companyName;

  const handleShowTicket = () => {
    setShowTicketCard(true);
  };

  if (showTicketCard) {
    return (
      <SmartTicketCard
        data={{
          ticketCode,
          fullName,
          companyName,
          registrationType,
          eventName,
          eventDate: '2026-12-12',
          email: userEmail
        }}
        onDownload={() => {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (context) {
            // Simple ticket download
            canvas.width = 800;
            canvas.height = 400;
            context.fillStyle = '#6C63FF';
            context.fillRect(0, 0, 800, 400);
            context.fillStyle = '#ffffff';
            context.font = 'bold 24px Arial';
            context.fillText(fullName, 50, 100);
            context.font = '16px Arial';
            context.fillText(`Code: ${ticketCode}`, 50, 200);

            const link = document.createElement('a');
            link.href = canvas.toDataURL();
            link.download = `ticket-${ticketCode}.png`;
            link.click();
          }
        }}
      />
    );
  }

  return (
    <div className="text-center py-16 space-y-6">
      {/* Celebration Icon */}
      <div className="text-6xl mb-4 animate-bounce">
        {isStartup ? '🚀' : '🎉'}
      </div>

      {/* Main Title */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">
          {isStartup ? '✅ تم استلام طلب شركتك بنجاح!' : '✅ تم التسجيل بنجاح!'}
        </h3>
        <p className="text-[var(--text-muted)]">
          شكراً لك يا {fullName}
          {companyName ? ` و${companyName}` : ''}
        </p>
      </div>

      {/* Startup-Specific Message */}
      {isStartup && (
        <div 
          className="p-4 rounded-lg border-2"
          style={{
            background: 'rgba(16, 185, 129, 0.1)',
            borderColor: '#10b981'
          }}
        >
          <h4 className="text-[#10b981] font-semibold mb-3">📅 الخطوة التالية</h4>
          <p className="text-white mb-4">
            الرجاء تحديد موعد المقابلة الشخصية الالكترونية مع الادارة
          </p>
          <a
            href="https://calendly.com/s3syria-com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
            style={{
              background: '#10b981',
              color: 'white',
              textDecoration: 'none'
            }}
          >
            ↗ حجز موعد المقابلة
          </a>
        </div>
      )}

      {/* Confirmation Email Notice */}
      <div 
        className="p-4 rounded-lg border-2"
        style={{
          background: 'rgba(108, 99, 255, 0.1)',
          borderColor: '#6C63FF'
        }}
      >
        <p className="text-[var(--text-muted)]">
          📧 سيصلك بريد إلكتروني بتأكيد التسجيل وكود التذكرة على{' '}
          <span className="text-[#6C63FF] font-semibold">البريد المسجل</span>
        </p>
      </div>

      {/* Digital Ticket Preview */}
      <div className="mt-8">
        <button
          onClick={handleShowTicket}
          className="inline-block px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #6C63FF 0%, #4C5FD5 100%)',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          🎫 عرض بطاقة التسجيل الذكية
        </button>
      </div>

      {/* Close Button */}
      <button 
        onClick={onClose} 
        className="btn-primary"
      >
        إغلاق
      </button>
    </div>
  );
}
