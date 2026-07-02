'use client';

import { useState, useEffect } from 'react';
import { SupportMessage } from '@/lib/types';
import { fetchSupportMessages, fetchSupportMessage, respondToSupportMessage } from '@/lib/api';

interface AdminSupportProps {
  eventId: number;
  token: string;
}

const S = {
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem', colorScheme: 'dark' } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 } as React.CSSProperties),
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '0.8rem', padding: '1.25rem' } as React.CSSProperties,
  label: { fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block', fontWeight: 600 } as React.CSSProperties,
};

export default function AdminSupport({ eventId, token }: AdminSupportProps) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadMessages();
  }, [eventId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchSupportMessages(eventId, token);
      setMessages(res.data || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل تحميل الرسائل';
      setError(errorMsg);
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMessage = async (message: SupportMessage) => {
    try {
      const res = await fetchSupportMessage(eventId, message.id, token);
      setSelectedMessage(res.data);
      setResponseText('');
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل تحميل الرسالة';
      setError(errorMsg);
      console.error('Error loading message:', err);
    }
  };

  const handleRespond = async () => {
    if (!selectedMessage || !responseText.trim()) return;
    try {
      setIsResponding(true);
      setError(null);
      await respondToSupportMessage(eventId, selectedMessage.id, { admin_response: responseText, admin_name: 'Admin', status: 'resolved', priority: selectedMessage.priority }, token);
      await loadMessages();
      setSelectedMessage(null);
      setResponseText('');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'فشل إرسال الرد';
      setError(errorMsg);
      console.error('Error responding to message:', err);
    } finally {
      setIsResponding(false);
    }
  };

  const filteredMessages = statusFilter === 'all' ? messages : messages.filter(m => m.status === statusFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return { bg: 'rgba(239,68,68,0.15)', text: '#fca5a5', label: 'جديدة' };
      case 'open': return { bg: 'rgba(234,179,8,0.15)', text: '#fcd34d', label: 'مفتوحة' };
      case 'in_progress': return { bg: 'rgba(59,130,246,0.15)', text: '#93c5fd', label: 'قيد المعالجة' };
      case 'resolved': return { bg: 'rgba(16,185,129,0.15)', text: '#86efac', label: 'تم حلها' };
      default: return { bg: 'rgba(107,114,128,0.15)', text: '#d1d5db', label: 'أخرى' };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return { text: '#fca5a5', label: '⚡ عاجل' };
      case 'high': return { text: '#fdba74', label: '! مهم' };
      case 'medium': return { text: '#fcd34d', label: '- عادي' };
      default: return { text: '#d1d5db', label: '↓ منخفض' };
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
      <div style={{ ...S.card, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(108,99,255,0.15)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.75rem 0', color: 'white' }}>💬 الرسائل</h3>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={S.inp}>
            <option value="all">جميع الرسائل</option>
            <option value="new">جديدة</option>
            <option value="open">مفتوحة</option>
            <option value="in_progress">قيد المعالجة</option>
            <option value="resolved">تم حلها</option>
          </select>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>⏳ جاري التحميل...</div>
          ) : filteredMessages.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>📭 لا توجد رسائل</div>
          ) : (
            filteredMessages.map((msg) => {
              const statusColor = getStatusColor(msg.status);
              return (
                <button key={msg.id} onClick={() => handleSelectMessage(msg)} style={{
                  width: '100%', padding: '0.75rem 1rem', borderBottom: '1px solid rgba(108,99,255,0.1)', background: selectedMessage?.id === msg.id ? 'rgba(108,99,255,0.2)' : 'transparent',
                  borderLeft: selectedMessage?.id === msg.id ? '3px solid #6C63FF' : '3px solid transparent', color: '#e2e8f0', cursor: 'pointer', textAlign: 'right', transition: 'all 0.2s'
                }} onMouseEnter={(e) => { if (selectedMessage?.id !== msg.id) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(108,99,255,0.1)'; }} onMouseLeave={(e) => { if (selectedMessage?.id !== msg.id) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <strong style={{ fontSize: '0.9rem' }}>{msg.name}</strong>
                    <span style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', borderRadius: '0.3rem', background: statusColor.bg, color: statusColor.text }}>{statusColor.label}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.subject}</p>
                  <p style={{ fontSize: '0.75rem', margin: '0.25rem 0 0 0', color: getPriorityColor(msg.priority).text }}>{getPriorityColor(msg.priority).label}</p>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div style={{ ...S.card, display: 'flex', flexDirection: 'column' }}>
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#fca5a5', fontSize: '0.9rem', marginBottom: '1rem' }}>❌ {error}</div>}
        {selectedMessage ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.75rem 0', color: 'white' }}>{selectedMessage.subject}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: '#94a3b8' }}>
                <span>من: <strong style={{ color: '#e2e8f0' }}>{selectedMessage.name}</strong></span>
                <span>البريد: <strong style={{ color: '#e2e8f0' }}>{selectedMessage.email}</strong></span>
                {selectedMessage.phone && <span>الهاتف: <strong style={{ color: '#e2e8f0' }}>{selectedMessage.phone}</strong></span>}
                <span style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(108,99,255,0.15)', color: '#94a3b8', fontSize: '0.8rem' }}>📧 ملاحظة: الرسائل محفوظة في قاعدة البيانات. يمكن إضافة نظام بريء لاحقاً</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
              {(() => { const statusColor = getStatusColor(selectedMessage.status); return <span style={{ padding: '0.4rem 0.75rem', borderRadius: '0.4rem', background: statusColor.bg, color: statusColor.text }}>{statusColor.label}</span>; })()}
              <span style={{ padding: '0.4rem 0.75rem', borderRadius: '0.4rem', background: 'rgba(108,99,255,0.1)', color: getPriorityColor(selectedMessage.priority).text }}>{getPriorityColor(selectedMessage.priority).label}</span>
              <span style={{ padding: '0.4rem 0.75rem', borderRadius: '0.4rem', background: 'rgba(108,99,255,0.1)', color: '#94a3b8', fontSize: '0.75rem' }}>
                {selectedMessage.category === 'general' && '📋 عام'} {selectedMessage.category === 'technical' && '🔧 تقني'} {selectedMessage.category === 'registration' && '📝 التسجيل'} {selectedMessage.category === 'ticketing' && '🎫 التذاكر'} {selectedMessage.category === 'other' && '⚙️ أخرى'}
              </span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(108,99,255,0.1)', color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: 1.6, flex: 1, overflowY: 'auto' }}>{selectedMessage.message}</div>
            {selectedMessage.admin_response && (
              <div style={{ background: 'rgba(16,185,129,0.1)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(16,185,129,0.3)' }}>
                <p style={{ fontSize: '0.85rem', color: '#86efac', margin: '0 0 0.5rem 0' }}>✓ الرد من: <strong>{selectedMessage.admin_name}</strong></p>
                <p style={{ color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>{selectedMessage.admin_response}</p>
              </div>
            )}
            {selectedMessage.status !== 'resolved' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid rgba(108,99,255,0.15)', paddingTop: '1rem' }}>
                <label style={S.label}>إرسال رد</label>
                <textarea value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder="اكتب ردك هنا..." style={{ ...S.inp, minHeight: '100px' }} />
                <button onClick={handleRespond} disabled={isResponding || !responseText.trim()} style={{ ...S.btn('#10b981'), opacity: isResponding || !responseText.trim() ? 0.5 : 1 }} onMouseEnter={(e) => (e.currentTarget.style.background = '#059669')} onMouseLeave={(e) => (e.currentTarget.style.background = '#10b981')}>
                  {isResponding ? '⏳ جاري الإرسال...' : '✓ إرسال الرد'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#94a3b8', fontSize: '1rem' }}>اختر رسالة لعرض تفاصيلها</div>
        )}
      </div>
    </div>
  );
}
