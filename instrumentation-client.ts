type ClientLogType = "console-error" | "window-error" | "unhandled-rejection";

type ClientLogPayload = {
  type: ClientLogType;
  message: string;
  stack?: string;
  url: string;
  pathname: string;
  userAgent: string;
  timestamp: string;
};

const clientLogEndpoint = "/api/client-log";
const duplicateWindowMs = 30_000;
const maxMessageLength = 6_000;
const maxStackLength = 8_000;
const sentAtByKey = new Map<string, number>();

const hydrationPatterns = [
  /hydration failed/i,
  /hydrated but some attributes/i,
  /server rendered html/i,
  /didn't match/i,
  /react\.dev\/link\/hydration-mismatch/i,
];

const truncate = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength)}...[truncated]` : value;

const describeUnknown = (value: unknown) => {
  if (value instanceof Error) return value.message || value.name;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object") {
    const maybeMessage = "message" in value ? value.message : null;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;

    try {
      return JSON.stringify(value);
    } catch {
      return Object.prototype.toString.call(value);
    }
  }

  return "Unknown client error";
};

const getStack = (value: unknown) =>
  value instanceof Error && value.stack
    ? truncate(value.stack, maxStackLength)
    : undefined;

const shouldReportConsoleError = (message: string) =>
  hydrationPatterns.some((pattern) => pattern.test(message));

const reportClientLog = (payload: ClientLogPayload) => {
  const now = Date.now();
  const key = `${payload.type}:${payload.pathname}:${payload.message}`;
  const previous = sentAtByKey.get(key);
  if (previous && now - previous < duplicateWindowMs) return;
  sentAtByKey.set(key, now);

  const body = JSON.stringify(payload);
  const blob = new Blob([body], { type: "application/json" });

  if (navigator.sendBeacon?.(clientLogEndpoint, blob)) return;

  void fetch(clientLogEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
};

const buildPayload = (
  type: ClientLogType,
  message: string,
  error?: unknown,
): ClientLogPayload => ({
  type,
  message: truncate(message, maxMessageLength),
  stack: getStack(error),
  url: window.location.href,
  pathname: window.location.pathname,
  userAgent: navigator.userAgent,
  timestamp: new Date().toISOString(),
});

if (process.env.NODE_ENV === "production" && typeof window !== "undefined") {
  const originalConsoleError = console.error.bind(console);

  console.error = (...args: unknown[]) => {
    originalConsoleError(...args);

    const message = args.map(describeUnknown).join(" ");
    if (shouldReportConsoleError(message)) {
      reportClientLog(buildPayload("console-error", message));
    }
  };

  window.addEventListener("error", (event) => {
    reportClientLog(
      buildPayload(
        "window-error",
        event.message || "Unhandled client error",
        event.error,
      ),
    );
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    reportClientLog(
      buildPayload(
        "unhandled-rejection",
        describeUnknown(reason),
        reason,
      ),
    );
  });
}
