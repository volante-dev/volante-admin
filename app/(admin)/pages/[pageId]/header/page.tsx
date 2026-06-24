import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import prisma from "@/lib/prisma";
import { PageHeaderForm } from "@/components/admin/PageHeaderForm";
import {
  isPageHeaderId,
  pageHeaderDefaults,
  pageHeaderLabels,
  type PageHeaderContentData,
  type PageHeaderId,
} from "@/components/admin/page-header-types";

export const dynamic = "force-dynamic";

const getPageHeaderContent = async (
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
  };
};

const PageHeaderAdmin = async ({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) => {
  const { pageId: rawPageId } = await params;
  if (!isPageHeaderId(rawPageId)) notFound();

  const content = await getPageHeaderContent(rawPageId);
  const label = pageHeaderLabels[rawPageId];

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          Pages / {label} / Header
        </Typography>
        <Typography variant="h2">Header {label}</Typography>
      </Box>
      <PageHeaderForm content={content} />
    </>
  );
};

export default PageHeaderAdmin;
