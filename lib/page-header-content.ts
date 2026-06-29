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
    .findUnique({
      where: { id: pageId },
      include: { translations: true },
    })
    .catch(() => null);

  if (!content) return pageHeaderDefaults[pageId];

  return {
    id: pageId,
    eyebrow: content.eyebrow,
    title: content.title,
    intro: content.intro,
    translations: content.translations.map((translation) => ({
      locale: translation.locale,
      eyebrow: translation.eyebrow,
      title: translation.title,
      intro: translation.intro,
    })),
  };
};
