"use client";

import { useState, useTransition, type FormEvent } from "react";
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
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import SaveIcon from "@mui/icons-material/Save";
import { toast } from "sonner";
import { updateSiteRoutes } from "@/app/(admin)/header/actions";
import {
  sitemapFrequencies,
  type SiteRouteData,
} from "@/lib/site-route-config";
import type { SiteLocaleData } from "@/lib/site-locales";
import { TranslateButton } from "./TranslateButton";

type EditableSiteRoute = SiteRouteData;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const getRouteLabel = (item: EditableSiteRoute, locale: string) => {
  if (locale === "fr") return item.label;
  if (locale === "en") return item.labelEn;
  return item.translations?.[locale]?.label ?? "";
};

const getRouteSlug = (item: EditableSiteRoute, locale: string) => {
  if (locale === "fr") return item.slug;
  if (locale === "en") return item.slugEn;
  return item.translations?.[locale]?.slug ?? "";
};

const validateItems = (items: EditableSiteRoute[], locales: SiteLocaleData[]) => {
  if (
    items.some((item) =>
      locales.some((locale) => !getRouteLabel(item, locale.code).trim()),
    )
  ) {
    return "Tous les intitules sont obligatoires.";
  }
  if (
    items.some((item) =>
      locales.some(
        (locale) =>
          item.id !== "home" && !slugPattern.test(getRouteSlug(item, locale.code)),
      ),
    )
  ) {
    return "Les slugs doivent contenir uniquement des minuscules, chiffres et tirets.";
  }

  for (const locale of locales) {
    const slugs = items
      .map((item) => getRouteSlug(item, locale.code))
      .filter(Boolean);
    if (new Set(slugs).size !== slugs.length) {
      return `Les slugs ${locale.label} doivent etre uniques.`;
    }
  }

  return null;
};

const SortableSiteRoute = ({
  item,
  index,
  onChange,
  locales,
}: {
  item: EditableSiteRoute;
  index: number;
  onChange: (item: EditableSiteRoute) => void;
  locales: SiteLocaleData[];
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const update = (patch: Partial<EditableSiteRoute>) =>
    onChange({ ...item, ...patch });
  const updateTranslation = (
    locale: string,
    patch: { label?: string; slug?: string },
  ) =>
    update({
      translations: {
        ...item.translations,
        [locale]: {
          ...item.translations?.[locale],
          ...patch,
        },
      },
    });
  const isHome = item.id === "home";
  const extraLocales = locales.filter(
    (locale) => locale.code !== "fr" && locale.code !== "en",
  );

  return (
    <Card
      ref={setNodeRef}
      variant="outlined"
      sx={{
        opacity: isDragging ? 0.7 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <CardContent>
        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
          <Tooltip title="Glisser pour reordonner">
            <IconButton size="small" {...attributes} {...listeners}>
              <DragIndicatorIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip size="small" label={`#${index + 1}`} />
              <Typography variant="body2" color="text.secondary">
                {item.id}
              </Typography>
            </Box>
            {extraLocales.length > 0 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {extraLocales.map((locale) => (
                  <Box
                    key={locale.code}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                      gap: 2,
                    }}
                  >
                    <TextField
                      label={`Intitule ${locale.label}`}
                      value={item.translations?.[locale.code]?.label ?? ""}
                      required
                      fullWidth
                      onChange={(event) =>
                        updateTranslation(locale.code, { label: event.target.value })
                      }
                    />
                    <TextField
                      label={`Slug ${locale.label}`}
                      value={item.translations?.[locale.code]?.slug ?? ""}
                      required={!isHome}
                      fullWidth
                      disabled={isHome}
                      helperText={
                        isHome
                          ? `La home conserve la racine /${locale.code}.`
                          : "Segment d'URL, sans slash."
                      }
                      error={
                        !isHome &&
                        Boolean(item.translations?.[locale.code]?.slug) &&
                        !slugPattern.test(item.translations?.[locale.code]?.slug ?? "")
                      }
                      onChange={(event) =>
                        updateTranslation(locale.code, { slug: event.target.value })
                      }
                    />
                  </Box>
                ))}
              </Box>
            )}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2,
              }}
            >
              <TextField
                label="Intitule francais"
                value={item.label}
                required
                fullWidth
                onChange={(event) => update({ label: event.target.value })}
              />
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                <TextField
                  label="Intitule anglais"
                  value={item.labelEn}
                  required
                  fullWidth
                  onChange={(event) => update({ labelEn: event.target.value })}
                />
                <TranslateButton
                  sourceText={item.label}
                  onTranslated={(labelEn) => update({ labelEn })}
                />
              </Box>
              <TextField
                label="Slug francais"
                value={item.slug}
                required={!isHome}
                fullWidth
                disabled={isHome}
                helperText={
                  isHome ? "La home conserve la racine /." : "Segment d'URL, sans slash."
                }
                error={!isHome && Boolean(item.slug) && !slugPattern.test(item.slug)}
                onChange={(event) => update({ slug: event.target.value })}
              />
              <TextField
                label="Slug anglais"
                value={item.slugEn}
                required={!isHome}
                fullWidth
                disabled={isHome}
                helperText={
                  isHome
                    ? "The home page keeps the /en root."
                    : "URL segment, without slash."
                }
                error={!isHome && Boolean(item.slugEn) && !slugPattern.test(item.slugEn)}
                onChange={(event) => update({ slugEn: event.target.value })}
              />
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(5, minmax(0, 1fr))" },
                gap: 2,
                alignItems: "center",
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={item.showInHeader}
                    disabled={isHome}
                    onChange={(event) =>
                      update({ showInHeader: event.target.checked })
                    }
                  />
                }
                label="Header"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={item.showInFooter}
                    disabled={isHome}
                    onChange={(event) =>
                      update({ showInFooter: event.target.checked })
                    }
                  />
                }
                label="Footer"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={item.includeInSitemap}
                    onChange={(event) =>
                      update({ includeInSitemap: event.target.checked })
                    }
                  />
                }
                label="Sitemap"
              />
              <TextField
                label="Priorite sitemap"
                type="number"
                value={item.sitemapPriority}
                inputProps={{ min: 0, max: 1, step: 0.1 }}
                onChange={(event) =>
                  update({ sitemapPriority: Number(event.target.value) })
                }
              />
              <TextField
                label="Frequence"
                select
                value={item.sitemapFrequency}
                onChange={(event) =>
                  update({
                    sitemapFrequency: event.target.value as SiteRouteData["sitemapFrequency"],
                  })
                }
              >
                {sitemapFrequencies.map((frequency) => (
                  <MenuItem key={frequency} value={frequency}>
                    {frequency}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export const HeaderNavigationForm = ({
  initialItems,
  locales,
}: {
  initialItems: SiteRouteData[];
  locales: SiteLocaleData[];
}) => {
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState<EditableSiteRoute[]>(
    initialItems.map((item, index) => ({ ...item, order: index })),
  );
  const [error, setError] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const updateItem = (id: string, next: EditableSiteRoute) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? next : item)),
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((current) => {
      const oldIndex = current.findIndex((item) => item.id === active.id);
      const newIndex = current.findIndex((item) => item.id === over.id);
      return arrayMove(current, oldIndex, newIndex).map((item, index) => ({
        ...item,
        order: index,
      }));
    });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const clientError = validateItems(items, locales);
    setError(clientError);
    if (clientError) return;

    const formData = new FormData();
    formData.set("items", JSON.stringify(items));

    startTransition(async () => {
      const result = await updateSiteRoutes(formData);
      if (result.success) {
        toast.success("Navigation mise a jour.");
      } else {
        setError(result.error ?? "Une erreur est survenue.");
      }
    });
  };

  return (
    <Card>
      <CardContent>
        <Box component="form" onSubmit={submit}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {items.map((item, index) => (
                  <SortableSiteRoute
                    key={item.id}
                    item={item}
                    index={index}
                    locales={locales}
                    onChange={(next) => updateItem(item.id, next)}
                  />
                ))}
              </Box>
            </SortableContext>
          </DndContext>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={pending}
            >
              Enregistrer
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
