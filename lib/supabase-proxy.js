import { createClient } from '@supabase/supabase-js';

const proxyUrl = typeof window !== 'undefined'
  ? window.location.origin + '/api/proxy/supabase'
  : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000') + '/api/proxy/supabase';

export const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  try { return sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token'); }
  catch (e) { return null; }
};

// Custom fetch: inject X-Admin-Token header when cookies are unavailable (Shopify WKWebView on iOS)
export const customFetch = (url, options = {}) => {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set('X-Admin-Token', token);

  // Prevent caching of Supabase proxy requests
  const newOptions = { ...options, headers, cache: 'no-store' };
  
  // Add robust cache control headers
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');

  return fetch(url, newOptions).then(response => {
    // Intercept 401 at fetch level — dispatch event so ClientAuth can show login form
    if (response.status === 401 && typeof window !== 'undefined') {
      if (token) {
        try { sessionStorage.removeItem('admin_token'); } catch (e) {}
        try { localStorage.removeItem('admin_token'); } catch (e) {}
      }
      window.dispatchEvent(new Event('rental-auth-failed'));
    }
    return response;
  });
};

export const supabaseProxy = createClient(proxyUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy', {
  global: { fetch: customFetch }
});
