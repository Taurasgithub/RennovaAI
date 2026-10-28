// Turns the app's design choices into an image-editing prompt.
// Keep these phrases in sync with src/data/catalog.ts in the app.

const ROOMS = { living: 'living room', bedroom: 'bedroom', kitchen: 'kitchen', bathroom: 'bathroom', office: 'home office', shop: 'small shop or café' };
const STYLES = {
  minimalist: 'minimalist interior, clean lines, uncluttered, soft neutral decor',
  modern: 'modern contemporary interior, sleek furniture, statement lighting',
  traditional: 'traditional South Asian interior, carved wood furniture, rich textiles, jharokha-inspired details',
  scandinavian: 'scandinavian interior, light oak wood, cosy textiles, airy and bright',
  industrial: 'industrial loft interior, exposed textures, black metal accents, concrete tones',
  luxury: 'luxury interior, marble surfaces, brushed gold accents, warm cove lighting',
};
const PALETTES = {
  'sea-breeze': 'soft sea-green walls (#CFE8E3) with teal accents',
  'teal-feature': 'deep teal feature wall (#1F6F6B) with mustard-gold accents',
  'desert-sand': 'warm sand-beige walls (#E8D8C3) with terracotta accents',
  'royal-navy': 'navy blue walls (#23395B) with amber-gold accents',
  'sage-garden': 'sage green walls (#B7C9A8) with olive accents',
  'blush-clay': 'blush clay pink walls (#E9C6B9) with rust accents',
  'pure-white': 'warm white walls (#F4F2EE) with charcoal accents',
  charcoal: 'charcoal grey walls (#4B5563) with amber accents',
};
const WALLS = { emulsion: 'matte emulsion paint', washable: 'premium washable satin paint', texture: 'textured stucco wall finish' };
const FLOORS = { keep: null, porcelain: 'large format porcelain floor tiles', laminate: 'warm wooden laminate flooring', marble: 'polished white marble flooring', vinyl: 'vinyl plank flooring' };
const CEILINGS = { keep: null, gypsum: 'gypsum false ceiling with recessed downlights', cove: 'false ceiling with warm LED cove lighting', wood: 'wooden slat ceiling panels' };
const EXTRAS = {
  panelling: 'vertical wooden slat feature wall',
  lighting: 'layered ambient lighting',
  woodwork: 'custom built-in wooden storage',
  decor: 'new curtains, cushions and decor accessories',
};

export function buildPrompt(c = {}) {
  const parts = [
    `Renovate this exact ${ROOMS[c.roomTypeId] || 'room'} photo into a ${STYLES[c.styleId] || STYLES.modern}.`,
    `Walls: ${PALETTES[c.paletteId] || PALETTES['teal-feature']}, ${WALLS[c.wallFinishId] || WALLS.washable}.`,
  ];
  if (FLOORS[c.flooringId]) parts.push(`Floor: ${FLOORS[c.flooringId]}.`);
  if (CEILINGS[c.ceilingId]) parts.push(`Ceiling: ${CEILINGS[c.ceilingId]}.`);
  const extras = (c.extras || []).map((e) => EXTRAS[e]).filter(Boolean);
  if (extras.length) parts.push(`Add: ${extras.join(', ')}.`);
  if (c.notes) parts.push(`Customer request: ${String(c.notes).slice(0, 300)}.`);
  parts.push(
    'Keep the same camera angle, room geometry, windows, doors and ceiling height so the customer recognises their own room.',
    'Photorealistic interior photography, natural daylight, realistic materials achievable by local Pakistani contractors. No text, no watermarks, no people.',
  );
  return parts.join(' ');
}
