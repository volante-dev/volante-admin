import prisma from "@/lib/prisma";
import {
  pageHeaderDefaults,
  type PageHeaderContentData,
  type PageHeaderId,
} from "@/components/admin/page-header-types";

export const getPageHeaderContent = async (
  pageId: PageHeaderId,
): Promise<PageHeaderContentData> => {
  const content = await prisma.pageHeaderContent
    .findUnique({ where: { id: pageId } })
    .catch(() => null);

  if (!content) return pageHeaderDefaults[pageId];

  return {
    id: pageId,
    eyebrow: content.eyebrow,
    eyebrowEn: content.eyebrowEn,
    title: content.title,
    titleEn: content.titleEn,
    intro: content.intro,
    introEn: content.introEn,
  };
};
