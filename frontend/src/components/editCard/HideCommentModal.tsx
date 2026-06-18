import { type FC, useState } from "react";

import { Button } from "src/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "src/components/ui/dialog";
import { Textarea } from "src/components/ui/textarea";
import { useHideEditComment } from "src/graphql";

interface Props {
  commentId: string;
  hidden: boolean;
  show: boolean;
  onHide: () => void;
}

const HideCommentModal: FC<Props> = ({ commentId, hidden, show, onHide }) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hideComment, { loading: saving }] = useHideEditComment();

  // Toggling: if currently hidden the action unhides, and vice versa
  const action = hidden ? "Unhide" : "Hide";
  const pastTense = hidden ? "unhidden" : "hidden";

  const handleClose = () => {
    setReason("");
    setError(null);
    onHide();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    hideComment({
      variables: {
        input: {
          id: commentId,
          hidden: !hidden,
          reason: reason.trim() || null,
        },
      },
    })
      .then(() => handleClose())
      .catch((err) =>
        setError(
          err instanceof Error
            ? err.message
            : `Failed to ${action.toLowerCase()} comment`,
        ),
      );
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogTitle>{action} comment</DialogTitle>
        <form onSubmit={handleSubmit}>
          <p>
            {hidden
              ? "This comment will be visible to everyone again."
              : "This comment will be hidden from everyone except moderators and its author."}
          </p>
          <div>
            <label htmlFor="hide-comment-reason" className="mb-1 block">
              <strong>Reason (optional):</strong>
            </label>
            <Textarea
              id="hide-comment-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Why is this comment being ${pastTense}?`}
              disabled={saving}
            />
          </div>
          {error && <div className="mt-3 text-destructive">{error}</div>}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={saving}>
              {saving ? `${action.replace(/e$/, "")}ing...` : action}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default HideCommentModal;
