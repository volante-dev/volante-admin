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
import {
  createStudioValue,
  updateStudioValue,
} from "@/app/(admin)/studio-values/actions";
import { TranslateButton } from "@/components/admin/TranslateButton";
import type { StudioValueData } from "./studio-value-types";
import type { SiteLocaleData } from "@/lib/site-locales";
import { legacyDefaultLocale, legacySecondaryLocale } from "@/lib/admin-translations";

type LocalizedStudioValueFields = Record<
  string,
  {
    title: string;
    description: string;
  }
>;

const toLocalizedStudioValueFields = (
  studioValue: StudioValueData | undefined,
  locales: SiteLocaleData[],
): LocalizedStudioValueFields => {
  const byLocale = new Map(studioValue?.translations.map((item) => [item.locale, item]) ?? []);

  return Object.fromEntries(
    locales.map((locale) => {
      const translation = byLocale.get(locale.code);
      const isLegacyDefault = locale.code === legacyDefaultLocale;
      const isLegacySecondary = locale.code === legacySecondaryLocale;

      return [
        locale.code,
        {
          title:
            translation?.title ??
            (isLegacyDefault
              ? studioValue?.title ?? ""
              : isLegacySecondary
                ? studioValue?.titleEn ?? ""
                : ""),
          description:
            translation?.description ??
            (isLegacyDefault
              ? studioValue?.description ?? ""
              : isLegacySecondary
                ? studioValue?.descriptionEn ?? ""
                : ""),
        },
      ];
    }),
  );
};

export const StudioValueForm = ({
  studioValue,
  locales,
}: {
  studioValue?: StudioValueData;
  locales: SiteLocaleData[];
}) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const activeLocales = locales.length
    ? locales
    : [{ code: legacyDefaultLocale, label: "Français" } as SiteLocaleData];
  const defaultLocale = activeLocales.find((locale) => locale.isDefault)?.code ?? activeLocales[0].code;
  const [localizedFields, setLocalizedFields] = useState(() =>
    toLocalizedStudioValueFields(studioValue, activeLocales),
  );
  const [order, setOrder] = useState(String(studioValue?.order ?? 0));
  const [active, setActive] = useState(studioValue?.active ?? true);
  const defaultFields = localizedFields[defaultLocale];

  const updateLocalizedField =
    (locale: string, field: keyof LocalizedStudioValueFields[string]) =>
    (value: string) => {
      setLocalizedFields((current) => ({
        ...current,
        [locale]: { ...current[locale], [field]: value },
      }));
    };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!defaultFields?.title.trim() || defaultFields.title.trim().length < 2) {
      setError("Le titre doit contenir au moins 2 caracteres.");
      setTab(0);
      return;
    }
    if (
      !defaultFields?.description.trim() ||
      defaultFields.description.trim().length < 10
    ) {
      setError("La description doit contenir au moins 10 caracteres.");
      setTab(0);
      return;
    }

    const formData = new FormData();
    formData.set("translations", JSON.stringify(localizedFields));
    const legacyDefaultFields = localizedFields[legacyDefaultLocale] ?? defaultFields;
    const legacySecondaryFields =
      localizedFields[legacySecondaryLocale] ?? { title: "", description: "" };
    formData.set("title", legacyDefaultFields.title);
    formData.set("titleEn", legacySecondaryFields.title);
    formData.set("description", legacyDefaultFields.description);
    formData.set("descriptionEn", legacySecondaryFields.description);
    formData.set("order", order);
    formData.set("active", String(active));

    startTransition(async () => {
      const result = studioValue
        ? await updateStudioValue(studioValue.id, formData)
        : await createStudioValue(formData);

      if (result.success) {
        toast.success(
          studioValue ? "Valeur mise a jour." : "Valeur creee avec succes.",
        );
        router.push("/studio-values");
      } else {
        setError(result.error ?? "Une erreur est survenue.");
      }
    });
  };

  return (
    <Card>
      <CardContent>
        <Box component="form" onSubmit={handleSubmit}>
          {error && (
            <Typography variant="body2" color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
          >
            {activeLocales.map((locale) => (
              <Tab key={locale.code} label={locale.nativeLabel || locale.label} />
            ))}
          </Tabs>

          {activeLocales.map((locale, index) => {
            const localeFields = localizedFields[locale.code];
            const sourceFields = localizedFields[defaultLocale];
            const isDefaultLocale = locale.code === defaultLocale;

            return tab === index ? (
              <Box key={locale.code} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                  <TextField
                    label="Titre"
                    value={localeFields.title}
                    onChange={(event) =>
                      updateLocalizedField(locale.code, "title")(event.target.value)
                    }
                    required={isDefaultLocale}
                    fullWidth
                    helperText={
                      isDefaultLocale
                        ? undefined
                        : "Optionnel : la langue par defaut sera utilisee si ce champ est vide."
                    }
                  />
                  {!isDefaultLocale && (
                    <TranslateButton
                      sourceText={sourceFields.title}
                      onTranslated={updateLocalizedField(locale.code, "title")}
                    />
                  )}
                </Box>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                  <TextField
                    label="Description"
                    value={localeFields.description}
                    onChange={(event) =>
                      updateLocalizedField(locale.code, "description")(event.target.value)
                    }
                    required={isDefaultLocale}
                    multiline
                    rows={5}
                    fullWidth
                    helperText={
                      isDefaultLocale
                        ? undefined
                        : "Optionnel : la langue par defaut sera utilisee si ce champ est vide."
                    }
                  />
                  {!isDefaultLocale && (
                    <TranslateButton
                      sourceText={sourceFields.description}
                      onTranslated={updateLocalizedField(locale.code, "description")}
                    />
                  )}
                </Box>
              </Box>
            ) : null;
          })}

          <Box sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              label="Ordre"
              type="number"
              value={order}
              onChange={(event) => setOrder(event.target.value)}
              required
              fullWidth
              slotProps={{ htmlInput: { min: 0 } }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={active}
                  onChange={(event) => setActive(event.target.checked)}
                />
              }
              label="Actif"
            />
          </Box>

          <Box sx={{ mt: 4, display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={() => router.push("/studio-values")}
              disabled={pending}
            >
              Annuler
            </Button>
            <Button type="submit" variant="contained" disabled={pending}>
              {pending
                ? "Enregistrement..."
                : studioValue
                  ? "Mettre a jour"
                  : "Creer"}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
