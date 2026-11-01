import { useCallback } from 'react';
import type { ServiceType } from '../data/catalog';
import type { EstimateLine } from '../lib/estimate';
import type { MatchReason } from '../lib/matching';
import type { Design, Milestone, Project } from '../store/useApp';
import { useApp, type Language } from '../store/useApp';
import { en, type TKey } from './en';
import { ur } from './ur';

export type { TKey } from './en';
export type Params = Record<string, string | number>;

const DICTS: Record<Language, Record<TKey, string>> = { en, ur };

function fill(s: string, p?: Params) {
  return p ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in p ? String(p[k]) : m)) : s;
}

export const currentLanguage = (): Language => useApp.getState().language;

/** Translate outside React (helpers, formatters). Components should use useT() so they re-render on change. */
export function translate(key: TKey, params?: Params, lang: Language = currentLanguage()) {
  return fill(DICTS[lang][key] ?? en[key], params);
}

/** t(key, params) for the active language; re-renders the caller when the language changes. */
export function useT() {
  const lang = useApp((s) => s.language);
  const t = useCallback((key: TKey, params?: Params) => fill(DICTS[lang][key] ?? en[key], params), [lang]);
  return { t, lang, ur: lang === 'ur' };
}

/* ---------- Catalog & data labels ---------- */

const has = (key: string): key is TKey => key in en;
const lookup = (key: string, fallback: string) => (has(key) ? translate(key) : fallback);

export const roomLabel = (id: string) => lookup(`room.${id}`, id);
export const styleLabel = (id: string) => lookup(`style.${id}`, id);
export const styleBlurb = (id: string) => lookup(`style.${id}.blurb`, '');
export const paletteLabel = (id: string) => lookup(`palette.${id}`, id);
export const wallLabel = (id: string) => lookup(`wall.${id}`, id);
export const floorLabel = (id: string) => lookup(`floor.${id}`, id);
export const ceilingLabel = (id: string) => lookup(`ceiling.${id}`, id);
export const extraLabel = (id: string) => lookup(`extra.${id}`, id);
export const serviceLabel = (s: ServiceType | string) => lookup(`service.${s}`, s);
export const cityLabel = (c: string) => lookup(`city.${c}`, c);
export const listJoin = (items: string[]) => items.join(translate('common.listSep'));

// Vendor availability strings in the sample data ('Tomorrow', 'This week', …) and booking start options.
const AVAIL: Record<string, TKey> = {
  Tomorrow: 'avail.tomorrow',
  'This week': 'avail.thisWeek',
  'Next week': 'avail.nextWeek',
  'In 2 weeks': 'avail.in2Weeks',
  Flexible: 'avail.flexible',
};
export const availabilityLabel = (s: string) => (AVAIL[s] ? translate(AVAIL[s]) : s);

/** "~1 hr", "~2 hrs", "~30 min" → localized. */
export const responseLabel = (s: string) => {
  const m = /^~\s*(\d+)\s*(min|hrs?)$/.exec(s.trim());
  if (!m) return s;
  return translate(m[2] === 'min' ? 'time.min' : m[2] === 'hr' ? 'time.hr' : 'time.hrs', { n: m[1] });
};

/** Auto-generated design names are rebuilt in the active language; names saved before this existed are shown as-is. */
export const designName = (d: Pick<Design, 'name' | 'nameParts'>) => {
  if (!d.nameParts) return d.name;
  const room = roomLabel(d.nameParts.roomTypeId);
  return translate('designs.name', {
    style: styleLabel(d.nameParts.styleId),
    room: currentLanguage() === 'en' ? room.toLowerCase() : room,
    n: d.nameParts.n,
  });
};

export const projectTitle = (p: Project, designs: Design[]) => {
  const d = designs.find((x) => x.id === p.designId);
  return d ? designName(d) : p.title;
};

export const milestoneTitle = (m: Milestone) =>
  m.stage !== undefined && has(`milestone.${m.stage}`) ? translate(`milestone.${m.stage}` as TKey) : m.title;

export const lineLabel = (l: EstimateLine) => {
  switch (l.part) {
    case 'walls':
      return translate('line.walls', { finish: wallLabel(l.ref ?? ''), area: l.qty ?? 0 });
    case 'floor':
      return translate('line.floor', { finish: floorLabel(l.ref ?? ''), area: l.qty ?? 0 });
    case 'ceiling':
      return translate('line.ceiling', { finish: ceilingLabel(l.ref ?? '') });
    case 'extra':
      return extraLabel(l.ref ?? '');
    case 'sundries':
      return translate('line.sundries');
    default:
      return l.label;
  }
};

export const reasonLabel = (r: MatchReason) => {
  switch (r.kind) {
    case 'all':
      return translate('reason.all');
    case 'covers':
    case 'partners':
      return translate(r.kind === 'covers' ? 'reason.covers' : 'reason.partners', { list: listJoin(r.services.map(serviceLabel)) });
    case 'budget':
      return translate('reason.budget');
    case 'available': {
      const when = availabilityLabel(r.when);
      return translate('reason.available', { when: currentLanguage() === 'en' ? when.toLowerCase() : when });
    }
    case 'topRated':
      return translate('reason.topRated');
  }
};

const METHODS: Record<string, TKey> = {
  jazzcash: 'book.method.jazzcash',
  easypaisa: 'book.method.easypaisa',
  card: 'book.method.card',
  // Labels stored by builds before payment methods were saved by id.
  JazzCash: 'book.method.jazzcash',
  Easypaisa: 'book.method.easypaisa',
  'Debit / credit card': 'book.method.card',
};
export const paymentLabel = (v: string) => (METHODS[v] ? translate(METHODS[v]) : v);
