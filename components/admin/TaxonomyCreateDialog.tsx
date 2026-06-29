"use client";

import { useState, useTransition } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { toast } from "sonner";
import { createProjectTaxonomyEntry } from "@/app/(admin)/project-taxonomies/actions";
import type {
  ProjectTaxonomyOption,
  ProjectTaxonomyType,
} from "./project-taxonomy-types";

export const TaxonomyCreateDialog = ({
  open,
  type,
  initialLabel,
  onClose,
  onCreated,
}: {
  open: boolean;
  type: ProjectTaxonomyType;
  initialLabel: string;
  onClose: () => void;
  onCreated: (entry: ProjectTaxonomyOption) => void;
}) => {
  const [pending, startTransition] = useTransition();
  const [label, setLabel] = useState(initialLabel);

  return (
    <Dialog open={open} onClose={() => !pending && onClose()} fullWidth maxWidth="sm">
      <DialogTitle>Créer une entrée</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "12px !important" }}>
        <TextField label="Libellé français" value={label} required onChange={(event) => setLabel(event.target.value)} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={pending}>Annuler</Button>
        <Button
          variant="contained"
          disabled={pending || label.trim().length < 2}
          onClick={() =>
            startTransition(async () => {
              const result = await createProjectTaxonomyEntry(type, label);
              if (!result.success || !result.entry) {
                toast.error(result.error ?? "Création impossible.");
                return;
              }
              toast.success("Entrée créée et sélectionnée.");
              onCreated(result.entry);
            })
          }
        >
          Créer et sélectionner
        </Button>
      </DialogActions>
    </Dialog>
  );
};
