"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { toast } from "sonner";
import {
  createProjectTaxonomyEntry,
  deleteProjectTaxonomyEntry,
  toggleProjectTaxonomyEntry,
  updateProjectTaxonomyEntry,
} from "@/app/(admin)/project-taxonomies/actions";
import { defaultSiteLocaleCode } from "@/lib/admin-translations";
import type { SiteLocaleData } from "@/lib/site-locales";
import {
  projectTaxonomyIconOptions,
  type ProjectTaxonomyRow,
  type ProjectTaxonomyType,
} from "./project-taxonomy-types";
import { TranslateButton } from "./TranslateButton";

const categories: { type: ProjectTaxonomyType; label: string; singular: string }[] = [
  { type: "SECTOR", label: "Secteurs", singular: "secteur" },
  { type: "LOCATION", label: "Localisations", singular: "localisation" },
  { type: "DELIVERED_SERVICE", label: "Services réalisés", singular: "service réalisé" },
];

const normalizeSlug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const ProjectTaxonomyManager = ({
  entries,
  locales,
}: {
  entries: ProjectTaxonomyRow[];
  locales: SiteLocaleData[];
}) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<ProjectTaxonomyType>("SECTOR");
  const [editing, setEditing] = useState<ProjectTaxonomyRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("category");
  const [introEyebrow, setIntroEyebrow] = useState("");
  const [introTitle, setIntroTitle] = useState("");
  const [intro, setIntro] = useState("");
  const extraLocales = locales.filter((locale) => locale.code !== defaultSiteLocaleCode);
  const [localizedFields, setLocalizedFields] = useState<
    Record<
      string,
      {
        label: string;
        slug: string;
        introEyebrow: string;
        introTitle: string;
        intro: string;
      }
    >
  >({});
  const [slugEdited, setSlugEdited] = useState(false);
  const currentCategory = categories.find((category) => category.type === type)!;
  const currentType = editing?.type ?? type;
  const currentIsSector = currentType === "SECTOR";
  const rows = entries.filter((entry) => entry.type === type);

  const openCreate = () => {
    setEditing(null);
    setLabel("");
    setSlug("");
    setIcon("category");
    setIntroEyebrow("");
    setIntroTitle("");
    setIntro("");
    setLocalizedFields(
      Object.fromEntries(
        extraLocales.map((locale) => [
          locale.code,
          { label: "", slug: "", introEyebrow: "", introTitle: "", intro: "" },
        ]),
      ),
    );
    setSlugEdited(false);
    setDialogOpen(true);
  };

  const openEdit = (entry: ProjectTaxonomyRow) => {
    setEditing(entry);
    setLabel(entry.label);
    setSlug(entry.slug ?? "");
    setIcon(entry.icon ?? "category");
    setIntroEyebrow(entry.introEyebrow ?? "");
    setIntroTitle(entry.introTitle ?? "");
    setIntro(entry.intro ?? "");
    const byLocale = new Map(entry.translations?.map((item) => [item.locale, item]) ?? []);
    setLocalizedFields(
      Object.fromEntries(
        extraLocales.map((locale) => {
          const translation = byLocale.get(locale.code);
          return [
            locale.code,
            {
              label: translation?.label ?? "",
              slug: translation?.slug ?? "",
              introEyebrow: translation?.introEyebrow ?? "",
              introTitle: translation?.introTitle ?? "",
              intro: translation?.intro ?? "",
            },
          ];
        }),
      ),
    );
    setSlugEdited(true);
    setDialogOpen(true);
  };

  const updateLabel = (value: string) => {
    setLabel(value);
    if (!editing && type === "SECTOR" && !slugEdited) {
      setSlug(normalizeSlug(value));
    }
  };

  const save = () => {
    startTransition(async () => {
      const result = editing
        ? await updateProjectTaxonomyEntry(
            editing.id,
            label,
            slug,
            icon,
            introEyebrow,
            introTitle,
            intro,
            localizedFields,
          )
        : await createProjectTaxonomyEntry(
            type,
            label,
            slug,
            icon,
            introEyebrow,
            introTitle,
            intro,
            localizedFields,
          );
      if (!result.success) {
        toast.error(result.error ?? "Enregistrement impossible.");
        return;
      }
      toast.success(editing ? "Entrée modifiée." : "Entrée créée.");
      setDialogOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h2">Taxonomies des réalisations</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Libellés traduits partagés par toutes les réalisations.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nouveau {currentCategory.singular}
        </Button>
      </Box>

      <Tabs value={type} onChange={(_, value: ProjectTaxonomyType) => setType(value)} sx={{ mb: 2 }}>
        {categories.map((category) => (
          <Tab key={category.type} value={category.type} label={category.label} />
        ))}
      </Tabs>

      <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Français</TableCell>
              <TableCell>Traductions</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell>Icone</TableCell>
              <TableCell align="center">Utilisations</TableCell>
              <TableCell align="center">Actif</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((entry) => (
              <TableRow key={entry.id} hover>
                <TableCell>{entry.label}</TableCell>
                <TableCell>
                  {entry.translations?.filter(
                    (translation) =>
                      translation.locale !== defaultSiteLocaleCode &&
                      !!translation.label,
                  ).length ?? 0}
                </TableCell>
                <TableCell>{entry.type === "SECTOR" ? entry.slug : "—"}</TableCell>
                <TableCell>{entry.type === "SECTOR" ? entry.icon ?? "category" : "—"}</TableCell>
                <TableCell align="center">{entry.usageCount}</TableCell>
                <TableCell align="center">
                  <Switch
                    checked={entry.active}
                    disabled={pending}
                    onChange={(_, active) =>
                      startTransition(async () => {
                        const result = await toggleProjectTaxonomyEntry(entry.id, active);
                        if (!result.success) toast.error(result.error ?? "Modification impossible.");
                        else router.refresh();
                      })
                    }
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton aria-label="Modifier" onClick={() => openEdit(entry)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    aria-label="Supprimer"
                    color="error"
                    disabled={pending || entry.usageCount > 0}
                    onClick={() => {
                      if (!window.confirm(`Supprimer « ${entry.label} » ?`)) return;
                      startTransition(async () => {
                        const result = await deleteProjectTaxonomyEntry(entry.id);
                        if (!result.success) toast.error(result.error ?? "Suppression impossible.");
                        else {
                          toast.success("Entrée supprimée.");
                          router.refresh();
                        }
                      });
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                  Aucune entrée dans cette catégorie.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Alert severity="info" sx={{ mt: 2 }}>
        Une entrée utilisée ne peut pas être supprimée. Désactivez-la pour la masquer des nouvelles sélections.
      </Alert>

      <Dialog open={dialogOpen} onClose={() => !pending && setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? "Modifier l’entrée" : `Nouveau ${currentCategory.singular}`}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>
          <TextField label="Libellé français" value={label} required onChange={(event) => updateLabel(event.target.value)} />
          {!currentIsSector &&
            extraLocales.map((locale) => {
              const fields = localizedFields[locale.code] ?? {
                label: "",
                slug: "",
                introEyebrow: "",
                introTitle: "",
                intro: "",
              };
              return (
                <Box key={locale.code} sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                  <TextField
                    label={`Libellé ${locale.nativeLabel || locale.label}`}
                    value={fields.label}
                    fullWidth
                    onChange={(event) =>
                      setLocalizedFields((current) => ({
                        ...current,
                        [locale.code]: {
                          ...(current[locale.code] ?? fields),
                          label: event.target.value,
                        },
                      }))
                    }
                  />
                  <TranslateButton
                    sourceText={label}
                    targetLocale={locale.code}
                    onTranslated={(translated) =>
                      setLocalizedFields((current) => ({
                        ...current,
                        [locale.code]: {
                          ...(current[locale.code] ?? fields),
                          label: translated,
                        },
                      }))
                    }
                  />
                </Box>
              );
            })}
          {currentIsSector && (
            <>
              <TextField
                label="Slug URL"
                value={slug}
                required
                onChange={(event) => {
                  setSlug(normalizeSlug(event.target.value));
                  setSlugEdited(true);
                }}
                helperText="Utilisé dans l'URL publique du filtre secteur."
              />
              <TextField
                select
                label="Icone"
                value={icon}
                onChange={(event) => setIcon(event.target.value)}
                helperText="Pictogramme utilisé dans le dock menu."
              >
                {projectTaxonomyIconOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <Typography variant="h3" sx={{ mt: 1 }}>
                Intro page secteur
              </Typography>
              <TextField
                label="Eyebrow surcharge"
                value={introEyebrow}
                onChange={(event) => setIntroEyebrow(event.target.value)}
                helperText="La surcharge s'active si l'eyebrow et le titre sont renseignés."
              />
              <TextField
                label="Titre surcharge"
                value={introTitle}
                onChange={(event) => setIntroTitle(event.target.value)}
              />
              <TextField
                label="Paragraphe surcharge"
                value={intro}
                onChange={(event) => setIntro(event.target.value)}
                multiline
                rows={4}
                helperText="Optionnel. Peut rester vide même si l'eyebrow et le titre sont renseignés."
              />
              {extraLocales.map((locale) => {
                const fields = localizedFields[locale.code] ?? {
                  label: "",
                  slug: "",
                  introEyebrow: "",
                  introTitle: "",
                  intro: "",
                };
                const updateLocalizedField =
                  (field: keyof typeof fields) => (value: string) =>
                    setLocalizedFields((current) => ({
                      ...current,
                      [locale.code]: {
                        ...(current[locale.code] ?? fields),
                        [field]: value,
                      },
                    }));

                return (
                  <Box
                    key={locale.code}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      borderTop: "1px solid",
                      borderColor: "divider",
                      pt: 2,
                    }}
                  >
                    <Typography variant="h3">
                      {locale.nativeLabel || locale.label}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                      <TextField
                        label="Libellé"
                        value={fields.label}
                        fullWidth
                        onChange={(event) =>
                          updateLocalizedField("label")(event.target.value)
                        }
                      />
                      <TranslateButton
                        sourceText={label}
                        targetLocale={locale.code}
                        onTranslated={updateLocalizedField("label")}
                      />
                    </Box>
                    <TextField
                      label="Slug URL"
                      value={fields.slug}
                      onChange={(event) =>
                        updateLocalizedField("slug")(normalizeSlug(event.target.value))
                      }
                    />
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                      <TextField
                        label="Eyebrow surcharge"
                        value={fields.introEyebrow}
                        fullWidth
                        onChange={(event) =>
                          updateLocalizedField("introEyebrow")(event.target.value)
                        }
                      />
                      <TranslateButton
                        sourceText={introEyebrow}
                        targetLocale={locale.code}
                        onTranslated={updateLocalizedField("introEyebrow")}
                      />
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                      <TextField
                        label="Titre surcharge"
                        value={fields.introTitle}
                        fullWidth
                        onChange={(event) =>
                          updateLocalizedField("introTitle")(event.target.value)
                        }
                      />
                      <TranslateButton
                        sourceText={introTitle}
                        targetLocale={locale.code}
                        onTranslated={updateLocalizedField("introTitle")}
                      />
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                      <TextField
                        label="Paragraphe surcharge"
                        value={fields.intro}
                        fullWidth
                        multiline
                        rows={4}
                        onChange={(event) =>
                          updateLocalizedField("intro")(event.target.value)
                        }
                      />
                      <TranslateButton
                        sourceText={intro}
                        targetLocale={locale.code}
                        onTranslated={updateLocalizedField("intro")}
                      />
                    </Box>
                  </Box>
                );
              })}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={pending}>Annuler</Button>
          <Button
            variant="contained"
            onClick={save}
            disabled={
              pending ||
              label.trim().length < 2 ||
              (currentIsSector && slug.trim().length < 2)
            }
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
