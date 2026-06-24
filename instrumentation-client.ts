type ClientLogType =
  | "console-error"
  | "console-warn"
  | "hydration-debug"
  | "report-error"
  | "window-error"
  | "unhandled-rejection";

type ClientLogPayload = {
  type: ClientLogType;
  message: string;
  stack?: string;
  url: string;
  pathname: string;
  userAgent: string;
  timestamp: string;
  context?: Record<string, string>;
};

const clientLogEndpoint = "/api/client-log";
const duplicateWindowMs = 30_000;
const maxMessageLength = 6_000;
const maxStackLength = 8_000;
const sentAtByKey = new Map<string, number>();

const hydrationPatterns = [
  /hydration failed/i,
  /hydration/i,
  /hydrated but some attributes/i,
  /server rendered html/i,
  /didn't match/i,
  /did not match/i,
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

const shouldReportHydrationRelatedMessage = (message: string) =>
  hydrationPatterns.some((pattern) => pattern.test(message));

const getAttributesSnapshot = (element: Element) =>
  element
    .getAttributeNames()
    .sort()
    .map((name) => `${name}=${JSON.stringify(element.getAttribute(name))}`)
    .join(" ");

const getSuspiciousAttributes = (element: Element) =>
  element
    .getAttributeNames()
    .filter(
      (name) =>
        name.startsWith("data-") ||
        name.startsWith("cz-") ||
        name.includes("extension") ||
        name.includes("locator"),
    )
    .sort();

const reportRootDomSnapshot = () => {
  const htmlAttributes = getSuspiciousAttributes(document.documentElement);
  const bodyAttributes = getSuspiciousAttributes(document.body);
  if (htmlAttributes.length === 0 && bodyAttributes.length === 0) return;

  reportClientLog(
    buildPayload("hydration-debug", "Suspicious root DOM attributes before hydration", undefined, {
      htmlAttributes: getAttributesSnapshot(document.documentElement),
      bodyAttributes: getAttributesSnapshot(document.body),
      readyState: document.readyState,
    }),
  );
};

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
  context?: Record<string, string>,
): ClientLogPayload => ({
  type,
  message: truncate(message, maxMessageLength),
  stack: getStack(error),
  url: window.location.href,
  pathname: window.location.pathname,
  userAgent: navigator.userAgent,
  timestamp: new Date().toISOString(),
  context,
});

if (process.env.NODE_ENV === "production" && typeof window !== "undefined") {
  const browserWindow = window as Window & {
    reportError?: (error: unknown) => void;
  };
  const originalConsoleError = console.error.bind(console);
  const originalReportError =
    typeof browserWindow.reportError === "function"
      ? browserWindow.reportError.bind(browserWindow)
      : null;

  console.error = (...args: unknown[]) => {
    originalConsoleError(...args);

    const message = args.map(describeUnknown).join(" ");
    reportClientLog(buildPayload("console-error", message));
  };

  const originalConsoleWarn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    originalConsoleWarn(...args);

    const message = args.map(describeUnknown).join(" ");
    if (shouldReportHydrationRelatedMessage(message)) {
      reportClientLog(buildPayload("console-warn", message));
    }
  };

  if (originalReportError) {
    browserWindow.reportError = (error: unknown) => {
      reportClientLog(
        buildPayload("report-error", describeUnknown(error), error),
      );
      originalReportError(error);
    };
  }

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

  reportRootDomSnapshot();
}
