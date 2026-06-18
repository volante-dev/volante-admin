"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import UploadIcon from "@mui/icons-material/Upload";
import { toast } from "sonner";

type MediaUrlFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  accept: string;
  projectId?: string;
  field: string;
  helperText?: string;
  previewType?: "IMAGE" | "VIDEO";
};

const cleanFileName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-");

export const MediaUrlField = ({
  label,
  value,
  onChange,
  required = false,
  accept,
  projectId,
  field,
  helperText,
  previewType = "IMAGE",
}: MediaUrlFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const pathname = `projects/${projectId ?? "draft"}/${field}/${Date.now()}-${cleanFileName(file.name)}`;
      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/media/upload",
        clientPayload: JSON.stringify({ projectId: projectId ?? null, field }),
      });
      onChange(blob.url);
      toast.success("Media uploade.");
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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
        <TextField
          label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          fullWidth
          helperText={helperText}
        />
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          hidden
          onChange={handleFile}
        />
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          sx={{ minWidth: 128 }}
        >
          Upload
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
          <Typography variant="caption" sx={{ display: "block", px: 1, py: 0.75 }}>
            Preview media
          </Typography>
        </Box>
      )}
    </Box>
  );
};
