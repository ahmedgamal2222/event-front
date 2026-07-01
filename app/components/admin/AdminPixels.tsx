'use client';

import { useState } from 'react';
import { updatePixelCodes, fetchPixelCodes } from '@/lib/api';

interface AdminPixelsProps {
  eventId: number;
  token: string;
}

export default function AdminPixels({ eventId, token }: AdminPixelsProps) {
  const [form, setForm] = useState({
    facebook_pixel_id: '',
    facebook_pixel_code: '',
    linkedin_pixel_id: '',
    linkedin_pixel_code: '',
    twitter_pixel_id: '',
    twitter_pixel_code: '',
    gtag_id: '',
    gtag_code: '',
    custom_pixel_code: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updatePixelCodes(eventId, form, token);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pixels');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadExisting = async () => {
    try {
      setLoading(true);
      const res = await fetchPixelCodes(eventId);
      if (res.data) {
        setForm(prev => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pixels');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold">أكواد التتبع والبكسل</h3>
        <button
          onClick={handleLoadExisting}
          disabled={loading}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:bg-gray-400"
        >
          تحميل الموجود
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          تم الحفظ بنجاح!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Facebook Pixel */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📘</span>
            <h4 className="text-xl font-bold">Facebook Pixel</h4>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-2">Pixel ID</label>
            <input
              type="text"
              name="facebook_pixel_id"
              value={form.facebook_pixel_id}
              onChange={handleInputChange}
              placeholder="123456789"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">معرّف البكسل الخاص بك من Facebook Business</p>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-2">كود البكسل الكامل</label>
            <textarea
              name="facebook_pixel_code"
              value={form.facebook_pixel_code}
              onChange={handleInputChange}
              rows={4}
              placeholder="<script>!function(f){...}</script>"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">الكود الكامل من Facebook - يمكنك لصق كود البكسل الكامل هنا</p>
          </div>
        </div>

        {/* LinkedIn Pixel */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">in</span>
            <h4 className="text-xl font-bold">LinkedIn Insight Tag</h4>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-2">Partner ID</label>
            <input
              type="text"
              name="linkedin_pixel_id"
              value={form.linkedin_pixel_id}
              onChange={handleInputChange}
              placeholder="123456"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">معرّف الشريك من LinkedIn</p>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-2">كود LinkedIn</label>
            <textarea
              name="linkedin_pixel_code"
              value={form.linkedin_pixel_code}
              onChange={handleInputChange}
              rows={4}
              placeholder="<script>_linkedin_partner_id = ...</script>"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>
        </div>

        {/* Twitter Pixel */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">𝕏</span>
            <h4 className="text-xl font-bold">Twitter Conversion Tracking</h4>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-2">Tracking ID</label>
            <input
              type="text"
              name="twitter_pixel_id"
              value={form.twitter_pixel_id}
              onChange={handleInputChange}
              placeholder="abc123"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">معرّف التتبع من Twitter</p>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-2">كود Twitter</label>
            <textarea
              name="twitter_pixel_code"
              value={form.twitter_pixel_code}
              onChange={handleInputChange}
              rows={4}
              placeholder="<script>!function(e,t,n,...){...}</script>"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>
        </div>

        {/* Google Analytics */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📊</span>
            <h4 className="text-xl font-bold">Google Analytics (gtag)</h4>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-2">Measurement ID</label>
            <input
              type="text"
              name="gtag_id"
              value={form.gtag_id}
              onChange={handleInputChange}
              placeholder="G-XXXXXXXXXX"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">معرّف القياس من Google Analytics 4</p>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-2">كود gtag</label>
            <textarea
              name="gtag_code"
              value={form.gtag_code}
              onChange={handleInputChange}
              rows={4}
              placeholder="<script async src='https://www.googletagmanager.com/...></script>"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>
        </div>

        {/* Custom Pixel Code */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">⚙️</span>
            <h4 className="text-xl font-bold">كود مخصص (اختياري)</h4>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-2">HTML/JavaScript مخصص</label>
            <textarea
              name="custom_pixel_code"
              value={form.custom_pixel_code}
              onChange={handleInputChange}
              rows={5}
              placeholder="أكود أي بكسل أو تتبع مخصص..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">أضف أي أكواد تتبع إضافية هنا</p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:bg-gray-400 font-bold"
          >
            {loading ? 'جاري الحفظ...' : 'حفظ الأكواد'}
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded">
        <h4 className="font-bold text-blue-900 mb-2">ملاحظات مهمة:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• يمكنك لصق الكود الكامل من كل منصة تتبع</li>
          <li>• ستُدرج جميع الأكواد تلقائياً في رأس الصفحة (HTML Head)</li>
          <li>• لا تنسَ التحقق من أن أكوادك تعمل بعد الحفظ</li>
          <li>• يمكنك استخدام أكثر من بكسل واحد في نفس الوقت</li>
        </ul>
      </div>
    </div>
  );
}
