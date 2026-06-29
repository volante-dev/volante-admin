"use client";

import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import TranslateIcon from "@mui/icons-material/Translate";
import { useAiRequest } from "@/lib/use-ai-request";
import {
  legacyDefaultLocale,
  legacySecondaryLocale,
} from "@/lib/admin-translations";

type TranslateButtonProps = {
  sourceText: string;
  onTranslated: (text: string) => void;
  html?: boolean;
  disabled?: boolean;
};

export const TranslateButton = ({
  sourceText,
  onTranslated,
  html = false,
  disabled = false,
}: TranslateButtonProps) => {
  const { execute, loading } = useAiRequest();

  const isEmpty = !sourceText?.trim();

  const handleClick = async () => {
    const result = await execute({
      task: "translate",
      text: sourceText,
      from: legacyDefaultLocale,
      to: legacySecondaryLocale,
      format: html ? "html" : "plain",
    });

    if (typeof result === "string") {
      onTranslated(result);
    }
  };

  return (
    <Tooltip
      title={isEmpty ? "Renseignez le champ francais d'abord" : "Traduire depuis le francais"}
    >
      <span>
        <IconButton
          size="small"
          onClick={handleClick}
          disabled={disabled || isEmpty || loading}
          sx={{ mt: 1 }}
        >
          {loading ? (
            <CircularProgress size={20} />
          ) : (
            <TranslateIcon fontSize="small" />
          )}
        </IconButton>
      </span>
    </Tooltip>
  );
};
