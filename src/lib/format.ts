import { currentLanguage, translate } from '../i18n';

export { uid } from './id';

export const pkr = (n: number) => 'PKR ' + Math.round(n).toLocaleString('en-US');

/** Compact PKR, e.g. 1.2 lac / 85k (لاکھ / ہزار in Urdu) — handy for small chips. */
export const pkrShort = (n: number) => {
  if (n >= 100000) return 'PKR ' + (n / 100000).toFixed(n >= 1000000 ? 0 : 1).replace(/\.0$/, '') + ' ' + translate('unit.lac');
  if (n >= 1000) {
    const k = translate('unit.thousand');
    return 'PKR ' + Math.round(n / 1000) + (k === 'k' ? k : ' ' + k);
  }
  return pkr(n);
};

export const roundTo = (n: number, step = 500) => Math.round(n / step) * step;

const locale = () => (currentLanguage() === 'ur' ? 'ur-PK' : 'en-GB');

export const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString(locale(), { day: 'numeric', month: 'short', year: 'numeric' });

export const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });

/** Compact range, e.g. "PKR 2.3 – 3 lac". */
export const pkrRangeShort = (low: number, high: number) => {
  const a = pkrShort(low), b = pkrShort(high);
  const unit = (x: string) => x.split(' ').slice(2).join(' ');
  if (unit(a) && unit(a) === unit(b)) return `${a.replace(' ' + unit(a), '')} – ${b.replace('PKR ', '')}`;
  return `${a} – ${b.replace('PKR ', '')}`;
};
