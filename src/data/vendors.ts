import type { ServiceType } from './catalog';

// SAMPLE LISTINGS for the beta build. Replace with the vendor API once vendors
// are onboarded and verified (see README → "Going live").

export type PortfolioItem = { title: string; paletteId: string; styleId: string; flooringId: string; ceilingId: string };
export type Review = { name: string; rating: number; text: string; date: string };

export type Vendor = {
  id: string;
  name: string;
  owner: string;
  services: ServiceType[];
  city: string;
  area: string;
  rating: number;
  reviewCount: number;
  jobsCompleted: number;
  yearsExperience: number;
  verified: boolean;
  pro: boolean; // Vendor Pro subscription → featured placement
  priceFactor: number; // relative to RennovaAI estimate
  speedFactor: number; // relative to standard timeline
  responseTime: string;
  availableFrom: string;
  about: string;
  portfolio: PortfolioItem[];
  reviews: Review[];
};

export const VENDORS: Vendor[] = [
  {
    id: 'v1', name: 'Indus Paint Works', owner: 'Rashid Mahar', services: ['Painter'], city: 'Sukkur', area: 'Military Road',
    rating: 4.8, reviewCount: 64, jobsCompleted: 118, yearsExperience: 9, verified: true, pro: true, priceFactor: 0.97, speedFactor: 0.85,
    responseTime: '~1 hr', availableFrom: 'This week',
    about: 'Interior and exterior painting specialists. Washable emulsions, texture and stucco finishes with dust-sheet protection and daily clean-up.',
    portfolio: [
      { title: 'Teal feature lounge', paletteId: 'teal-feature', styleId: 'modern', flooringId: 'porcelain', ceilingId: 'cove' },
      { title: 'Calm master bedroom', paletteId: 'sea-breeze', styleId: 'minimalist', flooringId: 'keep', ceilingId: 'keep' },
      { title: 'Warm family room', paletteId: 'desert-sand', styleId: 'traditional', flooringId: 'laminate', ceilingId: 'gypsum' },
    ],
    reviews: [
      { name: 'Sana K.', rating: 5, text: 'Finished a day early and the wall looks exactly like the preview.', date: 'Sep 2026' },
      { name: 'Imran A.', rating: 5, text: 'Very neat work, covered all furniture properly.', date: 'Aug 2026' },
      { name: 'Hira M.', rating: 4, text: 'Good finish, slight delay on day one but communicated well.', date: 'Jul 2026' },
    ],
  },
  {
    id: 'v2', name: 'Rohri Woodcraft', owner: 'Ghulam Abbas', services: ['Carpenter'], city: 'Sukkur', area: 'Rohri',
    rating: 4.7, reviewCount: 41, jobsCompleted: 77, yearsExperience: 15, verified: true, pro: false, priceFactor: 1.04, speedFactor: 1.1,
    responseTime: '~3 hrs', availableFrom: 'Next week',
    about: 'Custom wardrobes, TV units, wall panelling and traditional carved woodwork using seasoned sheesham and MDF.',
    portfolio: [
      { title: 'Slatted TV wall', paletteId: 'pure-white', styleId: 'scandinavian', flooringId: 'laminate', ceilingId: 'wood' },
      { title: 'Carved drawing room', paletteId: 'desert-sand', styleId: 'traditional', flooringId: 'marble', ceilingId: 'gypsum' },
    ],
    reviews: [
      { name: 'Faisal R.', rating: 5, text: 'Master craftsman. The wardrobe is solid and beautifully finished.', date: 'Sep 2026' },
      { name: 'Ayesha S.', rating: 4, text: 'Quality is excellent, took a little longer than quoted.', date: 'Jun 2026' },
    ],
  },
  {
    id: 'v3', name: 'Al-Noor Interiors', owner: 'Nadia Shaikh', services: ['Interior Decorator', 'Painter'], city: 'Sukkur', area: 'Barrage Colony',
    rating: 4.9, reviewCount: 38, jobsCompleted: 52, yearsExperience: 7, verified: true, pro: true, priceFactor: 1.12, speedFactor: 1.0,
    responseTime: '~30 min', availableFrom: 'This week',
    about: 'Full-room styling: colour consultation, curtains, décor sourcing and painting coordination. Turnkey makeovers before weddings and Eid.',
    portfolio: [
      { title: 'Bridal suite makeover', paletteId: 'blush-clay', styleId: 'luxury', flooringId: 'marble', ceilingId: 'cove' },
      { title: 'Sage reading corner', paletteId: 'sage-garden', styleId: 'scandinavian', flooringId: 'laminate', ceilingId: 'keep' },
      { title: 'Navy & gold lounge', paletteId: 'royal-navy', styleId: 'luxury', flooringId: 'marble', ceilingId: 'cove' },
    ],
    reviews: [
      { name: 'Mehwish T.', rating: 5, text: 'She understood exactly what I wanted from the AI preview. Stunning result.', date: 'Oct 2026' },
      { name: 'Usman Q.', rating: 5, text: 'Professional and transparent about every rupee.', date: 'Aug 2026' },
    ],
  },
  {
    id: 'v4', name: 'Bright Spark Electric', owner: 'Asif Jatoi', services: ['Electrician'], city: 'Sukkur', area: 'New Pind',
    rating: 4.6, reviewCount: 57, jobsCompleted: 140, yearsExperience: 11, verified: true, pro: false, priceFactor: 0.92, speedFactor: 0.9,
    responseTime: '~2 hrs', availableFrom: 'Tomorrow',
    about: 'Concealed wiring, cove and downlight installation, DB upgrades and fan/AC points. All work tested and certified.',
    portfolio: [
      { title: 'Cove light ceiling', paletteId: 'pure-white', styleId: 'modern', flooringId: 'porcelain', ceilingId: 'cove' },
      { title: 'Shop lighting refit', paletteId: 'charcoal', styleId: 'industrial', flooringId: 'vinyl', ceilingId: 'gypsum' },
    ],
    reviews: [
      { name: 'Kamran L.', rating: 5, text: 'Safe, tidy wiring and fair price.', date: 'Sep 2026' },
      { name: 'Rabia N.', rating: 4, text: 'Good job on the downlights.', date: 'Jul 2026' },
    ],
  },
  {
    id: 'v5', name: 'Sindh BuildPro', owner: 'Zubair Memon', services: ['Contractor', 'Painter', 'Electrician'], city: 'Sukkur', area: 'Airport Road',
    rating: 4.5, reviewCount: 29, jobsCompleted: 46, yearsExperience: 12, verified: true, pro: true, priceFactor: 1.0, speedFactor: 0.95,
    responseTime: '~1 hr', availableFrom: 'This week',
    about: 'Turnkey renovation contractor — tiling, false ceilings, plumbing coordination and finishing under one supervisor.',
    portfolio: [
      { title: 'Kitchen refit', paletteId: 'pure-white', styleId: 'modern', flooringId: 'porcelain', ceilingId: 'gypsum' },
      { title: 'Marble lounge', paletteId: 'desert-sand', styleId: 'luxury', flooringId: 'marble', ceilingId: 'cove' },
    ],
    reviews: [
      { name: 'Bilal H.', rating: 5, text: 'Handled tiles, ceiling and paint — one point of contact made it easy.', date: 'Oct 2026' },
      { name: 'Saima D.', rating: 4, text: 'Solid work, milestone payments gave me peace of mind.', date: 'Aug 2026' },
    ],
  },
  {
    id: 'v6', name: 'Lloyd Tile & Floor', owner: 'Shahid Soomro', services: ['Contractor'], city: 'Sukkur', area: 'Minara Road',
    rating: 4.4, reviewCount: 22, jobsCompleted: 61, yearsExperience: 8, verified: true, pro: false, priceFactor: 0.9, speedFactor: 1.05,
    responseTime: '~4 hrs', availableFrom: 'Next week',
    about: 'Porcelain, marble and laminate flooring. Free site measurement for RennovaAI customers.',
    portfolio: [
      { title: 'Porcelain living room', paletteId: 'sea-breeze', styleId: 'minimalist', flooringId: 'porcelain', ceilingId: 'keep' },
    ],
    reviews: [{ name: 'Adnan P.', rating: 4, text: 'Level, clean tiling at a good rate.', date: 'Sep 2026' }],
  },
  {
    id: 'v7', name: 'Hyderabad Home Studio', owner: 'Maria Qureshi', services: ['Interior Decorator', 'Carpenter'], city: 'Hyderabad', area: 'Latifabad',
    rating: 4.8, reviewCount: 47, jobsCompleted: 69, yearsExperience: 10, verified: true, pro: true, priceFactor: 1.1, speedFactor: 1.0,
    responseTime: '~1 hr', availableFrom: 'This week',
    about: 'Design-led makeovers with in-house carpentry. Specialists in compact apartments and rental refreshes.',
    portfolio: [
      { title: 'Scandi apartment', paletteId: 'pure-white', styleId: 'scandinavian', flooringId: 'laminate', ceilingId: 'keep' },
      { title: 'Teal dining nook', paletteId: 'teal-feature', styleId: 'modern', flooringId: 'porcelain', ceilingId: 'cove' },
    ],
    reviews: [{ name: 'Zara F.', rating: 5, text: 'Our rental looks brand new — tenants moved in within a week.', date: 'Sep 2026' }],
  },
  {
    id: 'v8', name: 'Qasimabad Painters', owner: 'Junaid Khan', services: ['Painter'], city: 'Hyderabad', area: 'Qasimabad',
    rating: 4.5, reviewCount: 33, jobsCompleted: 95, yearsExperience: 6, verified: true, pro: false, priceFactor: 0.94, speedFactor: 0.9,
    responseTime: '~2 hrs', availableFrom: 'Tomorrow',
    about: 'Fast, affordable painting crews for homes and offices.',
    portfolio: [{ title: 'Office repaint', paletteId: 'charcoal', styleId: 'industrial', flooringId: 'vinyl', ceilingId: 'gypsum' }],
    reviews: [{ name: 'Tariq J.', rating: 4, text: 'Quick and affordable.', date: 'Aug 2026' }],
  },
  {
    id: 'v9', name: 'Mehran Electric Co.', owner: 'Ali Raza', services: ['Electrician', 'Contractor'], city: 'Hyderabad', area: 'Auto Bhan Road',
    rating: 4.6, reviewCount: 25, jobsCompleted: 58, yearsExperience: 13, verified: true, pro: false, priceFactor: 0.98, speedFactor: 1.0,
    responseTime: '~3 hrs', availableFrom: 'This week',
    about: 'Electrical upgrades, solar-ready wiring and false ceilings with lighting design.',
    portfolio: [{ title: 'Gypsum & downlights', paletteId: 'sea-breeze', styleId: 'modern', flooringId: 'porcelain', ceilingId: 'gypsum' }],
    reviews: [{ name: 'Nida A.', rating: 5, text: 'Explained everything clearly, great lighting design.', date: 'Jul 2026' }],
  },
  {
    id: 'v10', name: 'Clifton Design Co.', owner: 'Hamza Siddiqui', services: ['Interior Decorator', 'Contractor'], city: 'Karachi', area: 'Clifton',
    rating: 4.9, reviewCount: 88, jobsCompleted: 130, yearsExperience: 14, verified: true, pro: true, priceFactor: 1.18, speedFactor: 0.95,
    responseTime: '~30 min', availableFrom: 'Next week',
    about: 'Premium residential and retail interiors. Marble, cove lighting and bespoke furniture with a dedicated site manager.',
    portfolio: [
      { title: 'Luxury penthouse lounge', paletteId: 'royal-navy', styleId: 'luxury', flooringId: 'marble', ceilingId: 'cove' },
      { title: 'Boutique café', paletteId: 'blush-clay', styleId: 'industrial', flooringId: 'vinyl', ceilingId: 'wood' },
    ],
    reviews: [{ name: 'Omar S.', rating: 5, text: 'World-class finish. Worth every rupee.', date: 'Oct 2026' }],
  },
  {
    id: 'v11', name: 'Gulshan Paint & Polish', owner: 'Kashif Baig', services: ['Painter', 'Carpenter'], city: 'Karachi', area: 'Gulshan-e-Iqbal',
    rating: 4.6, reviewCount: 52, jobsCompleted: 160, yearsExperience: 10, verified: true, pro: false, priceFactor: 0.95, speedFactor: 0.9,
    responseTime: '~1 hr', availableFrom: 'This week',
    about: 'Painting, wood polish and minor carpentry for apartments across Karachi.',
    portfolio: [{ title: 'Apartment refresh', paletteId: 'sage-garden', styleId: 'minimalist', flooringId: 'keep', ceilingId: 'keep' }],
    reviews: [{ name: 'Fatima Z.', rating: 5, text: 'Great value and very polite team.', date: 'Sep 2026' }],
  },
  {
    id: 'v12', name: 'Korangi Builders', owner: 'Naveed Akhtar', services: ['Contractor', 'Electrician'], city: 'Karachi', area: 'Korangi',
    rating: 4.3, reviewCount: 19, jobsCompleted: 40, yearsExperience: 9, verified: true, pro: false, priceFactor: 0.9, speedFactor: 1.1,
    responseTime: '~5 hrs', availableFrom: 'In 2 weeks',
    about: 'Civil works, tiling and shop fit-outs at competitive rates.',
    portfolio: [{ title: 'Shop fit-out', paletteId: 'charcoal', styleId: 'industrial', flooringId: 'porcelain', ceilingId: 'gypsum' }],
    reviews: [{ name: 'Waqas M.', rating: 4, text: 'Decent work for the price.', date: 'Aug 2026' }],
  },
];

export const getVendor = (id: string | undefined) => VENDORS.find((v) => v.id === id);
