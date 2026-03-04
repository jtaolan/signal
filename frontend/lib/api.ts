import { Brief, FeedsResponse, Source } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    next: { revalidate: 300 }, // 5-min ISR cache for GET requests
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

export async function fetchFeeds(
  theme?: string,
  cursor?: string,
  limit = 20,
): Promise<FeedsResponse> {
  const params = new URLSearchParams();
  if (theme) params.set('theme', theme);
  if (cursor) params.set('cursor', cursor);
  params.set('limit', String(limit));
  return apiFetch<FeedsResponse>(`/feeds?${params}`);
}

export async function fetchBrief(id: string): Promise<Brief> {
  return apiFetch<Brief>(`/briefs/${id}`);
}

export async function subscribe(
  email: string,
  themes: string[],
): Promise<{ message: string; unsubscribeUrl: string }> {
  const res = await fetch(`${API_URL}/subscriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, themes }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Subscription failed');
  }
  return res.json();
}

export async function unsubscribeByToken(
  token: string,
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/subscriptions/${token}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Unsubscribe failed');
  }
  return res.json();
}

export async function fetchSources(): Promise<{ sources: Source[] }> {
  const res = await fetch(`${API_URL}/sources`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch sources');
  return res.json();
}

export async function createSource(
  data: Omit<Source, 'sourceId' | 'createdAt' | 'last_ingested'>,
): Promise<Source> {
  const res = await fetch(`${API_URL}/sources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Create failed');
  }
  return res.json();
}

export async function updateSource(
  id: string,
  data: Partial<Source>,
): Promise<{ updated: string }> {
  const res = await fetch(`${API_URL}/sources/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Update failed');
  }
  return res.json();
}

export async function deleteSource(id: string): Promise<{ deleted: string }> {
  const res = await fetch(`${API_URL}/sources/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete failed');
  return res.json();
}
