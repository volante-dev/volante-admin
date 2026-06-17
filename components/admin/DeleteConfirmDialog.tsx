"use client";

import { useTransition } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

type DeleteConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export const DeleteConfirmDialog = ({
  open,
  title,
  message,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) => {
  const [pending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      await onConfirm();
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={pending}>
          Annuler
        </Button>
        <Button
          onClick={handleConfirm}
          color="error"
          variant="contained"
          disabled={pending}
        >
          {pending ? "Suppression..." : "Supprimer"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
