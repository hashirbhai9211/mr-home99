export type SocialLink = { platform: string; url: string };
export type OfficeLocation = { name: string; address: string; phone?: string; mapUrl?: string; hours?: string };
export type FooterLink = { label: string; href: string };

export interface SiteSettings {
  brandName: string;
  tagline: string;
  logo: string;
  logoDark: string;
  favicon: string;
  primaryColor: string;
  accentColor: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  workingHours: string;
  mapUrl: string;
  offices: OfficeLocation[];
  socialLinks: SocialLink[];
  footerDescription: string;
  copyrightText: string;
  footerLinks: FooterLink[];
  seoDefaultTitle: string;
  seoDefaultDescription: string;
  seoOgImage: string;
  siteUrl: string;
  gaId: string;
  metaPixelId: string;
  whatsappDefaultMessage: string;
  whatsappProjectMessage: string;
  whatsappMarketMessage: string;
  newsletterEnabled: boolean;
  newsletterTitle: string;
  newsletterDescription: string;
  introVideoUrl: string;
  introVideoPoster: string;
  introVideoEnabled: boolean;
  announcement: string;
  announcementEnabled: boolean;
  cookieConsentText: string;
  disclaimer: string;
  contactFields: string[];
  budgetOptions: string[];
  interestOptions: string[];
  cityFieldEnabled: boolean;
  customBudgetEnabled: boolean;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  // NOTE: DB seeds persist the values below at seed time; existing databases are
  // migrated forward by MRH-2026-09 settings patch (see src/lib/settings-types.ts mergeSettings).
  brandName: "MR.HOME",
  tagline: "Invest Wise. Live Better.",
  logo: "/brand/logo.svg",
  logoDark: "/brand/logo-dark.svg",
  favicon: "/brand/favicon.svg",
  primaryColor: "#1f8f3a",
  accentColor: "#3ec24a",
  phone: "+92 300 1363636",
  whatsapp: "+923001363636",
  email: "info@mrhome.ae",
  address: "Office 3402, Business Bay, Dubai, UAE",
  workingHours: "Mon – Sat: 9AM – 6PM",
  mapUrl: "https://maps.google.com/?q=Business+Bay+Dubai",
  offices: [
    { name: "Dubai HQ", address: "Office 3402, Business Bay, Dubai, UAE", phone: "+971 50 123 4567", hours: "Mon – Sat: 9AM – 6PM", mapUrl: "https://maps.google.com/?q=Business+Bay+Dubai" },
    { name: "Islamabad", address: "Blue Area, Islamabad, Pakistan", phone: "+92 51 000 0000", hours: "Mon – Sat: 10AM – 7PM", mapUrl: "https://maps.google.com/?q=Blue+Area+Islamabad" },
  ],
  socialLinks: [
    { platform: "facebook", url: "https://facebook.com/mrhome" },
    { platform: "instagram", url: "https://instagram.com/mrhome" },
    { platform: "linkedin", url: "https://linkedin.com/company/mrhome" },
    { platform: "youtube", url: "https://youtube.com/@mrhome" },
  ],
  footerDescription: "Your global real estate partner for a better tomorrow.",
  copyrightText: "MR.HOME. All Rights Reserved.",
  footerLinks: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Cookie Policy", href: "/cookie-policy" },
  ],
  seoDefaultTitle: "MR.HOME — Invest Wise. Live Better.",
  seoDefaultDescription: "Curated luxury properties across 10 global markets. Your trusted partner in international real estate investment.",
  seoOgImage: "/images/hero-villa.jpg",
  siteUrl: "",
  gaId: "",
  metaPixelId: "",
  whatsappDefaultMessage: "Hello MR.HOME, I would like to learn more about your property opportunities.",
  whatsappProjectMessage: "Hello MR.HOME, I'm interested in {{project}} in {{market}}. Please share more details.",
  whatsappMarketMessage: "Hello MR.HOME, I'm interested in investment opportunities in {{market}}.",
  newsletterEnabled: true,
  newsletterTitle: "Newsletter",
  newsletterDescription: "Stay updated with our latest projects and insights.",
  introVideoUrl: "https://res.cloudinary.com/j6kdg6uv/video/upload/ac_none/v1788578370/upscaled-video.mp4",
  introVideoPoster: "https://res.cloudinary.com/j6kdg6uv/video/upload/so_0/v1788578370/upscaled-video.jpg",
  introVideoEnabled: true,
  announcement: "",
  announcementEnabled: false,
  cookieConsentText: "We use cookies to enhance your experience and analyse traffic. You can accept or decline analytics cookies.",
  disclaimer: "All prices, ROI figures and handover dates are indicative and subject to change by the developer. MR.HOME acts as a marketing partner and does not guarantee investment returns.",
  contactFields: ["name", "email", "phone", "country", "market", "project", "budget", "interest", "message"],
  budgetOptions: ["Under $250K", "$250K – $500K", "$500K – $1M", "$1M – $3M", "$3M+"],
  interestOptions: ["Apartment", "Villa", "Penthouse", "Townhouse", "Commercial", "Land / Plot"],
  cityFieldEnabled: true,
  customBudgetEnabled: true,
};

export function mergeSettings(data: Record<string, unknown> | null | undefined): SiteSettings {
  const merged = { ...DEFAULT_SETTINGS, ...((data ?? {}) as Partial<SiteSettings>) };
  // One-time forward-fix: early seeds stored remote stock image URLs; the shipped
  // project now self-hosts those exact assets locally. Only rewrites the legacy values.
  if (typeof merged.seoOgImage === "string" && merged.seoOgImage.includes("images.pexels.com")) merged.seoOgImage = "/images/hero-villa.jpg";
  return merged;
}
