// RennovaAI AI visualisation API on Cloudflare Workers.
// Same contract as /server: POST /api/visualize (multipart: image, choices) → { image: data URI }.
// Uses the Workers AI binding, so no API token is stored anywhere. See worker/README.md.
import { buildPrompt } from '../../server/prompt.js';
// Public pages Google Play links to (store/*.html, bundled as text; see "rules" in wrangler.jsonc).

const MODEL = '@cf/black-forest-labs/flux-2-klein-9b';
const MAX_UPLOAD = 8 * 1024 * 1024;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store', ...cors } });

/** Width and height from a JPEG's frame header, or null for other formats. */
function jpegSize(bytes) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < bytes.length) {
    if (bytes[i] !== 0xff) return null;
    const marker = bytes[i + 1];
    const len = (bytes[i + 2] << 8) | bytes[i + 3];
    // SOF0–SOF15 (except DHT/JPG/DAC) hold the frame size.
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: (bytes[i + 5] << 8) | bytes[i + 6], width: (bytes[i + 7] << 8) | bytes[i + 8] };
    }
    i += 2 + len;
  }
  return null;
}

/** Output size: the photo's shape, longest side 1024, multiples of 16. */
function outputSize(size) {
  const w = size?.width || 1024;
  const h = size?.height || 768;
  const scale = 1024 / Math.max(w, h);
  const r16 = (n) => Math.max(256, Math.round((n * scale) / 16) * 16);
  return { width: r16(w), height: r16(h) };
}

/** The Supabase user behind the request's access token, or null. */
async function userFrom(request, env) {
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ') || !env.SUPABASE_URL) return null;
  const r = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}/auth/v1/user`, {
    headers: { Authorization: auth, apikey: env.SUPABASE_PUBLISHABLE_KEY },
  });
  if (!r.ok) return null;
  const user = await r.json();
  if (!user?.id) return null;
  // Suspended accounts lose access straight away, not only when their sign-in token expires.
  const p = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/profiles?select=status&id=eq.${encodeURIComponent(user.id)}`, {
    headers: { Authorization: auth, apikey: env.SUPABASE_PUBLISHABLE_KEY },
  });
  const rows = p.ok ? await p.json() : [];
  return rows[0]?.status === 'active' ? user : null;
}

async function visualize(request, env) {
  // Only signed-in RennovaAI users may spend the AI allowance.
  const user = env.REQUIRE_AUTH === 'false' ? null : await userFrom(request, env);
  if (env.REQUIRE_AUTH !== 'false' && !user) return json({ error: 'Please sign in to generate designs.' }, 401);

  if (env.RATE_LIMITER && user) {
    const { success } = await env.RATE_LIMITER.limit({ key: user.id });
    if (!success) return json({ error: 'Too many designs at once. Please wait a minute and try again.' }, 429);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'Please attach a room photo.' }, 400);
  }
  const image = form.get('image');
  if (!image || typeof image === 'string') return json({ error: 'Please attach a JPG, PNG or WEBP room photo.' }, 400);
  if (image.size > MAX_UPLOAD) return json({ error: 'That photo is too large (max 8 MB).' }, 413);
  if (image.type && !/^image\/(jpeg|png|webp)$/.test(image.type)) return json({ error: 'Please use a JPG, PNG or WEBP photo.' }, 400);

  let choices;
  try {
    choices = JSON.parse(String(form.get('choices') || '{}'));
  } catch {
    return json({ error: 'Invalid design choices.' }, 400);
  }

  const bytes = new Uint8Array(await image.arrayBuffer());
  const { width, height } = outputSize(jpegSize(bytes));
  const prompt = buildPrompt(choices);

  const input = new FormData();
  input.append('prompt', prompt);
  input.append('input_image_0', new Blob([bytes], { type: image.type || 'image/jpeg' }), 'room.jpg');
  input.append('width', String(width));
  input.append('height', String(height));
  const body = new Response(input);

  try {
    const out = await env.AI.run(MODEL, { multipart: { body: body.body, contentType: body.headers.get('content-type') } });
    if (!out?.image) return json({ error: 'The AI engine returned no image.' }, 502);
    return json({ image: `data:image/jpeg;base64,${out.image}` });
  } catch (e) {
    console.error('Workers AI error', e?.message || e);
    return json({ error: 'The AI engine is busy. Please try again in a moment.' }, 502);
  }
}

/**
 * Crash reports from the app (src/lib/crash.ts). No sign-in needed: crashes also happen before sign-in.
 * Reports are only written to the Worker log (Cloudflare dashboard -> Workers -> rennovaai-ai -> Logs),
 * with no personal data: message, stack, screen, platform and app version.
 */
async function reportError(request, env) {
  if (env.ERROR_LIMITER) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const { success } = await env.ERROR_LIMITER.limit({ key: ip });
    if (!success) return new Response(null, { status: 429, headers: cors });
  }
  const raw = await request.text();
  if (raw.length > 16000) return json({ error: 'Report too large.' }, 413);
  let r;
  try { r = JSON.parse(raw); } catch { return json({ error: 'Invalid report.' }, 400); }
  const str = (v, n) => (typeof v === 'string' ? v.slice(0, n) : undefined);
  console.error(JSON.stringify({
    type: 'app_crash',
    fatal: r?.fatal === true,
    message: str(r?.message, 500),
    stack: str(r?.stack, 6000),
    screen: str(r?.screen, 200),
    platform: str(r?.platform, 20),
    os: str(r?.os, 40),
    appVersion: str(r?.appVersion, 40),
    update: str(r?.update, 80),
  }));
  return new Response(null, { status: 204, headers: cors });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    // The privacy policy and terms moved to the app's own site (Cloudflare Pages, built by scripts/build-site.mjs).
    // Old links, including any already given to Google Play, keep working.
    const SITE = 'https://rennovaai.pages.dev';
    if (request.method === 'GET' && pathname === '/privacy') return Response.redirect(`${SITE}/privacy`, 301);
    if (request.method === 'GET' && pathname === '/terms') return Response.redirect(`${SITE}/terms`, 301);
    if (request.method === 'GET' && pathname === '/delete-account') return Response.redirect(`${SITE}/privacy#delete-account`, 301);
    if (request.method === 'GET' && pathname === '/health') return json({ ok: true, provider: 'cloudflare-worker', model: MODEL });
    if (request.method === 'POST' && pathname === '/api/visualize') return visualize(request, env);
    if (request.method === 'POST' && pathname === '/api/errors') return reportError(request, env);
    return json({ error: 'Not found' }, 404);
  },
};
