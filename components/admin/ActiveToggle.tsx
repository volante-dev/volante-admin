"use client";

import { useOptimistic, useTransition } from "react";
import Switch from "@mui/material/Switch";
import { toast } from "sonner";
import { toggleServiceActive } from "@/app/(admin)/services/actions";

type ActiveToggleProps = {
  id: string;
  active: boolean;
};

export const ActiveToggle = ({ id, active }: ActiveToggleProps) => {
  const [optimisticActive, setOptimisticActive] = useOptimistic(active);
  const [, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      setOptimisticActive(!optimisticActive);
      const result = await toggleServiceActive(id, !active);
      if (!result.success) {
        toast.error(result.error ?? "Erreur lors de la mise a jour.");
      }
    });
  };

  return (
    <Switch
      checked={optimisticActive}
      onChange={handleToggle}
      size="small"
      color="primary"
    />
  );
};
