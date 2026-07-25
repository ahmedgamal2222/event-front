# دليل تعديلات Frontend - نظام Google OAuth والتحسينات

## 📋 نظرة عامة
هذا الدليل يوضح التعديلات المطلوبة في Frontend (event-web و majarra-web) لدعم:
1. نظام Google OAuth للأدمن
2. عرض جهات الاتصال المدمجة مع التسجيلات
3. نظام المهام المحسّن
4. إخفاء الرعايات
5. إدارة ظهور الأحداث

---

## 1️⃣ تسجيل دخول الأدمن عبر Google OAuth

### إعداد Google OAuth 2.0

#### الخطوة 1: إنشاء مشروع في Google Cloud Console
1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com)
2. أنشئ مشروع جديد أو استخدم موجود
3. فعّل **Google+ API** أو **Google Identity**
4. انتقل إلى **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. اختر **Web application**
6. أضف **Authorized JavaScript origins**:
   - `http://localhost:3000` (للتطوير)
   - `https://yourdomain.com` (للإنتاج)
7. أضف **Authorized redirect URIs**:
   - `http://localhost:3000/admin/login`
   - `https://yourdomain.com/admin/login`
8. احفظ **Client ID** و **Client Secret**

#### الخطوة 2: تثبيت المكتبات المطلوبة

```bash
npm install @react-oauth/google
# أو
npm install react-google-login
```

#### الخطوة 3: تحديث ملف `.env.local`

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here
NEXT_PUBLIC_API_URL=http://localhost:8787
```

---

### تعديلات صفحة تسجيل الدخول

#### الملف: `app/admin/login/page.tsx` (أو المسار المناسب)

```tsx
'use client';

import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import jwt_decode from 'jwt-decode'; // npm install jwt-decode

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // تسجيل دخول عادي بالبريد وكلمة المرور
  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'pending_approval') {
          setIsPending(true);
          setError(data.message || 'في انتظار الموافقة');
        } else {
          setError(data.error || 'خطأ في تسجيل الدخول');
        }
        return;
      }

      // حفظ التوكن
      localStorage.setItem('admin_token', data.data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.data.admin));

      // التوجيه إلى لوحة التحكم
      router.push('/admin/dashboard');
    } catch (err) {
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  // تسجيل دخول عبر Google
  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('');
    setLoading(true);

    try {
      // فك تشفير Google JWT لاستخراج المعلومات
      const decoded: any = jwt_decode(credentialResponse.credential);

      const res = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          google_token: credentialResponse.credential,
          google_id: decoded.sub,
          email: decoded.email,
          name: decoded.name,
          picture: decoded.picture,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'pending_approval') {
          setIsPending(true);
          setError(data.message || 'سيتم اعتمادكم كمسؤول من قبل الإدارة وسنرسل لكم رسالة عند الاعتماد');
        } else {
          setError(data.error || 'خطأ في تسجيل الدخول');
        }
        return;
      }

      // حفظ التوكن
      localStorage.setItem('admin_token', data.data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.data.admin));

      router.push('/admin/dashboard');
    } catch (err) {
      setError('حدث خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('فشل تسجيل الدخول عبر Google');
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen flex items-center justify-center bg-gray-100" dir="rtl">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">تسجيل دخول الأدمن</h1>

          {/* رسالة الانتظار */}
          {isPending && (
            <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
              <p className="font-semibold">في انتظار الموافقة</p>
              <p className="text-sm mt-1">
                سيتم اعتمادكم كمسؤول من قبل الإدارة وسنرسل لكم رسالة عند الاعتماد
              </p>
            </div>
          )}

          {/* رسالة الخطأ */}
          {error && !isPending && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-800 rounded">
              {error}
            </div>
          )}

          {/* تسجيل الدخول عبر Google */}
          <div className="mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              text="signin_with"
              locale="ar"
              useOneTap
            />
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">أو</span>
            </div>
          </div>

          {/* تسجيل الدخول بالبريد */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">كلمة المرور</label>
              <input
                type="password"
                name="password"
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'جاري التحميل...' : 'تسجيل الدخول'}
            </button>
          </form>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
```

---

## 2️⃣ صفحة موافقة المسؤولين (Super Admin فقط)

### الملف: `app/admin/approvals/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface PendingAdmin {
  id: number;
  name: string;
  email: string;
  google_picture: string;
  created_at: string;
  requested_at: string;
}

export default function AdminApprovalsPage() {
  const router = useRouter();
  const [pendingAdmins, setPendingAdmins] = useState<PendingAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPendingAdmins();
  }, []);

  const fetchPendingAdmins = async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/pending-admins`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 403) {
          setError('غير مصرح لك بالوصول إلى هذه الصفحة');
        } else {
          throw new Error('فشل في جلب البيانات');
        }
        return;
      }

      const data = await res.json();
      setPendingAdmins(data.data || []);
    } catch (err) {
      setError('حدث خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (adminId: number) => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/auth/approve-admin/${adminId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('فشل في الموافقة');

      // إزالة من القائمة
      setPendingAdmins(prev => prev.filter(a => a.id !== adminId));
      alert('تم اعتماد المسؤول بنجاح');
    } catch (err) {
      alert('حدث خطأ في الموافقة');
    }
  };

  const handleReject = async (adminId: number) => {
    const reason = prompt('سبب الرفض (اختياري):');
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/auth/reject-admin/${adminId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) throw new Error('فشل في الرفض');

      setPendingAdmins(prev => prev.filter(a => a.id !== adminId));
      alert('تم رفض المسؤول');
    } catch (err) {
      alert('حدث خطأ في الرفض');
    }
  };

  if (loading) return <div className="p-8">جاري التحميل...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">طلبات انضمام المسؤولين</h1>

      {pendingAdmins.length === 0 ? (
        <p className="text-gray-500">لا توجد طلبات منتظرة</p>
      ) : (
        <div className="space-y-4">
          {pendingAdmins.map(admin => (
            <div key={admin.id} className="bg-white p-4 rounded-lg shadow border flex items-center justify-between">
              <div className="flex items-center gap-4">
                {admin.google_picture && (
                  <img
                    src={admin.google_picture}
                    alt={admin.name}
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <div>
                  <p className="font-semibold">{admin.name}</p>
                  <p className="text-sm text-gray-600">{admin.email}</p>
                  <p className="text-xs text-gray-400">
                    طلب التسجيل: {new Date(admin.created_at).toLocaleString('ar')}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(admin.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  موافقة
                </button>
                <button
                  onClick={() => handleReject(admin.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  رفض
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 3️⃣ تحديثات صفحة جهات الاتصال (CRM)

### عرض التسجيلات والمهام في صفحة جهة الاتصال

```tsx
// في صفحة تفاصيل جهة الاتصال
const ContactDetailPage = ({ params }: { params: { id: string } }) => {
  const [contact, setContact] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    fetchContactDetails();
  }, [params.id]);

  const fetchContactDetails = async () => {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`${API_URL}/api/crm/contacts/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    
    setContact(data.data);
    setRegistrations(data.registrations || []);
    setTasks(data.tasks || []);
  };

  return (
    <div className="p-8" dir="rtl">
      {/* معلومات جهة الاتصال */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-2xl font-bold mb-4">{contact?.full_name}</h2>
        {/* باقي المعلومات */}
      </div>

      {/* التسجيلات */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-xl font-bold mb-4">التسجيلات ({registrations.length})</h3>
        {registrations.map(reg => (
          <div key={reg.id} className="border-b py-3">
            <p className="font-semibold">{reg.event_name_ar || reg.event_name}</p>
            <p className="text-sm text-gray-600">النوع: {reg.reg_type}</p>
            <p className="text-sm text-gray-600">الحالة: {reg.status}</p>
          </div>
        ))}
      </div>

      {/* المهام */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">المهام ({tasks.length})</h3>
        {tasks.map(task => (
          <div key={task.id} className="border-b py-3">
            <p className="font-semibold">{task.title}</p>
            <p className="text-sm text-gray-600">الحالة: {task.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 4️⃣ تحديثات صفحة المهام

### دعم المسؤولين المتعددين

```tsx
const CreateTaskModal = ({ onClose }: { onClose: () => void }) => {
  const [assignees, setAssignees] = useState<string[]>([]);
  const currentAdmin = JSON.parse(localStorage.getItem('admin_user') || '{}');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');

    const formData = new FormData(e.target as HTMLFormElement);
    
    const res = await fetch(`${API_URL}/api/crm/tasks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: formData.get('title'),
        task_type: formData.get('task_type'),
        contact_id: formData.get('contact_id'),
        priority: formData.get('priority'),
        due_date: formData.get('due_date'),
        creator_email: currentAdmin.email,
        creator_name: currentAdmin.name,
        assignees: assignees.map(email => ({
          email,
          name: '', // يمكن إضافة اسم من قائمة الأدمن
        })),
      }),
    });

    if (res.ok) {
      alert('تم إنشاء المهمة بنجاح');
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* حقول المهمة */}
      <div>
        <label>العنوان</label>
        <input name="title" required className="w-full px-3 py-2 border rounded" />
      </div>

      <div>
        <label>المسؤول الرئيسي</label>
        <input 
          value={currentAdmin.email} 
          disabled 
          className="w-full px-3 py-2 border rounded bg-gray-100"
        />
        <p className="text-xs text-gray-500 mt-1">أنت المسؤول الرئيسي تلقائياً</p>
      </div>

      <div>
        <label>إضافة مسؤولين آخرين</label>
        <input
          type="email"
          placeholder="admin@example.com"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const email = e.currentTarget.value;
              if (email && !assignees.includes(email)) {
                setAssignees([...assignees, email]);
                e.currentTarget.value = '';
              }
            }
          }}
          className="w-full px-3 py-2 border rounded"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {assignees.map(email => (
            <span key={email} className="bg-blue-100 px-3 py-1 rounded-full text-sm">
              {email}
              <button
                type="button"
                onClick={() => setAssignees(assignees.filter(e => e !== email))}
                className="mr-2 text-red-600"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
        إنشاء المهمة
      </button>
    </form>
  );
};
```

---

## 5️⃣ إخفاء قسم الرعايات

### في CRM Navigation أو Sidebar

```tsx
// تعليق أو إزالة رابط الرعايات
// <Link href="/admin/crm/sponsorships">الرعايات</Link>
```

---

## 6️⃣ الصفحة الرئيسية - التوجيه التلقائي

### الملف: `app/page.tsx`

```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    checkEvents();
  }, []);

  const checkEvents = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events`);
      const data = await res.json();

      // إذا كان هناك حدث واحد فقط، التوجيه المباشر
      if (data.shouldRedirect && data.redirectSlug) {
        router.push(`/events/${data.redirectSlug}`);
        return;
      }

      // عرض قائمة الأحداث
      // ...
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  return <div>جاري التحميل...</div>;
}
```

---

## ✅ Checklist التنفيذ

### Backend (✅ مكتمل)
- [x] Migration 0023 - Google OAuth
- [x] Migration 0024 - دمج جهات الاتصال
- [x] Auth router - Google OAuth
- [x] Registrations - إنشاء جهات اتصال
- [x] Contacts - عرض التسجيلات والمهام
- [x] Tasks - نظام المسؤولين المتعددين
- [x] Sponsorships - إخفاء
- [x] Events - التوجيه التلقائي
- [x] نسخ إلى majarra-api

### Frontend (⏳ مطلوب)
- [ ] إعداد Google OAuth Client ID
- [ ] صفحة تسجيل الدخول مع Google
- [ ] صفحة موافقة المسؤولين
- [ ] تحديث صفحة جهات الاتصال
- [ ] تحديث صفحة المهام
- [ ] إخفاء قسم الرعايات
- [ ] التوجيه التلقائي في الصفحة الرئيسية
- [ ] نسخ التعديلات إلى majarra-web

---

## 📞 الدعم
في حال وجود أي استفسارات أو مشاكل، راجع الملفات التالية:
- `IMPLEMENTATION_SUMMARY.md` - ملخص التعديلات
- Backend logs في Cloudflare Workers
- Google OAuth documentation

