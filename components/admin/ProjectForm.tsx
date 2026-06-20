"use client";

import { useMemo, useState, useTransition } from "react";
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Switch from "@mui/material/Switch";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import SaveIcon from "@mui/icons-material/Save";
import UnpublishedIcon from "@mui/icons-material/Unpublished";
import PublishIcon from "@mui/icons-material/Publish";
import { toast } from "sonner";
import { createProject, updateProject } from "@/app/(admin)/projects/actions";
import { hasUnsupportedRichTextHtml } from "@/lib/rich-text";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { MediaUrlField } from "./MediaUrlField";
import { RichTextEditor } from "./RichTextEditor";
import { TranslateButton } from "./TranslateButton";
import type { AdminProjectDetail } from "./project-types";

type EditableSlide = {
  key: string;
  id?: string;
  title: string;
  titleEn: string;
  contentHtml: string;
  contentHtmlEn: string;
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl: string;
  posterUrl: string;
  alt: string;
  altEn: string;
};

type ProjectFormProps = {
  project?: AdminProjectDetail;
};

const newKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

const emptySlide = (): EditableSlide => ({
  key: newKey(),
  title: "",
  titleEn: "",
  contentHtml: "<p></p>",
  contentHtmlEn: "",
  mediaType: "IMAGE",
  mediaUrl: "",
  posterUrl: "",
  alt: "",
  altEn: "",
});

const stripHtml = (value: string) =>
  value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();

const isIncompleteSlide = (slide: EditableSlide) =>
  !slide.title.trim() || !stripHtml(slide.contentHtml) || !slide.mediaUrl.trim();

const toDatetimeLocal = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const nowDatetimeLocal = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const SlideSummary = ({
  slide,
  index,
}: {
  slide: EditableSlide;
  index: number;
}) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
    <Typography variant="body1" sx={{ fontWeight: 500 }}>
      {index + 1}.
    </Typography>
    <Typography variant="body1" noWrap>
      {slide.title || "Vue sans titre"}
    </Typography>
    <Chip
      size="small"
      label={slide.mediaType === "VIDEO" ? "Video" : "Image"}
      variant="outlined"
    />
    {isIncompleteSlide(slide) && (
      <Chip size="small" label="Incomplet" color="warning" />
    )}
  </Box>
);

const SortableSlide = ({
  slide,
  index,
  projectId,
  onChange,
  onDuplicate,
  onDelete,
}: {
  slide: EditableSlide;
  index: number;
  projectId?: string;
  onChange: (slide: EditableSlide) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) => {
  const [tab, setTab] = useState(0);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.key });

  const update = (patch: Partial<EditableSlide>) =>
    onChange({ ...slide, ...patch });

  const unsupportedHtml =
    hasUnsupportedRichTextHtml(slide.contentHtml) ||
    (!!slide.contentHtmlEn && hasUnsupportedRichTextHtml(slide.contentHtmlEn));

  return (
    <Accordion
      ref={setNodeRef}
      defaultExpanded={index === 0}
      sx={{
        opacity: isDragging ? 0.75 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            <Tooltip title="Glisser pour reordonner">
              <IconButton
                size="small"
                {...attributes}
                {...listeners}
                onClick={(event) => event.stopPropagation()}
              >
                <DragIndicatorIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <SlideSummary slide={slide} index={index} />
          </Box>
          <Box sx={{ display: "flex", gap: 0.5, mr: 1 }}>
            <Tooltip title="Dupliquer">
              <IconButton
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  onDuplicate();
                }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Supprimer">
              <IconButton
                size="small"
                color="error"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete();
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {unsupportedHtml && (
            <Alert severity="warning">
              Cette slide contient du HTML non supporte. Il sera nettoye a
              l&apos;enregistrement.
            </Alert>
          )}

          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="Francais" />
            <Tab label="English" />
            <Tab label="Media" />
            <Tab label="Preview" />
          </Tabs>

          {tab === 0 && (
            <>
              <TextField
                label="Titre"
                value={slide.title}
                required
                fullWidth
                onChange={(event) => update({ title: event.target.value })}
              />
              <RichTextEditor
                label="Paragraphe"
                value={slide.contentHtml}
                onChange={(value) => update({ contentHtml: value })}
                error={!stripHtml(slide.contentHtml)}
              />
            </>
          )}

          {tab === 1 && (
            <>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                <TextField
                  label="Title (EN)"
                  value={slide.titleEn}
                  fullWidth
                  onChange={(event) => update({ titleEn: event.target.value })}
                />
                <TranslateButton
                  sourceText={slide.title}
                  onTranslated={(text) => update({ titleEn: text })}
                />
              </Box>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                <Box sx={{ flex: 1 }}>
                  <RichTextEditor
                    label="Paragraph"
                    value={slide.contentHtmlEn || "<p></p>"}
                    onChange={(value) => update({ contentHtmlEn: value })}
                  />
                </Box>
                <TranslateButton
                  sourceText={slide.contentHtml}
                  onTranslated={(text) => update({ contentHtmlEn: text })}
                  html
                />
              </Box>
            </>
          )}

          {tab === 2 && (
            <>
              <ToggleButtonGroup
                value={slide.mediaType}
                exclusive
                onChange={(_, value) => value && update({ mediaType: value })}
                size="small"
              >
                <ToggleButton value="IMAGE">Image</ToggleButton>
                <ToggleButton value="VIDEO">Video</ToggleButton>
              </ToggleButtonGroup>
              <MediaUrlField
                label="URL media"
                value={slide.mediaUrl}
                onChange={(value) => update({ mediaUrl: value })}
                required
                accept={
                  slide.mediaType === "VIDEO"
                    ? "video/mp4"
                    : "image/jpeg,image/png,image/webp,image/avif"
                }
                projectId={projectId}
                field={`slide-${index + 1}-media`}
                previewType={slide.mediaType}
              />
              {slide.mediaType === "VIDEO" && (
                <MediaUrlField
                  label="Poster video"
                  value={slide.posterUrl}
                  onChange={(value) => update({ posterUrl: value })}
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  projectId={projectId}
                  field={`slide-${index + 1}-poster`}
                  helperText="Recommande pour eviter un ecran vide avant lecture."
                />
              )}
              <TextField
                label="Alt"
                value={slide.alt}
                fullWidth
                helperText="Recommande pour les images."
                onChange={(event) => update({ alt: event.target.value })}
              />
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                <TextField
                  label="Alt (EN)"
                  value={slide.altEn}
                  fullWidth
                  onChange={(event) => update({ altEn: event.target.value })}
                />
                <TranslateButton
                  sourceText={slide.alt}
                  onTranslated={(text) => update({ altEn: text })}
                />
              </Box>
            </>
          )}

          {tab === 3 && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "280px 1fr" },
                gap: 2,
                alignItems: "start",
              }}
            >
              <Box
                sx={{
                  height: 180,
                  bgcolor: "grey.100",
                  borderRadius: 1,
                  overflow: "hidden",
                }}
              >
                {slide.mediaUrl ? (
                  slide.mediaType === "VIDEO" ? (
                    <Box
                      component="video"
                      src={slide.mediaUrl}
                      poster={slide.posterUrl || undefined}
                      controls
                      muted
                      playsInline
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <Box
                      component="img"
                      src={slide.mediaUrl}
                      alt={slide.alt || slide.title}
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )
                ) : (
                  <Box
                    sx={{
                      height: "100%",
                      display: "grid",
                      placeItems: "center",
                      color: "text.secondary",
                    }}
                  >
                    Aucun media
                  </Box>
                )}
              </Box>
              <Box>
                <Typography variant="h3" sx={{ mb: 1 }}>
                  {slide.title || "Vue sans titre"}
                </Typography>
                <Box
                  sx={{
                    "& p": { typography: "body1" },
                    "& h3": { typography: "h3" },
                    "& h4": { typography: "h4" },
                    "& ul, & ol": { pl: 3 },
                  }}
                  dangerouslySetInnerHTML={{ __html: slide.contentHtml }}
                />
              </Box>
            </Box>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export const ProjectForm = ({ project }: ProjectFormProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EditableSlide | null>(null);

  const [title, setTitle] = useState(project?.title ?? "");
  const [titleEn, setTitleEn] = useState(project?.titleEn ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [descriptionEn, setDescriptionEn] = useState(
    project?.descriptionEn ?? "",
  );
  const [imageUrl, setImageUrl] = useState(project?.imageUrl ?? "");
  const [tags, setTags] = useState(project?.tags.join(", ") ?? "");
  const [clientName, setClientName] = useState(project?.clientName ?? "");
  const [sector, setSector] = useState(project?.sector ?? "");
  const [sectorEn, setSectorEn] = useState(project?.sectorEn ?? "");
  const [projectYear, setProjectYear] = useState(
    project?.projectYear ? String(project.projectYear) : "",
  );
  const [projectLocation, setProjectLocation] = useState(
    project?.projectLocation ?? "",
  );
  const [projectLocationEn, setProjectLocationEn] = useState(
    project?.projectLocationEn ?? "",
  );
  const [deliveredServices, setDeliveredServices] = useState(
    project?.deliveredServices.join(", ") ?? "",
  );
  const [deliveredServicesEn, setDeliveredServicesEn] = useState(
    project?.deliveredServicesEn.join(", ") ?? "",
  );
  const [challenge, setChallenge] = useState(project?.challenge ?? "");
  const [challengeEn, setChallengeEn] = useState(project?.challengeEn ?? "");
  const [approach, setApproach] = useState(project?.approach ?? "");
  const [approachEn, setApproachEn] = useState(project?.approachEn ?? "");
  const [results, setResults] = useState(project?.results ?? "");
  const [resultsEn, setResultsEn] = useState(project?.resultsEn ?? "");
  const [credits, setCredits] = useState(project?.credits ?? "");
  const [awards, setAwards] = useState(project?.awards ?? "");
  const [awardsEn, setAwardsEn] = useState(project?.awardsEn ?? "");
  const [externalUrl, setExternalUrl] = useState(project?.externalUrl ?? "");
  const [featured, setFeatured] = useState(project?.featured ?? false);
  const [order, setOrder] = useState(String(project?.order ?? 0));
  const [publishedAt, setPublishedAt] = useState(
    toDatetimeLocal(project?.publishedAt ?? null),
  );
  const [slides, setSlides] = useState<EditableSlide[]>(
    project?.slides.map((slide) => ({
      key: slide.id,
      id: slide.id,
      title: slide.title,
      titleEn: slide.titleEn ?? "",
      contentHtml: slide.contentHtml,
      contentHtmlEn: slide.contentHtmlEn ?? "",
      mediaType: slide.mediaType,
      mediaUrl: slide.mediaUrl,
      posterUrl: slide.posterUrl ?? "",
      alt: slide.alt ?? "",
      altEn: slide.altEn ?? "",
    })) ?? [],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const incompleteSlides = useMemo(
    () => slides.filter(isIncompleteSlide).length,
    [slides],
  );

  const updateSlide = (key: string, next: EditableSlide) => {
    setSlides((current) =>
      current.map((slide) => (slide.key === key ? next : slide)),
    );
  };

  const duplicateSlide = (key: string) => {
    setSlides((current) => {
      const index = current.findIndex((slide) => slide.key === key);
      if (index === -1) return current;
      const copy = { ...current[index], key: newKey(), id: undefined };
      return [
        ...current.slice(0, index + 1),
        copy,
        ...current.slice(index + 1),
      ];
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSlides((current) => {
      const oldIndex = current.findIndex((slide) => slide.key === active.id);
      const newIndex = current.findIndex((slide) => slide.key === over.id);
      return arrayMove(current, oldIndex, newIndex);
    });
  };

  const validateClient = () => {
    if (!title.trim()) return "Le titre est obligatoire.";
    if (!slug.trim()) return "Le slug est obligatoire.";
    if (!description.trim()) return "La description est obligatoire.";
    if (!imageUrl.trim()) return "L'image de couverture est obligatoire.";
    if (slides.some(isIncompleteSlide)) {
      return "Une ou plusieurs slides sont incompletes.";
    }
    return null;
  };

  const submit = (nextPublishedAt = publishedAt) => {
    setError(null);
    const clientError = validateClient();
    if (clientError) {
      setError(clientError);
      return;
    }

    const formData = new FormData();
    formData.set("title", title);
    formData.set("titleEn", titleEn);
    formData.set("slug", slug);
    formData.set("description", description);
    formData.set("descriptionEn", descriptionEn);
    formData.set("imageUrl", imageUrl);
    formData.set("tags", tags);
    formData.set("clientName", clientName);
    formData.set("sector", sector);
    formData.set("sectorEn", sectorEn);
    formData.set("projectYear", projectYear);
    formData.set("projectLocation", projectLocation);
    formData.set("projectLocationEn", projectLocationEn);
    formData.set("deliveredServices", deliveredServices);
    formData.set("deliveredServicesEn", deliveredServicesEn);
    formData.set("challenge", challenge);
    formData.set("challengeEn", challengeEn);
    formData.set("approach", approach);
    formData.set("approachEn", approachEn);
    formData.set("results", results);
    formData.set("resultsEn", resultsEn);
    formData.set("credits", credits);
    formData.set("awards", awards);
    formData.set("awardsEn", awardsEn);
    formData.set("externalUrl", externalUrl);
    formData.set("featured", String(featured));
    formData.set("order", order);
    formData.set("publishedAt", nextPublishedAt);
    formData.set(
      "slides",
      JSON.stringify(
        slides.map((slide) => ({
          id: slide.id,
          title: slide.title,
          titleEn: slide.titleEn,
          contentHtml: slide.contentHtml,
          contentHtmlEn: stripHtml(slide.contentHtmlEn)
            ? slide.contentHtmlEn
            : "",
          mediaType: slide.mediaType,
          mediaUrl: slide.mediaUrl,
          posterUrl: slide.posterUrl,
          alt: slide.alt,
          altEn: slide.altEn,
        })),
      ),
    );

    startTransition(async () => {
      const result = project
        ? await updateProject(project.id, formData)
        : await createProject(formData);

      if (result.success) {
        toast.success(project ? "Realisation mise a jour." : "Realisation creee.");
        result.warnings?.forEach((warning) => toast.warning(warning));
        if (!project && result.id) {
          router.push(`/projects/${result.id}/edit`);
        } else {
          router.refresh();
        }
      } else {
        setError(result.error ?? "Une erreur est survenue.");
      }
    });
  };

  const confirmDeleteSlide = async () => {
    if (!deleteTarget) return;
    setSlides((current) =>
      current.filter((slide) => slide.key !== deleteTarget.key),
    );
    setDeleteTarget(null);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {error && <Alert severity="error">{error}</Alert>}
      {publishedAt && slides.length === 0 && (
        <Alert severity="warning">
          Aucune slide n&apos;est renseignee. Le front utilisera le fallback
          couverture + description.
        </Alert>
      )}

      <Card>
        <CardContent>
          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="Francais" />
            <Tab label="English" />
            <Tab label="Etude de cas" />
            <Tab label="Parametres" />
          </Tabs>

          {tab === 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <TextField
                label="Titre"
                value={title}
                required
                fullWidth
                onChange={(event) => setTitle(event.target.value)}
              />
              <TextField
                label="Slug"
                value={slug}
                required
                fullWidth
                helperText="Minuscules, chiffres et tirets uniquement."
                onChange={(event) => setSlug(event.target.value)}
              />
              <TextField
                label="Description"
                value={description}
                required
                fullWidth
                multiline
                rows={4}
                onChange={(event) => setDescription(event.target.value)}
              />
              <MediaUrlField
                label="Image de couverture"
                value={imageUrl}
                onChange={setImageUrl}
                required
                accept="image/jpeg,image/png,image/webp,image/avif"
                projectId={project?.id}
                field="cover"
                helperText="Utilisee dans la grille portfolio."
              />
            </Box>
          )}

          {tab === 1 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                <TextField
                  label="Title (EN)"
                  value={titleEn}
                  fullWidth
                  onChange={(event) => setTitleEn(event.target.value)}
                />
                <TranslateButton sourceText={title} onTranslated={setTitleEn} />
              </Box>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                <TextField
                  label="Description (EN)"
                  value={descriptionEn}
                  fullWidth
                  multiline
                  rows={4}
                  onChange={(event) => setDescriptionEn(event.target.value)}
                />
                <TranslateButton sourceText={description} onTranslated={setDescriptionEn} />
              </Box>
            </Box>
          )}

          {tab === 2 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Alert severity="info">
                Ces informations rendent la realisation plus claire pour les
                visiteurs, les moteurs de recherche et les assistants IA.
              </Alert>
              <Typography variant="h4">Informations factuelles</Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: 2.5,
                }}
              >
                <TextField
                  label="Client"
                  value={clientName}
                  onChange={(event) => setClientName(event.target.value)}
                />
                <TextField
                  label="Annee"
                  type="number"
                  value={projectYear}
                  slotProps={{ htmlInput: { min: 1900, max: 2100 } }}
                  onChange={(event) => setProjectYear(event.target.value)}
                />
                <TextField
                  label="Secteur"
                  value={sector}
                  onChange={(event) => setSector(event.target.value)}
                />
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                  <TextField
                    label="Sector (EN)"
                    value={sectorEn}
                    fullWidth
                    onChange={(event) => setSectorEn(event.target.value)}
                  />
                  <TranslateButton sourceText={sector} onTranslated={setSectorEn} />
                </Box>
                <TextField
                  label="Localisation"
                  value={projectLocation}
                  onChange={(event) => setProjectLocation(event.target.value)}
                />
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                  <TextField
                    label="Location (EN)"
                    value={projectLocationEn}
                    fullWidth
                    onChange={(event) => setProjectLocationEn(event.target.value)}
                  />
                  <TranslateButton sourceText={projectLocation} onTranslated={setProjectLocationEn} />
                </Box>
                <TextField
                  label="Services realises"
                  value={deliveredServices}
                  multiline
                  rows={2}
                  helperText="Separes par virgule ou retour ligne."
                  onChange={(event) => setDeliveredServices(event.target.value)}
                />
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                  <TextField
                    label="Services delivered (EN)"
                    value={deliveredServicesEn}
                    fullWidth
                    multiline
                    rows={2}
                    helperText="Separated by comma or line break."
                    onChange={(event) => setDeliveredServicesEn(event.target.value)}
                  />
                  <TranslateButton sourceText={deliveredServices} onTranslated={setDeliveredServicesEn} />
                </Box>
              </Box>

              <Typography variant="h4">Recit et resultats</Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: 2.5,
                }}
              >
                {(
                  [
                    ["Problematique", challenge, setChallenge, undefined],
                    ["Challenge (EN)", challengeEn, setChallengeEn, challenge],
                    ["Approche", approach, setApproach, undefined],
                    ["Approach (EN)", approachEn, setApproachEn, approach],
                    ["Resultats", results, setResults, undefined],
                    ["Results (EN)", resultsEn, setResultsEn, results],
                    ["Distinctions", awards, setAwards, undefined],
                    ["Awards (EN)", awardsEn, setAwardsEn, awards],
                  ] as [string, string, (v: string) => void, string | undefined][]
                ).map(([label, value, setter, translateFrom]) =>
                  translateFrom !== undefined ? (
                    <Box key={label} sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                      <TextField
                        label={label}
                        value={value}
                        fullWidth
                        multiline
                        rows={3}
                        onChange={(event) => setter(event.target.value)}
                      />
                      <TranslateButton sourceText={translateFrom} onTranslated={setter} />
                    </Box>
                  ) : (
                    <TextField
                      key={label}
                      label={label}
                      value={value}
                      multiline
                      rows={3}
                      onChange={(event) => setter(event.target.value)}
                    />
                  ),
                )}
              </Box>
              <TextField
                label="Credits"
                value={credits}
                multiline
                rows={2}
                onChange={(event) => setCredits(event.target.value)}
              />
              <TextField
                label="Lien externe"
                value={externalUrl}
                type="url"
                helperText="Site du client, publication ou page de reference."
                onChange={(event) => setExternalUrl(event.target.value)}
              />
            </Box>
          )}

          {tab === 3 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box>
                <Typography variant="h4" sx={{ mb: 1.5 }}>
                  Palette du carrousel featured
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Quatre couleurs sont extraites automatiquement de la
                  couverture. La palette est recalculée lorsque celle-ci change.
                </Typography>
                <Box
                  sx={{
                    position: "relative",
                    height: 140,
                    overflow: "hidden",
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    background:
                      project?.heroPaletteComputed.length === 4
                        ? `radial-gradient(circle at 18% 25%, ${project.heroPaletteComputed[0]} 0%, transparent 55%), radial-gradient(circle at 82% 20%, ${project.heroPaletteComputed[1]} 0%, transparent 55%), radial-gradient(circle at 28% 85%, ${project.heroPaletteComputed[2]} 0%, transparent 58%), radial-gradient(circle at 78% 80%, ${project.heroPaletteComputed[3]} 0%, transparent 58%), ${project.heroPaletteComputed[0]}`
                        : "linear-gradient(135deg, #E7E8E3, #C9CCC5)",
                  }}
                />
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.5 }}>
                  {project?.heroPaletteComputed.length ? (
                    project.heroPaletteComputed.map((color) => (
                      <Box
                        key={color}
                        sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                      >
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            bgcolor: color,
                            border: "1px solid",
                            borderColor: "divider",
                          }}
                        />
                        <Typography variant="caption">{color}</Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      La palette sera calculée au prochain enregistrement.
                    </Typography>
                  )}
                </Box>
              </Box>
              <TextField
                label="Tags"
                value={tags}
                fullWidth
                helperText="Separes par virgule ou retour ligne."
                multiline
                rows={2}
                onChange={(event) => setTags(event.target.value)}
              />
              <TextField
                label="Ordre"
                type="number"
                value={order}
                required
                fullWidth
                slotProps={{ htmlInput: { min: 0 } }}
                onChange={(event) => setOrder(event.target.value)}
              />
              <TextField
                label="Date de publication"
                type="datetime-local"
                value={publishedAt}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                onChange={(event) => setPublishedAt(event.target.value)}
                helperText="Vide = brouillon."
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={featured}
                    onChange={(event) => setFeatured(event.target.checked)}
                  />
                }
                label="Featured"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
              gap: 1,
            }}
          >
            <Box>
              <Typography variant="h3">Slides</Typography>
              <Typography variant="body2" color="text.secondary">
                {slides.length} vue{slides.length !== 1 ? "s" : ""}
                {incompleteSlides > 0
                  ? `, ${incompleteSlides} incomplete${incompleteSlides > 1 ? "s" : ""}`
                  : ""}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setSlides((current) => [...current, emptySlide()])}
            >
              Ajouter une vue
            </Button>
          </Box>

          {slides.length === 0 ? (
            <Alert severity="info">
              Aucune slide. Ajoutez une vue pour controler la page detail; sinon
              le front utilisera le fallback.
            </Alert>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={slides.map((slide) => slide.key)}
                strategy={verticalListSortingStrategy}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {slides.map((slide, index) => (
                    <SortableSlide
                      key={slide.key}
                      slide={slide}
                      index={index}
                      projectId={project?.id}
                      onChange={(next) => updateSlide(slide.key, next)}
                      onDuplicate={() => duplicateSlide(slide.key)}
                      onDelete={() => setDeleteTarget(slide)}
                    />
                  ))}
                </Box>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Box>
              <Typography variant="body1" fontWeight={500}>
                Statut : {publishedAt ? "publie" : "brouillon"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                L&apos;enregistrement applique aussi les changements de slides.
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button
                variant="outlined"
                onClick={() => router.push("/projects")}
                disabled={pending}
              >
                Annuler
              </Button>
              <Button
                variant="outlined"
                startIcon={<OpenInNewIcon />}
                component="a"
                href={project?.previewUrl ?? undefined}
                target="_blank"
                rel="noreferrer"
                disabled={!project?.previewUrl}
              >
                Previsualiser
              </Button>
              <Button
                variant="outlined"
                startIcon={<UnpublishedIcon />}
                disabled={pending}
                onClick={() => {
                  setPublishedAt("");
                  submit("");
                }}
              >
                Brouillon
              </Button>
              <Button
                variant="outlined"
                startIcon={<PublishIcon />}
                disabled={pending}
                onClick={() => {
                  const next = publishedAt || nowDatetimeLocal();
                  setPublishedAt(next);
                  submit(next);
                }}
              >
                Publier
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={pending}
                onClick={() => submit()}
              >
                {pending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        title={`Supprimer "${deleteTarget?.title || "cette vue"}" ?`}
        message="La slide sera supprimee au prochain enregistrement."
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteSlide}
      />
    </Box>
  );
};
