"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { toast } from "sonner";
import { updateProjectMasonryLayout } from "@/app/(admin)/projects/actions";
import type { AdminMasonryProject } from "./project-types";
import {
  getDesktopMasonryPlacements,
  type DesktopMasonryPlacement,
} from "./masonry-layout";

type SortableProjectTileProps = {
  project: AdminMasonryProject;
  placement: DesktopMasonryPlacement;
  visualHero: boolean;
  autoHero: boolean;
  onToggleSize: (id: string) => void;
};

const inferMediaTypeFromUrl = (value: string) =>
  /\.(mp4|mov|webm)(?:[?#].*)?$/i.test(value) ? "VIDEO" : "IMAGE";

const ProjectCoverPreview = ({
  project,
}: {
  project: AdminMasonryProject;
}) => {
  const mediaType =
    project.imageAssetMediaType ?? inferMediaTypeFromUrl(project.imageUrl);
  const sx = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  } as const;

  return mediaType === "VIDEO" ? (
    <Box
      component="video"
      src={project.imageUrl}
      poster={project.imageAssetPosterUrl ?? undefined}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      sx={sx}
    />
  ) : (
    <Box component="img" src={project.imageUrl} alt="" sx={sx} />
  );
};

const SortableProjectTile = ({
  project,
  placement,
  visualHero,
  autoHero,
  onToggleSize,
}: SortableProjectTileProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        position: "relative",
        overflow: "hidden",
        minHeight: 0,
        gridColumn: `${placement.columnStart} / span ${placement.columnSpan}`,
        gridRow: `${placement.rowStart} / span ${placement.rowSpan}`,
        opacity: isDragging ? 0.55 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
        backgroundColor: "grey.900",
        borderRadius: 1,
        boxShadow: isDragging ? 6 : 0,
        zIndex: isDragging ? 2 : 1,
      }}
    >
      <ProjectCoverPreview project={project} />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,.82), rgba(0,0,0,.05) 70%)",
        }}
      />
      <Tooltip title="Deplacer la realisation">
        <IconButton
          size="small"
          aria-label={`Deplacer ${project.title}`}
          {...attributes}
          {...listeners}
          sx={{
            position: "absolute",
            top: 6,
            left: 6,
            color: "common.white",
            backgroundColor: "rgba(0,0,0,.55)",
            cursor: isDragging ? "grabbing" : "grab",
            "&:hover": { backgroundColor: "rgba(0,0,0,.75)" },
          }}
        >
          <DragIndicatorIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Button
        size="small"
        variant="contained"
        onClick={() => onToggleSize(project.id)}
        aria-label={`Passer ${project.title} en ${project.portfolioSize === "HERO" ? "normal" : "hero"}`}
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          minWidth: 0,
          px: 1,
          py: 0.25,
          fontSize: "0.65rem",
        }}
      >
        {autoHero
          ? "Hero auto"
          : project.portfolioSize === "HERO"
            ? "Hero"
            : "Normal"}
      </Button>
      <Typography
        variant={visualHero ? "h5" : "caption"}
        sx={{
          position: "absolute",
          left: 1,
          right: 1,
          bottom: 1,
          color: "common.white",
          fontWeight: 600,
          lineHeight: 1.2,
        }}
      >
        {project.title}
      </Typography>
    </Box>
  );
};

const HeaderPreviewTile = ({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end",
      minHeight: 0,
      p: 2,
      gridColumn: "1 / span 2",
      gridRow: "1 / span 2",
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 1,
      backgroundColor: "grey.50",
    }}
  >
    <Typography variant="caption" color="primary" sx={{ mb: 1 }}>
      {eyebrow}
    </Typography>
    <Typography variant="h5" sx={{ lineHeight: 1 }}>
      {title}
    </Typography>
  </Box>
);

const MobilePreview = ({
  projects,
  header,
}: {
  projects: AdminMasonryProject[];
  header: ProjectMasonryEditorHeader;
}) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gridAutoRows: 48,
      gap: "2px",
      overflow: "hidden",
      borderRadius: 1,
      backgroundColor: "divider",
    }}
  >
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        gridColumn: "span 2",
        gridRow: "span 2",
        p: 1,
        backgroundColor: "grey.50",
      }}
    >
      <Typography sx={{ color: "primary.main", fontSize: "0.5rem" }}>
        {header.eyebrow}
      </Typography>
      <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, lineHeight: 1 }}>
        {header.title}
      </Typography>
    </Box>
    {projects.map((project, index) => {
      const hero = index === 0 || project.portfolioSize === "HERO";
      return (
        <Box
          key={project.id}
          sx={{
            position: "relative",
            overflow: "hidden",
            gridColumn: hero ? "span 2" : "span 1",
            gridRow: hero ? "span 2" : "span 1",
            backgroundColor: "grey.900",
          }}
        >
          <ProjectCoverPreview project={project} />
          <Typography
            sx={{
              position: "absolute",
              left: 0.5,
              right: 0.5,
              bottom: 0.5,
              color: "common.white",
              fontSize: "0.55rem",
              lineHeight: 1.1,
              textShadow: "0 1px 3px rgba(0,0,0,.9)",
            }}
          >
            {project.title}
          </Typography>
        </Box>
      );
    })}
  </Box>
);

const serializeLayout = (projects: AdminMasonryProject[]) =>
  projects.map(({ id, portfolioSize }) => `${id}:${portfolioSize}`).join("|");

type ProjectMasonryEditorHeader = {
  eyebrow: string;
  title: string;
};

export const ProjectMasonryEditor = ({
  projects: initialProjects,
  header,
}: {
  projects: AdminMasonryProject[];
  header: ProjectMasonryEditorHeader;
}) => {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [savedProjects, setSavedProjects] = useState(initialProjects);
  const [saving, startSaving] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const firstProject = projects[0];
  const remainingProjects = useMemo(() => projects.slice(1), [projects]);
  const placements = useMemo(
    () =>
      getDesktopMasonryPlacements(remainingProjects, {
        rowStart: 3,
        promoteNormalBands: true,
      }),
    [remainingProjects],
  );
  const dirty = serializeLayout(projects) !== serializeLayout(savedProjects);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setProjects((current) => {
      const oldIndex = current.findIndex((project) => project.id === active.id);
      const newIndex = current.findIndex((project) => project.id === over.id);
      return arrayMove(current, oldIndex, newIndex);
    });
  };

  const toggleSize = (id: string) => {
    setProjects((current) =>
      current.map((project) =>
        project.id === id
          ? {
              ...project,
              portfolioSize:
                project.portfolioSize === "HERO" ? "NORMAL" : "HERO",
            }
          : project,
      ),
    );
  };

  const save = () => {
    startSaving(async () => {
      const result = await updateProjectMasonryLayout(
        projects.map(({ id, portfolioSize }) => ({ id, portfolioSize })),
      );
      if (!result.success) {
        toast.error(result.error ?? "Erreur lors de la sauvegarde.");
        return;
      }
      setSavedProjects(projects);
      toast.success("Agencement du portfolio enregistre.");
      router.refresh();
    });
  };

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, mb: 4 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h4">Agencement du portfolio</Typography>
          <Typography variant="body2" color="text.secondary">
            Glissez les realisations publiees et choisissez leur format.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setProjects(savedProjects)}
            disabled={!dirty || saving}
          >
            Annuler
          </Button>
          <Button variant="contained" onClick={save} disabled={!dirty || saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </Box>
      </Box>

      {projects.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 3 }}>
          Publiez une realisation pour commencer l’agencement.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 190px" },
            alignItems: "start",
            gap: 3,
          }}
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={projects.map((project) => project.id)}
              strategy={rectSortingStrategy}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gridAutoRows: "clamp(76px, 9vw, 132px)",
                  gap: "3px",
                  minWidth: 0,
                }}
              >
                <HeaderPreviewTile {...header} />
                {firstProject && (
                  <SortableProjectTile
                    key={firstProject.id}
                    project={firstProject}
                    placement={{
                      columnStart: 3,
                      rowStart: 1,
                      columnSpan: 2,
                      rowSpan: 2,
                    }}
                    visualHero
                    autoHero={firstProject.portfolioSize === "NORMAL"}
                    onToggleSize={toggleSize}
                  />
                )}
                {remainingProjects.map((project) => {
                  const placement = placements.get(project.id)!;
                  const visualHero =
                    placement.columnSpan === 2 && placement.rowSpan === 2;
                  return (
                  <SortableProjectTile
                    key={project.id}
                    project={project}
                    placement={placement}
                    visualHero={visualHero}
                    autoHero={visualHero && project.portfolioSize === "NORMAL"}
                    onToggleSize={toggleSize}
                  />
                  );
                })}
              </Box>
            </SortableContext>
          </DndContext>

          <Box sx={{ position: { lg: "sticky" }, top: { lg: 24 } }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Preview mobile
            </Typography>
            <MobilePreview projects={projects} header={header} />
          </Box>
        </Box>
      )}
    </Paper>
  );
};
