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
import type {
  ProjectTaxonomyRow,
  ProjectTaxonomyType,
} from "./project-taxonomy-types";

const categories: { type: ProjectTaxonomyType; label: string; singular: string }[] = [
  { type: "SECTOR", label: "Secteurs", singular: "secteur" },
  { type: "LOCATION", label: "Localisations", singular: "localisation" },
  { type: "DELIVERED_SERVICE", label: "Services réalisés", singular: "service réalisé" },
];

export const ProjectTaxonomyManager = ({ entries }: { entries: ProjectTaxonomyRow[] }) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<ProjectTaxonomyType>("SECTOR");
  const [editing, setEditing] = useState<ProjectTaxonomyRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [labelEn, setLabelEn] = useState("");
  const currentCategory = categories.find((category) => category.type === type)!;
  const rows = entries.filter((entry) => entry.type === type);

  const openCreate = () => {
    setEditing(null);
    setLabel("");
    setLabelEn("");
    setDialogOpen(true);
  };

  const openEdit = (entry: ProjectTaxonomyRow) => {
    setEditing(entry);
    setLabel(entry.label);
    setLabelEn(entry.labelEn);
    setDialogOpen(true);
  };

  const save = () => {
    startTransition(async () => {
      const result = editing
        ? await updateProjectTaxonomyEntry(editing.id, label, labelEn)
        : await createProjectTaxonomyEntry(type, label, labelEn);
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
                <TableCell colSpan={5} align="center" sx={{ py: 6, color: "text.secondary" }}>
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
          <TextField label="Libellé français" value={label} required onChange={(event) => setLabel(event.target.value)} />
          <TextField label="English label" value={labelEn} required onChange={(event) => setLabelEn(event.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={pending}>Annuler</Button>
          <Button variant="contained" onClick={save} disabled={pending || label.trim().length < 2 || labelEn.trim().length < 2}>
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
