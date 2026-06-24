"use client";

import { useMemo, useState, useTransition } from "react";
import { uploadPresigned } from "@vercel/blob/client";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
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
import UploadIcon from "@mui/icons-material/Upload";
import { toast } from "sonner";
import {
  deleteMediaAsset,
  optimizeMediaAsset,
  replaceMediaAssetVideoWithMp4,
  updateMediaAsset,
} from "@/app/(admin)/media-assets/actions";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import {
  convertVideoToMp4,
  type VideoConversionStatus,
} from "@/lib/browser-video-converter";
import { useAiRequest } from "@/lib/use-ai-request";
import type { MediaMetadataOutput } from "@/lib/ai";
import type { MediaAssetData } from "./media-types";

const hasMissingAlt = (asset: MediaAssetData) => !asset.alt || !asset.altEn;
const hasMissingTags = (asset: MediaAssetData) => asset.tags.length === 0;
const posterAccept = "image/jpeg,image/png,image/webp,image/avif";
const optimizableMimeTypes = new Set(["image/png", "image/jpeg"]);
const largeImageThresholdBytes = 1024 * 1024;

const cleanFileName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-");

const isMediaMetadataOutput = (
  output: unknown,
): output is MediaMetadataOutput =>
  typeof output === "object" &&
  output !== null &&
  "alt" in output &&
  "altEn" in output &&
  "tags" in output &&
  Array.isArray((output as MediaMetadataOutput).tags);

const inferMimeTypeFromPath = (value: string) => {
  const normalized = value.toLowerCase();
  if (normalized.includes(".png")) return "image/png";
  if (normalized.includes(".jpg") || normalized.includes(".jpeg")) return "image/jpeg";
  if (normalized.includes(".webp")) return "image/webp";
  if (normalized.includes(".avif")) return "image/avif";
  if (normalized.includes(".mp4")) return "video/mp4";
  if (normalized.includes(".mov")) return "video/quicktime";
  return null;
};

const getAssetMimeType = (asset: MediaAssetData) =>
  asset.mimeType ??
  inferMimeTypeFromPath(asset.pathname) ??
  inferMimeTypeFromPath(asset.url);

const formatMimeType = (value: string | null | undefined) => {
  if (!value) return null;
  const subtype = value.split("/").pop()?.split(";")[0]?.trim().toLowerCase();
  if (!subtype) return null;
  if (subtype === "jpeg" || subtype === "jpg") return "JPEG";
  if (subtype === "png") return "PNG";
  if (subtype === "webp") return "WebP";
  if (subtype === "avif") return "AVIF";
  if (subtype === "mp4") return "MP4";
  if (subtype === "quicktime") return "MOV";
  return subtype.toUpperCase();
};

const getAssetFormat = (asset: MediaAssetData) =>
  formatMimeType(getAssetMimeType(asset));

const getAssetTypeLabel = (asset: MediaAssetData) => {
  const type = asset.mediaType === "VIDEO" ? "Video" : "Image";
  const format = getAssetFormat(asset);
  return format ? `${type} - ${format}` : type;
};

const canOptimize = (asset: MediaAssetData | null) => {
  if (!asset || asset.mediaType !== "IMAGE") return false;
  const mimeType = getAssetMimeType(asset);
  return Boolean(mimeType && optimizableMimeTypes.has(mimeType));
};

const canConvertToMp4 = (asset: MediaAssetData | null) =>
  Boolean(
    asset &&
      asset.mediaType === "VIDEO" &&
      getAssetMimeType(asset) === "video/quicktime",
  );

const isLargeImage = (asset: MediaAssetData) =>
  asset.mediaType === "IMAGE" &&
  asset.size !== null &&
  asset.size > largeImageThresholdBytes;

const formatBytes = (value: number) => {
  if (value < 1024) return `${value} o`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} Ko`;
  return `${(value / (1024 * 1024)).toFixed(1)} Mo`;
};

export const MediaAssetTable = ({ assets }: { assets: MediaAssetData[] }) => {
  const [rows, setRows] = useState(assets);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<MediaAssetData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaAssetData | null>(null);
  const [draftAlt, setDraftAlt] = useState("");
  const [draftAltEn, setDraftAltEn] = useState("");
  const [draftTags, setDraftTags] = useState("");
  const [draftPosterUrl, setDraftPosterUrl] = useState("");
  const [draftPosterPathname, setDraftPosterPathname] = useState("");
  const [draftPosterMimeType, setDraftPosterMimeType] = useState("");
  const [draftPosterSize, setDraftPosterSize] = useState("");
  const [posterUploading, setPosterUploading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [converting, setConverting] = useState(false);
  const [conversionStatus, setConversionStatus] =
    useState<VideoConversionStatus | null>(null);
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
    setDraftPosterUrl(asset.posterUrl ?? "");
    setDraftPosterPathname(asset.posterPathname ?? "");
    setDraftPosterMimeType(asset.posterMimeType ?? "");
    setDraftPosterSize(asset.posterSize ? String(asset.posterSize) : "");
  };

  const handleSave = () => {
    if (!editing) return;

    const formData = new FormData();
    formData.set("name", editing.name);
    formData.set("alt", draftAlt);
    formData.set("altEn", draftAltEn);
    formData.set("tags", draftTags);
    formData.set("active", String(editing.active));
    if (editing.mediaType === "VIDEO") {
      formData.set("posterUrl", draftPosterUrl);
      formData.set("posterPathname", draftPosterPathname);
      formData.set("posterMimeType", draftPosterMimeType);
      formData.set("posterSize", draftPosterSize);
    }

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

  const handlePosterUpload = async (file: File | null) => {
    if (!editing || !file) return;

    setPosterUploading(true);
    try {
      const pathname = `media-assets/${editing.id}/poster/${Date.now()}-${cleanFileName(file.name)}`;
      const blob = await uploadPresigned(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/media/upload",
        clientPayload: JSON.stringify({
          mediaAssetId: editing.id,
          field: "video-poster",
        }),
      });
      setDraftPosterUrl(blob.url);
      setDraftPosterPathname(blob.pathname);
      setDraftPosterMimeType(file.type);
      setDraftPosterSize(String(file.size));
      toast.success("Poster uploade.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'upload du poster.",
      );
    } finally {
      setPosterUploading(false);
    }
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

  const handleOptimize = async () => {
    if (!editing || !canOptimize(editing)) return;

    setOptimizing(true);
    try {
      const result = await optimizeMediaAsset(editing.id);
      if (!result.success) {
        toast.error(result.error ?? "Impossible d'optimiser l'image.");
        return;
      }
      if (result.asset) {
        setRows((current) =>
          current.map((asset) =>
            asset.id === result.asset?.id ? result.asset : asset,
          ),
        );
        setEditing(result.asset);
      }
      if (result.optimization?.applied) {
        toast.success(
          `Image optimisee : ${formatBytes(result.optimization.savedBytes)} economises.`,
        );
      } else {
        toast.info("Aucun remplacement : l'image optimisee n'etait pas plus legere.");
      }
    } finally {
      setOptimizing(false);
    }
  };

  const handleConvertToMp4 = async () => {
    if (!editing || !canConvertToMp4(editing)) return;

    setConverting(true);
    setConversionStatus({
      phase: "loading",
      progress: null,
      label: "Telechargement de la video",
    });
    try {
      const response = await fetch(editing.url);
      if (!response.ok) {
        throw new Error(`Video inaccessible (${response.status}).`);
      }
      const source = await response.blob();
      const sourceName = editing.pathname.split("/").pop() || editing.name;
      const mp4File = await convertVideoToMp4(
        source,
        sourceName,
        setConversionStatus,
      );

      setConversionStatus({
        phase: "uploading",
        progress: null,
        label: "Upload de la video convertie",
      });
      const pathname = `media-assets/${editing.id}/converted/${Date.now()}-${cleanFileName(mp4File.name)}`;
      const blob = await uploadPresigned(pathname, mp4File, {
        access: "public",
        handleUploadUrl: "/api/media/upload",
        clientPayload: JSON.stringify({
          mediaAssetId: editing.id,
          field: "video-conversion",
        }),
      });

      setConversionStatus({
        phase: "finalizing",
        progress: null,
        label: "Finalisation",
      });
      const result = await replaceMediaAssetVideoWithMp4(editing.id, {
        url: blob.url,
        pathname: blob.pathname,
        contentType: mp4File.type,
        size: mp4File.size,
      });
      if (!result.success || !result.asset) {
        throw new Error(result.error ?? "Impossible de finaliser la conversion.");
      }

      setRows((current) =>
        current.map((asset) =>
          asset.id === result.asset?.id ? result.asset : asset,
        ),
      );
      setEditing(result.asset);
      toast.success("Video convertie en MP4.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la conversion de la video.",
      );
    } finally {
      setConverting(false);
      setConversionStatus(null);
    }
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
                      asset.posterUrl ? (
                        <Box
                          component="img"
                          src={asset.posterUrl}
                          alt=""
                          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <Box
                          component="video"
                          src={asset.url}
                          muted
                          playsInline
                          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      )
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
                    {isLargeImage(asset) && (
                      <Chip
                        size="small"
                        color="warning"
                        variant="outlined"
                        label="Image > 1 Mo"
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>{getAssetTypeLabel(asset)}</TableCell>
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
                  poster={draftPosterUrl || undefined}
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
          {editing && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Taille : {editing.size !== null ? formatBytes(editing.size) : "inconnue"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Format : {getAssetFormat(editing) ?? "inconnu"}
              </Typography>
              {editing.mediaType === "IMAGE" && editing.width && editing.height && (
                <Typography variant="body2" color="text.secondary">
                  Dimensions : {editing.width} x {editing.height} px
                </Typography>
              )}
            </Box>
          )}
          {editing?.mediaType === "VIDEO" && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography variant="body2" fontWeight={500}>
                Poster video
              </Typography>
              {draftPosterUrl ? (
                <Box
                  component="img"
                  src={draftPosterUrl}
                  alt=""
                  sx={{
                    width: "100%",
                    maxHeight: 220,
                    objectFit: "contain",
                    bgcolor: "grey.100",
                    borderRadius: 1,
                  }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Aucun poster renseigne.
                </Typography>
              )}
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={
                    posterUploading ? <CircularProgress size={18} /> : <UploadIcon />
                  }
                  disabled={posterUploading || pending}
                >
                  {posterUploading ? "Upload..." : "Uploader un poster"}
                  <input
                    type="file"
                    accept={posterAccept}
                    hidden
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      event.target.value = "";
                      void handlePosterUpload(file);
                    }}
                  />
                </Button>
                {draftPosterUrl && (
                  <Button
                    variant="text"
                    color="error"
                    onClick={() => {
                      setDraftPosterUrl("");
                      setDraftPosterPathname("");
                      setDraftPosterMimeType("");
                      setDraftPosterSize("");
                    }}
                    disabled={posterUploading || pending}
                  >
                    Retirer le poster
                  </Button>
                )}
              </Box>
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
          {canOptimize(editing) && (
            <Button
              variant="outlined"
              onClick={handleOptimize}
              disabled={optimizing || generating || pending || converting}
            >
              {optimizing ? "Optimisation..." : "Optimize"}
            </Button>
          )}
          {canConvertToMp4(editing) && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Button
                variant="outlined"
                onClick={handleConvertToMp4}
                disabled={converting || generating || pending || optimizing}
              >
                {converting ? "Conversion..." : "Convertir en MP4"}
              </Button>
              {conversionStatus && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                  <Typography variant="body2" color="text.secondary">
                    {conversionStatus.label}
                  </Typography>
                  <LinearProgress
                    variant={
                      conversionStatus.progress === null
                        ? "indeterminate"
                        : "determinate"
                    }
                    value={
                      conversionStatus.progress === null
                        ? undefined
                        : conversionStatus.progress * 100
                    }
                  />
                </Box>
              )}
            </Box>
          )}
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
