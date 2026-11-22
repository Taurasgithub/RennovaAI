// Builds the public website (privacy policy, terms, account deletion) for Cloudflare Pages.
// Source of truth: store/privacy-policy.html and store/terms.html. Output: site/dist.
// Deploy: npm run site:deploy  (Cloudflare Pages project "rennovaai")
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';

const out = 'site/dist';
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
// Pages serves privacy.html at /privacy with no redirect (Play's policy check wants a direct 200).
cpSync('store/privacy-policy.html', `${out}/privacy.html`);
cpSync('store/terms.html', `${out}/terms.html`);
cpSync('store/icon-512.png', `${out}/icon.png`);
cpSync('site/index.html', `${out}/index.html`);

writeFileSync(
  `${out}/_redirects`,
  ['/delete-account /privacy#delete-account 301', '/privacy-policy /privacy 301', ''].join('\n'),
);
writeFileSync(
  `${out}/_headers`,
  [
    '/*',
    "  Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    '  X-Content-Type-Options: nosniff',
    '  X-Frame-Options: DENY',
    '  Referrer-Policy: no-referrer',
    '  Strict-Transport-Security: max-age=31536000; includeSubDomains',
    '',
  ].join('\n'),
);
console.log(`Built ${out}`);
