"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import LinkIcon from "@mui/icons-material/Link";
import ShortTextIcon from "@mui/icons-material/ShortText";
import SubdirectoryArrowLeftIcon from "@mui/icons-material/SubdirectoryArrowLeft";

type RichTextEditorProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
};

export const RichTextEditor = ({
  label,
  value,
  onChange,
  error = false,
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [3, 4] },
      }),
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
    ],
    content: value || "<p></p>",
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const nextValue = value || "<p></p>";
    if (editor.getHTML() !== nextValue) {
      editor.commands.setContent(nextValue, { emitUpdate: false });
    }
  }, [editor, value]);

  const setLink = () => {
    if (!editor) return;
    const current = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("URL du lien", current ?? "");

    if (href === null) return;
    if (!href.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        borderColor: error ? "error.main" : "divider",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 1.5,
          py: 1,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          flexWrap: "wrap",
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.default",
        }}
      >
        <Button
          size="small"
          onClick={() => editor?.chain().focus().setParagraph().run()}
          variant={editor?.isActive("paragraph") ? "contained" : "text"}
        >
          {label}
        </Button>
        <Button
          size="small"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          variant={editor?.isActive("heading", { level: 3 }) ? "contained" : "text"}
        >
          H3
        </Button>
        <Button
          size="small"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 4 }).run()}
          variant={editor?.isActive("heading", { level: 4 }) ? "contained" : "text"}
        >
          H4
        </Button>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        <Tooltip title="Gras">
          <IconButton
            size="small"
            color={editor?.isActive("bold") ? "primary" : "default"}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <FormatBoldIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Italique">
          <IconButton
            size="small"
            color={editor?.isActive("italic") ? "primary" : "default"}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <FormatItalicIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Liste">
          <IconButton
            size="small"
            color={editor?.isActive("bulletList") ? "primary" : "default"}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <FormatListBulletedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Liste numerotee">
          <IconButton
            size="small"
            color={editor?.isActive("orderedList") ? "primary" : "default"}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <FormatListNumberedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Lien">
          <IconButton
            size="small"
            color={editor?.isActive("link") ? "primary" : "default"}
            onClick={setLink}
          >
            <LinkIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Retour ligne">
          <IconButton
            size="small"
            onClick={() => editor?.chain().focus().setHardBreak().run()}
          >
            <SubdirectoryArrowLeftIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Box
        sx={{
          minHeight: 150,
          px: 2,
          py: 1.5,
          "& .tiptap": {
            outline: "none",
            minHeight: 120,
          },
          "& .tiptap p": { my: 1 },
          "& .tiptap h3": { typography: "h3", my: 1.5 },
          "& .tiptap h4": { typography: "h4", my: 1 },
          "& .tiptap ul, & .tiptap ol": { pl: 3 },
          "& .tiptap a": { color: "primary.main" },
        }}
      >
        {editor ? (
          <EditorContent editor={editor} />
        ) : (
          <Box sx={{ color: "text.secondary", display: "flex", gap: 1 }}>
            <ShortTextIcon fontSize="small" />
            Chargement de l&apos;editeur...
          </Box>
        )}
      </Box>
    </Paper>
  );
};
