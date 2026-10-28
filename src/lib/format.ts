export const pkr = (n: number) => 'PKR ' + Math.round(n).toLocaleString('en-US');

/** Compact PKR, e.g. 1.2L / 85k — handy for small chips. */
export const pkrShort = (n: number) => {
  if (n >= 100000) return 'PKR ' + (n / 100000).toFixed(n >= 1000000 ? 0 : 1).replace(/\.0$/, '') + ' lac';
  if (n >= 1000) return 'PKR ' + Math.round(n / 1000) + 'k';
  return pkr(n);
};

export const roundTo = (n: number, step = 500) => Math.round(n / step) * step;

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

/** Compact range, e.g. "PKR 2.3 – 3 lac". */
export const pkrRangeShort = (low: number, high: number) => {
  const a = pkrShort(low), b = pkrShort(high);
  const unit = (x: string) => x.split(' ').slice(2).join(' ');
  if (unit(a) && unit(a) === unit(b)) return `${a.replace(' ' + unit(a), '')} – ${b.replace('PKR ', '')}`;
  return `${a} – ${b.replace('PKR ', '')}`;
};
