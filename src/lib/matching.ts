import { VENDORS, type Vendor } from '../data/vendors';
import type { Estimate } from './estimate';
import { roundTo } from './format';

export type Quote = {
  vendor: Vendor;
  price: number;
  days: number;
  score: number;
  coverage: number; // share of required services the vendor covers (0–1)
  reasons: string[];
};

/**
 * Matching algorithm: pairs the customer's requirements with vendors by
 * service type, location, budget and availability, then returns a shortlist
 * of 3–5 quotes (per the RennovaAI operations plan).
 */
export function matchVendors(estimate: Estimate, city: string, budget?: number, limit = 5): Quote[] {
  const pool = VENDORS.filter((v) => v.city === city && v.verified);
  const needed = estimate.services;

  const quotes = pool
    .map((v): Quote => {
      const covered = needed.filter((s) => v.services.includes(s));
      const coverage = needed.length ? covered.length / needed.length : 1;
      const price = roundTo(estimate.mid * v.priceFactor, 1000);
      const days = Math.max(2, Math.round(estimate.days * v.speedFactor));
      const reasons: string[] = [];

      let score = v.rating * 12; // up to 60
      score += coverage * 25;
      if (coverage === 1) reasons.push('Covers every trade in your design');
      else if (covered.length) {
        reasons.push(`Covers ${covered.join(', ')}`);
        reasons.push(`Brings partner trades for ${needed.filter((x) => !covered.includes(x)).join(', ')}`);
      }
      if (budget && price <= budget) {
        score += 10;
        reasons.push('Within your budget');
      } else if (!budget) score += 5;
      if (v.availableFrom === 'Tomorrow' || v.availableFrom === 'This week') {
        score += 6;
        reasons.push(`Available ${v.availableFrom.toLowerCase()}`);
      }
      if (v.pro) score += 4; // featured placement for Vendor Pro
      if (v.rating >= 4.8) reasons.push('Top rated');
      score += Math.min(v.jobsCompleted, 150) / 30;

      return { vendor: v, price, days, score, coverage, reasons };
    })
    .filter((q) => q.coverage > 0)
    .sort((a, b) => b.score - a.score);

  // Prefer vendors who can deliver most of the job; fall back to the best partial matches
  // so the customer always sees at least three quotes when the city has them.
  const strong = quotes.filter((q) => q.coverage >= 0.5);
  const shortlist = strong.length >= 3 ? strong : [...strong, ...quotes.filter((q) => q.coverage < 0.5).sort((a, b) => b.coverage - a.coverage)];
  return shortlist.slice(0, limit);
}
