'use client';
/**
 * ContactInteractionLog — سجل تواصل شامل لجهة اتصال محددة
 * يعرض كل التواصلات، الإحصائيات، وعدد مرات التواصل
 */
import { useState, useEffect } from 'react';

const S = {
  inp: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '0.5rem', padding: '0.55rem 0.85rem', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem', colorScheme: 'dark' } as React.CSSProperties,
  card: { background: '#13102a', border: '1px solid rgba(108,99,255,0.15)', borderRadius: '1rem', padding: '1.25rem' } as React.CSSProperties,
  btn: (color = '#6C63FF') => ({ background: color, color: 'white', border: 'none', borderRadius: '0.4rem', padding: '0.45rem 1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 } as React.CSSProperties),
};

const CHANNEL_ICONS: Record<string, string> = {
  call: '📞', whatsapp: '💬', email: '📧', meeting: '🤝', sms: '📱', other: '🔔',
};
const CHANNEL_LABELS: Record<string, string> = {
  call: 'مكالمة', whatsapp: 'واتساب', email: 'بريد', meeting: 'اجتماع', sms: 'رسالة نصية', other: 'أخرى',
};
const DIR_COLOR: Record<string, string> = { outbound: '#10b981', inbound: '#3b82f6' };
const DIR_LABEL: Record<string, string> = { outbound: '↑ صادر', inbound: '↓ وارد' };

interface Interaction {
  id: number;
  channel: string;
  direction: string;
  subject: string;
  summary?: string;
  logged_by?: string;
  created_at: string;
  event_name_ar?: string;
}

interface Stats {
  total: number;
  by_channel: Record<string, number>;
  by_direction: Record<string, number>;
  last_contact?: string;
  first_contact?: string;
}

interface Props {
  contactId: number;
  contactName?: string;
  token: string;
  apiBase: string;
  onClose: () => void;
}

export default function ContactInteractionLog({ contactId, contactName, token, apiBase, onClose }: Props) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  useEffect(() => {
    loadData();
  }, [contactId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // جلب كل التواصلات لجهة الاتصال
      const res = await fetch(`${apiBase}/api/crm/interactions?contact_id=${contactId}`, { headers });
      const data = await res.json();
      
      if (data.success) {
        const items = data.data || [];
        setInteractions(items);
        
        // حساب الإحصائيات
        const byChannel: Record<string, number> = {};
        const byDirection: Record<string, number> = {};
        
        items.forEach((item: Interaction) => {
          byChannel[item.channel] = (byChannel[item.channel] || 0) + 1;
          byDirection[item.direction] = (byDirection[item.direction] || 0) + 1;
        });
        
        setStats({
          total: items.length,
          by_channel: byChannel,
          by_direction: byDirection,
          last_contact: items[0]?.created_at,
          first_contact: items[items.length - 1]?.created_at,
        });
      }
    } catch (err) {
      console.error('Failed to load interactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (d: string) => new Date(d).toLocaleString('ar-SA', { 
    year: 'numeric', month: 'short', day: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  });

  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.7)', zIndex: 999, 
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      padding: 20 
    }} onClick={onClose}>
      <div style={{ 
        background: '#1a1537', borderRadius: '1rem', 
        maxWidth: 900, width: '100%', maxHeight: '90vh', 
        overflow: 'auto', border: '1px solid rgba(108,99,255,0.3)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ 
          padding: '1.5rem 2rem', 
          borderBottom: '1px solid rgba(108,99,255,0.2)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, color: 'white', fontSize: '1.3rem', fontWeight: 700 }}>
              💬 سجل التواصل الكامل
            </h2>
            {contactName && (
              <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
                لـ: <strong style={{ color: '#a5b4fc' }}>{contactName}</strong>
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ 
            background: 'rgba(255,255,255,0.1)', 
            border: 'none', borderRadius: '0.5rem', 
            color: 'white', padding: '0.5rem 1rem', 
            cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 
          }}>
            ✕ إغلاق
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem 2rem' }}>
          {loading ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>جاري التحميل...</p>
          ) : (
            <>
              {/* Statistics */}
              {stats && (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                  gap: 12, 
                  marginBottom: 24 
                }}>
                  {/* Total */}
                  <div style={{ 
                    ...S.card, 
                    background: 'linear-gradient(135deg, #6C63FF 0%, #8b5cf6 100%)',
                    border: 'none',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>💬</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>
                      {stats.total}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                      إجمالي التواصلات
                    </div>
                  </div>

                  {/* By Channel */}
                  {Object.entries(stats.by_channel).slice(0, 2).map(([channel, count]) => (
                    <div key={channel} style={{ ...S.card, textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>
                        {CHANNEL_ICONS[channel] || '🔔'}
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>
                        {count}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {CHANNEL_LABELS[channel] || channel}
                      </div>
                    </div>
                  ))}

                  {/* By Direction */}
                  {Object.entries(stats.by_direction).map(([dir, count]) => (
                    <div key={dir} style={{ ...S.card, textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: 8, color: DIR_COLOR[dir] }}>
                        {dir === 'outbound' ? '↑' : '↓'}
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>
                        {count}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {DIR_LABEL[dir] || dir}
                      </div>
                    </div>
                  ))}

                  {/* Last Contact */}
                  {stats.last_contact && (
                    <div style={{ ...S.card, gridColumn: 'span 2' }}>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 4 }}>
                        آخر تواصل
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'white', fontWeight: 600 }}>
                        {fmt(stats.last_contact)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Timeline */}
              <div>
                <h3 style={{ 
                  color: '#a5b4fc', fontSize: '1rem', fontWeight: 700, 
                  marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 
                }}>
                  <span style={{ 
                    width: 4, height: 20, background: '#6C63FF', borderRadius: 2 
                  }}></span>
                  السجل الزمني
                </h3>

                {interactions.length === 0 ? (
                  <div style={{ 
                    ...S.card, textAlign: 'center', 
                    padding: '2rem', color: '#64748b' 
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>📭</div>
                    <p style={{ margin: 0 }}>لا يوجد سجل تواصل حتى الآن</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {interactions.map((item, idx) => (
                      <div key={item.id} style={{ 
                        ...S.card, 
                        display: 'flex', 
                        gap: 12, 
                        alignItems: 'flex-start',
                        borderLeft: `3px solid ${DIR_COLOR[item.direction] || '#6b7280'}`,
                        paddingLeft: '1rem'
                      }}>
                        {/* Icon */}
                        <div style={{ 
                          width: 38, height: 38, borderRadius: '50%', 
                          background: `${DIR_COLOR[item.direction] || '#6b7280'}20`, 
                          border: `1px solid ${DIR_COLOR[item.direction] || '#6b7280'}40`, 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          fontSize: '1.1rem', flexShrink: 0 
                        }}>
                          {CHANNEL_ICONS[item.channel] || '🔔'}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            display: 'flex', alignItems: 'center', 
                            gap: 8, flexWrap: 'wrap', marginBottom: 4 
                          }}>
                            <span style={{ 
                              color: 'white', fontWeight: 600, fontSize: '0.88rem' 
                            }}>
                              {item.subject}
                            </span>
                            <span style={{ 
                              fontSize: '0.68rem', 
                              background: `${DIR_COLOR[item.direction] || '#6b7280'}20`, 
                              color: DIR_COLOR[item.direction] || '#6b7280', 
                              padding: '2px 7px', borderRadius: 99, fontWeight: 600 
                            }}>
                              {DIR_LABEL[item.direction] || item.direction}
                            </span>
                            <span style={{ 
                              fontSize: '0.68rem', color: '#64748b', 
                              background: 'rgba(255,255,255,0.05)', 
                              padding: '2px 7px', borderRadius: 99 
                            }}>
                              {CHANNEL_LABELS[item.channel] || item.channel}
                            </span>
                          </div>

                          {item.summary && (
                            <p style={{ 
                              color: '#94a3b8', fontSize: '0.8rem', 
                              margin: '0 0 6px', lineHeight: 1.5 
                            }}>
                              {item.summary}
                            </p>
                          )}

                          <div style={{ 
                            display: 'flex', gap: 12, flexWrap: 'wrap', 
                            fontSize: '0.72rem', color: '#64748b' 
                          }}>
                            <span>🕐 {fmt(item.created_at)}</span>
                            {item.logged_by && <span>✍️ {item.logged_by}</span>}
                            {item.event_name_ar && <span>📍 {item.event_name_ar}</span>}
                          </div>
                        </div>

                        {/* Timeline indicator */}
                        {idx < interactions.length - 1 && (
                          <div style={{ 
                            position: 'absolute', right: 49, top: 50, 
                            width: 2, height: 10, 
                            background: 'rgba(108,99,255,0.2)' 
                          }} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
