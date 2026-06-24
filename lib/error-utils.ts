export const describeUnknownError = (error: unknown) => {
  if (error instanceof Error) {
    return error.message || error.name || "Erreur inconnue";
  }
  if (typeof error === "string") {
    return error;
  }
  if (typeof error === "number" || typeof error === "boolean") {
    return String(error);
  }
  if (error && typeof error === "object") {
    const maybeMessage = "message" in error ? error.message : null;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
    }

    try {
      return JSON.stringify(error);
    } catch {
      return Object.prototype.toString.call(error);
    }
  }

  return "Erreur inconnue";
};

export const toError = (error: unknown, fallback: string) => {
  if (error instanceof Error) return error;
  const description = describeUnknownError(error);
  return new Error(description === "Erreur inconnue" ? fallback : description);
};
