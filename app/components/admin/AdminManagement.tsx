'use client';
import { useState, useEffect, useCallback } from 'react';
import AdminPermissionsEditor from './AdminPermissionsEditor';

const S = {
  inp: {
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '0.5rem',
    padding: '0.55rem 0.85rem',
    color: 'white',
    outline: 'none',
    width: '100%',
    fontSize: '0.9rem',
    colorScheme: 'dark',
  } as React.CSSProperties,
  btn: (color = '#6C63FF') =>
    ({
      background: color,
      color: 'white',
      border: 'none',
      borderRadius: '0.4rem',
      padding: '0.45rem 1rem',
      cursor: 'pointer',
      fontSize: '0.85rem',
      fontWeight: 600,
    } as React.CSSProperties),
  card: {
    background: '#13102a',
    border: '1px solid rgba(108,99,255,0.15)',
    borderRadius: '1rem',
    padding: '1.25rem',
  } as React.CSSProperties,
  label: {
    fontSize: '0.78rem',
    color: '#94a3b8',
    marginBottom: '0.3rem',
    display: 'block',
  } as React.CSSProperties,
};

const COUNTRIES = [
  'Syria',
  'Lebanon',
  'Jordan',
  'Iraq',
  'Saudi Arabia',
  'UAE',
  'Kuwait',
  'Qatar',
  'Bahrain',
  'Oman',
  'Egypt',
  'Libya',
  'Tunisia',
  'Algeria',
  'Morocco',
  'Sudan',
  'Yemen',
  'Palestine',
  'Turkey',
  'Germany',
  'France',
  'UK',
  'USA',
  'Canada',
  'Australia',
  'Sweden',
  'Netherlands',
  'Belgium',
  'Switzerland',
];

const COUNTRY_CITIES: Record<string, string[]> = {
  Syria: [
    'دمشق',
    'حلب',
    'حمص',
    'اللاذقية',
    'حماة',
    'دير الزور',
    'الرقة',
    'إدلب',
    'درعا',
    'السويداء',
    'طرطوس',
    'القامشلي',
  ],
  Lebanon: ['بيروت', 'طرابلس', 'صيدا', 'صور', 'زحلة'],
  Jordan: ['عمّان', 'إربد', 'الزرقاء', 'العقبة'],
  Iraq: ['بغداد', 'البصرة', 'الموصل', 'أربيل'],
  'Saudi Arabia': ['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام'],
  UAE: ['دبي', 'أبوظبي', 'الشارقة', 'عجمان'],
  Egypt: ['القاهرة', 'الإسكندرية', 'الجيزة'],
};

interface Admin {
  id: number;
  name: string;
  email: string;
  role: string;
  google_picture?: string;
  google_email?: string;
  auth_method?: string;
  approval_status?: string;
  is_active: number;
  created_at: string;
}

interface Props {
  token: string;
  apiBase: string;
  isSuperAdmin?: boolean;
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  super_admin: { label: '👑 رئيسي', color: '#f59e0b' },
  admin: { label: '⚙️ مسؤول', color: '#6C63FF' },
  moderator: { label: '👁️ مشاهد', color: '#64748b' },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  approved: { label: '✅ معتمد', color: '#10b981' },
  pending: { label: '⏳ منتظر', color: '#f59e0b' },
  rejected: { label: '❌ مرفوض', color: '#ef4444' },
};

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'admin' as 'admin' | 'moderator' | 'super_admin',
  phone: '',
  city: '',
  country: 'Syria',
};

export default function AdminManagement({
  token,
  apiBase,
  isSuperAdmin = false,
}: Props) {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [editingPermsFor, setEditingPermsFor] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [myId, setMyId] = useState<number | null>(null);

  const headers = { Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const meRes = await fetch(`${apiBase}/api/auth/me`, { headers });
      const meData = await meRes.json();
      if (meData.success) setMyId(meData.data.id);

      const res = await fetch(`${apiBase}/api/auth/admins`, { headers });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'خطأ');
        return;
      }
      setAdmins(data.data || []);
      setPendingCount(
        (data.data || []).filter((a: Admin) => a.approval_status === 'pending')
          .length
      );
    } catch {
      setError('خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  }, [token, apiBase]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (id: number) => {
    setProcessing(id);
    await fetch(`${apiBase}/api/auth/approve-admin/${id}`, {
      method: 'POST',
      headers,
    });
    await load();
    setProcessing(null);
  };

  const reject = async (id: number) => {
    const reason = prompt('سبب الرفض:') ?? '';
    setProcessing(id);
    await fetch(`${apiBase}/api/auth/reject-admin/${id}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    await load();
    setProcessing(null);
  };

  const deactivate = async (id: number) => {
    if (!confirm('تعطيل؟')) return;
    setProcessing(id);
    await fetch(`${apiBase}/api/auth/admins/${id}`, {
      method: 'DELETE',
      headers,
    });
    await load();
    setProcessing(null);
  };

  const reactivate = async (id: number) => {
    if (!confirm('إعادة تنشيط؟')) return;
    setProcessing(id);
    const res = await fetch(`${apiBase}/api/auth/admins/${id}/activate`, {
      method: 'POST',
      headers,
    });
    const data = await res.json();
    if (!data.success) alert(data.error || 'فشل');
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

  const addAdmin = async () => {
    setAddError('');
    if (!addForm.name || !addForm.email || !addForm.password) {
      setAddError('الاسم والبريد وكلمة المرور مطلوبة');
      return;
    }
    if (addForm.password.length < 6) {
      setAddError('كلمة المرور 6 أحرف على الأقل');
      return;
    }
    setAdding(true);
    try {
      const res = await fetch(`${apiBase}/api/auth/admins`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addForm.name,
          email: addForm.email,
          password: addForm.password,
          role: addForm.role,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setAddError(data.error || 'فشل الإضافة');
        return;
      }
      setAddForm(emptyForm);
      setShowAddForm(false);
      await load();
    } catch {
      setAddError('خطأ في الاتصال');
    } finally {
      setAdding(false);
    }
  };

  if (loading)
    return (
      <p style={{ color: '#94a3b8', textAlign: 'center', padding: '3rem' }}>
        جاري التحميل...
      </p>
    );
  if (error)
    return (
      <div
        style={{ ...S.card, color: '#fca5a5', textAlign: 'center' }}
      >
        ❌ {error}
      </div>
    );

  const cities = COUNTRY_CITIES[addForm.country] || [];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div>
          <h2 style={{ color: 'white', margin: 0, fontWeight: 700 }}>
            👥 إدارة المسؤولين
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '4px 0 0' }}>
            {admins.length} مسؤول مسجل
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {pendingCount > 0 && (
            <a
              href="/admin/approvals"
              style={{
                background: 'rgba(245,158,11,0.15)',
                border: '1px solid rgba(245,158,11,0.4)',
                color: '#fcd34d',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              ⏳ {pendingCount} طلب منتظر →
            </a>
          )}
          <button
            onClick={() => {
              setShowAddForm((v) => !v);
              setAddError('');
            }}
            style={S.btn('#10b981')}
          >
            {showAddForm ? '✖ إلغاء' : '+ إضافة مسؤول'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div
          style={{
            ...S.card,
            marginBottom: 16,
            border: '1px solid rgba(16,185,129,0.3)',
          }}
        >
          <h3
            style={{
              color: '#34d399',
              margin: '0 0 14px',
              fontSize: '0.95rem',
            }}
          >
            ➕ إضافة مسؤول جديد
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}
          >
            <div>
              <label style={S.label}>الاسم *</label>
              <input
                style={S.inp}
                value={addForm.name}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="أحمد محمد"
              />
            </div>
            <div>
              <label style={S.label}>البريد *</label>
              <input
                style={S.inp}
                type="email"
                value={addForm.email}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label style={S.label}>كلمة المرور *</label>
              <input
                style={S.inp}
                type="password"
                value={addForm.password}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder="6+ أحرف"
              />
            </div>
            <div>
              <label style={S.label}>الهاتف</label>
              <input
                style={S.inp}
                value={addForm.phone}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="+963..."
              />
            </div>
            <div>
              <label style={S.label}>الدولة</label>
              <select
                style={S.inp}
                value={addForm.country}
                onChange={(e) =>
                  setAddForm((f) => ({
                    ...f,
                    country: e.target.value,
                    city: '',
                  }))
                }
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={S.label}>المدينة</label>
              {cities.length > 0 ? (
                <select
                  style={S.inp}
                  value={addForm.city}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, city: e.target.value }))
                  }
                >
                  <option value="">— اختر —</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  style={S.inp}
                  value={addForm.city}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, city: e.target.value }))
                  }
                  placeholder="المدينة"
                />
              )}
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={S.label}>الصلاحية</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(['admin', 'moderator', 'super_admin'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setAddForm((f) => ({ ...f, role: r }))}
                    style={{
                      ...S.btn(
                        addForm.role === r ? ROLE_LABELS[r].color : '#1e2235'
                      ),
                      fontSize: '0.8rem',
                      padding: '0.35rem 0.8rem',
                      border:
                        addForm.role === r
                          ? `1px solid ${ROLE_LABELS[r].color}`
                          : '1px solid #334155',
                    }}
                  >
                    {ROLE_LABELS[r].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {addError && (
            <p style={{ color: '#fca5a5', fontSize: '0.82rem', margin: '8px 0 0' }}>
              ❌ {addError}
            </p>
          )}
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button
              onClick={addAdmin}
              disabled={adding}
              style={S.btn('#10b981')}
            >
              {adding ? 'جاري...' : '✅ إضافة المسؤول'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              style={{
                ...S.btn(),
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#94a3b8',
              }}
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {admins.map((admin) => {
          const roleInfo = ROLE_LABELS[admin.role] || {
            label: admin.role,
            color: '#6b7280',
          };
          const statusInfo = STATUS_LABELS[admin.approval_status || 'approved'] || {
            label: admin.approval_status,
            color: '#6b7280',
          };
          const isSelf = admin.id === myId;
          const isDisabled = !admin.is_active;
          return (
            <div
              key={admin.id}
              style={{
                ...S.card,
                opacity: isDisabled ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
                borderColor: isDisabled
                  ? 'rgba(239,68,68,0.3)'
                  : admin.role === 'super_admin'
                    ? 'rgba(245,158,11,0.3)'
                    : 'rgba(108,99,255,0.15)',
              }}
            >
              {admin.google_picture ? (
                <img
                  src={admin.google_picture}
                  alt={admin.name}
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    flexShrink: 0,
                    border: '2px solid rgba(255,255,255,0.1)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: roleInfo.color,
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    flexShrink: 0,
                  }}
                >
                  {admin.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 150 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ color: 'white', fontWeight: 600 }}>
                    {admin.name}
                  </span>
                  {isSelf && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        background: 'rgba(108,99,255,0.2)',
                        color: '#818cf8',
                        padding: '1px 6px',
                        borderRadius: 4,
                      }}
                    >
                      أنت
                    </span>
                  )}
                  {isDisabled && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        background: 'rgba(239,68,68,0.2)',
                        color: '#fca5a5',
                        padding: '1px 6px',
                        borderRadius: 4,
                      }}
                    >
                      معطّل
                    </span>
                  )}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                  {admin.google_email || admin.email}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    marginTop: 4,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.7rem',
                      background: 'rgba(255,255,255,0.05)',
                      color: roleInfo.color,
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}
                  >
                    {roleInfo.label}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      background: 'rgba(255,255,255,0.05)',
                      color: statusInfo.color,
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}
                  >
                    {statusInfo.label}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#4b5563' }}>
                    {admin.auth_method === 'google' ? '🔵 Google' : '🔑 بريد'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#374151' }}>
                    {new Date(admin.created_at).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
              </div>
              {!isSelf && (
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    flexShrink: 0,
                    flexWrap: 'wrap',
                  }}
                >
                  {admin.approval_status === 'pending' && (
                    <>
                      <button
                        onClick={() => approve(admin.id)}
                        disabled={processing === admin.id}
                        style={S.btn('#10b981')}
                      >
                        ✅ موافقة
                      </button>
                      <button
                        onClick={() => reject(admin.id)}
                        disabled={processing === admin.id}
                        style={{
                          ...S.btn(),
                          background: 'rgba(239,68,68,0.15)',
                          border: '1px solid rgba(239,68,68,0.4)',
                          color: '#fca5a5',
                        }}
                      >
                        ❌ رفض
                      </button>
                    </>
                  )}
                  {admin.approval_status !== 'pending' && admin.is_active === 1 && (
                    <>
                      <select
                        value={admin.role}
                        onChange={(e) =>
                          changeRole(admin.id, e.target.value)
                        }
                        disabled={processing === admin.id}
                        style={{
                          ...S.inp,
                          width: 'auto',
                          fontSize: '0.78rem',
                          padding: '0.3rem 0.5rem',
                        }}
                      >
                        <option value="admin">⚙️ مسؤول</option>
                        <option value="moderator">👁️ مشاهد</option>
                        <option value="super_admin">👑 رئيسي</option>
                      </select>
                      <button
                        onClick={() =>
                          setEditingPermsFor({
                            id: admin.id,
                            name: admin.name,
                          })
                        }
                        style={{
                          ...S.btn('#1e3a5f'),
                          fontSize: '0.78rem',
                          padding: '0.3rem 0.6rem',
                          border: '1px solid rgba(59,130,246,0.4)',
                          color: '#60a5fa',
                        }}
                      >
                        🔐 صلاحيات
                      </button>
                      <button
                        onClick={() => deactivate(admin.id)}
                        disabled={processing === admin.id}
                        style={{
                          ...S.btn(),
                          fontSize: '0.78rem',
                          padding: '0.3rem 0.6rem',
                          background: 'rgba(239,68,68,0.1)',
                          color: '#fca5a5',
                          border: '1px solid rgba(239,68,68,0.3)',
                        }}
                      >
                        🚫 تعطيل
                      </button>
                    </>
                  )}
                  {admin.is_active === 0 && (
                    <button
                      onClick={() => reactivate(admin.id)}
                      disabled={processing === admin.id}
                      style={S.btn('#10b981')}
                    >
                      ✅ تنشيط
                    </button>
                  )}
                  {processing === admin.id && (
                    <span
                      style={{
                        color: '#94a3b8',
                        fontSize: '0.8rem',
                        alignSelf: 'center',
                      }}
                    >
                      ...
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingPermsFor && (
        <AdminPermissionsEditor
          adminId={editingPermsFor.id}
          adminName={editingPermsFor.name}
          token={token}
          apiBase={apiBase}
          onClose={() => setEditingPermsFor(null)}
        />
      )}
    </div>
  );
}