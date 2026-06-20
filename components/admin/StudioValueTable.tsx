"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { toast } from "sonner";
import {
  deleteStudioValue,
  reorderStudioValues,
} from "@/app/(admin)/studio-values/actions";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { SortableStudioValueRow } from "./SortableStudioValueRow";
import { StudioValueActiveToggle } from "./StudioValueActiveToggle";
import type { StudioValueData } from "./studio-value-types";

export const StudioValueTable = ({
  studioValues,
}: {
  studioValues: StudioValueData[];
}) => {
  const [orderedValues, setOrderedValues] = useState(studioValues);
  const [reorderMode, setReorderMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StudioValueData | null>(null);
  const [saving, startSaving] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setOrderedValues((current) => {
      const from = current.findIndex((value) => value.id === active.id);
      const to = current.findIndex((value) => value.id === over.id);
      return arrayMove(current, from, to);
    });
  };

  const saveOrder = () => {
    startSaving(async () => {
      const result = await reorderStudioValues(
        orderedValues.map((value) => value.id),
      );
      if (result.success) {
        toast.success("Ordre enregistre.");
        setReorderMode(false);
      } else {
        toast.error(result.error ?? "Impossible d'enregistrer l'ordre.");
      }
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteStudioValue(deleteTarget.id);
    if (result.success) {
      toast.success("Valeur supprimee.");
      setDeleteTarget(null);
    } else {
      toast.error(result.error ?? "Impossible de supprimer la valeur.");
    }
  };

  if (reorderMode) {
    return (
      <>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Glissez les lignes pour modifier l&apos;ordre d&apos;affichage.
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              disabled={saving}
              onClick={() => {
                setOrderedValues(studioValues);
                setReorderMode(false);
              }}
            >
              Annuler
            </Button>
            <Button size="small" variant="contained" disabled={saving} onClick={saveOrder}>
              {saving ? "Enregistrement..." : "Enregistrer l'ordre"}
            </Button>
          </Box>
        </Box>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={orderedValues.map((value) => value.id)}
            strategy={verticalListSortingStrategy}
          >
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell>Titre</TableCell>
                    <TableCell>Title EN</TableCell>
                    <TableCell>Actif</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orderedValues.map((studioValue) => (
                    <SortableStudioValueRow
                      key={studioValue.id}
                      studioValue={studioValue}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </SortableContext>
        </DndContext>
      </>
    );
  }

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<SwapVertIcon />}
          onClick={() => {
            setOrderedValues(studioValues);
            setReorderMode(true);
          }}
        >
          Reordonner
        </Button>
      </Box>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 60 }}>#</TableCell>
              <TableCell>Titre</TableCell>
              <TableCell>Title EN</TableCell>
              <TableCell sx={{ width: 80 }}>Actif</TableCell>
              <TableCell sx={{ width: 110 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {studioValues.map((studioValue) => (
              <TableRow key={studioValue.id} hover>
                <TableCell>{studioValue.order}</TableCell>
                <TableCell>{studioValue.title}</TableCell>
                <TableCell>{studioValue.titleEn || "--"}</TableCell>
                <TableCell>
                  <StudioValueActiveToggle
                    id={studioValue.id}
                    active={studioValue.active}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    component={Link}
                    href={`/studio-values/${studioValue.id}/edit`}
                    size="small"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteTarget(studioValue)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <DeleteConfirmDialog
        open={deleteTarget !== null}
        title={`Supprimer "${deleteTarget?.title}" ?`}
        message="Cette valeur sera supprimee de la page Studio."
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
};
