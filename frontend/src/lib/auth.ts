const TOKEN_KEY = "erp_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function setAuthToken(token: string): void {
  if (typeof document === "undefined") return;
  
  // Set in localStorage for client-side persistence
  localStorage.setItem(TOKEN_KEY, token);
  
  // Set in cookie for middleware and SSR
  const cookieValue = encodeURIComponent(token);
  document.cookie = `${TOKEN_KEY}=${cookieValue}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function clearAuthToken(): void {
  if (typeof document === "undefined") return;
  
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  
  // 1. Try cookie first
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
  
  // 2. Fallback to localStorage and sync back to cookie
  const tokenFromStorage = localStorage.getItem(TOKEN_KEY);
  if (tokenFromStorage) {
    // Sync storage back to cookie if middleware needs it
    const cookieValue = encodeURIComponent(tokenFromStorage);
    document.cookie = `${TOKEN_KEY}=${cookieValue}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    return tokenFromStorage;
  }
  
  return null;
}
