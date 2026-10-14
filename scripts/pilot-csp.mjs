/**
 * Pilot builds only: let the pages reach the pilot's Supabase project and
 * the Google Classroom API. The public build keeps `connect-src 'self'`,
 * because this plugin changes nothing unless VITE_CLOUD_CLASS_LOGIN is
 * 'true' AND a Supabase URL is set.
 */
export const CLASSROOM_ORIGIN = 'https://classroom.googleapis.com';

/** The origins a pilot page must be allowed to connect to. */
export function pilotConnectOrigins(env = {}) {
  if (env.VITE_CLOUD_CLASS_LOGIN !== 'true' || !env.VITE_SUPABASE_URL) return [];
  const supabase = new URL(env.VITE_SUPABASE_URL);
  if (supabase.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(supabase.hostname)) {
    throw new Error('The pilot Supabase URL must use HTTPS.');
  }
  const socket = `${supabase.protocol === 'https:' ? 'wss' : 'ws'}://${supabase.host}`;
  return [supabase.origin, socket, CLASSROOM_ORIGIN];
}

/** Add origins to the meta Content-Security-Policy's connect-src. */
export function widenConnectSrc(html, origins) {
  if (!origins.length) return html;
  return html.replace(/connect-src 'self'/u, `connect-src 'self' ${origins.join(' ')}`);
}

export function pilotCsp(env) {
  const origins = pilotConnectOrigins(env);
  return {
    name: 'bloomtype-pilot-csp',
    transformIndexHtml(html) {
      return widenConnectSrc(html, origins);
    },
  };
}
