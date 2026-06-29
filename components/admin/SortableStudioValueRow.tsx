"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import type { StudioValueData } from "./studio-value-types";

export const SortableStudioValueRow = ({
  studioValue,
}: {
  studioValue: StudioValueData;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: studioValue.id });

  return (
    <TableRow
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      hover
    >
      <TableCell sx={{ width: 60, cursor: "grab" }} {...attributes} {...listeners}>
        <DragIndicatorIcon fontSize="small" color="action" />
      </TableCell>
      <TableCell>{studioValue.title}</TableCell>
      <TableCell>{studioValue.active ? "Oui" : "Non"}</TableCell>
    </TableRow>
  );
};
