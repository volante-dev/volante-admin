import prisma from "@/lib/prisma";
import {
  homePageContentDefault,
  type HomePageContentData,
} from "@/components/admin/home-page-types";

export const getHomePageContent = async (): Promise<HomePageContentData> => {
  const content = await prisma.homePageContent
    .findUnique({
      where: { id: "home" },
      include: { translations: true },
    })
    .catch(() => null);

  if (!content) return homePageContentDefault;

  return {
    id: "home",
    eyebrow: content.eyebrow,
    eyebrowEn: content.eyebrowEn,
    title: content.title,
    titleEn: content.titleEn,
    subheading: content.subheading,
    subheadingEn: content.subheadingEn,
    primaryCtaLabel: content.primaryCtaLabel,
    primaryCtaLabelEn: content.primaryCtaLabelEn,
    secondaryCtaLabel: content.secondaryCtaLabel,
    secondaryCtaLabelEn: content.secondaryCtaLabelEn,
    translations: content.translations.map((translation) => ({
      locale: translation.locale,
      eyebrow: translation.eyebrow,
      title: translation.title,
      subheading: translation.subheading,
      primaryCtaLabel: translation.primaryCtaLabel,
      secondaryCtaLabel: translation.secondaryCtaLabel,
    })),
  };
};
