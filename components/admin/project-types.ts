export type AdminProjectListItem = {
  id: string;
  title: string;
  slug: string;
  featured: boolean;
  order: number;
  publishedAt: string | null;
  slidesCount: number;
  previewUrl: string | null;
};

export type AdminProjectSlide = {
  id: string;
  order: number;
  title: string;
  titleEn: string | null;
  contentHtml: string;
  contentHtmlEn: string | null;
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl: string;
  posterUrl: string | null;
  alt: string | null;
  altEn: string | null;
};

export type AdminProjectDetail = {
  id: string;
  title: string;
  titleEn: string | null;
  slug: string;
  description: string;
  descriptionEn: string | null;
  imageUrl: string;
  tags: string[];
  featured: boolean;
  order: number;
  publishedAt: string | null;
  slides: AdminProjectSlide[];
  previewUrl: string | null;
};
