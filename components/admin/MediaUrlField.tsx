"use client";

import { useEffect, useMemo, useState } from "react";
import { uploadPresigned } from "@vercel/blob/client";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import LinearProgress from "@mui/material/LinearProgress";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CollectionsIcon from "@mui/icons-material/Collections";
import UploadIcon from "@mui/icons-material/Upload";
import { toast } from "sonner";
import { createMediaAssetFromUpload } from "@/app/(admin)/media-assets/actions";
import type {
  MediaAssetType,
  MediaSelection,
} from "@/components/admin/media/media-types";

type MediaUrlFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  assetId?: string | null;
  onAssetChange?: (assetId: string | null) => void;
  required?: boolean;
  accept: string;
  projectId?: string;
  basePath?: string;
  field: string;
  helperText?: string;
  previewType?: "IMAGE" | "VIDEO";
};

const cleanFileName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-");

const fieldLabel = (field: string) =>
  field
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const defaultTags = (basePath: string | undefined, field: string) =>
  [basePath?.split("/").filter(Boolean).at(-1), field.replace(/[-_]+/g, " ")]
    .filter(Boolean)
    .join(", ");

const inferTypeFilter = (accept: string): MediaAssetType | undefined =>
  accept.includes("video") ? "VIDEO" : accept.includes("image") ? "IMAGE" : undefined;

export const MediaUrlField = ({
  label,
  value,
  onChange,
  assetId,
  onAssetChange,
  required = false,
  accept,
  projectId,
  basePath,
  field,
  helperText,
  previewType = "IMAGE",
}: MediaUrlFieldProps) => {
  const typeFilter = useMemo(() => inferTypeFilter(accept), [accept]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [assetName, setAssetName] = useState("");
  const [assetAlt, setAssetAlt] = useState("");
  const [assetAltEn, setAssetAltEn] = useState("");
  const [assetTags, setAssetTags] = useState(defaultTags(basePath, field));
  const [query, setQuery] = useState("");
  const [libraryAssets, setLibraryAssets] = useState<MediaSelection[]>([]);

  useEffect(() => {
    if (!libraryOpen) return;

    const controller = new AbortController();
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    if (query.trim()) params.set("q", query.trim());

    fetch(`/api/media-assets?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Chargement impossible.");
        return response.json() as Promise<{ assets: MediaSelection[] }>;
      })
      .then((payload) => setLibraryAssets(payload.assets))
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        toast.error("Impossible de charger la galerie.");
      });

    return () => controller.abort();
  }, [libraryOpen, query, typeFilter]);

  const resetUpload = () => {
    setSelectedFile(null);
    setAssetName("");
    setAssetAlt("");
    setAssetAltEn("");
    setAssetTags(defaultTags(basePath, field));
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Selectionnez un fichier.");
      return;
    }
    const name = assetName.trim() || selectedFile.name.replace(/\.[^.]+$/, "");
    if (name.length < 2) {
      toast.error("Le nom doit contenir au moins 2 caracteres.");
      return;
    }

    setUploading(true);
    try {
      const prefix = basePath ?? `projects/${projectId ?? "draft"}`;
      const pathname = `${prefix}/${field}/${Date.now()}-${cleanFileName(selectedFile.name)}`;
      const blob = await uploadPresigned(pathname, selectedFile, {
        access: "public",
        handleUploadUrl: "/api/media/upload",
        clientPayload: JSON.stringify({ projectId: projectId ?? null, field }),
      });
      const result = await createMediaAssetFromUpload(
        {
          url: blob.url,
          pathname: blob.pathname,
          contentType: selectedFile.type,
          size: selectedFile.size,
        },
        {
          name,
          alt: assetAlt,
          altEn: assetAltEn,
          tags: assetTags
            .split(/[\n,]/)
            .map((tag) => tag.trim())
            .filter(Boolean),
          mimeType: selectedFile.type,
          size: selectedFile.size,
        },
      );
      if (!result.success || !result.asset) {
        throw new Error(result.error ?? "Media uploade mais non reference.");
      }

      onChange(result.asset.url);
      onAssetChange?.(result.asset.id);
      toast.success("Media ajoute a la galerie.");
      setUploadOpen(false);
      resetUpload();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'upload du media.",
      );
    } finally {
      setUploading(false);
    }
  };

  const selectAsset = (asset: MediaSelection) => {
    onChange(asset.url);
    onAssetChange?.(asset.id);
    setLibraryOpen(false);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
        <TextField
          label={label}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            onAssetChange?.(null);
          }}
          required={required}
          fullWidth
          helperText={
            helperText ??
            (assetId ? "Image liee a la galerie." : "URL libre ou media de la galerie.")
          }
        />
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          disabled={uploading}
          onClick={() => setUploadOpen(true)}
          sx={{ minWidth: 116 }}
        >
          Upload
        </Button>
        <Button
          variant="outlined"
          startIcon={<CollectionsIcon />}
          onClick={() => setLibraryOpen(true)}
          sx={{ minWidth: 116 }}
        >
          Galerie
        </Button>
      </Box>
      {uploading && <LinearProgress />}
      {value && (
        <Box
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            overflow: "hidden",
            bgcolor: "background.default",
            maxWidth: 360,
          }}
        >
          {previewType === "VIDEO" ? (
            <Box
              component="video"
              src={value}
              controls
              muted
              playsInline
              sx={{ display: "block", width: "100%", maxHeight: 180 }}
            />
          ) : (
            <Box
              component="img"
              src={value}
              alt=""
              sx={{
                display: "block",
                width: "100%",
                maxHeight: 180,
                objectFit: "cover",
              }}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          )}
          <Typography
            variant="caption"
            sx={{ display: "block", px: 1, py: 0.75 }}
          >
            {assetId ? "Media de la galerie" : "URL media"}
          </Typography>
        </Box>
      )}

      <Dialog
        open={uploadOpen}
        onClose={() => !uploading && setUploadOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Ajouter un media</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Button component="label" variant="outlined" startIcon={<UploadIcon />}>
            {selectedFile ? selectedFile.name : "Choisir un fichier"}
            <input
              type="file"
              accept={accept}
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setSelectedFile(file);
                if (file && !assetName) {
                  setAssetName(fieldLabel(file.name.replace(/\.[^.]+$/, "")));
                }
              }}
            />
          </Button>
          <TextField
            label="Nom"
            value={assetName}
            required
            onChange={(event) => setAssetName(event.target.value)}
          />
          <TextField
            label="Alt FR"
            value={assetAlt}
            onChange={(event) => setAssetAlt(event.target.value)}
          />
          <TextField
            label="Alt EN"
            value={assetAltEn}
            onChange={(event) => setAssetAltEn(event.target.value)}
          />
          <TextField
            label="Tags"
            value={assetTags}
            helperText="Tags separes par des virgules."
            onChange={(event) => setAssetTags(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadOpen(false)} disabled={uploading}>
            Annuler
          </Button>
          <Button onClick={handleUpload} variant="contained" disabled={uploading}>
            {uploading ? "Upload..." : "Ajouter"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Selectionner dans la galerie</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            label="Rechercher"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            size="small"
          />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr 1fr",
                sm: "repeat(3, minmax(0, 1fr))",
              },
              gap: 1.5,
            }}
          >
            {libraryAssets.map((asset) => (
              <Button
                key={asset.id}
                variant={asset.id === assetId ? "contained" : "outlined"}
                onClick={() => selectAsset(asset)}
                sx={{
                  p: 1,
                  alignItems: "stretch",
                  display: "flex",
                  flexDirection: "column",
                  textAlign: "left",
                  gap: 1,
                  textTransform: "none",
                }}
              >
                <Box
                  sx={{
                    height: 112,
                    bgcolor: "grey.100",
                    borderRadius: 1,
                    overflow: "hidden",
                  }}
                >
                  {asset.mediaType === "VIDEO" ? (
                    <Box
                      component="video"
                      src={asset.url}
                      poster={asset.posterUrl ?? undefined}
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
                <Typography variant="body2" noWrap>
                  {asset.name}
                </Typography>
              </Button>
            ))}
          </Box>
          {libraryAssets.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Aucun media disponible.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLibraryOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
