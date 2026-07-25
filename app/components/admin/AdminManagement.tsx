'use client';
import { useState, useEffect, useCallback } from 'react';

const S = {
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem', colorScheme: 'dark' } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 } as React.CSSProperties),
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '1rem', padding: '1.25rem' } as React.CSSProperties,
  label: { fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', display: 'block' } as React.CSSProperties,
};

interface Admin {
  id: number; name: string; email: string; role: string;
  google_picture?: string; google_email?: string;
  auth_method: string; approval_status: string;
  is_active: number; created_at: string;
}

interface Props {
  token: string;
  apiBase: string;
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  super_admin: { label: '👑 مسؤول رئيسي', color: '#f59e0b' },
  admin: { label: '⚙️ مسؤول', color: '#6C63FF' },
  viewer: { label: '👁️ مشاهد', color: '#64748b' },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  approved: { label: '✅ معتمد', color: '#10b981' },
  pending: { label: '⏳ منتظر', color: '#f59e0b' },
  rejected: { label: '❌ مرفوض', color: '#ef4444' },
};

export default function AdminManagement({ token, apiBase }: Props) {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  const me = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('admin_user') || '{}') : {};
  const headers = { Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/auth/admins`, { headers });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'خطأ'); return; }
      setAdmins(data.data || []);
      setPendingCount((data.data || []).filter((a: Admin) => a.approval_status === 'pending').length);
    } catch { setError('خطأ في الاتصال'); }
    finally { setLoading(false); }
  }, [token, apiBase]);

  useEffect(() => { load(); }, [load]);

  const approve = async (id: number) => {
    setProcessing(id);
    await fetch(`${apiBase}/api/auth/approve-admin/${id}`, { method: 'POST', headers });
    await load();
    setProcessing(null);
  };

  const reject = async (id: number) => {
    const reason = prompt('سبب الرفض (اختياري):') ?? '';
    setProcessing(id);
    await fetch(`${apiBase}/api/auth/reject-admin/${id}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    await load();
    setProcessing(null);
  };

  const deactivate = async (id: number, name: string) => {
    if (!confirm(`تعطيل حساب ${name}؟`)) return;
    setProcessing(id);
    await fetch(`${apiBase}/api/auth/admins/${id}`, { method: 'DELETE', headers });
    await load();
    setProcessing(null);
  };

  const changeRole = async (id: number, role: string) => {
    setProcessing(id);
    await fetch(`${apiBase}/api/auth/admins/${id}/role`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    await load();
    setProcessing(null);
  };

  if (loading) return <p style={{ color: '#94a3b8', textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>;
  if (error) return <div style={{ ...S.card, color: '#fca5a5', textAlign: 'center' }}>❌ {error}<br /><small>يجب أن تكون المسؤول الرئيسي للوصول لهذه الصفحة</small></div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ color: 'white', margin: 0, fontWeight: 700 }}>👥 إدارة المسؤولين</h2>
          <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '4px 0 0' }}>{admins.length} مسؤول مسجل</p>
        </div>
        {pendingCount > 0 && (
          <a href="/admin/approvals" style={{
            background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)',
            color: '#fcd34d', borderRadius: '0.5rem', padding: '0.5rem 1rem',
            textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600,
          }}>
            ⏳ {pendingCount} طلب انضمام منتظر →
          </a>
        )}
      </div>

      {/* Admins Grid */}
      <div style={{ display: 'grid', gap: 10 }}>
        {admins.map(admin => {
          const roleInfo = ROLE_LABELS[admin.role] || { label: admin.role, color: '#6b7280' };
          const statusInfo = STATUS_LABELS[admin.approval_status] || { label: admin.approval_status, color: '#6b7280' };
          const isSelf = admin.id === me.id;
          const isDisabled = !admin.is_active;

          return (
            <div key={admin.id} style={{
              ...S.card,
              opacity: isDisabled ? 0.5 : 1,
              display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
              borderColor: admin.role === 'super_admin' ? 'rgba(245,158,11,0.3)' : 'rgba(108,99,255,0.15)',
            }}>
              {/* Avatar */}
              {admin.google_picture ? (
                <img src={admin.google_picture} alt={admin.name} style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, border: `2px solid ${roleInfo.color}40` }} />
              ) : (
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: `${roleInfo.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: roleInfo.color, fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}>
                  {admin.name?.[0]?.toUpperCase() || '؟'}
                </div>
              )}

              {/* Info */}
              <div style={{ flex: 1, minWidth: 150 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ color: 'white', fontWeight: 600 }}>{admin.name}</span>
                  {isSelf && <span style={{ fontSize: '0.7rem', background: 'rgba(108,99,255,0.2)', color: '#818cf8', padding: '1px 6px', borderRadius: 4 }}>أنت</span>}
                  {isDisabled && <span style={{ fontSize: '0.7rem', background: 'rgba(239,68,68,0.2)', color: '#fca5a5', padding: '1px 6px', borderRadius: 4 }}>معطّل</span>}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{admin.google_email || admin.email}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.7rem', background: `${roleInfo.color}20`, color: roleInfo.color, padding: '2px 8px', borderRadius: 4 }}>{roleInfo.label}</span>
                  <span style={{ fontSize: '0.7rem', background: `${statusInfo.color}20`, color: statusInfo.color, padding: '2px 8px', borderRadius: 4 }}>{statusInfo.label}</span>
                  <span style={{ fontSize: '0.7rem', color: '#4b5563' }}>{admin.auth_method === 'google' ? '🔵 Google' : '🔑 بريد'}</span>
                  <span style={{ fontSize: '0.7rem', color: '#374151' }}>
                    {new Date(admin.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>

              {/* Actions (super admin only, not self) */}
              {!isSelf && (
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                  {admin.approval_status === 'pending' && (
                    <>
                      <button onClick={() => approve(admin.id)} disabled={processing === admin.id} style={S.btn('#10b981')}>✅ موافقة</button>
                      <button onClick={() => reject(admin.id)} disabled={processing === admin.id} style={{ ...S.btn('#ef4444'), background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)' }}>❌ رفض</button>
                    </>
                  )}
                  {admin.approval_status === 'approved' && admin.is_active === 1 && (
                    <>
                      <select
                        value={admin.role}
                        onChange={e => changeRole(admin.id, e.target.value)}
                        disabled={processing === admin.id}
                        style={{ ...S.inp, width: 'auto', fontSize: '0.78rem', padding: '0.3rem 0.5rem' }}
                      >
                        <option value="admin">⚙️ مسؤول</option>
                        <option value="viewer">👁️ مشاهد</option>
                        <option value="super_admin">👑 رئيسي</option>
                      </select>
                      <button onClick={() => deactivate(admin.id, admin.name)} disabled={processing === admin.id}
                        style={{ ...S.btn('#374151'), fontSize: '0.78rem', padding: '0.3rem 0.6rem', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}>
                        🚫 تعطيل
                      </button>
                    </>
                  )}
                  {processing === admin.id && <span style={{ color: '#94a3b8', fontSize: '0.8rem', alignSelf: 'center' }}>...</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
