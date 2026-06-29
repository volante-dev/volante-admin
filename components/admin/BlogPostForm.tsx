"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import SaveIcon from "@mui/icons-material/Save";
import UnpublishedIcon from "@mui/icons-material/Unpublished";
import PublishIcon from "@mui/icons-material/Publish";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { toast } from "sonner";
import {
  createBlogPost,
  updateBlogPost,
} from "@/app/(admin)/trailblaze/actions";
import { nowAdminDatetimeLocal, toAdminDatetimeLocal } from "@/lib/admin-date";
import {
  defaultSiteLocaleCode,
} from "@/lib/admin-translations";
import { hasUnsupportedRichTextHtml, isBlankRichText } from "@/lib/rich-text";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { MediaUrlField } from "./MediaUrlField";
import { RichTextEditor } from "./RichTextEditor";
import { TranslateButton } from "./TranslateButton";
import { useAiRequest } from "@/lib/use-ai-request";
import type { SiteLocaleData } from "@/lib/site-locales";
import type { BlogSeoDescriptionOutput, BlogTagsOutput } from "@/lib/ai";
import type { MediaAssetType, MediaSelection } from "./media/media-types";
import type {
  AdminBlogPostDetail,
  BlogPostBlockType,
} from "./blog-types";

type EditableBlock = {
  key: string;
  id?: string;
  type: BlogPostBlockType;
  contentHtml: string;
  translations: Record<string, { contentHtml: string }>;
  mediaUrl: string;
  mediaAssetId: string;
  mediaAssetPosterUrl: string;
};

type BlogPostFormProps = {
  post?: AdminBlogPostDetail;
  locales: SiteLocaleData[];
};

type LocalizedBlogPostFields = Record<
  string,
  {
    eyebrow: string;
    title: string;
    slug: string;
    seoDescription: string;
    tags: string;
  }
>;

const newKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

const emptyBlock = (type: BlogPostBlockType): EditableBlock => ({
  key: newKey(),
  type,
  contentHtml: "<p></p>",
  translations: {},
  mediaUrl: "",
  mediaAssetId: "",
  mediaAssetPosterUrl: "",
});

const stripHtml = (value: string) =>
  value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();

const tagsToText = (tags: string[]) => tags.join(", ");
const seoDescriptionMaxLength = 240;

const parseTagText = (value: string) => {
  const seen = new Set<string>();
  return value
    .split(/[\n,]/)
    .map((tag) => tag.replace(/^#+/, "").trim())
    .filter((tag) => tag.length >= 2)
    .filter((tag) => {
      const key = tag.toLocaleLowerCase("fr-FR");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const inferMediaTypeFromUrl = (value: string): MediaAssetType =>
  /\.(mp4|mov|webm)(?:[?#].*)?$/i.test(value) ? "VIDEO" : "IMAGE";

const extraAdminLocales = (locales: SiteLocaleData[]) =>
  locales.filter((locale) => locale.code !== defaultSiteLocaleCode);

const emptyLocalizedBlogPostFields = () => ({
  eyebrow: "",
  title: "",
  slug: "",
  seoDescription: "",
  tags: "",
});

const toLocalizedBlogPostFields = (
  post: AdminBlogPostDetail | undefined,
  locales: SiteLocaleData[],
): LocalizedBlogPostFields => {
  const byLocale = new Map(post?.translations.map((item) => [item.locale, item]) ?? []);

  return Object.fromEntries(
    extraAdminLocales(locales).map((locale) => {
      const translation = byLocale.get(locale.code);
      return [
        locale.code,
        {
          eyebrow: translation?.eyebrow ?? "",
          title: translation?.title ?? "",
          slug: translation?.slug ?? "",
          seoDescription: translation?.seoDescription ?? "",
          tags: tagsToText(translation?.tags ?? []),
        },
      ];
    }),
  );
};

const toBlockTranslations = (
  block: AdminBlogPostDetail["blocks"][number] | undefined,
  locales: SiteLocaleData[],
): EditableBlock["translations"] => {
  const byLocale = new Map(block?.translations.map((item) => [item.locale, item]) ?? []);

  return Object.fromEntries(
    extraAdminLocales(locales).map((locale) => {
      const translation = byLocale.get(locale.code);
      return [locale.code, { contentHtml: translation?.contentHtml ?? "" }];
    }),
  );
};

const isIncompleteBlock = (block: EditableBlock) => {
  if (block.type === "RICHTEXT") return isBlankRichText(block.contentHtml);
  return !block.mediaUrl.trim();
};

const blockLabel = (type: BlogPostBlockType) => {
  if (type === "RICHTEXT") return "Rich text";
  if (type === "VIDEO") return "Video";
  return "Image";
};

const BlockSummary = ({
  block,
  index,
}: {
  block: EditableBlock;
  index: number;
}) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
    <Typography variant="body1" sx={{ fontWeight: 500 }}>
      {index + 1}.
    </Typography>
    <Chip size="small" label={blockLabel(block.type)} variant="outlined" />
    {block.type === "RICHTEXT" ? (
      <Typography variant="body1" noWrap>
        {stripHtml(block.contentHtml) || "Bloc texte vide"}
      </Typography>
    ) : (
      <Typography variant="body1" noWrap>
        {block.mediaUrl || "Media non renseigne"}
      </Typography>
    )}
    {isIncompleteBlock(block) && (
      <Chip size="small" label="Incomplet" color="warning" />
    )}
  </Box>
);

const SortableBlogBlock = ({
  block,
  index,
  postId,
  extraLocales,
  onChange,
  onDuplicate,
  onDelete,
}: {
  block: EditableBlock;
  index: number;
  postId?: string;
  extraLocales: SiteLocaleData[];
  onChange: (block: EditableBlock) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) => {
  const [tab, setTab] = useState(0);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.key });

  const update = (patch: Partial<EditableBlock>) =>
    onChange({ ...block, ...patch });

  const updateTranslation = (locale: string, contentHtml: string) => {
    onChange({
      ...block,
      translations: {
        ...block.translations,
        [locale]: { contentHtml },
      },
    });
  };

  const selectLibraryMedia = (asset: MediaSelection | null) => {
    if (!asset) return;
    update({
      mediaUrl: asset.url,
      mediaAssetId: asset.id,
      mediaAssetPosterUrl: asset.posterUrl ?? "",
    });
  };

  const unsupportedHtml =
    block.type === "RICHTEXT" &&
    hasUnsupportedRichTextHtml(block.contentHtml);

  return (
    <Accordion
      ref={setNodeRef}
      defaultExpanded={index === 0}
      sx={{
        opacity: isDragging ? 0.75 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            <Tooltip title="Glisser pour reordonner">
              <IconButton
                size="small"
                {...attributes}
                {...listeners}
                onClick={(event) => event.stopPropagation()}
              >
                <DragIndicatorIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <BlockSummary block={block} index={index} />
          </Box>
          <Box sx={{ display: "flex", gap: 0.5, mr: 1 }}>
            <Tooltip title="Dupliquer">
              <IconButton
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  onDuplicate();
                }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Supprimer">
              <IconButton
                size="small"
                color="error"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete();
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {unsupportedHtml && (
            <Alert severity="warning">
              Ce bloc contient du HTML non supporte. Il sera nettoye a
              l&apos;enregistrement.
            </Alert>
          )}

          <ToggleButtonGroup
            value={block.type}
            exclusive
            onChange={(_, value) => {
              if (!value) return;
              update({
                type: value,
                contentHtml: value === "RICHTEXT" ? block.contentHtml : "<p></p>",
                mediaUrl: value === "RICHTEXT" ? "" : block.mediaUrl,
                mediaAssetId: value === "RICHTEXT" ? "" : block.mediaAssetId,
                mediaAssetPosterUrl:
                  value === "RICHTEXT" ? "" : block.mediaAssetPosterUrl,
              });
            }}
            size="small"
          >
            <ToggleButton value="RICHTEXT">Rich text</ToggleButton>
            <ToggleButton value="IMAGE">Image</ToggleButton>
            <ToggleButton value="VIDEO">Video</ToggleButton>
          </ToggleButtonGroup>

          {block.type === "RICHTEXT" ? (
            <>
              <Tabs
                value={tab}
                onChange={(_, value) => setTab(value)}
                sx={{ borderBottom: 1, borderColor: "divider" }}
              >
                <Tab label="Francais" />
                {extraLocales.map((locale) => (
                  <Tab key={locale.code} label={locale.nativeLabel || locale.label} />
                ))}
                <Tab label="Preview" />
              </Tabs>
              {tab === 0 && (
                <RichTextEditor
                  label="Contenu"
                  value={block.contentHtml}
                  onChange={(value) => update({ contentHtml: value })}
                  error={isBlankRichText(block.contentHtml)}
                />
              )}
              {extraLocales.map((locale, localeIndex) => {
                const tabIndex = 1 + localeIndex;
                const translation = block.translations[locale.code] ?? {
                  contentHtml: "",
                };

                return tab === tabIndex ? (
                  <Box key={locale.code} sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                    <Box sx={{ flex: 1 }}>
                      <RichTextEditor
                        label="Contenu"
                        value={translation.contentHtml || "<p></p>"}
                        onChange={(value) => updateTranslation(locale.code, value)}
                      />
                    </Box>
                    <TranslateButton
                      sourceText={block.contentHtml}
                      targetLocale={locale.code}
                      onTranslated={(text) => updateTranslation(locale.code, text)}
                      html
                    />
                  </Box>
                ) : null;
              })}
              {tab === 1 + extraLocales.length && (
                <Box
                  sx={{
                    "& p": { typography: "body1" },
                    "& h3": { typography: "h3" },
                    "& h4": { typography: "h4" },
                    "& ul": { listStyleType: "disc", pl: 3 },
                    "& ol": { listStyleType: "decimal", pl: 3 },
                    "& li": { display: "list-item" },
                  }}
                  dangerouslySetInnerHTML={{ __html: block.contentHtml }}
                />
              )}
            </>
          ) : (
            <MediaUrlField
              label="URL media"
              value={block.mediaUrl}
              onChange={(value) => update({ mediaUrl: value })}
              assetId={block.mediaAssetId}
              onAssetChange={(assetId) => update({ mediaAssetId: assetId ?? "" })}
              required
              accept={
                block.type === "VIDEO"
                  ? "video/mp4,video/quicktime,.mov"
                  : "image/jpeg,image/png,image/webp,image/avif"
              }
              projectId={postId}
              field={`trailblaze-block-${index + 1}`}
              libraryType={block.type}
              previewType={block.type}
              onAssetSelect={selectLibraryMedia}
            />
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export const BlogPostForm = ({ post, locales }: BlogPostFormProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { execute: executeTagsAi, loading: generatingTags } = useAiRequest();
  const {
    execute: executeSeoDescriptionAi,
    loading: generatingSeoDescription,
  } = useAiRequest();
  const [tab, setTab] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EditableBlock | null>(null);

  const [title, setTitle] = useState(post?.title ?? "");
  const [eyebrow, setEyebrow] = useState(post?.eyebrow ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [seoDescription, setSeoDescription] = useState(
    post?.seoDescription ?? "",
  );
  const extraLocales = extraAdminLocales(locales);
  const [localizedPostFields, setLocalizedPostFields] = useState(() =>
    toLocalizedBlogPostFields(post, locales),
  );
  const [coverMediaUrl, setCoverMediaUrl] = useState(post?.coverMediaUrl ?? "");
  const [coverMediaAssetId, setCoverMediaAssetId] = useState(
    post?.coverMediaAssetId ?? "",
  );
  const [coverMediaType, setCoverMediaType] = useState<MediaAssetType>(
    post?.coverMediaAssetType ??
      inferMediaTypeFromUrl(post?.coverMediaUrl ?? ""),
  );
  const [publishedAt, setPublishedAt] = useState(
    toAdminDatetimeLocal(post?.publishedAt ?? null),
  );
  const [tags, setTags] = useState(tagsToText(post?.tags ?? []));
  const [blocks, setBlocks] = useState<EditableBlock[]>(
    post?.blocks.map((block) => ({
      key: block.id,
      id: block.id,
      type: block.type,
      contentHtml: block.contentHtml ?? "<p></p>",
      translations: toBlockTranslations(block, locales),
      mediaUrl: block.mediaUrl ?? "",
      mediaAssetId: block.mediaAssetId ?? "",
      mediaAssetPosterUrl: block.mediaAssetPosterUrl ?? "",
    })) ?? [],
  );

  const updateLocalizedPostField =
    (locale: string, field: keyof LocalizedBlogPostFields[string]) =>
    (value: string) => {
      setLocalizedPostFields((current) => ({
        ...current,
        [locale]: {
          ...(current[locale] ?? emptyLocalizedBlogPostFields()),
          [field]: value,
        },
      }));
    };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const incompleteBlocks = useMemo(
    () => blocks.filter(isIncompleteBlock).length,
    [blocks],
  );

  const updateCoverUrl = (value: string) => {
    setCoverMediaUrl(value);
    setCoverMediaType(inferMediaTypeFromUrl(value));
  };

  const selectCoverMedia = (asset: MediaSelection | null) => {
    if (!asset) return;
    setCoverMediaType(asset.mediaType);
  };

  const updateBlock = (key: string, next: EditableBlock) => {
    setBlocks((current) =>
      current.map((block) => (block.key === key ? next : block)),
    );
  };

  const addBlock = (type: BlogPostBlockType) => {
    setBlocks((current) => [...current, emptyBlock(type)]);
  };

  const duplicateBlock = (key: string) => {
    setBlocks((current) => {
      const index = current.findIndex((block) => block.key === key);
      if (index === -1) return current;
      const copy = { ...current[index], key: newKey(), id: undefined };
      return [
        ...current.slice(0, index + 1),
        copy,
        ...current.slice(index + 1),
      ];
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setBlocks((current) => {
      const oldIndex = current.findIndex((block) => block.key === active.id);
      const newIndex = current.findIndex((block) => block.key === over.id);
      return arrayMove(current, oldIndex, newIndex);
    });
  };

  const collectRichTextContent = () =>
    blocks
      .filter((block) => block.type === "RICHTEXT")
      .map((block) => stripHtml(block.contentHtml))
      .filter(Boolean)
      .join("\n\n");

  const generateTags = async () => {
    const content = collectRichTextContent();
    if (!title.trim() || !eyebrow.trim() || !content.trim()) {
      setError("Renseignez au moins le titre, l'eyebrow et un bloc rich text francais.");
      return;
    }

    const result = await executeTagsAi({
      task: "generate-blog-tags",
      title,
      eyebrow,
      slug,
      content,
    });

    if (result && typeof result === "object" && "tags" in result) {
      const output = result as BlogTagsOutput;
      setTags(tagsToText(output.tags));
      toast.success("Tags SEO generes.");
    }
  };

  const generateSeoDescription = async () => {
    const content = collectRichTextContent();
    if (!title.trim() || !eyebrow.trim() || !content.trim()) {
      setError("Renseignez au moins le titre, l'eyebrow et un bloc rich text francais.");
      return;
    }

    const result = await executeSeoDescriptionAi({
      task: "generate-blog-seo-description",
      title,
      eyebrow,
      slug,
      content,
    });

    if (
      result &&
      typeof result === "object" &&
      "seoDescription" in result
    ) {
      const output = result as BlogSeoDescriptionOutput;
      setSeoDescription(output.seoDescription);
      toast.success("Descriptions SEO generees.");
    }
  };

  const validateClient = () => {
    if (!title.trim()) return "Le titre est obligatoire.";
    if (!eyebrow.trim()) return "L'eyebrow est obligatoire.";
    if (!slug.trim()) return "Le slug francais est obligatoire.";
    if (seoDescription.trim().length > seoDescriptionMaxLength) {
      return `La description SEO francaise doit faire ${seoDescriptionMaxLength} caracteres maximum.`;
    }
    if (!coverMediaUrl.trim()) return "Le media de couverture est obligatoire.";
    if (blocks.some(isIncompleteBlock)) {
      return "Un ou plusieurs blocs sont incomplets.";
    }
    return null;
  };

  const submit = (nextPublishedAt = publishedAt) => {
    setError(null);
    const clientError = validateClient();
    if (clientError) {
      setError(clientError);
      return;
    }

    const formData = new FormData();
    formData.set("title", title);
    formData.set("eyebrow", eyebrow);
    formData.set("slug", slug);
    formData.set("seoDescription", seoDescription);
    formData.set(
      "translations",
      JSON.stringify({
        [defaultSiteLocaleCode]: {
          title,
          eyebrow,
          slug,
          seoDescription,
          tags,
        },
        ...localizedPostFields,
      }),
    );
    formData.set("coverMediaUrl", coverMediaUrl);
    formData.set("coverMediaAssetId", coverMediaAssetId);
    formData.set("tags", JSON.stringify(parseTagText(tags)));
    formData.set("publishedAt", nextPublishedAt);
    formData.set(
      "blocks",
      JSON.stringify(
        blocks.map((block) => ({
          id: block.id,
          type: block.type,
          contentHtml: block.contentHtml,
          translations: {
            [defaultSiteLocaleCode]: { contentHtml: block.contentHtml },
            ...block.translations,
          },
          mediaUrl: block.mediaUrl,
          mediaAssetId: block.mediaAssetId,
        })),
      ),
    );

    startTransition(async () => {
      const result = post
        ? await updateBlogPost(post.id, formData)
        : await createBlogPost(formData);

      if (result.success) {
        toast.success(post ? "Article mis a jour." : "Article cree.");
        result.warnings?.forEach((warning) => toast.warning(warning));
        if (!post && result.id) {
          router.push(`/trailblaze/${result.id}/edit`);
        } else {
          router.refresh();
        }
      } else {
        setError(result.error ?? "Une erreur est survenue.");
      }
    });
  };

  const confirmDeleteBlock = async () => {
    if (!deleteTarget) return;
    setBlocks((current) =>
      current.filter((block) => block.key !== deleteTarget.key),
    );
    setDeleteTarget(null);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {error && <Alert severity="error">{error}</Alert>}
      {publishedAt && blocks.length === 0 && (
        <Alert severity="warning">Article publie sans bloc de contenu.</Alert>
      )}

      <Card>
        <CardContent>
          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="Francais" />
            {extraLocales.map((locale) => (
              <Tab key={locale.code} label={locale.nativeLabel || locale.label} />
            ))}
            <Tab label="Couverture" />
            <Tab label="Contenu" />
            <Tab label="Parametres" />
          </Tabs>

          {tab === 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <TextField
                label="Eyebrow"
                value={eyebrow}
                required
                fullWidth
                onChange={(event) => setEyebrow(event.target.value)}
              />
              <TextField
                label="Titre"
                value={title}
                required
                fullWidth
                onChange={(event) => setTitle(event.target.value)}
              />
              <TextField
                label="Slug francais"
                value={slug}
                required
                fullWidth
                helperText="Minuscules, chiffres et tirets uniquement."
                onChange={(event) => setSlug(event.target.value)}
              />
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                <TextField
                  label="Description SEO"
                  value={seoDescription}
                  fullWidth
                  multiline
                  minRows={3}
                  helperText={`${seoDescription.trim().length}/${seoDescriptionMaxLength} caracteres. Utilisee pour Google, les partages sociaux et la donnee structuree.`}
                  error={seoDescription.trim().length > seoDescriptionMaxLength}
                  onChange={(event) => setSeoDescription(event.target.value)}
                />
                <Tooltip title="Generer une description SEO FR/EN">
                  <span>
                    <IconButton
                      onClick={generateSeoDescription}
                      disabled={generatingSeoDescription}
                      sx={{ mt: 1 }}
                    >
                      <AutoAwesomeIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </Box>
          )}

          {extraLocales.map((locale, localeIndex) => {
            const tabIndex = 1 + localeIndex;
            const fields =
              localizedPostFields[locale.code] ?? emptyLocalizedBlogPostFields();

            return tab === tabIndex ? (
              <Box key={locale.code} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                  <TextField
                    label="Eyebrow"
                    value={fields.eyebrow}
                    fullWidth
                    onChange={(event) =>
                      updateLocalizedPostField(locale.code, "eyebrow")(
                        event.target.value,
                      )
                    }
                  />
                  <TranslateButton
                    sourceText={eyebrow}
                    targetLocale={locale.code}
                    onTranslated={updateLocalizedPostField(locale.code, "eyebrow")}
                  />
                </Box>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                  <TextField
                    label="Titre"
                    value={fields.title}
                    fullWidth
                    onChange={(event) =>
                      updateLocalizedPostField(locale.code, "title")(
                        event.target.value,
                      )
                    }
                  />
                  <TranslateButton
                    sourceText={title}
                    targetLocale={locale.code}
                    onTranslated={updateLocalizedPostField(locale.code, "title")}
                  />
                </Box>
                <TextField
                  label="Slug"
                  value={fields.slug}
                  fullWidth
                  helperText="Minuscules, chiffres et tirets uniquement."
                  onChange={(event) =>
                    updateLocalizedPostField(locale.code, "slug")(
                      event.target.value,
                    )
                  }
                />
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                  <TextField
                    label="Description SEO"
                    value={fields.seoDescription}
                    fullWidth
                    multiline
                    minRows={3}
                    helperText={`${fields.seoDescription.trim().length}/${seoDescriptionMaxLength} caracteres.`}
                    error={fields.seoDescription.trim().length > seoDescriptionMaxLength}
                    onChange={(event) =>
                      updateLocalizedPostField(locale.code, "seoDescription")(
                        event.target.value,
                      )
                    }
                  />
                  <TranslateButton
                    sourceText={seoDescription}
                    targetLocale={locale.code}
                    onTranslated={updateLocalizedPostField(
                      locale.code,
                      "seoDescription",
                    )}
                  />
                </Box>
                <TextField
                  label="Tags SEO"
                  value={fields.tags}
                  fullWidth
                  multiline
                  minRows={3}
                  helperText="Separez les tags par des virgules ou des retours a la ligne."
                  onChange={(event) =>
                    updateLocalizedPostField(locale.code, "tags")(
                      event.target.value,
                    )
                  }
                />
              </Box>
            ) : null;
          })}

          {tab === 1 + extraLocales.length && (
            <MediaUrlField
              label="Media de couverture"
              value={coverMediaUrl}
              onChange={updateCoverUrl}
              assetId={coverMediaAssetId}
              onAssetChange={(assetId) => setCoverMediaAssetId(assetId ?? "")}
              onAssetSelect={selectCoverMedia}
              required
              accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/quicktime,.mov"
              libraryType="ALL"
              previewType={coverMediaType}
              projectId={post?.id}
              field="trailblaze-cover"
              helperText="Utilise pour la liste Trailblaze, le partage social et le SEO."
            />
          )}

          {tab === 2 + extraLocales.length && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button startIcon={<AddIcon />} onClick={() => addBlock("RICHTEXT")}>
                  Ajouter rich text
                </Button>
                <Button startIcon={<AddIcon />} onClick={() => addBlock("IMAGE")}>
                  Ajouter image
                </Button>
                <Button startIcon={<AddIcon />} onClick={() => addBlock("VIDEO")}>
                  Ajouter video
                </Button>
              </Box>
              {incompleteBlocks > 0 && (
                <Alert severity="warning">
                  {incompleteBlocks} bloc{incompleteBlocks > 1 ? "s" : ""} incomplet
                  {incompleteBlocks > 1 ? "s" : ""}.
                </Alert>
              )}
              {blocks.length === 0 ? (
                <Box
                  sx={{
                    py: 6,
                    textAlign: "center",
                    border: "1px dashed",
                    borderColor: "divider",
                    borderRadius: 2,
                    color: "text.secondary",
                  }}
                >
                  Aucun bloc pour le moment.
                </Box>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={blocks.map((block) => block.key)}
                    strategy={verticalListSortingStrategy}
                  >
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                      {blocks.map((block, index) => (
                        <SortableBlogBlock
                          key={block.key}
                          block={block}
                          index={index}
                          postId={post?.id}
                          extraLocales={extraLocales}
                          onChange={(next) => updateBlock(block.key, next)}
                          onDuplicate={() => duplicateBlock(block.key)}
                          onDelete={() => setDeleteTarget(block)}
                        />
                      ))}
                    </Box>
                  </SortableContext>
                </DndContext>
              )}
            </Box>
          )}

          {tab === 3 + extraLocales.length && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <Typography variant="h4">Tags SEO</Typography>
                  <Button
                    startIcon={<AutoAwesomeIcon />}
                    onClick={generateTags}
                    disabled={generatingTags}
                  >
                    {generatingTags ? "Generation..." : "Generer par IA"}
                  </Button>
                </Box>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 2.5,
                  }}
                >
                  <TextField
                    label="Tags francais"
                    value={tags}
                    onChange={(event) => setTags(event.target.value)}
                    fullWidth
                    multiline
                    minRows={3}
                    helperText="Separez les tags par des virgules ou des retours a la ligne."
                  />
                </Box>
              </Box>
              <TextField
                label="Date de publication"
                type="datetime-local"
                value={publishedAt}
                onChange={(event) => setPublishedAt(event.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Vide = brouillon."
              />
              {post?.previewUrl && (
                <Button
                  component="a"
                  href={post.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  startIcon={<OpenInNewIcon />}
                  sx={{ alignSelf: "flex-start" }}
                >
                  Voir sur le site
                </Button>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<UnpublishedIcon />}
            onClick={() => {
              setPublishedAt("");
              submit("");
            }}
            disabled={pending}
          >
            Enregistrer en brouillon
          </Button>
          <Button
            variant="outlined"
            startIcon={<PublishIcon />}
            onClick={() => {
              const next = publishedAt || nowAdminDatetimeLocal();
              setPublishedAt(next);
              submit(next);
            }}
            disabled={pending}
          >
            Publier
          </Button>
        </Box>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={() => submit()}
          disabled={pending}
        >
          Enregistrer
        </Button>
      </Box>

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        title="Supprimer ce bloc ?"
        message="Le bloc sera retire de l'article au prochain enregistrement."
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteBlock}
      />
    </Box>
  );
};
