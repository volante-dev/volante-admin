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
    title: content.title,
    subheading: content.subheading,
    primaryCtaLabel: content.primaryCtaLabel,
    secondaryCtaLabel: content.secondaryCtaLabel,
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
