"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import PaletteIcon from "@mui/icons-material/Palette";
import { toast } from "sonner";
import { recomputeMissingProjectHeroColors } from "@/app/(admin)/projects/actions";

export const HeroColorBackfillButton = () => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outlined"
      startIcon={<PaletteIcon />}
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await recomputeMissingProjectHeroColors();
          if (!result.success) {
            toast.error(result.error ?? "Extraction impossible.");
            return;
          }

          result.warnings?.forEach((message) => toast.info(message));
          router.refresh();
        });
      }}
    >
      {pending ? "Calcul en cours..." : "Calculer les couleurs manquantes"}
    </Button>
  );
};
