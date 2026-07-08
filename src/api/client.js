import { API_BASE_URL } from '../config';

export async function apiPost(path, body, idToken) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: idToken } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `요청이 실패했습니다 (${res.status})`);
  }
  return data;
}
