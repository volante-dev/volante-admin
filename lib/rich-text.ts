const allowedTags = new Set([
  "p",
  "br",
  "strong",
  "em",
  "b",
  "i",
  "ul",
  "ol",
  "li",
  "a",
  "h3",
  "h4",
]);
const voidTags = new Set(["br"]);
const allowedProtocols = ["http:", "https:", "mailto:", "tel:"];

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const isSafeHref = (href: string) => {
  if (href.startsWith("/") || href.startsWith("#")) return true;

  try {
    return allowedProtocols.includes(new URL(href).protocol);
  } catch {
    return false;
  }
};

const renderAnchorAttributes = (attributes: string) => {
  const rendered: string[] = [];
  const attrPattern =
    /([a-zA-Z:-]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match: RegExpExecArray | null;
  let hasTargetBlank = false;

  while ((match = attrPattern.exec(attributes))) {
    const name = match[1].toLowerCase();
    const value = match[3] ?? match[4] ?? match[5] ?? "";

    if (name === "href" && isSafeHref(value)) {
      rendered.push(`href="${escapeHtml(value)}"`);
    }

    if (name === "title") {
      rendered.push(`title="${escapeHtml(value)}"`);
    }

    if (name === "target" && value === "_blank") {
      hasTargetBlank = true;
      rendered.push('target="_blank"');
    }
  }

  if (hasTargetBlank) rendered.push('rel="noopener noreferrer"');
  return rendered.length ? ` ${rendered.join(" ")}` : "";
};

export const sanitizeRichTextHtml = (html: string) => {
  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, "");
  const tagPattern = /<\/?\s*([a-zA-Z0-9]+)([^>]*)>/g;
  let sanitized = "";
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(withoutComments))) {
    sanitized += escapeHtml(withoutComments.slice(cursor, match.index));

    const rawTag = match[0];
    const tag = match[1].toLowerCase();
    const attributes = match[2] ?? "";
    const isClosing = /^<\s*\//.test(rawTag);

    if (allowedTags.has(tag)) {
      if (isClosing && !voidTags.has(tag)) {
        sanitized += `</${tag}>`;
      } else if (!isClosing) {
        const anchorAttributes =
          tag === "a" ? renderAnchorAttributes(attributes) : "";
        sanitized += voidTags.has(tag)
          ? `<${tag}>`
          : `<${tag}${anchorAttributes}>`;
      }
    }

    cursor = tagPattern.lastIndex;
  }

  sanitized += escapeHtml(withoutComments.slice(cursor));
  return sanitized;
};

export const hasUnsupportedRichTextHtml = (html: string) =>
  sanitizeRichTextHtml(html) !== html;

export const isBlankRichText = (html: string) =>
  sanitizeRichTextHtml(html)
    .replace(/<br>/g, "")
    .replace(/<\/?(p|strong|em|b|i|ul|ol|li|a|h3|h4)(?:\s[^>]*)?>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim().length === 0;
