import { auth } from "@/lib/auth"

const shouldLog = !!process.env.LOG_AUTH_DEBUG;

function redact(obj: any) {
  if (!obj || typeof obj !== 'object') return obj;
  const out: any = Array.isArray(obj) ? [] : {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (k.toLowerCase().includes('pass') || k.toLowerCase().includes('secret') || k === 'token') {
      out[k] = typeof v === 'string' ? '<redacted>' : v;
    } else if (typeof v === 'object') {
      out[k] = redact(v);
    } else if (typeof v === 'string') {
      out[k] = v.length > 64 ? v.slice(0, 32) + '…' : v;
    } else {
      out[k] = v;
    }
  }
  return out;
}

export async function GET(request: Request) {
  if (shouldLog) {
    try {
      const raw = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || '';
      const safe = raw.replace(/^prisma\+/, '');
      let hostInfo = { host: 'unknown', port: '' };
      try {
        const u = new URL(safe);
        hostInfo = { host: u.hostname, port: u.port || (u.protocol === 'postgres:' ? '5432' : '') };
      } catch (e) {
        // ignore parse errors
      }
      console.log('[api/auth] GET', { url: request.url, dbHost: hostInfo, cookiePreview: (request.headers.get('cookie') || '').slice(0, 200) });
    } catch (err) {
      console.log('[api/auth] GET', { url: request.url });
    }
  }
  return auth.handler(request)
}

export async function POST(request: Request) {
  if (shouldLog) {
    try {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const clone = request.clone();
        const body = await clone.json().catch(() => null);
        // also log DB host info and a cookie preview to help diagnose env issues
        const raw = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || '';
        const safe = raw.replace(/^prisma\+/, '');
        let hostInfo = { host: 'unknown', port: '' };
        try {
          const u = new URL(safe);
          hostInfo = { host: u.hostname, port: u.port || (u.protocol === 'postgres:' ? '5432' : '') };
        } catch (e) {
          // ignore
        }
        console.log('[api/auth] POST', { url: request.url, body: redact(body), dbHost: hostInfo, cookiePreview: (request.headers.get('cookie') || '').slice(0, 200) });
      } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        // Don't attempt to parse multipart/form-data here; just log headers
        console.log('[api/auth] POST', { url: request.url, contentType });
      } else {
        console.log('[api/auth] POST', { url: request.url, contentType });
      }
    } catch (err) {
      console.error('[api/auth] debug log failed', err);
    }
  }

  return auth.handler(request)
}
