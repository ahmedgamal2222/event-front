'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogin } from '../../lib/api';

function saveToken(t: string) { if (typeof window !== 'undefined') localStorage.setItem('admin_token', t); }
export function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : ''; }
export function removeToken() { if (typeof window !== 'undefined') localStorage.removeItem('admin_token'); }

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('admin_token')) {
      router.replace('/admin/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await adminLogin(email, password);
      saveToken(res.data.token);
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'بيانات الدخول غير صحيحة');
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
        <form onSubmit={handleSubmit} className="card space-y-4">
          <h2 className="text-lg font-bold text-white text-center">تسجيل الدخول</h2>
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-1">البريد الإلكتروني</label>
            <input className="input-field" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@event.com" />
          </div>
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-1">كلمة المرور</label>
            <input className="input-field" type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full text-center">
            {loading ? 'جار الدخول...' : 'دخول'}
          </button>
        </form>
      </div>
    </div>
  );
}
