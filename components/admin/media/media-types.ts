export type MediaAssetType = "IMAGE" | "VIDEO";

export type MediaAssetData = {
  id: string;
  url: string;
  pathname: string;
  mediaType: MediaAssetType;
  mimeType: string | null;
  size: number | null;
  width: number | null;
  height: number | null;
  name: string;
  alt: string | null;
  altEn: string | null;
  tags: string[];
  active: boolean;
  createdAt: string;
  usageCount: number;
};

export type MediaSelection = {
  id: string;
  url: string;
  mediaType: MediaAssetType;
  name: string;
  alt: string | null;
  altEn: string | null;
};
