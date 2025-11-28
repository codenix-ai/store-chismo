export interface SiteConfig {
  branding: SiteBranding;
  theme: SiteTheme;
  hero: SiteHero;
  about: SiteAbout;
  menu: SiteMenu;
  gallery: SiteGallery;
  testimonials: SiteTestimonials;
  contact: SiteContact;
  navigation: SiteNavigation;
  footer: SiteFooter;
  reservationForm: SiteReservationForm;
  seo: SiteSeo;
}

export interface SiteBranding {
  name: string;
  tagline?: string;
  description?: string;
  logo?: {
    url?: string;
    alt?: string;
  };
}

export interface SiteTheme {
  colors: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
}

export interface SiteHero {
  title: string;
  subtitle?: string;
  description?: string;
  backgroundImage?: {
    id: string;
    alt: string;
  };
  buttons?: Array<{
    text: string;
    action: string;
    variant: 'primary' | 'outline' | 'secondary';
  }>;
}

export interface SiteAbout {
  title: string;
  paragraphs: string[];
  stats?: Array<{
    value: string;
    label: string;
  }>;
}

export interface SiteMenuItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: string;
}

export interface SiteMenu {
  title: string;
  subtitle?: string;
  items: SiteMenuItem[];
}

export interface SiteGalleryImage {
  id: string;
  alt: string;
}

export interface SiteGallery {
  title: string;
  subtitle?: string;
  images: SiteGalleryImage[];
}

export interface SiteTestimonialItem {
  id: string;
  name: string;
  role?: string;
  rating: number;
  comment: string;
}

export interface SiteTestimonials {
  title: string;
  subtitle?: string;
  items: SiteTestimonialItem[];
}

export interface SiteContact {
  title: string;
  subtitle?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  phone?: string;
  email?: string;
  hours?: Record<string, string>;
  social?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
  };
}

export interface SiteNavigation {
  items: Array<{
    label: string;
    href: string;
  }>;
  reserveButtonText?: string;
}

export interface SiteFooter {
  aboutText?: string;
  copyrightText?: string;
}

export interface SiteReservationFormField {
  label: string;
  placeholder?: string;
}

export interface SiteReservationForm {
  title: string;
  fields: {
    name: SiteReservationFormField;
    email: SiteReservationFormField;
    phone: SiteReservationFormField;
    date: SiteReservationFormField;
    time: SiteReservationFormField;
    partySize: SiteReservationFormField;
    specialRequests?: SiteReservationFormField;
  };
  submitButton: string;
  submittingButton?: string;
  successMessage?: string;
  errorMessage?: string;
}

export interface SiteSeo {
  title: string;
  description: string;
  keywords?: string[];
}
