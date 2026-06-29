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
import type { SiteLocaleData } from "@/lib/site-locales";
import { defaultSiteLocaleCode } from "@/lib/admin-translations";

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
  locales: SiteLocaleData[];
};

type LocalizedServiceFields = Record<
  string,
  {
    title: string;
    descriptionHtml: string;
  }
>;

const toLocalizedServiceFields = (
  service: ServiceFormProps["service"],
  locales: SiteLocaleData[],
): LocalizedServiceFields => {
  const byLocale = new Map(service?.translations?.map((item) => [item.locale, item]) ?? []);

  return Object.fromEntries(
    locales.map((locale) => {
      const translation = byLocale.get(locale.code);
      const isLegacyDefault = locale.code === defaultSiteLocaleCode;

      return [
        locale.code,
        {
          title:
            translation?.title ??
            (isLegacyDefault ? service?.title ?? "" : ""),
          descriptionHtml:
            translation?.descriptionHtml ??
            (isLegacyDefault
              ? service?.descriptionHtml ?? `<p>${service?.description ?? ""}</p>`
              : ""),
        },
      ];
    }),
  );
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

export const ServiceForm = ({
  service,
  availableProjects = [],
  locales,
}: ServiceFormProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const activeLocales = locales.length
    ? locales
    : [{ code: defaultSiteLocaleCode, label: "Français" } as SiteLocaleData];
  const defaultLocale = activeLocales.find((locale) => locale.isDefault)?.code ?? activeLocales[0].code;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const [localizedFields, setLocalizedFields] = useState(() =>
    toLocalizedServiceFields(service, activeLocales),
  );
  const [icon, setIcon] = useState(service?.icon ?? "");
  const [order, setOrder] = useState(String(service?.order ?? 0));
  const [active, setActive] = useState(service?.active ?? true);
  const [selectedExamples, setSelectedExamples] = useState<ServicePortfolioExampleProject[]>(
    service?.portfolioExamples ?? [],
  );
  const [projectToAdd, setProjectToAdd] = useState("");
  const defaultFields = localizedFields[defaultLocale];

  const updateLocalizedField =
    (locale: string, field: keyof LocalizedServiceFields[string]) =>
    (value: string) => {
      setLocalizedFields((current) => ({
        ...current,
        [locale]: { ...current[locale], [field]: value },
      }));
    };

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

    if (!defaultFields?.title || defaultFields.title.length < 2) {
      setError("Le titre doit contenir au moins 2 caracteres.");
      setTab(0);
      return;
    }
    if (isBlankRichText(defaultFields.descriptionHtml)) {
      setError("La description doit contenir au moins 10 caracteres.");
      setTab(0);
      return;
    }

    const formData = new FormData();
    formData.set("translations", JSON.stringify(localizedFields));
    const defaultLocaleFields = localizedFields[defaultSiteLocaleCode] ?? defaultFields;
    formData.set("title", defaultLocaleFields.title);
    formData.set("descriptionHtml", defaultLocaleFields.descriptionHtml);
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
            {activeLocales.map((locale) => (
              <Tab key={locale.code} label={locale.nativeLabel || locale.label} />
            ))}
          </Tabs>

          {activeLocales.map((locale, index) => {
            const localeFields = localizedFields[locale.code];
            const sourceFields = localizedFields[defaultLocale];
            const isDefaultLocale = locale.code === defaultLocale;

            return tab === index ? (
              <Box key={locale.code} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                  <TextField
                    label="Titre"
                    value={localeFields.title}
                    onChange={(event) =>
                      updateLocalizedField(locale.code, "title")(event.target.value)
                    }
                    required={isDefaultLocale}
                    fullWidth
                    error={!!error && isDefaultLocale && localeFields.title.length < 2}
                    helperText={
                      isDefaultLocale
                        ? "Titre du service dans la langue par defaut (min. 2 caracteres)"
                        : "Optionnel : la langue par defaut sera utilisee si ce champ est vide."
                    }
                  />
                  {!isDefaultLocale && (
                    <TranslateButton
                      sourceText={sourceFields.title}
                      targetLocale={locale.code}
                      onTranslated={updateLocalizedField(locale.code, "title")}
                    />
                  )}
                </Box>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                  <Box sx={{ flex: 1 }}>
                    <RichTextEditor
                      label="Description"
                      value={localeFields.descriptionHtml || "<p></p>"}
                      onChange={updateLocalizedField(locale.code, "descriptionHtml")}
                      error={
                        !!error &&
                        isDefaultLocale &&
                        isBlankRichText(localeFields.descriptionHtml)
                      }
                    />
                  </Box>
                  {!isDefaultLocale && (
                    <TranslateButton
                      sourceText={sourceFields.descriptionHtml}
                      targetLocale={locale.code}
                      onTranslated={updateLocalizedField(locale.code, "descriptionHtml")}
                      html
                    />
                  )}
                </Box>
              </Box>
            ) : null;
          })}

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
