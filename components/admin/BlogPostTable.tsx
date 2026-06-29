"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PublishIcon from "@mui/icons-material/Publish";
import UnpublishedIcon from "@mui/icons-material/Unpublished";
import { toast } from "sonner";
import {
  deleteBlogPost,
  publishBlogPost,
  unpublishBlogPost,
} from "@/app/(admin)/trailblaze/actions";
import { formatAdminDateTime } from "@/lib/admin-date";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import type { AdminBlogPostListItem } from "./blog-types";

type StatusFilter = "all" | "published" | "draft";

export const BlogPostTable = ({
  posts,
}: {
  posts: AdminBlogPostListItem[];
}) => {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] =
    useState<AdminBlogPostListItem | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return posts.filter((post) => {
      if (statusFilter === "published" && !post.publishedAt) return false;
      if (statusFilter === "draft" && post.publishedAt) return false;
      if (!normalizedQuery) return true;

      return (
        post.title.toLowerCase().includes(normalizedQuery) ||
        post.slug.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [posts, query, statusFilter]);

  const runMutation = (
    post: AdminBlogPostListItem,
    mutation: () => Promise<{
      success: boolean;
      error?: string;
      warnings?: string[];
    }>,
    successMessage: string,
  ) => {
    setPendingId(post.id);
    startTransition(async () => {
      const result = await mutation();
      setPendingId(null);

      if (result.success) {
        toast.success(successMessage);
        result.warnings?.forEach((warning) => toast.warning(warning));
        router.refresh();
      } else {
        toast.error(result.error ?? "Une erreur est survenue.");
      }
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    runMutation(
      deleteTarget,
      () => deleteBlogPost(deleteTarget.id),
      "Article supprime.",
    );
    setDeleteTarget(null);
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "stretch", md: "center" },
          justifyContent: "space-between",
          mb: 2,
          flexDirection: { xs: "column", md: "row" },
          gap: 1.5,
        }}
      >
        <ToggleButtonGroup
          value={statusFilter}
          exclusive
          onChange={(_, value) => value && setStatusFilter(value)}
          size="small"
        >
          <ToggleButton value="all">Tous ({posts.length})</ToggleButton>
          <ToggleButton value="published">
            Publies ({posts.filter((p) => p.publishedAt).length})
          </ToggleButton>
          <ToggleButton value="draft">
            Brouillons ({posts.filter((p) => !p.publishedAt).length})
          </ToggleButton>
        </ToggleButtonGroup>
        <TextField
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher titre ou slug"
          size="small"
          sx={{ minWidth: { md: 280 } }}
        />
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Titre</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Publication</TableCell>
              <TableCell>Blocs</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Aucun article trouve.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((post) => {
                const isPending = pending && pendingId === post.id;
                const published = post.publishedAt !== null;

                return (
                  <TableRow key={post.id} hover>
                    <TableCell>{post.title}</TableCell>
                    <TableCell>{post.slug}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={published ? "Publie" : "Brouillon"}
                        color={published ? "success" : "default"}
                        variant={published ? "filled" : "outlined"}
                      />
                    </TableCell>
                    <TableCell>{formatAdminDateTime(post.publishedAt)}</TableCell>
                    <TableCell>{post.blocksCount}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Modifier">
                        <IconButton
                          component={Link}
                          href={`/trailblaze/${post.id}/edit`}
                          size="small"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Voir sur le site">
                        <span>
                          <IconButton
                            component="a"
                            href={post.previewUrl ?? undefined}
                            target="_blank"
                            rel="noreferrer"
                            size="small"
                            disabled={!post.previewUrl}
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={published ? "Repasser en brouillon" : "Publier"}>
                        <span>
                          <IconButton
                            size="small"
                            disabled={isPending}
                            onClick={() =>
                              runMutation(
                                post,
                                () =>
                                  published
                                    ? unpublishBlogPost(post.id)
                                    : publishBlogPost(post.id),
                                published
                                  ? "Article repasse en brouillon."
                                  : "Article publie.",
                              )
                            }
                          >
                            {published ? (
                              <UnpublishedIcon fontSize="small" />
                            ) : (
                              <PublishIcon fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Supprimer">
                        <IconButton
                          size="small"
                          color="error"
                          disabled={isPending}
                          onClick={() => setDeleteTarget(post)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 1.5 }}>
        <Typography variant="body2" color="text.secondary">
          {filtered.length} article{filtered.length !== 1 ? "s" : ""}
        </Typography>
      </Box>

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        title={`Supprimer "${deleteTarget?.title}" ?`}
        message="Cette action est irreversible. L'article et ses blocs seront supprimes du site public."
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
};
