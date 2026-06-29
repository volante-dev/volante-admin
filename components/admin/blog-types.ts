export type BlogPostBlockType = "RICHTEXT" | "IMAGE" | "VIDEO";

export type AdminBlogPostListItem = {
  id: string;
  title: string;
  slug: string;
  slugEn: string;
  publishedAt: string | null;
  blocksCount: number;
  previewUrl: string | null;
};

export type AdminBlogPostBlock = {
  id: string;
  order: number;
  type: BlogPostBlockType;
  contentHtml: string | null;
  contentHtmlEn: string | null;
  mediaUrl: string | null;
  mediaAssetId: string | null;
  mediaAssetPosterUrl: string | null;
};

export type AdminBlogPostDetail = {
  id: string;
  title: string;
  titleEn: string;
  eyebrow: string;
  eyebrowEn: string | null;
  slug: string;
  slugEn: string;
  coverMediaUrl: string;
  coverMediaAssetId: string | null;
  coverMediaAssetType: "IMAGE" | "VIDEO" | null;
  coverMediaPosterUrl: string | null;
  tags: string[];
  tagsEn: string[];
  publishedAt: string | null;
  blocks: AdminBlogPostBlock[];
  previewUrl: string | null;
};
