"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { AiTask } from "./ai";

export function useAiRequest() {
  const [loading, setLoading] = useState(false);

  const execute = useCallback(async (task: AiTask): Promise<string | null> => {
    setLoading(true);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });

      const data = await response.json();

      if (!data.success) {
        toast.error(data.error || "Erreur lors de la requete IA.");
        return null;
      }

      return data.output;
    } catch {
      toast.error("Impossible de contacter le service IA.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { execute, loading };
}
