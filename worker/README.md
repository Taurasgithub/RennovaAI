# RennovaAI AI API (Cloudflare Worker)

The published app talks to this Worker, not to `/server` (which only runs on your own PC).

| Path | What it does |
|---|---|
| `POST /api/visualize` | Room photo + design choices → renovated preview (`{ image: data URI }`). Signed-in users only. |
| `GET /privacy` | Privacy policy (`store/privacy-policy.html`): the URL for Google Play. |
| `GET /terms` | Terms of use (`store/terms.html`). |
| `GET /delete-account` | Redirects to the account-deletion section, for Play's Data safety form. |
| `GET /health` | Status check. |

It uses the **Workers AI binding**, so no API token is stored anywhere. The image model is FLUX.2 klein (`@cf/black-forest-labs/flux-2-klein-9b`), which runs on the free daily Workers AI allowance.

Protection against misuse:
- Each request must carry the user's Supabase access token. The Worker checks it with Supabase.
- At most 5 designs per user per minute (`ratelimits` in `wrangler.jsonc`).
- Photos up to 8 MB; the app already shrinks them to 512 px.

## Deploy

```bash
cd worker
npm install
npx wrangler login     # opens Cloudflare in your browser; use the account that has Workers AI
npx wrangler deploy
```

Wrangler prints the URL, e.g. `https://rennovaai-ai.<your-subdomain>.workers.dev`. Then:
1. Check `https://…workers.dev/health` and `/privacy` in a browser.
2. Put the URL in `eas.json` → `build.*.env.EXPO_PUBLIC_API_URL`, and in `.env` for local testing.
3. Use `https://…workers.dev/privacy` as the privacy-policy URL in Play Console.

Live logs: `npx wrangler tail`.

## Changing the prompt
The prompt is built by `server/prompt.js`, shared with the local server. Edit it, then `npx wrangler deploy` again.
