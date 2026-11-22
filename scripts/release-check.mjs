// Release checklist: fails while placeholder (dummy) values are still in the app or the public site.
//   npm run release-check          → lists what is left (exit 1 if anything is)
//   --eas (eas-build-pre-install)  → only blocks *production* EAS builds; other builds just warn
import { readFileSync } from 'node:fs';

const DUMMY_WHATSAPP = '923000000000';
const DUMMY_EMAIL = 'support@rennovaai.com';

const problems = [];
const eas = JSON.parse(readFileSync('eas.json', 'utf8'));
for (const [name, profile] of Object.entries(eas.build ?? {})) {
  const env = profile.env ?? {};
  if (name !== 'production') continue;
  if (!env.EXPO_PUBLIC_SUPPORT_WHATSAPP || env.EXPO_PUBLIC_SUPPORT_WHATSAPP === DUMMY_WHATSAPP)
    problems.push(`eas.json → build.${name}.env.EXPO_PUBLIC_SUPPORT_WHATSAPP is the dummy number ${DUMMY_WHATSAPP}`);
  if (!env.EXPO_PUBLIC_SUPPORT_EMAIL || env.EXPO_PUBLIC_SUPPORT_EMAIL === DUMMY_EMAIL)
    problems.push(`eas.json → build.${name}.env.EXPO_PUBLIC_SUPPORT_EMAIL is the dummy address ${DUMMY_EMAIL}`);
}
for (const file of ['store/privacy-policy.html', 'store/terms.html', 'store/listing.md']) {
  if (readFileSync(file, 'utf8').includes(DUMMY_EMAIL)) problems.push(`${file} still shows the dummy email ${DUMMY_EMAIL} (then run: npm run site:deploy)`);
}

const easMode = process.argv.includes('--eas');
const blocking = !easMode || process.env.EAS_BUILD_PROFILE === 'production';

if (!problems.length) {
  console.log('Release check passed: no placeholder contacts left.');
} else {
  console[blocking ? 'error' : 'warn'](`Release check: ${problems.length} placeholder(s) to replace before publishing:\n- ${problems.join('\n- ')}`);
  if (blocking) process.exit(1);
}
