'use client';

import { useState, useEffect } from 'react';
import { SupportMessage } from '@/lib/types';
import { fetchSupportMessages, fetchSupportMessage, respondToSupportMessage } from '@/lib/api';

interface AdminSupportProps {
  eventId: number;
  token: string;
}

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
      const res = await fetchSupportMessages(eventId, token);
      setMessages(res.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMessage = async (message: SupportMessage) => {
    try {
      const res = await fetchSupportMessage(eventId, message.id, token);
      setSelectedMessage(res.data);
      setResponseText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load message');
    }
  };

  const handleRespond = async () => {
    if (!selectedMessage || !responseText.trim()) return;

    try {
      setIsResponding(true);
      await respondToSupportMessage(
        eventId,
        selectedMessage.id,
        {
          admin_response: responseText,
          admin_name: 'Admin',
          status: 'resolved',
          priority: selectedMessage.priority,
        },
        token
      );

      await loadMessages();
      setSelectedMessage(null);
      setResponseText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send response');
    } finally {
      setIsResponding(false);
    }
  };

  const filteredMessages = statusFilter === 'all' 
    ? messages 
    : messages.filter(m => m.status === statusFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-red-100 text-red-800';
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 font-bold';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Messages List */}
      <div className="col-span-1 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-bold text-lg mb-3">الرسائل</h3>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          >
            <option value="all">جميع الرسائل</option>
            <option value="new">جديدة</option>
            <option value="open">مفتوحة</option>
            <option value="in_progress">قيد المعالجة</option>
            <option value="resolved">تم حلها</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">جاري التحميل...</div>
          ) : filteredMessages.length === 0 ? (
            <div className="p-4 text-center text-gray-500">لا توجد رسائل</div>
          ) : (
            filteredMessages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => handleSelectMessage(msg)}
                className={`w-full text-right p-3 border-b hover:bg-gray-50 transition ${
                  selectedMessage?.id === msg.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-1">
                  <span className="font-bold text-sm">{msg.name}</span>
                  <span className={`text-xs px-2 py-1 rounded ${getStatusColor(msg.status)}`}>
                    {msg.status === 'new' && 'جديدة'}
                    {msg.status === 'open' && 'مفتوحة'}
                    {msg.status === 'in_progress' && 'قيد المعالجة'}
                    {msg.status === 'resolved' && 'تم حلها'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 truncate">{msg.subject}</p>
                <p className={`text-xs mt-1 ${getPriorityColor(msg.priority)}`}>
                  {msg.priority === 'urgent' && '⚡ عاجل'}
                  {msg.priority === 'high' && '! مهم'}
                  {msg.priority === 'medium' && '- عادي'}
                  {msg.priority === 'low' && 'منخفض'}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message Detail */}
      <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {selectedMessage ? (
          <div className="space-y-4">
            {/* Header */}
            <div>
              <h3 className="text-2xl font-bold mb-2">{selectedMessage.subject}</h3>
              <div className="flex gap-4 text-sm text-gray-600">
                <span>من: <strong>{selectedMessage.name}</strong></span>
                <span>البريد: <strong>{selectedMessage.email}</strong></span>
                {selectedMessage.phone && <span>الهاتف: <strong>{selectedMessage.phone}</strong></span>}
              </div>
            </div>

            {/* Meta info */}
            <div className="flex gap-2 text-sm">
              <span className={`px-2 py-1 rounded ${getStatusColor(selectedMessage.status)}`}>
                {selectedMessage.status === 'new' && 'جديدة'}
                {selectedMessage.status === 'open' && 'مفتوحة'}
                {selectedMessage.status === 'in_progress' && 'قيد المعالجة'}
                {selectedMessage.status === 'resolved' && 'تم حلها'}
              </span>
              <span className={`px-2 py-1 rounded border ${getPriorityColor(selectedMessage.priority)}`}>
                {selectedMessage.priority === 'urgent' && '⚡ عاجل'}
                {selectedMessage.priority === 'high' && '! مهم'}
                {selectedMessage.priority === 'medium' && '- عادي'}
                {selectedMessage.priority === 'low' && 'منخفض'}
              </span>
              <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">
                {selectedMessage.category === 'general' && 'عام'}
                {selectedMessage.category === 'technical' && 'تقني'}
                {selectedMessage.category === 'registration' && 'التسجيل'}
                {selectedMessage.category === 'ticketing' && 'التذاكر'}
                {selectedMessage.category === 'other' && 'أخرى'}
              </span>
            </div>

            {/* Message */}
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
              <p className="text-gray-800 whitespace-pre-wrap">{selectedMessage.message}</p>
            </div>

            {/* Previous Response */}
            {selectedMessage.admin_response && (
              <div className="bg-green-50 p-4 rounded border border-green-200">
                <p className="text-sm text-gray-600 mb-2">
                  الرد من: <strong>{selectedMessage.admin_name}</strong>
                </p>
                <p className="text-gray-800 whitespace-pre-wrap">{selectedMessage.admin_response}</p>
              </div>
            )}

            {/* Response Form */}
            {selectedMessage.status !== 'resolved' && (
              <div className="space-y-3 border-t pt-4">
                <h4 className="font-bold">إرسال رد</h4>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={4}
                  placeholder="اكتب ردك هنا..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleRespond}
                  disabled={isResponding || !responseText.trim()}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  {isResponding ? 'جاري الإرسال...' : 'إرسال الرد'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>اختر رسالة لعرضها</p>
          </div>
        )}
      </div>
    </div>
  );
}
