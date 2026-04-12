const TOKEN_KEY = "erp_token";
const ROLE_KEY = "erp_role";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function setAuthToken(token: string, role?: string): void {
  if (typeof document === "undefined") return;

  localStorage.setItem(TOKEN_KEY, token);
  if (role) {
    localStorage.setItem(ROLE_KEY, role);
  }

  const cookieValue = encodeURIComponent(token);
  document.cookie = `${TOKEN_KEY}=${cookieValue}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  if (role) {
    document.cookie = `${ROLE_KEY}=${encodeURIComponent(role)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  }
}

export function clearAuthToken(): void {
  if (typeof document === "undefined") return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = `${ROLE_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  let tokenFromCookie: string | null = null;
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(TOKEN_KEY + "=")) {
      tokenFromCookie = decodeURIComponent(cookie.substring(TOKEN_KEY.length + 1));
      break;
    }
  }

  if (tokenFromCookie) return tokenFromCookie;

  const tokenFromStorage = localStorage.getItem(TOKEN_KEY);
  if (tokenFromStorage) {
    const cookieValue = encodeURIComponent(tokenFromStorage);
    document.cookie = `${TOKEN_KEY}=${cookieValue}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    const role = localStorage.getItem(ROLE_KEY);
    if (role) {
      document.cookie = `${ROLE_KEY}=${encodeURIComponent(role)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    }
    return tokenFromStorage;
  }

  return null;
}
