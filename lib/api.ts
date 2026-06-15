// lib/api.ts – API client
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'API error');
  return data;
}

export function getAuthHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// ── Event helpers ──────────────────────────────────────────────────────────────
export const fetchEvent = (slug: string) => apiFetch<any>(`/api/events/${slug}`);
export const fetchSpeakers = (eventId: number) => apiFetch<any>(`/api/events/${eventId}/speakers`);
export const fetchAgenda = (eventId: number) => apiFetch<any>(`/api/events/${eventId}/agenda`);
export const fetchStats = (eventId: number) => apiFetch<any>(`/api/events/${eventId}/stats`);
export const fetchSponsors = (eventId: number) => apiFetch<any>(`/api/events/${eventId}/sponsors`);
export const fetchFaqs = (eventId: number) => apiFetch<any>(`/api/events/${eventId}/faqs`);

export const submitRegistration = (eventId: number, body: any) =>
  apiFetch<any>(`/api/events/${eventId}/registrations`, { method: 'POST', body: JSON.stringify(body) });

// ── Admin helpers ──────────────────────────────────────────────────────────────
export const adminLogin = (email: string, password: string) =>
  apiFetch<any>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const fetchRegistrations = (eventId: number, token: string, params?: string) =>
  apiFetch<any>(`/api/events/${eventId}/registrations${params ? '?' + params : ''}`, {
    headers: getAuthHeaders(token)
  });

export const updateRegistration = (eventId: number, id: number, body: any, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/registrations/${id}`, {
    method: 'PUT', body: JSON.stringify(body), headers: getAuthHeaders(token)
  });
