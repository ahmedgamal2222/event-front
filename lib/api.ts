// lib/api.ts – API client
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://event-api.info1703.workers.dev';

// Simple in-memory cache
const cache = new Map<string, { data: any; time: number }>();
const CACHE_TTL = 60000; // 60 seconds

if (typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_API_URL) {
  console.warn('⚠️ NEXT_PUBLIC_API_URL not set, using default API endpoint');
}

export async function apiFetch<T>(path: string, options?: RequestInit, bypassCache = false): Promise<T> {
  const isGet = !options?.method || options.method === 'GET';
  // Admin requests (with Authorization header) always bypass cache
  const hasAuth = !!(options?.headers as any)?.Authorization;

  // Check in-memory cache for GET requests (unless bypassed or admin)
  if (isGet && !bypassCache && !hasAuth) {
    const cached = cache.get(path);
    if (cached && Date.now() - cached.time < CACHE_TTL) {
      return cached.data;
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...options?.headers,
    },
    // Always bypass browser/CDN cache for API calls
    cache: 'no-store',
  });
  
  // Check if response is JSON
  const contentType = res.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    const text = await res.text();
    console.error('❌ Non-JSON response:', text);
    throw new Error(`Server error (${res.status}): Invalid response format`);
  }
  
  const data = await res.json();
  if (!data.success) {
    console.error('❌ API Error:', data.error);
    // Auto-logout on expired/invalid token
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      window.location.href = '/admin';
      throw new Error('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً');
    }
    throw new Error(data.error || 'API error');
  }
  
  // Store in in-memory cache for GET responses
  if (isGet) {
    cache.set(path, { data, time: Date.now() });
  }
  
  return data;
}

// Clear cache function
export function clearApiCache() {
  cache.clear();
}

export function clearApiCacheFor(path: string) {
  cache.delete(path);
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

export const deleteRegistration = (eventId: number, id: number, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/registrations/${id}`, {
    method: 'DELETE', headers: getAuthHeaders(token)
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

// ── Public – Tickets ───────────────────────────────────────────────────────────
export const fetchTickets = (eventId: number, bypass = false) =>
  apiFetch<any>(`/api/events/${eventId}/tickets`, undefined, bypass);

export const fetchTicketAvailability = (eventId: number, ticketTypeId: number) =>
  apiFetch<any>(`/api/events/${eventId}/tickets/available/${ticketTypeId}`);

// ── Admin – Tickets ────────────────────────────────────────────────────────────
export const createTicketType = (eventId: number, body: any, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/tickets`, { 
    method: 'POST', body: JSON.stringify(body), headers: getAuthHeaders(token) 
  });

export const updateTicketType = (eventId: number, id: number, body: any, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/tickets/${id}`, { 
    method: 'PUT', body: JSON.stringify(body), headers: getAuthHeaders(token) 
  });

export const deleteTicketType = (eventId: number, id: number, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/tickets/${id}`, { 
    method: 'DELETE', headers: getAuthHeaders(token) 
  });

// ── Public – Support Messages ──────────────────────────────────────────────────
export const submitSupportMessage = (eventId: number, body: any) =>
  apiFetch<any>(`/api/events/${eventId}/support/messages`, { 
    method: 'POST', body: JSON.stringify(body) 
  });

export const fetchPixelCodes = (eventId: number) =>
  apiFetch<any>(`/api/events/${eventId}/support/pixels`);

// ── Admin – Support Messages ───────────────────────────────────────────────────
export const fetchSupportMessages = (eventId: number, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/support/messages`, { 
    headers: getAuthHeaders(token) 
  });

export const fetchSupportMessage = (eventId: number, id: number, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/support/messages/${id}`, { 
    headers: getAuthHeaders(token) 
  });

export const respondToSupportMessage = (eventId: number, id: number, body: any, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/support/messages/${id}`, { 
    method: 'PUT', body: JSON.stringify(body), headers: getAuthHeaders(token) 
  });

// ── Admin – Pixel Tracking ─────────────────────────────────────────────────────
export const updatePixelCodes = (eventId: number, body: any, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/support/pixels`, { 
    method: 'PUT', body: JSON.stringify(body), headers: getAuthHeaders(token) 
  });

// ── Public – Tickets Config ───────────────────────────────────────────────────
export const fetchTicketsConfig = (eventId: number) =>
  apiFetch<any>(`/api/events/${eventId}/tickets-config`);

// ── Admin – Tickets Config ────────────────────────────────────────────────────
export const updateTicketsConfig = (eventId: number, body: any, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/tickets-config`, { 
    method: 'POST', body: JSON.stringify(body), headers: getAuthHeaders(token) 
  });
// ── Admin – Email Settings ────────────────────────────────────────────────
export const fetchEmailSettings = (eventId: number, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/email-settings`, { 
    headers: getAuthHeaders(token) 
  });

export const createEmailSettings = (eventId: number, body: any, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/email-settings`, { 
    method: 'POST', body: JSON.stringify(body), headers: getAuthHeaders(token) 
  });

export const updateEmailSettings = (eventId: number, body: any, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/email-settings`, { 
    method: 'PUT', body: JSON.stringify(body), headers: getAuthHeaders(token) 
  });

// ── Public – Venue Gallery ────────────────────────────────────────────────
export const fetchVenueGallery = (eventId: number) =>
  apiFetch<any>(`/api/events/${eventId}/venue`);

// ── Admin – Venue Gallery ─────────────────────────────────────────────────
export const fetchVenueGalleryAdmin = (eventId: number, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/venue/all`, { headers: getAuthHeaders(token) });

export const createVenueMedia = (eventId: number, body: any, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/venue`, { 
    method: 'POST', body: JSON.stringify(body), headers: getAuthHeaders(token) 
  });

export const updateVenueMedia = (eventId: number, id: number, body: any, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/venue/${id}`, { 
    method: 'PUT', body: JSON.stringify(body), headers: getAuthHeaders(token) 
  });

export const deleteVenueMedia = (eventId: number, id: number, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/venue/${id}`, { 
    method: 'DELETE', headers: getAuthHeaders(token) 
  });

// ── Public – Articles ─────────────────────────────────────────────────────
export const fetchArticles = (eventId: number, params = '') =>
  apiFetch<any>(`/api/events/${eventId}/articles${params ? '?' + params : ''}`);

export const fetchArticle = (eventId: number, slug: string) =>
  apiFetch<any>(`/api/events/${eventId}/articles/${slug}`);

// ── Admin – Articles ──────────────────────────────────────────────────────
export const fetchArticlesAdmin = (eventId: number, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/articles/admin/all`, { headers: getAuthHeaders(token) });

export const createArticle = (eventId: number, body: any, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/articles`, {
    method: 'POST', body: JSON.stringify(body), headers: getAuthHeaders(token)
  });

export const updateArticle = (eventId: number, id: number, body: any, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/articles/${id}`, {
    method: 'PUT', body: JSON.stringify(body), headers: getAuthHeaders(token)
  });

export const deleteArticle = (eventId: number, id: number, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/articles/${id}`, {
    method: 'DELETE', headers: getAuthHeaders(token)
  });

// ── Public – Terms & Privacy ───────────────────────────────────────────────
export const fetchTerms = (eventId: number) =>
  apiFetch<any>(`/api/events/${eventId}/terms`);

// ── Admin – Terms & Privacy ────────────────────────────────────────────────
export const updateTerms = (eventId: number, body: any, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/terms`, {
    method: 'PUT', body: JSON.stringify(body), headers: getAuthHeaders(token)
  });

// ── Public – Static Pages ──────────────────────────────────────────────────
export const fetchPages = (eventId: number, position?: string) =>
  apiFetch<any>(`/api/events/${eventId}/pages${position ? '?position=' + position : ''}`);

export const fetchPage = (eventId: number, slug: string) =>
  apiFetch<any>(`/api/events/${eventId}/pages/${slug}`);

// ── Admin – Static Pages ───────────────────────────────────────────────────
export const fetchPagesAdmin = (eventId: number, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/pages/admin/all`, { headers: getAuthHeaders(token) });

export const createPage = (eventId: number, body: any, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/pages`, {
    method: 'POST', body: JSON.stringify(body), headers: getAuthHeaders(token)
  });

export const updatePage = (eventId: number, id: number, body: any, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/pages/${id}`, {
    method: 'PUT', body: JSON.stringify(body), headers: getAuthHeaders(token)
  });

export const deletePage = (eventId: number, id: number, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/pages/${id}`, {
    method: 'DELETE', headers: getAuthHeaders(token)
  });

// ── Admin – Auth Profile ───────────────────────────────────────────────────
export const updateAdminProfile = (body: any, token: string) =>
  apiFetch<any>('/api/auth/profile', {
    method: 'PUT', body: JSON.stringify(body), headers: getAuthHeaders(token)
  });

// ── Admin – File Upload ────────────────────────────────────────────────────
export async function uploadFile(file: File, token: string): Promise<{ url: string; filename: string; originalName: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/api/uploads/file`, {
    method: 'POST',
    body: formData,
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Upload failed');
  return { url: data.url, filename: data.filename, originalName: data.originalName };
}

// ── Public – Payments ──────────────────────────────────────────────────────
export const fetchPaymentSettingsPublic = (eventId: number) =>
  apiFetch<any>(`/api/events/${eventId}/payments/settings-public`);

export const initiatePayment = (eventId: number, body: any) =>
  apiFetch<any>(`/api/events/${eventId}/payments/initiate`, {
    method: 'POST', body: JSON.stringify(body)
  });

export const checkPaymentStatus = (eventId: number, orderRef: string) =>
  apiFetch<any>(`/api/events/${eventId}/payments/check/${orderRef}`, undefined, true);

// ── Public – Countries ─────────────────────────────────────────────────────
export const fetchCountries = (eventId: number) =>
  apiFetch<any>(`/api/events/${eventId}/countries`);

// ── Admin – Countries ──────────────────────────────────────────────────────
export const fetchCountriesAdmin = (eventId: number, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/countries/all`, { headers: getAuthHeaders(token) });

export const createCountry = (eventId: number, body: any, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/countries`, { method: 'POST', body: JSON.stringify(body), headers: getAuthHeaders(token) });

export const updateCountry = (eventId: number, id: number, body: any, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/countries/${id}`, { method: 'PUT', body: JSON.stringify(body), headers: getAuthHeaders(token) });

export const deleteCountry = (eventId: number, id: number, token: string) =>
  apiFetch<any>(`/api/events/${eventId}/countries/${id}`, { method: 'DELETE', headers: getAuthHeaders(token) });