export type BlogPostBlockType = "RICHTEXT" | "IMAGE" | "VIDEO";

export type AdminBlogPostListItem = {
  id: string;
  title: string;
  slug: string;
  publishedAt: string | null;
  blocksCount: number;
  previewUrl: string | null;
};

export type AdminBlogPostBlock = {
  id: string;
  order: number;
  type: BlogPostBlockType;
  contentHtml: string | null;
  mediaUrl: string | null;
  mediaAssetId: string | null;
  mediaAssetPosterUrl: string | null;
  translations: {
    locale: string;
    contentHtml: string | null;
  }[];
};

export type AdminBlogPostDetail = {
  id: string;
  title: string;
  eyebrow: string;
  slug: string;
  seoDescription: string | null;
  coverMediaUrl: string;
  coverMediaAssetId: string | null;
  coverMediaAssetType: "IMAGE" | "VIDEO" | null;
  coverMediaPosterUrl: string | null;
  tags: string[];
  publishedAt: string | null;
  blocks: AdminBlogPostBlock[];
  previewUrl: string | null;
  translations: {
    locale: string;
    title: string | null;
    eyebrow: string | null;
    slug: string | null;
    seoDescription: string | null;
    tags: string[];
  }[];
};
