import { faSpinner, faTrash } from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { Icon } from "src/components/fragments";
import { Button } from "src/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "src/components/ui/dialog";

interface Props {
  show: boolean;
  selectedCount: number;
  deleting: boolean;
  onHide: () => void;
  onDelete: () => Promise<boolean | undefined>;
}

export const DeleteFingerprintsModal: FC<Props> = ({
  show,
  selectedCount,
  deleting,
  onHide,
  onDelete,
}) => {
  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent>
        <DialogTitle>Delete Fingerprint Submissions</DialogTitle>
        <p>
          Are you sure you want to delete {selectedCount} fingerprint
          submission(s)? This action cannot be undone.
        </p>
        <p className="text-destructive">
          <strong>Warning:</strong> This will delete all submissions for the
          selected fingerprints on this scene.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onDelete} disabled={deleting}>
            {deleting ? (
              <>
                <Icon icon={faSpinner} className="mr-1 fa-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Icon icon={faTrash} className="mr-1" />
                Delete
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
