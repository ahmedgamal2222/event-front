// lib/api.ts – API client
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev';

if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_API_URL) {
  console.warn('⚠️ NEXT_PUBLIC_API_URL not set, using default API endpoint');
}

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

// ── Public helpers ─────────────────────────────────────────────────────────────
export const fetchEvent     = (slug: string) => apiFetch<any>(`/api/events/${slug}`);
export const fetchSpeakers  = (eventId: number) => apiFetch<any>(`/api/events/${eventId}/speakers`);
export const fetchAgenda    = (eventId: number) => apiFetch<any>(`/api/events/${eventId}/agenda`);
export const fetchStats     = (eventId: number) => apiFetch<any>(`/api/events/${eventId}/stats`);
export const fetchSponsors  = (eventId: number) => apiFetch<any>(`/api/events/${eventId}/sponsors`);
export const fetchFaqs      = (eventId: number) => apiFetch<any>(`/api/events/${eventId}/faqs`);

export const submitRegistration = (eventId: number, body: any) =>
  apiFetch<any>(`/api/events/${eventId}/registrations`, { method: 'POST', body: JSON.stringify(body) });

// ── Admin – Auth ───────────────────────────────────────────────────────────────
export const adminLogin = (email: string, password: string) =>
  apiFetch<any>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

// ── Admin – Events ─────────────────────────────────────────────────────────────
export const fetchAllEvents = (token: string) =>
  apiFetch<any>('/api/events/all', { headers: getAuthHeaders(token) });

export const updateEvent = (id: number, body: any, token: string) =>
  apiFetch<any>(`/api/events/${id}`, { method: 'PUT', body: JSON.stringify(body), headers: getAuthHeaders(token) });

export const createEvent = (body: any, token: string) =>
  apiFetch<any>('/api/events', { method: 'POST', body: JSON.stringify(body), headers: getAuthHeaders(token) });

// ── Admin – Registrations ──────────────────────────────────────────────────────
export const fetchRegistrations = (eventId: number, token: string, params?: string) =>
  apiFetch<any>(`/api/events/${eventId}/registrations${params ? '?' + params : ''}`, {
    headers: getAuthHeaders(token)
  });

export const updateRegistration = (eventId: number, id: number, body: any, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/registrations/${id}`, {
    method: 'PUT', body: JSON.stringify(body), headers: getAuthHeaders(token)
  });

// ── Admin – Speakers ───────────────────────────────────────────────────────────
export const createSpeaker = (eventId: number, body: any, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/speakers`, { method: 'POST', body: JSON.stringify(body), headers: getAuthHeaders(token) });

export const updateSpeaker = (eventId: number, id: number, body: any, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/speakers/${id}`, { method: 'PUT', body: JSON.stringify(body), headers: getAuthHeaders(token) });

export const deleteSpeaker = (eventId: number, id: number, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/speakers/${id}`, { method: 'DELETE', headers: getAuthHeaders(token) });

// ── Admin – Sponsors ───────────────────────────────────────────────────────────
export const createSponsor = (eventId: number, body: any, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/sponsors`, { method: 'POST', body: JSON.stringify(body), headers: getAuthHeaders(token) });

export const updateSponsor = (eventId: number, id: number, body: any, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/sponsors/${id}`, { method: 'PUT', body: JSON.stringify(body), headers: getAuthHeaders(token) });

export const deleteSponsor = (eventId: number, id: number, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/sponsors/${id}`, { method: 'DELETE', headers: getAuthHeaders(token) });

// ── Admin – FAQs ───────────────────────────────────────────────────────────────
export const createFaq = (eventId: number, body: any, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/faqs`, { method: 'POST', body: JSON.stringify(body), headers: getAuthHeaders(token) });

export const deleteFaq = (eventId: number, id: number, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/faqs/${id}`, { method: 'DELETE', headers: getAuthHeaders(token) });

// ── Admin – Agenda ─────────────────────────────────────────────────────────────
export const createAgendaDay = (eventId: number, body: any, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/agenda/days`, { method: 'POST', body: JSON.stringify(body), headers: getAuthHeaders(token) });

export const updateAgendaDay = (eventId: number, id: number, body: any, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/agenda/days/${id}`, { method: 'PUT', body: JSON.stringify(body), headers: getAuthHeaders(token) });

export const createAgendaSession = (eventId: number, body: any, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/agenda/sessions`, { method: 'POST', body: JSON.stringify(body), headers: getAuthHeaders(token) });

export const updateAgendaSession = (eventId: number, id: number, body: any, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/agenda/sessions/${id}`, { method: 'PUT', body: JSON.stringify(body), headers: getAuthHeaders(token) });

export const deleteAgendaSession = (eventId: number, id: number, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/agenda/sessions/${id}`, { method: 'DELETE', headers: getAuthHeaders(token) });

// ── Admin – Uploads ────────────────────────────────────────────────────────────
export async function uploadImage(file: File, token: string): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${API_BASE}/api/uploads/image`, {
    method: 'POST',
    body: formData,
    headers: { Authorization: `Bearer ${token}` },
  });
  
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Upload failed');
  return { url: data.url, filename: data.filename };
}

export async function deleteImage(filename: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/uploads/${filename}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Delete failed');
}
