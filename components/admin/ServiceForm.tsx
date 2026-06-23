"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { toast } from "sonner";
import { createService, updateService } from "@/app/(admin)/services/actions";
import { isBlankRichText } from "@/lib/rich-text";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { TranslateButton } from "@/components/admin/TranslateButton";
import type { ServiceData } from "@/app/(admin)/services/page";

type ServiceFormProps = {
  service?: ServiceData;
};

export const ServiceForm = ({ service }: ServiceFormProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(service?.title ?? "");
  const [titleEn, setTitleEn] = useState(service?.titleEn ?? "");
  const [descriptionHtml, setDescriptionHtml] = useState(
    service?.descriptionHtml ?? `<p>${service?.description ?? ""}</p>`,
  );
  const [descriptionEn, setDescriptionEn] = useState(
    service?.descriptionHtmlEn ?? (service?.descriptionEn ? `<p>${service.descriptionEn}</p>` : ""),
  );
  const [icon, setIcon] = useState(service?.icon ?? "");
  const [order, setOrder] = useState(String(service?.order ?? 0));
  const [active, setActive] = useState(service?.active ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title || title.length < 2) {
      setError("Le titre doit contenir au moins 2 caracteres.");
      setTab(0);
      return;
    }
    if (isBlankRichText(descriptionHtml)) {
      setError("La description doit contenir au moins 10 caracteres.");
      setTab(0);
      return;
    }

    const formData = new FormData();
    formData.set("title", title);
    formData.set("titleEn", titleEn);
    formData.set("descriptionHtml", descriptionHtml);
    formData.set("descriptionHtmlEn", descriptionEn);
    formData.set("icon", icon);
    formData.set("order", order);
    formData.set("active", String(active));

    startTransition(async () => {
      const result = service
        ? await updateService(service.id, formData)
        : await createService(formData);

      if (result.success) {
        toast.success(
          service ? "Service mis a jour." : "Service cree avec succes.",
        );
        router.push("/services");
      } else {
        setError(result.error ?? "Une erreur est survenue.");
      }
    });
  };

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit}>
          {error && (
            <Typography
              variant="body2"
              color="error"
              sx={{ mb: 2, p: 1.5, bgcolor: "error.50", borderRadius: 1 }}
            >
              {error}
            </Typography>
          )}

          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="Francais" />
            <Tab label="English" />
          </Tabs>

          {tab === 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <TextField
                label="Titre"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                fullWidth
                error={!!error && title.length < 2}
                helperText="Titre du service en francais (min. 2 caracteres)"
              />
              <RichTextEditor
                label="Description"
                value={descriptionHtml}
                onChange={setDescriptionHtml}
                error={!!error && isBlankRichText(descriptionHtml)}
              />
            </Box>
          )}

          {tab === 1 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                <TextField
                  label="Title (EN)"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  fullWidth
                  helperText="Traduction anglaise du titre (optionnel)"
                />
                <TranslateButton sourceText={title} onTranslated={setTitleEn} />
              </Box>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                <Box sx={{ flex: 1 }}>
                  <RichTextEditor
                    label="Description (EN)"
                    value={descriptionEn || "<p></p>"}
                    onChange={setDescriptionEn}
                  />
                </Box>
                <TranslateButton
                  sourceText={descriptionHtml}
                  onTranslated={setDescriptionEn}
                  html
                />
              </Box>
            </Box>
          )}

          <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              label="Icone"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              fullWidth
              helperText="Identifiant de l'icone (optionnel)"
            />
            <TextField
              label="Ordre"
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              required
              fullWidth
              slotProps={{ htmlInput: { min: 0 } }}
              helperText="Position d'affichage (0 = premier)"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  color="primary"
                />
              }
              label="Actif"
            />
          </Box>

          <Box
            sx={{ mt: 4, display: "flex", gap: 2, justifyContent: "flex-end" }}
          >
            <Button
              variant="outlined"
              onClick={() => router.push("/services")}
              disabled={pending}
            >
              Annuler
            </Button>
            <Button type="submit" variant="contained" disabled={pending}>
              {pending
                ? "Enregistrement..."
                : service
                  ? "Mettre a jour"
                  : "Creer"}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};
