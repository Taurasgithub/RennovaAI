import { CEILINGS, CITY_FACTOR, EXTRAS, FLOORING, STYLES, WALL_FINISHES, findById } from '../data/catalog';
import type { ServiceType } from '../data/catalog';
import { roundTo } from './format';

export type DesignChoices = {
  roomTypeId: string;
  area: number; // floor area sq ft
  styleId: string;
  paletteId: string;
  wallFinishId: string;
  flooringId: string;
  ceilingId: string;
  extras: string[];
  notes: string;
};

export type EstimateLine = { label: string; amount: number; service: ServiceType };

export type Estimate = {
  low: number;
  high: number;
  mid: number;
  lines: EstimateLine[];
  days: number;
  services: ServiceType[];
  wallArea: number;
};

const CEILING_HEIGHT_FT = 10;

/**
 * RennovaAI cost engine (v1, rule-based).
 * Inputs: room size, selected materials, style and city.
 * Rates are PKR per sq ft including labour, tuned for Sindh in 2026; the range
 * (−12% / +15%) reflects vendor-to-vendor variation. Replace the rate tables in
 * data/catalog.ts with live vendor pricing as the marketplace grows.
 */
export function estimateCost(c: DesignChoices, city: string): Estimate {
  const style = findById(STYLES, c.styleId);
  const wall = findById(WALL_FINISHES, c.wallFinishId);
  const floor = findById(FLOORING, c.flooringId);
  const ceiling = findById(CEILINGS, c.ceilingId);
  const cityF = CITY_FACTOR[city] ?? 1;
  const side = Math.sqrt(Math.max(c.area, 20));
  const wallArea = Math.round(side * 4 * CEILING_HEIGHT_FT * 0.85); // minus ~15% for doors & windows

  const lines: EstimateLine[] = [];
  lines.push({ label: `Walls · ${wall.label} (${wallArea} sq ft)`, amount: wallArea * wall.rate, service: 'Painter' });
  if (floor.rate > 0) lines.push({ label: `Flooring · ${floor.label} (${c.area} sq ft)`, amount: c.area * floor.rate, service: 'Contractor' });
  if (ceiling.rate > 0) lines.push({ label: `Ceiling · ${ceiling.label}`, amount: c.area * ceiling.rate, service: ceiling.id === 'wood' ? 'Carpenter' : 'Contractor' });
  for (const id of c.extras) {
    const ex = EXTRAS.find((e) => e.id === id);
    if (ex) lines.push({ label: ex.label, amount: ex.cost, service: ex.service });
  }
  const scaled = lines.map((l) => ({ ...l, amount: roundTo(l.amount * style.multiplier * cityF) }));
  const subtotal = scaled.reduce((s, l) => s + l.amount, 0);
  const sundries = roundTo(subtotal * 0.06);
  scaled.push({ label: 'Site prep, protection & clean-up', amount: sundries, service: 'Contractor' });
  const mid = subtotal + sundries;

  // Timeline: base 2 days for paint + effort-weighted days for other trades.
  let days = 2 + Math.ceil(wallArea / 400);
  if (floor.rate > 0) days += Math.ceil(c.area / 120) + 1;
  if (ceiling.rate > 0) days += Math.ceil(c.area / 150) + 1;
  days += c.extras.length * 2;

  const services = Array.from(new Set(scaled.map((l) => l.service)));
  return { low: roundTo(mid * 0.88, 1000), high: roundTo(mid * 1.15, 1000), mid: roundTo(mid, 1000), lines: scaled, days, services, wallArea };
}
