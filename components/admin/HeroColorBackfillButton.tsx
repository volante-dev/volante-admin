"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import PaletteIcon from "@mui/icons-material/Palette";
import { toast } from "sonner";
import { recomputeProjectHeroPalettes } from "@/app/(admin)/projects/actions";

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
          const result = await recomputeProjectHeroPalettes();
          if (!result.success) {
            toast.error(result.error ?? "Extraction impossible.");
            return;
          }

          result.warnings?.forEach((message) => toast.info(message));
          router.refresh();
        });
      }}
    >
      {pending ? "Recalcul en cours..." : "Recalculer toutes les palettes"}
    </Button>
  );
};
