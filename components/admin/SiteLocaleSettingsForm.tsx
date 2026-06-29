"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Radio from "@mui/material/Radio";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import AddIcon from "@mui/icons-material/Add";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import SaveIcon from "@mui/icons-material/Save";
import { toast } from "sonner";
import { updateSiteLocales } from "@/app/(admin)/settings/languages/actions";
import type { SiteLocaleData } from "@/lib/site-locales";

type EditableLocale = SiteLocaleData & {
  key: string;
};

const candidateLocales = [
  { code: "es", label: "Espagnol", nativeLabel: "Español", hreflang: "es" },
  { code: "de", label: "Allemand", nativeLabel: "Deutsch", hreflang: "de" },
  { code: "it", label: "Italien", nativeLabel: "Italiano", hreflang: "it" },
  { code: "pt", label: "Portugais", nativeLabel: "Português", hreflang: "pt" },
  { code: "nl", label: "Neerlandais", nativeLabel: "Nederlands", hreflang: "nl" },
];

const localeCodePattern = /^[a-z]{2}(?:-[a-z0-9]{2,8})?$/;
const hreflangPattern = /^[a-z]{2}(?:-[A-Z]{2})?$/;

const toEditableLocale = (locale: SiteLocaleData): EditableLocale => ({
  ...locale,
  key: locale.code,
});

const toPayload = (locale: EditableLocale, order: number): SiteLocaleData => ({
  code: locale.code.trim().toLowerCase(),
  label: locale.label.trim(),
  nativeLabel: locale.nativeLabel.trim(),
  hreflang: locale.hreflang.trim(),
  isDefault: locale.isDefault,
  enabledInAdmin: locale.isDefault ? true : locale.enabledInAdmin,
  publishedOnFront: locale.isDefault ? true : locale.publishedOnFront,
  aiEnabled: locale.aiEnabled,
  order,
});

const validateLocales = (locales: SiteLocaleData[]) => {
  if (!locales.length) return "Au moins une langue est obligatoire.";
  if (locales.filter((locale) => locale.isDefault).length !== 1) {
    return "Une seule langue doit etre definie comme langue par defaut.";
  }

  const codes = locales.map((locale) => locale.code);
  if (new Set(codes).size !== codes.length) {
    return "Chaque code langue doit etre unique.";
  }

  for (const locale of locales) {
    if (!localeCodePattern.test(locale.code)) {
      return "Les codes langue doivent suivre le format ISO court.";
    }
    if (!locale.label || !locale.nativeLabel) {
      return "Les intitules des langues sont obligatoires.";
    }
    if (!hreflangPattern.test(locale.hreflang)) {
      return "Le hreflang doit suivre un format comme fr-FR, en ou de-DE.";
    }
  }

  return null;
};

export const SiteLocaleSettingsForm = ({
  initialLocales,
}: {
  initialLocales: SiteLocaleData[];
}) => {
  const [pending, startTransition] = useTransition();
  const [locales, setLocales] = useState<EditableLocale[]>(
    initialLocales.map(toEditableLocale),
  );
  const [error, setError] = useState<string | null>(null);

  const activeAdminCount = useMemo(
    () => locales.filter((locale) => locale.enabledInAdmin).length,
    [locales],
  );
  const publishedCount = useMemo(
    () => locales.filter((locale) => locale.publishedOnFront).length,
    [locales],
  );

  const updateLocale = (key: string, patch: Partial<EditableLocale>) => {
    setLocales((current) =>
      current.map((locale) =>
        locale.key === key ? { ...locale, ...patch } : locale,
      ),
    );
  };

  const setDefaultLocale = (key: string) => {
    setLocales((current) =>
      current.map((locale) => ({
        ...locale,
        isDefault: locale.key === key,
        enabledInAdmin:
          locale.key === key ? true : locale.enabledInAdmin,
        publishedOnFront:
          locale.key === key ? true : locale.publishedOnFront,
      })),
    );
  };

  const moveLocale = (index: number, direction: -1 | 1) => {
    setLocales((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  };

  const addLocale = () => {
    const usedCodes = new Set(locales.map((locale) => locale.code));
    const candidate =
      candidateLocales.find((locale) => !usedCodes.has(locale.code)) ??
      candidateLocales[0];

    setLocales((current) => [
      ...current,
      {
        ...candidate,
        key: `new-${Date.now()}`,
        isDefault: false,
        enabledInAdmin: true,
        publishedOnFront: false,
        aiEnabled: true,
        order: current.length,
      },
    ]);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const payload = locales.map(toPayload);
    const clientError = validateLocales(payload);
    setError(clientError);
    if (clientError) return;

    const formData = new FormData();
    formData.set("locales", JSON.stringify(payload));

    startTransition(async () => {
      const result = await updateSiteLocales(formData);
      if (result.success) {
        toast.success("Langues mises a jour.");
      } else {
        setError(result.error ?? "Une erreur est survenue.");
      }
    });
  };

  return (
    <Card>
      <CardContent>
        <Box
          component="form"
          onSubmit={submit}
          sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
        >
          {error && <Alert severity="error">{error}</Alert>}

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip size="small" label={`${locales.length} langues`} />
            <Chip size="small" label={`${activeAdminCount} actives en admin`} />
            <Chip size="small" label={`${publishedCount} publiees front`} />
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {locales.map((locale, index) => {
              const isDefault = locale.isDefault;

              return (
                <Card key={locale.key} variant="outlined">
                  <CardContent>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          md: "auto minmax(84px, 0.4fr) repeat(3, minmax(0, 1fr))",
                        },
                        gap: 2,
                        alignItems: "center",
                      }}
                    >
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <Tooltip title="Monter">
                          <span>
                            <IconButton
                              size="small"
                              disabled={index === 0}
                              onClick={() => moveLocale(index, -1)}
                            >
                              <ArrowUpwardIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Descendre">
                          <span>
                            <IconButton
                              size="small"
                              disabled={index === locales.length - 1}
                              onClick={() => moveLocale(index, 1)}
                            >
                              <ArrowDownwardIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>

                      <TextField
                        label="Code"
                        value={locale.code}
                        required
                        inputProps={{ autoCapitalize: "none" }}
                        error={
                          Boolean(locale.code) &&
                          !localeCodePattern.test(locale.code.trim().toLowerCase())
                        }
                        helperText="fr, en, es"
                        onChange={(event) =>
                          updateLocale(locale.key, { code: event.target.value })
                        }
                      />
                      <TextField
                        label="Intitule admin"
                        value={locale.label}
                        required
                        onChange={(event) =>
                          updateLocale(locale.key, { label: event.target.value })
                        }
                      />
                      <TextField
                        label="Nom natif"
                        value={locale.nativeLabel}
                        required
                        onChange={(event) =>
                          updateLocale(locale.key, {
                            nativeLabel: event.target.value,
                          })
                        }
                      />
                      <TextField
                        label="hreflang"
                        value={locale.hreflang}
                        required
                        error={
                          Boolean(locale.hreflang) &&
                          !hreflangPattern.test(locale.hreflang.trim())
                        }
                        helperText="fr-FR, en"
                        onChange={(event) =>
                          updateLocale(locale.key, { hreflang: event.target.value })
                        }
                      />
                    </Box>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          md: "repeat(4, minmax(0, 1fr))",
                        },
                        gap: 2,
                        mt: 2,
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Radio
                            checked={isDefault}
                            onChange={() => setDefaultLocale(locale.key)}
                          />
                        }
                        label="Langue par defaut"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={locale.enabledInAdmin}
                            disabled={isDefault}
                            onChange={(event) =>
                              updateLocale(locale.key, {
                                enabledInAdmin: event.target.checked,
                              })
                            }
                          />
                        }
                        label="Champs admin"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={locale.publishedOnFront}
                            disabled={isDefault}
                            onChange={(event) =>
                              updateLocale(locale.key, {
                                publishedOnFront: event.target.checked,
                              })
                            }
                          />
                        }
                        label="Publiee front"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={locale.aiEnabled}
                            onChange={(event) =>
                              updateLocale(locale.key, {
                                aiEnabled: event.target.checked,
                              })
                            }
                          />
                        }
                        label="Traduction IA"
                      />
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>

          <Alert severity="info">
            Desactiver une langue masque ses champs ou sa publication, mais ne supprime
            aucune traduction existante.
          </Alert>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Button startIcon={<AddIcon />} onClick={addLocale}>
              Ajouter une langue
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={pending}
            >
              Enregistrer
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
