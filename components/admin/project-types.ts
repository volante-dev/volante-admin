export type AdminProjectListItem = {
  id: string;
  title: string;
  slug: string;
  featured: boolean;
  order: number;
  portfolioSize: "NORMAL" | "HERO";
  portfolioOrder: number;
  publishedAt: string | null;
  slidesCount: number;
  previewUrl: string | null;
};

export type AdminMasonryProject = {
  id: string;
  title: string;
  slug: string;
  imageUrl: string;
  imageAssetMediaType: "IMAGE" | "VIDEO" | null;
  imageAssetPosterUrl: string | null;
  portfolioSize: "NORMAL" | "HERO";
  portfolioOrder: number;
};

export type AdminProjectSlide = {
  id: string;
  order: number;
  title: string;
  contentHtml: string;
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl: string;
  mediaAssetId: string | null;
  posterUrl: string | null;
  alt: string | null;
  translations: {
    locale: string;
    title: string | null;
    contentHtml: string | null;
    alt: string | null;
  }[];
};

export type AdminProjectDetail = {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl: string;
  imageAssetId: string | null;
  imageAssetMediaType: "IMAGE" | "VIDEO" | null;
  imageAssetPosterUrl: string | null;
  heroPaletteComputed: string[];
  tags: string[];
  clientName: string | null;
  sectorEntryId: string | null;
  projectYear: number | null;
  locationEntryId: string | null;
  deliveredServiceEntryIds: string[];
  challenge: string | null;
  approach: string | null;
  results: string | null;
  credits: string | null;
  awards: string | null;
  externalUrl: string | null;
  featured: boolean;
  order: number;
  portfolioSize: "NORMAL" | "HERO";
  portfolioOrder: number;
  publishedAt: string | null;
  slides: AdminProjectSlide[];
  previewUrl: string | null;
  translations: {
    locale: string;
    title: string | null;
    slug: string | null;
    description: string | null;
    challenge: string | null;
    approach: string | null;
    results: string | null;
    awards: string | null;
  }[];
};
