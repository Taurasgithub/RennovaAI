import { create } from 'zustand';
import { accountsEnabled, supabase, type VendorProfile } from '../lib/supabase';
import type { ServiceType } from './catalog';
import type { Vendor } from './vendors';

/** An approved vendor account shown in the marketplace, in the same shape as the sample listings. */
export function vendorFromProfile(v: VendorProfile): Vendor {
  return {
    id: v.user_id,
    name: v.business_name,
    owner: v.owner_name,
    services: v.services as ServiceType[],
    city: v.city,
    area: v.service_areas[0] ?? '',
    // New accounts have no reviews or completed jobs yet; the UI shows "New" instead of a rating.
    rating: 0,
    reviewCount: 0,
    jobsCompleted: 0,
    yearsExperience: v.years_experience ?? 0,
    verified: v.status === 'approved',
    pro: false,
    priceFactor: 1,
    speedFactor: 1,
    responseTime: '~2 hrs',
    availableFrom: 'This week',
    about: v.about,
    portfolio: [],
    reviews: [],
    account: {
      logoUrl: v.logo_url,
      coverUrl: v.cover_url,
      photos: v.portfolio_urls,
      serviceAreas: v.service_areas,
      workingHours: v.working_hours,
      whatsapp: v.whatsapp,
    },
  };
}

type Marketplace = {
  accountVendors: Vendor[];
  load: () => Promise<void>;
};

/** Approved vendor accounts (readable by anyone through row-level security). Empty in on-device mode. */
export const useMarketplace = create<Marketplace>((set) => ({
  accountVendors: [],
  load: async () => {
    if (!accountsEnabled()) return;
    const { data } = await supabase.from('vendor_profiles').select('*').eq('status', 'approved').order('reviewed_at', { ascending: false });
    set({ accountVendors: ((data as VendorProfile[]) ?? []).map(vendorFromProfile) });
  },
}));
