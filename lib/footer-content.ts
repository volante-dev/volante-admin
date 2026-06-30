import prisma from "@/lib/prisma";
import {
  footerContentDefault,
  type FooterContentData,
} from "@/components/admin/footer-content-types";

export const getFooterContent = async (): Promise<FooterContentData> => {
  const content = await prisma.footerContent
    .findUnique({
      where: { id: "footer" },
      include: { translations: true },
    })
    .catch(() => null);

  if (!content) return footerContentDefault;

  return {
    id: "footer",
    tagline: content.tagline,
    contactHeading: content.contactHeading,
    contactEmail: content.contactEmail,
    contactSocialLabel: content.contactSocialLabel,
    legalText: content.legalText,
    madeWithCare: content.madeWithCare,
    translations: content.translations.map((translation) => ({
      locale: translation.locale,
      tagline: translation.tagline,
      contactHeading: translation.contactHeading,
      contactEmail: translation.contactEmail,
      contactSocialLabel: translation.contactSocialLabel,
      legalText: translation.legalText,
      madeWithCare: translation.madeWithCare,
    })),
  };
};
