'use client';

import { useState, useEffect } from 'react';
import { TicketType } from '@/lib/types';
import { fetchTickets, createTicketType, updateTicketType, deleteTicketType } from '@/lib/api';

interface AdminTicketsProps {
  eventId: number;
  token: string;
}

export default function AdminTickets({ eventId, token }: AdminTicketsProps) {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name_ar: '',
    name_en: '',
    description: '',
    price_per_unit: 0,
    duration_type: 'single_day' as const,
    custom_days: 1,
    quantity_available: 0,
    sort_order: 0,
  });

  useEffect(() => {
    loadTickets();
  }, [eventId]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await fetchTickets(eventId);
      setTickets(res.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await updateTicketType(eventId, editingId, form, token);
      } else {
        await createTicketType(eventId, form, token);
      }

      setForm({
        name_ar: '',
        name_en: '',
        description: '',
        price_per_unit: 0,
        duration_type: 'single_day',
        custom_days: 1,
        quantity_available: 0,
        sort_order: 0,
      });
      setEditingId(null);
      setIsFormOpen(false);
      await loadTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save ticket');
    }
  };

  const handleEdit = (ticket: TicketType) => {
    setForm({
      name_ar: ticket.name_ar,
      name_en: ticket.name_en,
      description: ticket.description || '',
      price_per_unit: ticket.price_per_unit,
      duration_type: ticket.duration_type,
      custom_days: ticket.custom_days || 1,
      quantity_available: ticket.quantity_available,
      sort_order: ticket.sort_order,
    });
    setEditingId(ticket.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد؟')) return;

    try {
      await deleteTicketType(eventId, id, token);
      await loadTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete ticket');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name.includes('price') || name.includes('quantity') || name.includes('custom') || name.includes('sort')
        ? Number(value)
        : value,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold">إدارة التذاكر</h3>
        <button
          onClick={() => {
            setEditingId(null);
            setForm({
              name_ar: '',
              name_en: '',
              description: '',
              price_per_unit: 0,
              duration_type: 'single_day',
              custom_days: 1,
              quantity_available: 0,
              sort_order: 0,
            });
            setIsFormOpen(!isFormOpen);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {isFormOpen ? 'إلغاء' : 'إضافة تذكرة جديدة'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Form */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 mb-2">الاسم (عربي) *</label>
              <input
                type="text"
                name="name_ar"
                value={form.name_ar}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-2">الاسم (English)</label>
              <input
                type="text"
                name="name_en"
                value={form.name_en}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-2">الوصف</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-gray-700 mb-2">السعر</label>
              <input
                type="number"
                name="price_per_unit"
                value={form.price_per_unit}
                onChange={handleInputChange}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-2">عدد التذاكر</label>
              <input
                type="number"
                name="quantity_available"
                value={form.quantity_available}
                onChange={handleInputChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-2">ترتيب</label>
              <input
                type="number"
                name="sort_order"
                value={form.sort_order}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 mb-2">نوع المدة</label>
              <select
                name="duration_type"
                value={form.duration_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="single_day">يوم واحد</option>
                <option value="three_days">3 أيام</option>
                <option value="full_event">كل أيام الحدث</option>
                <option value="custom_days">عدد أيام محدد</option>
              </select>
            </div>
            {form.duration_type === 'custom_days' && (
              <div>
                <label className="block font-bold text-gray-700 mb-2">عدد الأيام</label>
                <input
                  type="number"
                  name="custom_days"
                  value={form.custom_days}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            >
              {editingId ? 'تحديث' : 'إضافة'}
            </button>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-8 text-gray-500">لا توجد تذاكر</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="px-4 py-3 text-right">الاسم (عربي)</th>
                <th className="px-4 py-3 text-right">السعر</th>
                <th className="px-4 py-3 text-right">المدة</th>
                <th className="px-4 py-3 text-right">المتاح</th>
                <th className="px-4 py-3 text-right">المباع</th>
                <th className="px-4 py-3">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{ticket.name_ar}</td>
                  <td className="px-4 py-3">{ticket.price_per_unit} ريال</td>
                  <td className="px-4 py-3">
                    {ticket.duration_type === 'single_day' && 'يوم واحد'}
                    {ticket.duration_type === 'three_days' && '3 أيام'}
                    {ticket.duration_type === 'full_event' && 'كل أيام الحدث'}
                    {ticket.duration_type === 'custom_days' && `${ticket.custom_days} أيام`}
                  </td>
                  <td className="px-4 py-3">{ticket.quantity_available - ticket.quantity_sold}</td>
                  <td className="px-4 py-3">{ticket.quantity_sold}</td>
                  <td className="px-4 py-3 space-x-2">
                    <button
                      onClick={() => handleEdit(ticket)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(ticket.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
