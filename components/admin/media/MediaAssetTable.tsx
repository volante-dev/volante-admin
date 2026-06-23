"use client";

import { useMemo, useState, useTransition } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { toast } from "sonner";
import {
  deleteMediaAsset,
  updateMediaAsset,
} from "@/app/(admin)/media-assets/actions";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import type { MediaAssetData } from "./media-types";

export const MediaAssetTable = ({ assets }: { assets: MediaAssetData[] }) => {
  const [rows, setRows] = useState(assets);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<MediaAssetData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaAssetData | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return rows;
    return rows.filter((asset) =>
      [
        asset.name,
        asset.alt ?? "",
        asset.altEn ?? "",
        asset.tags.join(" "),
        asset.pathname,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [query, rows]);

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;

    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateMediaAsset(editing.id, formData);
      if (result.success && result.asset) {
        setRows((current) =>
          current.map((asset) =>
            asset.id === result.asset?.id ? result.asset : asset,
          ),
        );
        setEditing(null);
        toast.success("Media mis a jour.");
      } else {
        toast.error(result.error ?? "Impossible de mettre a jour le media.");
      }
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const result = await deleteMediaAsset(deleteTarget.id);
    if (result.success) {
      setRows((current) =>
        current.filter((asset) => asset.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
      toast.success("Media supprime.");
    } else {
      toast.error(result.error ?? "Impossible de supprimer le media.");
    }
  };

  return (
    <>
      <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", gap: 2 }}>
        <TextField
          label="Rechercher"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          size="small"
          sx={{ maxWidth: 360, flex: 1 }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ alignSelf: "center" }}>
          {filtered.length} media{filtered.length > 1 ? "s" : ""}
        </Typography>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Apercu</TableCell>
              <TableCell>Nom</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell>Usages</TableCell>
              <TableCell>Actif</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((asset) => (
              <TableRow key={asset.id} hover>
                <TableCell sx={{ width: 120 }}>
                  <Box
                    sx={{
                      width: 96,
                      height: 64,
                      bgcolor: "grey.100",
                      overflow: "hidden",
                      borderRadius: 1,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {asset.mediaType === "VIDEO" ? (
                      <Box
                        component="video"
                        src={asset.url}
                        muted
                        playsInline
                        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <Box
                        component="img"
                        src={asset.url}
                        alt=""
                        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {asset.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {asset.pathname}
                  </Typography>
                </TableCell>
                <TableCell>{asset.mediaType === "VIDEO" ? "Video" : "Image"}</TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {asset.tags.map((tag) => (
                      <Chip key={tag} size="small" label={tag} />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>{asset.usageCount}</TableCell>
                <TableCell>{asset.active ? "Oui" : "Non"}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => setEditing(asset)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setDeleteTarget(asset)}
                    disabled={pending}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={editing !== null} onClose={() => setEditing(null)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={handleSave}>
          <DialogTitle>Modifier le media</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField name="name" label="Nom" defaultValue={editing?.name ?? ""} required />
            <TextField name="alt" label="Alt FR" defaultValue={editing?.alt ?? ""} />
            <TextField name="altEn" label="Alt EN" defaultValue={editing?.altEn ?? ""} />
            <TextField
              name="tags"
              label="Tags"
              defaultValue={editing?.tags.join(", ") ?? ""}
              helperText="Tags separes par des virgules."
            />
            <FormControlLabel
              control={
                <Switch
                  name="active"
                  defaultChecked={editing?.active ?? true}
                  value="true"
                />
              }
              label="Actif"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditing(null)} disabled={pending}>
              Annuler
            </Button>
            <Button type="submit" variant="contained" disabled={pending}>
              Enregistrer
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        title={`Supprimer "${deleteTarget?.name}" ?`}
        message="La suppression est bloquee si ce media est encore utilise."
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
};
