import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type RoomType = {
  id: string;
  label: string;
  icon: IconName;
  defaultArea: number; // sq ft
};

export const ROOM_TYPES: RoomType[] = [
  { id: 'living', label: 'Living room', icon: 'tv-outline', defaultArea: 250 },
  { id: 'bedroom', label: 'Bedroom', icon: 'bed-outline', defaultArea: 180 },
  { id: 'kitchen', label: 'Kitchen', icon: 'restaurant-outline', defaultArea: 120 },
  { id: 'bathroom', label: 'Bathroom', icon: 'water-outline', defaultArea: 60 },
  { id: 'office', label: 'Office', icon: 'briefcase-outline', defaultArea: 200 },
  { id: 'shop', label: 'Shop / Café', icon: 'storefront-outline', defaultArea: 300 },
];

export type DesignStyle = {
  id: string;
  label: string;
  blurb: string;
  multiplier: number; // cost multiplier
  furniture: string; // furniture colour used in the illustration
  prompt: string; // phrase sent to the AI engine
};

export const STYLES: DesignStyle[] = [
  { id: 'minimalist', label: 'Minimalist', blurb: 'Clean lines, calm and clutter-free', multiplier: 1.0, furniture: '#E9E6E1', prompt: 'minimalist interior, clean lines, uncluttered, soft neutral decor' },
  { id: 'modern', label: 'Modern', blurb: 'Sleek finishes and bold accents', multiplier: 1.1, furniture: '#3B4A5E', prompt: 'modern contemporary interior, sleek furniture, statement lighting' },
  { id: 'traditional', label: 'Traditional', blurb: 'Warm wood, rich textiles, classic motifs', multiplier: 1.15, furniture: '#7A4A2B', prompt: 'traditional South Asian interior, carved wood furniture, rich textiles, jharokha-inspired details' },
  { id: 'scandinavian', label: 'Scandinavian', blurb: 'Light woods, airy and cosy', multiplier: 1.05, furniture: '#D9C7A7', prompt: 'scandinavian interior, light oak wood, cosy textiles, airy and bright' },
  { id: 'industrial', label: 'Industrial', blurb: 'Raw textures, metal and concrete', multiplier: 1.05, furniture: '#4A4A4A', prompt: 'industrial loft interior, exposed textures, black metal accents, concrete tones' },
  { id: 'luxury', label: 'Luxury', blurb: 'Marble, gold accents, cove lighting', multiplier: 1.35, furniture: '#F1E9DA', prompt: 'luxury interior, marble surfaces, brushed gold accents, warm cove lighting' },
];

export type Palette = {
  id: string;
  label: string;
  wall: string;
  accent: string;
  trim: string;
};

export const PALETTES: Palette[] = [
  { id: 'sea-breeze', label: 'Sea Breeze', wall: '#CFE8E3', accent: '#0AB49A', trim: '#FFFFFF' },
  { id: 'teal-feature', label: 'Teal Feature', wall: '#1F6F6B', accent: '#E9B44C', trim: '#F4EFE6' },
  { id: 'desert-sand', label: 'Desert Sand', wall: '#E8D8C3', accent: '#C27C3A', trim: '#FFFFFF' },
  { id: 'royal-navy', label: 'Royal Navy', wall: '#23395B', accent: '#FEA923', trim: '#F2F2F2' },
  { id: 'sage-garden', label: 'Sage Garden', wall: '#B7C9A8', accent: '#5E7A4B', trim: '#FAFAF5' },
  { id: 'blush-clay', label: 'Blush Clay', wall: '#E9C6B9', accent: '#B5654A', trim: '#FFFFFF' },
  { id: 'pure-white', label: 'Pure White', wall: '#F4F2EE', accent: '#2B2B2B', trim: '#FFFFFF' },
  { id: 'charcoal', label: 'Charcoal', wall: '#4B5563', accent: '#F59E0B', trim: '#E5E7EB' },
];

export type MaterialOption = {
  id: string;
  label: string;
  rate: number; // PKR per sq ft (material + labour), 0 = keep existing
  colour?: string; // used by the illustration
  prompt?: string;
};

export const WALL_FINISHES: MaterialOption[] = [
  { id: 'emulsion', label: 'Standard emulsion', rate: 45, prompt: 'matte emulsion paint' },
  { id: 'washable', label: 'Premium washable', rate: 70, prompt: 'premium washable satin paint' },
  { id: 'texture', label: 'Texture / stucco', rate: 120, prompt: 'textured stucco wall finish' },
];

export const FLOORING: MaterialOption[] = [
  { id: 'keep', label: 'Keep existing', rate: 0, colour: '#C9B8A0' },
  { id: 'porcelain', label: 'Porcelain tiles', rate: 450, colour: '#E7E3DC', prompt: 'large format porcelain floor tiles' },
  { id: 'laminate', label: 'Wooden laminate', rate: 380, colour: '#B9895A', prompt: 'warm wooden laminate flooring' },
  { id: 'marble', label: 'Marble', rate: 650, colour: '#F3F1EC', prompt: 'polished white marble flooring' },
  { id: 'vinyl', label: 'Vinyl planks', rate: 250, colour: '#9C8D7B', prompt: 'vinyl plank flooring' },
];

export const CEILINGS: MaterialOption[] = [
  { id: 'keep', label: 'Keep existing', rate: 0 },
  { id: 'gypsum', label: 'Gypsum false ceiling', rate: 220, prompt: 'gypsum false ceiling with recessed downlights' },
  { id: 'cove', label: 'Cove lighting', rate: 300, prompt: 'false ceiling with warm LED cove lighting' },
  { id: 'wood', label: 'Wooden panels', rate: 500, prompt: 'wooden slat ceiling panels' },
];

export type Extra = { id: string; label: string; cost: number; service: ServiceType; prompt: string };

export const EXTRAS: Extra[] = [
  { id: 'panelling', label: 'Feature wall panelling', cost: 35000, service: 'Carpenter', prompt: 'vertical wooden slat feature wall' },
  { id: 'lighting', label: 'Lighting upgrade', cost: 25000, service: 'Electrician', prompt: 'layered ambient lighting' },
  { id: 'woodwork', label: 'Custom furniture / woodwork', cost: 80000, service: 'Carpenter', prompt: 'custom built-in wooden storage' },
  { id: 'decor', label: 'Curtains & décor', cost: 20000, service: 'Interior Decorator', prompt: 'new curtains, cushions and decor accessories' },
];

export const SERVICE_TYPES = ['Painter', 'Carpenter', 'Interior Decorator', 'Electrician', 'Contractor'] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const SERVICE_ICONS: Record<ServiceType, IconName> = {
  Painter: 'color-palette-outline',
  Carpenter: 'hammer-outline',
  'Interior Decorator': 'sparkles-outline',
  Electrician: 'flash-outline',
  Contractor: 'construct-outline',
};

export const CITY_FACTOR: Record<string, number> = { Sukkur: 1.0, Hyderabad: 1.05, Karachi: 1.15 };

export const findById = <T extends { id: string }>(list: T[], id: string | undefined, fallback = 0): T =>
  list.find((x) => x.id === id) ?? list[fallback];
