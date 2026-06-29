"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { toast } from "sonner";
import { createService, updateService } from "@/app/(admin)/services/actions";
import { isBlankRichText } from "@/lib/rich-text";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { TranslateButton } from "@/components/admin/TranslateButton";
import type { ServiceData } from "@/app/(admin)/services/page";

export type ServicePortfolioExampleProject = {
  id: string;
  title: string;
  imageUrl: string;
  imageAssetMediaType: "IMAGE" | "VIDEO" | null;
  imageAssetPosterUrl: string | null;
};

type ServiceFormProps = {
  service?: ServiceData & {
    portfolioExamples?: ServicePortfolioExampleProject[];
  };
  availableProjects?: ServicePortfolioExampleProject[];
};

const inferMediaTypeFromUrl = (value: string) =>
  /\.(mp4|mov|webm)(?:[?#].*)?$/i.test(value) ? "VIDEO" : "IMAGE";

const ProjectPreviewMedia = ({ project }: { project: ServicePortfolioExampleProject }) => {
  const mediaType = project.imageAssetMediaType ?? inferMediaTypeFromUrl(project.imageUrl);
  const src = mediaType === "VIDEO" ? project.imageAssetPosterUrl ?? project.imageUrl : project.imageUrl;

  return (
    <Box
      component="img"
      src={src}
      alt=""
      sx={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
      }}
    />
  );
};

const SortableSelectedProject = ({
  project,
  onRemove,
}: {
  project: ServicePortfolioExampleProject;
  onRemove: (id: string) => void;
}) => {
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
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        aspectRatio: "0.78",
        bgcolor: "grey.100",
        opacity: isDragging ? 0.6 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <ProjectPreviewMedia project={project} />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,.72), rgba(0,0,0,.08) 65%)",
        }}
      />
      <IconButton
        size="small"
        aria-label="Déplacer"
        sx={{
          position: "absolute",
          left: 4,
          top: 4,
          color: "white",
          bgcolor: "rgba(0,0,0,.28)",
          cursor: "grab",
          "&:hover": { bgcolor: "rgba(0,0,0,.42)" },
        }}
        {...attributes}
        {...listeners}
      >
        <DragIndicatorIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        aria-label="Retirer"
        onClick={() => onRemove(project.id)}
        sx={{
          position: "absolute",
          right: 4,
          top: 4,
          color: "white",
          bgcolor: "rgba(0,0,0,.28)",
          "&:hover": { bgcolor: "rgba(0,0,0,.42)" },
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
      <Typography
        variant="body2"
        sx={{
          position: "absolute",
          left: 10,
          right: 10,
          bottom: 10,
          color: "white",
          fontWeight: 600,
          textShadow: "0 1px 8px rgba(0,0,0,.38)",
        }}
      >
        {project.title}
      </Typography>
    </Box>
  );
};

export const ServiceForm = ({ service, availableProjects = [] }: ServiceFormProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const [title, setTitle] = useState(service?.title ?? "");
  const [titleEn, setTitleEn] = useState(service?.titleEn ?? "");
  const [descriptionHtml, setDescriptionHtml] = useState(
    service?.descriptionHtml ?? `<p>${service?.description ?? ""}</p>`,
  );
  const [descriptionEn, setDescriptionEn] = useState(
    service?.descriptionHtmlEn ?? (service?.descriptionEn ? `<p>${service.descriptionEn}</p>` : ""),
  );
  const [icon, setIcon] = useState(service?.icon ?? "");
  const [order, setOrder] = useState(String(service?.order ?? 0));
  const [active, setActive] = useState(service?.active ?? true);
  const [selectedExamples, setSelectedExamples] = useState<ServicePortfolioExampleProject[]>(
    service?.portfolioExamples ?? [],
  );
  const [projectToAdd, setProjectToAdd] = useState("");

  const selectableProjects = availableProjects.filter(
    (project) => !selectedExamples.some((selected) => selected.id === project.id),
  );

  const addExample = () => {
    if (selectedExamples.length >= 3 || !projectToAdd) return;
    const project = availableProjects.find((item) => item.id === projectToAdd);
    if (!project) return;
    setSelectedExamples((current) => [...current, project]);
    setProjectToAdd("");
  };

  const removeExample = (id: string) => {
    setSelectedExamples((current) => current.filter((project) => project.id !== id));
  };

  const handleExamplesDragEnd = (event: DragEndEvent) => {
    const { active: dragged, over } = event;
    if (!over || dragged.id === over.id) return;

    setSelectedExamples((current) => {
      const oldIndex = current.findIndex((project) => project.id === dragged.id);
      const newIndex = current.findIndex((project) => project.id === over.id);
      return arrayMove(current, oldIndex, newIndex);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title || title.length < 2) {
      setError("Le titre doit contenir au moins 2 caracteres.");
      setTab(0);
      return;
    }
    if (isBlankRichText(descriptionHtml)) {
      setError("La description doit contenir au moins 10 caracteres.");
      setTab(0);
      return;
    }

    const formData = new FormData();
    formData.set("title", title);
    formData.set("titleEn", titleEn);
    formData.set("descriptionHtml", descriptionHtml);
    formData.set("descriptionHtmlEn", descriptionEn);
    formData.set("icon", icon);
    formData.set("order", order);
    formData.set("active", String(active));
    formData.set(
      "portfolioExampleProjectIds",
      JSON.stringify(selectedExamples.map((project) => project.id)),
    );

    startTransition(async () => {
      const result = service
        ? await updateService(service.id, formData)
        : await createService(formData);

      if (result.success) {
        toast.success(
          service ? "Service mis a jour." : "Service cree avec succes.",
        );
        router.push("/services");
      } else {
        setError(result.error ?? "Une erreur est survenue.");
      }
    });
  };

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit}>
          {error && (
            <Typography
              variant="body2"
              color="error"
              sx={{ mb: 2, p: 1.5, bgcolor: "error.50", borderRadius: 1 }}
            >
              {error}
            </Typography>
          )}

          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="Francais" />
            <Tab label="English" />
          </Tabs>

          {tab === 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <TextField
                label="Titre"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                fullWidth
                error={!!error && title.length < 2}
                helperText="Titre du service en francais (min. 2 caracteres)"
              />
              <RichTextEditor
                label="Description"
                value={descriptionHtml}
                onChange={setDescriptionHtml}
                error={!!error && isBlankRichText(descriptionHtml)}
              />
            </Box>
          )}

          {tab === 1 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                <TextField
                  label="Title (EN)"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  fullWidth
                  helperText="Traduction anglaise du titre (optionnel)"
                />
                <TranslateButton sourceText={title} onTranslated={setTitleEn} />
              </Box>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                <Box sx={{ flex: 1 }}>
                  <RichTextEditor
                    label="Description (EN)"
                    value={descriptionEn || "<p></p>"}
                    onChange={setDescriptionEn}
                  />
                </Box>
                <TranslateButton
                  sourceText={descriptionHtml}
                  onTranslated={setDescriptionEn}
                  html
                />
              </Box>
            </Box>
          )}

          <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box>
                <Typography variant="h3">Exemples de réalisations</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {"Jusqu'à 3 réalisations publiées, affichées sous la description du service."}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                <TextField
                  select
                  label="Ajouter une réalisation"
                  value={projectToAdd}
                  onChange={(event) => setProjectToAdd(event.target.value)}
                  disabled={selectedExamples.length >= 3 || selectableProjects.length === 0}
                  fullWidth
                  helperText={
                    selectedExamples.length >= 3
                      ? "Limite de 3 exemples atteinte."
                      : "Seules les réalisations publiées sont proposées."
                  }
                >
                  {selectableProjects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.title}
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addExample}
                  disabled={!projectToAdd || selectedExamples.length >= 3}
                  sx={{ mt: 1 }}
                >
                  Ajouter
                </Button>
              </Box>
              {selectedExamples.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleExamplesDragEnd}
                >
                  <SortableContext
                    items={selectedExamples.map((project) => project.id)}
                    strategy={rectSortingStrategy}
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "repeat(3, minmax(0, 1fr))", md: "repeat(3, 150px)" },
                        gap: 1.5,
                      }}
                    >
                      {selectedExamples.map((project) => (
                        <SortableSelectedProject
                          key={project.id}
                          project={project}
                          onRemove={removeExample}
                        />
                      ))}
                    </Box>
                  </SortableContext>
                </DndContext>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "repeat(3, minmax(0, 1fr))", md: "repeat(3, 150px)" },
                    gap: 1.5,
                  }}
                >
                  {[0, 1, 2].map((placeholder) => (
                    <Box
                      key={placeholder}
                      sx={{
                        aspectRatio: "0.78",
                        borderRadius: 1,
                        border: "1px dashed",
                        borderColor: "divider",
                        bgcolor: "grey.50",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "text.secondary",
                      }}
                    >
                      <Typography variant="body2">Placeholder</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
            <TextField
              label="Icone"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              fullWidth
              helperText="Identifiant de l'icone (optionnel)"
            />
            <TextField
              label="Ordre"
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              required
              fullWidth
              slotProps={{ htmlInput: { min: 0 } }}
              helperText="Position d'affichage (0 = premier)"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  color="primary"
                />
              }
              label="Actif"
            />
          </Box>

          <Box
            sx={{ mt: 4, display: "flex", gap: 2, justifyContent: "flex-end" }}
          >
            <Button
              variant="outlined"
              onClick={() => router.push("/services")}
              disabled={pending}
            >
              Annuler
            </Button>
            <Button type="submit" variant="contained" disabled={pending}>
              {pending
                ? "Enregistrement..."
                : service
                  ? "Mettre a jour"
                  : "Creer"}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};
