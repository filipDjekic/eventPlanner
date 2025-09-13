// src/utils/auth.js
export function stripDiacritics(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizeUloga(raw) {
  if (raw == null) return null;
  const str = stripDiacritics(String(raw).toLowerCase());
  if (str.includes('organizator') || str === '0') return 'Organizator';
  if (str.includes('dobavljac') || str.includes('dobavljač') || str === '1') return 'Dobavljac';
  return null;
}

export function isValidObjectId(x) {
  return typeof x === 'string' && /^[a-f\d]{24}$/i.test(x);
}

// Robustly parse login response from backend
export function parseLoginResponse(data) {
  if (!data || typeof data !== 'object') return null;
  const token = data.Token || data.token || data.JWT || data.jwt || '';
  const roleRaw = data.Uloga || data.uloga || data.Role || data.role;
  const id = data.Id || data.id || data.UserId || data.userId || null;
  const name = data.Ime || data.ime || data.Name || data.name || '';
  const emailVerified = data.VerifikovanEmail ?? data.verifikovanEmail ?? data.EmailVerified ?? data.emailVerified ?? true;
  return {
    token: String(token || ''),
    id: id ? String(id) : null,
    role: normalizeUloga(roleRaw),
    name: String(name || ''),
    emailVerified: Boolean(emailVerified),
  };
}

export function saveAuth(auth) {
  if (!auth) return;
  try {
    if (auth.token) localStorage.setItem('token', auth.token);
    localStorage.setItem('user', JSON.stringify({
      id: auth.id, role: auth.role, name: auth.name, emailVerified: auth.emailVerified
    }));
  } catch { /* ignore */ }
}

export function getAuth() {
  try {
    const token = localStorage.getItem('token') || '';
    const raw = localStorage.getItem('user');
    const user = raw ? JSON.parse(raw) : null;
    return {
      token,
      id: user?.id ?? null,
      role: user?.role ?? null,
      name: user?.name ?? null,
      emailVerified: user?.emailVerified ?? null,
    };
  } catch {
    return { token: '', id: null, role: null, name: null, emailVerified: null };
  }
}

export function getToken() {
  return localStorage.getItem('token') || '';
}

export function clearAuth() {
  try { localStorage.removeItem('token'); } catch {}
  try { localStorage.removeItem('user'); } catch {}
  try { localStorage.removeItem('Organizatori'); } catch {}
  try { localStorage.removeItem('Dobavljaci'); } catch {}
}
