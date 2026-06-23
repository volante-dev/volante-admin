"use client";

import { useMemo, useState, useTransition } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { toast } from "sonner";
import {
  deleteMediaAsset,
  updateMediaAsset,
} from "@/app/(admin)/media-assets/actions";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { useAiRequest } from "@/lib/use-ai-request";
import type { MediaMetadataOutput } from "@/lib/ai";
import type { MediaAssetData } from "./media-types";

const hasMissingAlt = (asset: MediaAssetData) => !asset.alt || !asset.altEn;
const hasMissingTags = (asset: MediaAssetData) => asset.tags.length === 0;

const isMediaMetadataOutput = (
  output: unknown,
): output is MediaMetadataOutput =>
  typeof output === "object" &&
  output !== null &&
  "alt" in output &&
  "altEn" in output &&
  "tags" in output &&
  Array.isArray((output as MediaMetadataOutput).tags);

export const MediaAssetTable = ({ assets }: { assets: MediaAssetData[] }) => {
  const [rows, setRows] = useState(assets);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<MediaAssetData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaAssetData | null>(null);
  const [draftAlt, setDraftAlt] = useState("");
  const [draftAltEn, setDraftAltEn] = useState("");
  const [draftTags, setDraftTags] = useState("");
  const [pending, startTransition] = useTransition();
  const { execute, loading: generating } = useAiRequest();

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

  const openEditor = (asset: MediaAssetData) => {
    setEditing(asset);
    setDraftAlt(asset.alt ?? "");
    setDraftAltEn(asset.altEn ?? "");
    setDraftTags(asset.tags.join(", "));
  };

  const handleSave = () => {
    if (!editing) return;

    const formData = new FormData();
    formData.set("name", editing.name);
    formData.set("alt", draftAlt);
    formData.set("altEn", draftAltEn);
    formData.set("tags", draftTags);
    formData.set("active", String(editing.active));

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

  const handleGenerate = async () => {
    if (!editing || editing.mediaType !== "IMAGE") return;

    const result = await execute({
      task: "generate-media-metadata",
      imageUrl: editing.url,
      assetName: editing.name,
    });
    if (!isMediaMetadataOutput(result)) {
      if (result) toast.error("La reponse IA est invalide.");
      return;
    }

    setDraftAlt(result.alt);
    setDraftAltEn(result.altEn);
    setDraftTags(result.tags.join(", "));
    toast.success("Alt et tags generes.");
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
              <TableRow
                key={asset.id}
                hover
                onClick={() => openEditor(asset)}
                sx={{ cursor: "pointer" }}
              >
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
                  <Box sx={{ mt: 0.75, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {hasMissingAlt(asset) && (
                      <Chip
                        size="small"
                        color="warning"
                        variant="outlined"
                        label="Alt manquant"
                      />
                    )}
                    {hasMissingTags(asset) && (
                      <Chip
                        size="small"
                        color="warning"
                        variant="outlined"
                        label="Tags manquants"
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>{asset.mediaType === "VIDEO" ? "Video" : "Image"}</TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {asset.tags.length > 0 ? (
                      asset.tags.map((tag) => (
                        <Chip key={tag} size="small" label={tag} />
                      ))
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Aucun tag
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{asset.usageCount}</TableCell>
                <TableCell>{asset.active ? "Oui" : "Non"}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      openEditor(asset);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(event) => {
                      event.stopPropagation();
                      setDeleteTarget(asset);
                    }}
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
        <DialogTitle>Modifier les metadonnees</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {editing && (
            <Box
              sx={{
                bgcolor: "grey.100",
                borderRadius: 1,
                overflow: "hidden",
                display: "grid",
                placeItems: "center",
                minHeight: 260,
              }}
            >
              {editing.mediaType === "VIDEO" ? (
                <Box
                  component="video"
                  src={editing.url}
                  controls
                  muted
                  playsInline
                  sx={{ width: "100%", maxHeight: 360, objectFit: "contain" }}
                />
              ) : (
                <Box
                  component="img"
                  src={editing.url}
                  alt=""
                  sx={{ width: "100%", maxHeight: 360, objectFit: "contain" }}
                />
              )}
            </Box>
          )}
          <Button
            variant="outlined"
            startIcon={generating ? <CircularProgress size={18} /> : <AutoAwesomeIcon />}
            onClick={handleGenerate}
            disabled={!editing || editing.mediaType !== "IMAGE" || generating || pending}
          >
            {generating ? "Generation..." : "Generer alt & tags"}
          </Button>
          <TextField
            label="Alt FR"
            value={draftAlt}
            onChange={(event) => setDraftAlt(event.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
          <TextField
            label="Alt EN"
            value={draftAltEn}
            onChange={(event) => setDraftAltEn(event.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
          <TextField
            label="Tags"
            value={draftTags}
            helperText="5 tags recommandes, separes par des virgules."
            onChange={(event) => setDraftTags(event.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)} disabled={pending || generating}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={pending || generating || !editing}
          >
            Enregistrer
          </Button>
        </DialogActions>
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
