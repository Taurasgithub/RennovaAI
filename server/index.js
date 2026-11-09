// RennovaAI AI server — keeps the image-model API key off the phone.
// POST /api/visualize  (multipart: image=<room photo>, choices=<JSON>)  →  { image: "data:image/png;base64,..." }
import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import sharp from 'sharp';
import { buildPrompt } from './prompt.js';

const PORT = Number(process.env.PORT || 8080);
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const hasCloudflare = !!(CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN);
// IMAGE_PROVIDER picks one explicitly (cloudflare | openrouter | openai). Otherwise: OpenRouter, then Cloudflare, then OpenAI.
const PROVIDER = process.env.IMAGE_PROVIDER || (OPENROUTER_API_KEY ? 'openrouter' : hasCloudflare ? 'cloudflare' : 'openai');
const IMAGE_MODEL = {
  openrouter: process.env.OPENROUTER_IMAGE_MODEL || 'google/gemini-2.5-flash-image',
  // Free daily allowance on Workers AI; supports editing from reference images.
  cloudflare: process.env.CLOUDFLARE_IMAGE_MODEL || '@cf/black-forest-labs/flux-2-klein-9b',
  openai: process.env.IMAGE_MODEL || 'gpt-image-1',
}[PROVIDER];
const IMAGE_SIZE = process.env.IMAGE_SIZE || '1536x1024';
const IMAGE_QUALITY = process.env.IMAGE_QUALITY || 'medium';
const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
const OPENROUTER_BASE_URL = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');

const missing = {
  openrouter: !OPENROUTER_API_KEY && 'OPENROUTER_API_KEY',
  cloudflare: !hasCloudflare && 'CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN',
  openai: !OPENAI_API_KEY && 'OPENAI_API_KEY',
}[PROVIDER];
if (missing === undefined) {
  console.error(`Unknown IMAGE_PROVIDER "${PROVIDER}" — use cloudflare, openrouter or openai.`);
  process.exit(1);
}
if (missing) {
  console.error(`Missing ${missing} for the ${PROVIDER} image provider — see .env.example.`);
  process.exit(1);
}

// "1536x1024" → "3:2"
function aspectRatio(size) {
  const [w, h] = size.split('x').map(Number);
  if (!w || !h) return '3:2';
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const g = gcd(w, h);
  return `${w / g}:${h / g}`;
}

async function editWithOpenRouter(file, prompt) {
  const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  const r = await fetch(`${OPENROUTER_BASE_URL}/images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt,
      aspect_ratio: aspectRatio(IMAGE_SIZE),
      input_references: [{ type: 'image_url', image_url: { url: dataUrl } }],
    }),
  });
  return { r, json: await r.json() };
}

/**
 * Cloudflare Workers AI (FLUX.2): multipart request with the prompt and the room photo as input_image_0.
 * FLUX.2 on Workers AI expects small reference images, so the photo is shrunk first.
 * Returns the same { r, json } shape as the other providers ({ data: [{ b64_json }] }).
 */
async function editWithCloudflare(file, prompt) {
  const [w, h] = IMAGE_SIZE.split('x').map(Number);
  const ref = await sharp(file.buffer).rotate().resize(512, 512, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer();
  const form = new FormData();
  form.append('prompt', prompt);
  form.append('input_image_0', new Blob([ref], { type: 'image/jpeg' }), 'room.jpg');
  // Keep the output under ~1 MP, same aspect ratio as IMAGE_SIZE.
  const scale = Math.min(1, 1024 / Math.max(w || 1024, h || 768));
  form.append('width', String(Math.round(((w || 1024) * scale) / 16) * 16));
  form.append('height', String(Math.round(((h || 768) * scale) / 16) * 16));
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/${IMAGE_MODEL}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}` },
    body: form,
  });
  const raw = await r.json().catch(() => ({}));
  const image = raw?.result?.image;
  const json = image ? { data: [{ b64_json: image, media_type: 'image/jpeg' }] } : { error: { message: raw?.errors?.[0]?.message || `HTTP ${r.status}` } };
  return { r, json };
}

async function editWithOpenAI(file, prompt) {
  const form = new FormData();
  form.append('model', IMAGE_MODEL);
  form.append('prompt', prompt);
  form.append('size', IMAGE_SIZE);
  form.append('quality', IMAGE_QUALITY);
  form.append('n', '1');
  form.append('image', new Blob([file.buffer], { type: file.mimetype }), file.originalname || 'room.jpg');
  const r = await fetch(`${OPENAI_BASE_URL}/images/edits`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: form,
  });
  return { r, json: await r.json() };
}

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use('/api/', rateLimit({ windowMs: 60 * 60 * 1000, limit: Number(process.env.RATE_LIMIT_PER_HOUR || 30), standardHeaders: true, legacyHeaders: false }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, /^image\/(jpeg|png|webp)$/.test(file.mimetype)),
});

app.get('/health', (_req, res) => res.json({ ok: true, provider: PROVIDER, model: IMAGE_MODEL }));

app.post('/api/visualize', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Please attach a JPG, PNG or WEBP room photo (max 10 MB).' });
    let choices;
    try {
      choices = JSON.parse(req.body.choices || '{}');
    } catch {
      return res.status(400).json({ error: 'Invalid design choices.' });
    }
    const prompt = buildPrompt(choices);

    const edit = { openrouter: editWithOpenRouter, cloudflare: editWithCloudflare, openai: editWithOpenAI }[PROVIDER];
    const { r, json } = await edit(req.file, prompt);
    if (!r.ok) {
      console.error('Image API error', r.status, json?.error?.message);
      return res.status(502).json({ error: 'The AI engine is busy. Please try again in a moment.' });
    }
    const item = json?.data?.[0];
    const b64 = item?.b64_json;
    const url = item?.url;
    if (!b64 && !url) return res.status(502).json({ error: 'The AI engine returned no image.' });
    res.json({ image: b64 ? `data:${item.media_type || 'image/png'};base64,${b64}` : url, prompt });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Something went wrong while generating your design.' });
  }
});

app.listen(PORT, () => console.log(`RennovaAI AI server listening on :${PORT}`));
