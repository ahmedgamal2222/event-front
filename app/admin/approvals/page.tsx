'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev';

const S = {
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '1rem', padding: '1.25rem' } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.5rem 1.2rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 } as React.CSSProperties),
};

interface PendingAdmin {
  id: number;
  name: string;
  email: string;
  google_email?: string;
  google_picture?: string;
  auth_method: string;
  created_at: string;
}

export default function AdminApprovalsPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<PendingAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin'); return; }
    load(token);
  }, [router]);

  const load = async (token?: string) => {
    const t = token || localStorage.getItem('admin_token') || '';
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/pending-admins`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 403) setError('غير مصرح لك — هذه الصفحة للمسؤول الرئيسي فقط');
        else setError(data.error || 'خطأ في جلب البيانات');
        return;
      }
      setAdmins(data.data || []);
    } catch {
      setError('خطأ في الاتصال بالخادم');
    } finally { setLoading(false); }
  };

  const approve = async (id: number) => {
    setProcessing(id);
    try {
      const res = await fetch(`${API_BASE}/api/auth/approve-admin/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      });
      const data = await res.json();
      if (data.success) {
        setAdmins(prev => prev.filter(a => a.id !== id));
      } else alert(data.error || 'فشل في الموافقة');
    } catch { alert('خطأ في الاتصال'); }
    finally { setProcessing(null); }
  };

  const reject = async (id: number) => {
    const reason = prompt('سبب الرفض (اختياري):') ?? undefined;
    setProcessing(id);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reject-admin/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) {
        setAdmins(prev => prev.filter(a => a.id !== id));
      } else alert(data.error || 'فشل في الرفض');
    } catch { alert('خطأ في الاتصال'); }
    finally { setProcessing(null); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0d0b1a', padding: '2rem 1rem', direction: 'rtl', fontFamily: "'Cairo', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>طلبات الانضمام</h1>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0' }}>مراجعة واعتماد المسؤولين الجدد</p>
          </div>
          <button onClick={() => router.push('/admin/dashboard')} style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.85rem' }}>
            ← العودة
          </button>
        </div>

        {loading ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: '3rem' }}>جاري التحميل...</p>
        ) : error ? (
          <div style={{ ...S.card, borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5', textAlign: 'center' }}>
            ❌ {error}
          </div>
        ) : admins.length === 0 ? (
          <div style={{ ...S.card, textAlign: 'center', color: '#64748b', padding: '3rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
            <p style={{ margin: 0 }}>لا توجد طلبات انضمام معلقة</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 4 }}>
              {admins.length} طلب انضمام معلق
            </div>
            {admins.map(admin => (
              <div key={admin.id} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                {/* Avatar */}
                {admin.google_picture ? (
                  <img src={admin.google_picture} alt={admin.name} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(108,99,255,0.4)' }} />
                ) : (
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(108,99,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontWeight: 700, fontSize: '1.2rem', flexShrink: 0 }}>
                    {admin.name?.[0]?.toUpperCase() || '؟'}
                  </div>
                )}

                {/* Info */}
                <div style={{ flex: 1, minWidth: 150 }}>
                  <p style={{ color: 'white', fontWeight: 700, margin: 0 }}>{admin.name}</p>
                  <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '2px 0' }}>{admin.google_email || admin.email}</p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                    <span style={{ background: admin.auth_method === 'google' ? 'rgba(59,130,246,0.15)' : 'rgba(108,99,255,0.15)', color: admin.auth_method === 'google' ? '#60a5fa' : '#818cf8', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px' }}>
                      {admin.auth_method === 'google' ? '🔵 Google' : '🔑 بريد'}
                    </span>
                    <span style={{ color: '#4b5563', fontSize: '0.72rem' }}>
                      {new Date(admin.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => approve(admin.id)}
                    disabled={processing === admin.id}
                    style={S.btn('#10b981')}
                  >
                    {processing === admin.id ? '...' : '✅ موافقة'}
                  </button>
                  <button
                    onClick={() => reject(admin.id)}
                    disabled={processing === admin.id}
                    style={{ ...S.btn('#ef4444'), background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)' }}
                  >
                    {processing === admin.id ? '...' : '❌ رفض'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
