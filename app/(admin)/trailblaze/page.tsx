import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import AddIcon from "@mui/icons-material/Add";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { createBlogPostPreviewUrl } from "@/lib/preview-token";
import { BlogPostTable } from "@/components/admin/BlogPostTable";
import type { AdminBlogPostListItem } from "@/components/admin/blog-types";

export const dynamic = "force-dynamic";

const TrailblazePage = async () => {
  const raw = await prisma.blogPost.findMany({
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    include: { _count: { select: { blocks: true } } },
  });

  const posts: AdminBlogPostListItem[] = raw.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    blocksCount: post._count.blocks,
    previewUrl: createBlogPostPreviewUrl(post.slug, post.publishedAt !== null),
  }));

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
          gap: 2,
        }}
      >
        <Typography variant="h2">Trailblaze</Typography>
        <Link href="/trailblaze/new">
          <Button variant="contained" startIcon={<AddIcon />}>
            Nouvel article
          </Button>
        </Link>
      </Box>

      {posts.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Aucun article pour le moment.
          </Typography>
          <Link href="/trailblaze/new">
            <Button variant="outlined" startIcon={<AddIcon />}>
              Creer le premier article
            </Button>
          </Link>
        </Box>
      ) : (
        <BlogPostTable posts={posts} />
      )}
    </>
  );
};

export default TrailblazePage;
