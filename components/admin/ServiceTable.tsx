"use client";

import { useState, useMemo, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import Link from "next/link";
import { toast } from "sonner";
import { ActiveToggle } from "./ActiveToggle";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { SortableServiceRow } from "./SortableServiceRow";
import {
  deleteService,
  reorderServices,
} from "@/app/(admin)/services/actions";
import type { ServiceData } from "@/app/(admin)/services/page";

type SortKey = "order" | "title" | "titleEn" | "active";
type SortDir = "asc" | "desc";
type Filter = "all" | "active" | "inactive";

export const ServiceTable = ({ services }: { services: ServiceData[] }) => {
  const [sortKey, setSortKey] = useState<SortKey>("order");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filter, setFilter] = useState<Filter>("all");
  const [deleteTarget, setDeleteTarget] = useState<ServiceData | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [orderedServices, setOrderedServices] = useState(services);
  const [saving, startSaveTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    let result = [...services];

    if (filter === "active") result = result.filter((s) => s.active);
    if (filter === "inactive") result = result.filter((s) => !s.active);

    result.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal, "fr")
          : bVal.localeCompare(aVal, "fr");
      }
      if (typeof aVal === "boolean" && typeof bVal === "boolean") {
        return sortDir === "asc"
          ? Number(aVal) - Number(bVal)
          : Number(bVal) - Number(aVal);
      }
      return sortDir === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return result;
  }, [services, filter, sortKey, sortDir]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteService(deleteTarget.id);
    if (result.success) {
      toast.success("Service supprime.");
      setDeleteTarget(null);
    } else {
      toast.error(result.error ?? "Erreur lors de la suppression.");
    }
  };

  const enterReorderMode = () => {
    setOrderedServices([...services].sort((a, b) => a.order - b.order));
    setReorderMode(true);
  };

  const cancelReorder = () => {
    setReorderMode(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrderedServices((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const saveOrder = () => {
    startSaveTransition(async () => {
      const ids = orderedServices.map((s) => s.id);
      const result = await reorderServices(ids);
      if (result.success) {
        toast.success("Ordre enregistre.");
        setReorderMode(false);
      } else {
        toast.error(result.error ?? "Erreur lors de la sauvegarde.");
      }
    });
  };

  if (reorderMode) {
    return (
      <>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
            gap: 1,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Glissez les lignes pour reordonner les services.
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={cancelReorder}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={saveOrder}
              disabled={saving}
            >
              {saving ? "Enregistrement..." : "Enregistrer l'ordre"}
            </Button>
          </Box>
        </Box>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={orderedServices.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 60 }} />
                    <TableCell>Titre</TableCell>
                    <TableCell>Title EN</TableCell>
                    <TableCell sx={{ width: 80 }}>Icone</TableCell>
                    <TableCell sx={{ width: 80 }}>Actif</TableCell>
                    <TableCell sx={{ width: 100 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orderedServices.map((service) => (
                    <SortableServiceRow key={service.id} service={service} />
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
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_, v) => v && setFilter(v as Filter)}
          size="small"
        >
          <ToggleButton value="all">Tous ({services.length})</ToggleButton>
          <ToggleButton value="active">
            Actifs ({services.filter((s) => s.active).length})
          </ToggleButton>
          <ToggleButton value="inactive">
            Inactifs ({services.filter((s) => !s.active).length})
          </ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<SwapVertIcon />}
            onClick={enterReorderMode}
          >
            Reordonner
          </Button>
          <Typography variant="body2" color="text.secondary">
            {filtered.length} service{filtered.length !== 1 ? "s" : ""}
          </Typography>
        </Box>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 60 }}>
                <TableSortLabel
                  active={sortKey === "order"}
                  direction={sortKey === "order" ? sortDir : "asc"}
                  onClick={() => handleSort("order")}
                >
                  #
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortKey === "title"}
                  direction={sortKey === "title" ? sortDir : "asc"}
                  onClick={() => handleSort("title")}
                >
                  Titre
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortKey === "titleEn"}
                  direction={sortKey === "titleEn" ? sortDir : "asc"}
                  onClick={() => handleSort("titleEn")}
                >
                  Title EN
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ width: 80 }}>Icone</TableCell>
              <TableCell sx={{ width: 80 }}>
                <TableSortLabel
                  active={sortKey === "active"}
                  direction={sortKey === "active" ? sortDir : "asc"}
                  onClick={() => handleSort("active")}
                >
                  Actif
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ width: 100 }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Aucun service trouve.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((service) => (
                <TableRow key={service.id} hover>
                  <TableCell>{service.order}</TableCell>
                  <TableCell>{service.title}</TableCell>
                  <TableCell>
                    {service.titleEn || (
                      <Typography variant="body2" color="text.secondary">
                        --
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {service.icon || (
                      <Typography variant="body2" color="text.secondary">
                        --
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <ActiveToggle id={service.id} active={service.active} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      component={Link}
                      href={`/services/${service.id}/edit`}
                      size="small"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteTarget(service)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        title={`Supprimer "${deleteTarget?.title}" ?`}
        message="Cette action est irreversible. Le service sera supprime du site public."
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
};
