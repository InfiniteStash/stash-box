import { type FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "src/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "src/components/ui/dialog";
import { Textarea } from "src/components/ui/textarea";
import { EditOperationTypes, EditTargetTypes } from "src/constants";
import { ROUTE_EDITS } from "src/constants/route";
import type { EditFragment } from "src/graphql";
import { useDeleteEdit } from "src/graphql";

interface Props {
  edit: EditFragment;
  show: boolean;
  onHide: () => void;
}

const DeleteEditModal: FC<Props> = ({ edit, show, onHide }) => {
  const navigate = useNavigate();
  const [deleteReason, setDeleteReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleteEdit, { loading: deleting }] = useDeleteEdit();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteReason.trim()) return;

    setError(null);
    deleteEdit({
      variables: {
        input: {
          id: edit.id,
          reason: deleteReason,
        },
      },
    })
      .then(() => {
        onHide();
        navigate(ROUTE_EDITS);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to delete edit");
      });
  };

  const handleClose = () => {
    setDeleteReason("");
    setError(null);
    onHide();
  };

  const editType = `${EditOperationTypes[edit.operation]} ${EditTargetTypes[edit.target_type]}`;
  const userName = edit.user?.name || "Unknown User";
  const editIdShort = edit.id.slice(0, 8);

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogTitle>
          Delete {editType} - {editIdShort} by {userName}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="delete-edit-reason" className="mb-1 block">
              <strong>Reason for deletion (required):</strong>
            </label>
            <Textarea
              id="delete-edit-reason"
              rows={4}
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Enter the reason for deleting this edit..."
              required
              disabled={deleting}
            />
          </div>
          {error && <div className="mt-3 text-destructive">{error}</div>}
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={!deleteReason.trim() || deleting}
            >
              {deleting ? "Deleting..." : "Delete Edit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteEditModal;
