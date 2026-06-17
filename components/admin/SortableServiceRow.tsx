"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Typography from "@mui/material/Typography";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import type { ServiceData } from "@/app/(admin)/services/page";

export const SortableServiceRow = ({ service }: { service: ServiceData }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: service.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} hover>
      <TableCell sx={{ cursor: "grab" }} {...attributes} {...listeners}>
        <DragIndicatorIcon fontSize="small" color="action" />
      </TableCell>
      <TableCell>{service.title}</TableCell>
      <TableCell>
        {service.titleEn || (
          <Typography variant="body2" color="text.secondary">
            --
          </Typography>
        )}
      </TableCell>
      <TableCell>
        {service.icon || (
          <Typography variant="body2" color="text.secondary">
            --
          </Typography>
        )}
      </TableCell>
      <TableCell>
        <Typography variant="body2" color={service.active ? "primary" : "text.secondary"}>
          {service.active ? "Oui" : "Non"}
        </Typography>
      </TableCell>
      <TableCell />
    </TableRow>
  );
};
