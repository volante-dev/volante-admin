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

export const ProjectTaxonomyManager = ({ entries }: { entries: ProjectTaxonomyRow[] }) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<ProjectTaxonomyType>("SECTOR");
  const [editing, setEditing] = useState<ProjectTaxonomyRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [labelEn, setLabelEn] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("category");
  const [introEyebrow, setIntroEyebrow] = useState("");
  const [introEyebrowEn, setIntroEyebrowEn] = useState("");
  const [introTitle, setIntroTitle] = useState("");
  const [introTitleEn, setIntroTitleEn] = useState("");
  const [intro, setIntro] = useState("");
  const [introEn, setIntroEn] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const currentCategory = categories.find((category) => category.type === type)!;
  const currentType = editing?.type ?? type;
  const currentIsSector = currentType === "SECTOR";
  const rows = entries.filter((entry) => entry.type === type);

  const openCreate = () => {
    setEditing(null);
    setLabel("");
    setLabelEn("");
    setSlug("");
    setIcon("category");
    setIntroEyebrow("");
    setIntroEyebrowEn("");
    setIntroTitle("");
    setIntroTitleEn("");
    setIntro("");
    setIntroEn("");
    setSlugEdited(false);
    setDialogOpen(true);
  };

  const openEdit = (entry: ProjectTaxonomyRow) => {
    setEditing(entry);
    setLabel(entry.label);
    setLabelEn(entry.labelEn);
    setSlug(entry.slug ?? "");
    setIcon(entry.icon ?? "category");
    setIntroEyebrow(entry.introEyebrow ?? "");
    setIntroEyebrowEn(entry.introEyebrowEn ?? "");
    setIntroTitle(entry.introTitle ?? "");
    setIntroTitleEn(entry.introTitleEn ?? "");
    setIntro(entry.intro ?? "");
    setIntroEn(entry.introEn ?? "");
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
            labelEn,
            slug,
            icon,
            introEyebrow,
            introEyebrowEn,
            introTitle,
            introTitleEn,
            intro,
            introEn,
          )
        : await createProjectTaxonomyEntry(
            type,
            label,
            labelEn,
            slug,
            icon,
            introEyebrow,
            introEyebrowEn,
            introTitle,
            introTitleEn,
            intro,
            introEn,
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
            Libellés bilingues partagés par toutes les réalisations.
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
              <TableCell>English</TableCell>
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
                <TableCell>{entry.labelEn}</TableCell>
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
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
            <TextField
              label="English label"
              value={labelEn}
              required
              fullWidth
              onChange={(event) => setLabelEn(event.target.value)}
            />
            <TranslateButton sourceText={label} onTranslated={setLabelEn} />
          </Box>
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
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                <TextField
                  label="Eyebrow surcharge anglais"
                  value={introEyebrowEn}
                  fullWidth
                  onChange={(event) => setIntroEyebrowEn(event.target.value)}
                />
                <TranslateButton sourceText={introEyebrow} onTranslated={setIntroEyebrowEn} />
              </Box>
              <TextField
                label="Titre surcharge"
                value={introTitle}
                onChange={(event) => setIntroTitle(event.target.value)}
              />
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                <TextField
                  label="Titre surcharge anglais"
                  value={introTitleEn}
                  fullWidth
                  onChange={(event) => setIntroTitleEn(event.target.value)}
                />
                <TranslateButton sourceText={introTitle} onTranslated={setIntroTitleEn} />
              </Box>
              <TextField
                label="Paragraphe surcharge"
                value={intro}
                onChange={(event) => setIntro(event.target.value)}
                multiline
                rows={4}
                helperText="Optionnel. Peut rester vide même si l'eyebrow et le titre sont renseignés."
              />
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                <TextField
                  label="Paragraphe surcharge anglais"
                  value={introEn}
                  fullWidth
                  onChange={(event) => setIntroEn(event.target.value)}
                  multiline
                  rows={4}
                />
                <TranslateButton sourceText={intro} onTranslated={setIntroEn} />
              </Box>
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
              labelEn.trim().length < 2 ||
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
