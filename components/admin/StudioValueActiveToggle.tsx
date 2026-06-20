"use client";

import { useState, useTransition } from "react";
import Switch from "@mui/material/Switch";
import { toast } from "sonner";
import { toggleStudioValueActive } from "@/app/(admin)/studio-values/actions";

export const StudioValueActiveToggle = ({
  id,
  active: initialActive,
}: {
  id: string;
  active: boolean;
}) => {
  const [active, setActive] = useState(initialActive);
  const [pending, startTransition] = useTransition();

  const toggle = (nextActive: boolean) => {
    setActive(nextActive);
    startTransition(async () => {
      const result = await toggleStudioValueActive(id, nextActive);
      if (!result.success) {
        setActive(!nextActive);
        toast.error(result.error ?? "Impossible de modifier la valeur.");
      }
    });
  };

  return (
    <Switch
      checked={active}
      onChange={(_, checked) => toggle(checked)}
      disabled={pending}
      size="small"
    />
  );
};
