import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const maxMessageLength = 6_000;
const maxStackLength = 8_000;
const maxUrlLength = 2_000;
const maxUserAgentLength = 600;
const maxBodyBytes = 20_000;

const allowedTypes = new Set([
  "console-error",
  "window-error",
  "unhandled-rejection",
]);

const truncate = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength)}...[truncated]` : value;

const readString = (
  source: Record<string, unknown>,
  key: string,
  maxLength: number,
) => {
  const value = source[key];
  return typeof value === "string" ? truncate(value, maxLength) : undefined;
};

export const POST = async (request: Request) => {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > maxBodyBytes) {
      return NextResponse.json({ ok: false }, { status: 413 });
    }

    const body = await request.text();
    if (body.length > maxBodyBytes) {
      return NextResponse.json({ ok: false }, { status: 413 });
    }

    const rawPayload = JSON.parse(body) as unknown;
    if (!rawPayload || typeof rawPayload !== "object") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const source = rawPayload as Record<string, unknown>;
    const type = readString(source, "type", 80);
    const message = readString(source, "message", maxMessageLength);
    if (!type || !allowedTypes.has(type) || !message) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const logPayload = {
      type,
      message,
      stack: readString(source, "stack", maxStackLength),
      url: readString(source, "url", maxUrlLength),
      pathname: readString(source, "pathname", maxUrlLength),
      userAgent: readString(source, "userAgent", maxUserAgentLength),
      timestamp: readString(source, "timestamp", 80),
      receivedAt: new Date().toISOString(),
    };

    console.error("[client-log]", JSON.stringify(logPayload));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[client-log] invalid payload", error);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
};
