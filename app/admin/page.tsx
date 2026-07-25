'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogin } from '../../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev';
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '974559978030-n1mofmr4g1ffgf5l4jt8332ivsq78qkl.apps.googleusercontent.com';

function saveToken(t: string) { if (typeof window !== 'undefined') localStorage.setItem('admin_token', t); }
function saveUser(u: any) { if (typeof window !== 'undefined') localStorage.setItem('admin_user', JSON.stringify(u)); }
export function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : ''; }
export function removeToken() { if (typeof window !== 'undefined') localStorage.removeItem('admin_token'); }

declare global {
  interface Window {
    google?: any;
    handleGoogleCredential?: (response: any) => void;
  }
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('admin_token')) {
      router.replace('/admin/dashboard');
      return;
    }
    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [router]);

  const initGoogle = () => {
    if (!window.google) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
      ux_mode: 'popup',
    });
    if (googleBtnRef.current) {
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'filled_black',
        size: 'large',
        text: 'signin_with',
        locale: 'ar',
        width: '100%',
      });
    }
  };

  const handleGoogleCredential = async (response: any) => {
    setError(''); setLoading(true); setIsPending(false);
    try {
      // Decode JWT payload from Google
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const res = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          google_token: response.credential,
          google_id: payload.sub,
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.error === 'pending_approval') {
          setIsPending(true);
          setError(data.message || 'سيتم اعتمادكم كمسؤول من قبل الإدارة وسنرسل لكم رسالة عند الاعتماد');
        } else if (data.error === 'account_disabled') {
          setIsDisabled(true);
          setError(data.message || 'حسابك معطّل من قبل الإدارة');
        } else {
          setError(data.error || 'خطأ في تسجيل الدخول');
        }
        return;
      }
      saveToken(data.data.token);
      saveUser(data.data.admin);
      router.push('/admin/dashboard');
    } catch {
      setError('حدث خطأ في تسجيل الدخول عبر Google');
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setIsPending(false); setIsDisabled(false);
    try {
      const res = await adminLogin(email, password) as any;
      if (res.data?.admin?.approval_status === 'pending') {
        setIsPending(true);
        setError('سيتم اعتمادكم كمسؤول من قبل الإدارة وسنرسل لكم رسالة عند الاعتماد');
        return;
      }
      saveToken(res.data.token);
      saveUser(res.data.admin);
      router.push('/admin/dashboard');
    } catch (err: any) {
      if (err.message?.includes('pending')) {
        setIsPending(true);
        setError('سيتم اعتمادكم كمسؤول من قبل الإدارة وسنرسل لكم رسالة عند الاعتماد');
      } else if (err.message?.includes('account_disabled') || err.message?.includes('معطّل')) {
        setIsDisabled(true);
        setError(err.message);
      } else {
        setError(err.message || 'بيانات الدخول غير صحيحة');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0d0b1a' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl font-black text-white mb-1"><span style={{ color: '#6C63FF' }}>S3</span> Summit</div>
          <p className="text-[var(--text-muted)] text-sm">لوحة تحكم المشرفين</p>
        </div>
        <div className="card space-y-4">
          <h2 className="text-lg font-bold text-white text-center">تسجيل الدخول</h2>

          {/* رسالة الانتظار */}
          {isPending && (
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#fcd34d', fontSize: '0.85rem', textAlign: 'center', lineHeight: 1.6 }}>
              <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>⏳</div>
              <strong>طلبك قيد المراجعة</strong>
              <br />
              سيتم اعتمادكم كمسؤول من قبل الإدارة وسنرسل لكم رسالة عند الاعتماد
            </div>
          )}

          {/* رسالة الحساب المعطّل */}
          {isDisabled && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: '#fca5a5', fontSize: '0.85rem', textAlign: 'center', lineHeight: 1.6 }}>
              <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>🚫</div>
              <strong>حساب معطّل</strong>
              <br />
              {error || 'حسابك معطّل من قبل الإدارة، يرجى التواصل مع المسؤول الرئيسي'}
            </div>
          )}

          {/* رسالة الخطأ */}
          {error && !isPending && !isDisabled && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          {/* زر تسجيل الدخول بـ Google */}
          <div>
            <div ref={googleBtnRef} style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ color: '#4b5563', fontSize: '0.8rem' }}>أو</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          </div>

          {/* تسجيل الدخول بالبريد وكلمة المرور */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1">البريد الإلكتروني</label>
              <input className="input-field" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@event.com" />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1">كلمة المرور</label>
              <input className="input-field" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full text-center">
              {loading ? 'جار الدخول...' : 'دخول'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
