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
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import {
  deleteProject,
  publishProject,
  unpublishProject,
} from "@/app/(admin)/projects/actions";
import type { AdminProjectListItem } from "./project-types";

type StatusFilter = "all" | "published" | "draft";
type FeaturedFilter = "all" | "featured";

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "--";

export const ProjectTable = ({
  projects,
}: {
  projects: AdminProjectListItem[];
}) => {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [featuredFilter, setFeaturedFilter] =
    useState<FeaturedFilter>("all");
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] =
    useState<AdminProjectListItem | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return projects.filter((project) => {
      if (statusFilter === "published" && !project.publishedAt) return false;
      if (statusFilter === "draft" && project.publishedAt) return false;
      if (featuredFilter === "featured" && !project.featured) return false;
      if (!normalizedQuery) return true;

      return (
        project.title.toLowerCase().includes(normalizedQuery) ||
        project.slug.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [projects, statusFilter, featuredFilter, query]);

  const runMutation = (
    project: AdminProjectListItem,
    mutation: () => Promise<{
      success: boolean;
      error?: string;
      warnings?: string[];
    }>,
    successMessage: string,
  ) => {
    setPendingId(project.id);
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
      () => deleteProject(deleteTarget.id),
      "Realisation supprimee.",
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
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <ToggleButtonGroup
            value={statusFilter}
            exclusive
            onChange={(_, value) => value && setStatusFilter(value)}
            size="small"
          >
            <ToggleButton value="all">Tous ({projects.length})</ToggleButton>
            <ToggleButton value="published">
              Publies ({projects.filter((p) => p.publishedAt).length})
            </ToggleButton>
            <ToggleButton value="draft">
              Brouillons ({projects.filter((p) => !p.publishedAt).length})
            </ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            value={featuredFilter}
            exclusive
            onChange={(_, value) => value && setFeaturedFilter(value)}
            size="small"
          >
            <ToggleButton value="all">Tous</ToggleButton>
            <ToggleButton value="featured">Featured</ToggleButton>
          </ToggleButtonGroup>
        </Box>
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
              <TableCell>Featured</TableCell>
              <TableCell>Ordre</TableCell>
              <TableCell>Publication</TableCell>
              <TableCell>Slides</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Aucune realisation trouvee.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((project) => {
                const isPending = pending && pendingId === project.id;
                const published = project.publishedAt !== null;

                return (
                  <TableRow key={project.id} hover>
                    <TableCell>{project.title}</TableCell>
                    <TableCell>{project.slug}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={published ? "Publie" : "Brouillon"}
                        color={published ? "success" : "default"}
                        variant={published ? "filled" : "outlined"}
                      />
                    </TableCell>
                    <TableCell>{project.featured ? "Oui" : "--"}</TableCell>
                    <TableCell>{project.order}</TableCell>
                    <TableCell>{formatDate(project.publishedAt)}</TableCell>
                    <TableCell>{project.slidesCount}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Modifier">
                        <IconButton
                          component={Link}
                          href={`/projects/${project.id}/edit`}
                          size="small"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip
                        title={
                          project.previewUrl
                            ? "Previsualiser"
                            : "PREVIEW_SECRET requis pour un brouillon"
                        }
                      >
                        <span>
                          <IconButton
                            component="a"
                            href={project.previewUrl ?? undefined}
                            target="_blank"
                            rel="noreferrer"
                            size="small"
                            disabled={!project.previewUrl}
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
                                project,
                                () =>
                                  published
                                    ? unpublishProject(project.id)
                                    : publishProject(project.id),
                                published
                                  ? "Realisation repassee en brouillon."
                                  : "Realisation publiee.",
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
                          onClick={() => setDeleteTarget(project)}
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
          {filtered.length} realisation{filtered.length !== 1 ? "s" : ""}
        </Typography>
      </Box>

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        title={`Supprimer "${deleteTarget?.title}" ?`}
        message="Cette action est irreversible. La realisation et ses slides seront supprimees du site public."
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
};
