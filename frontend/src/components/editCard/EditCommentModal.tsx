import { type FC, useState } from "react";

import { NoteInput } from "src/components/form";
import { Button } from "src/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "src/components/ui/dialog";
import { Textarea } from "src/components/ui/textarea";
import { useUpdateEditComment } from "src/graphql";

interface Props {
  commentId: string;
  text: string;
  show: boolean;
  onHide: () => void;
}

const EditCommentModal: FC<Props> = ({ commentId, text, show, onHide }) => {
  const [comment, setComment] = useState(text);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [updateComment, { loading: saving }] = useUpdateEditComment();

  const handleClose = () => {
    setComment(text);
    setReason("");
    setError(null);
    onHide();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = comment.trim();
    if (!trimmed) return;

    setError(null);
    updateComment({
      variables: {
        input: {
          id: commentId,
          comment: trimmed,
          reason: reason.trim() || null,
        },
      },
    })
      .then(() => handleClose())
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to edit comment"),
      );
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogTitle>Edit comment</DialogTitle>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <div className="mb-1">
              <strong>Comment:</strong>
            </div>
            <NoteInput initialValue={text} onChange={setComment} />
          </div>
          <div>
            <label htmlFor="edit-comment-reason" className="mb-1 block">
              <strong>Reason (optional):</strong>
            </label>
            <Textarea
              id="edit-comment-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this comment being edited?"
              disabled={saving}
            />
          </div>
          {error && <div className="mt-3 text-destructive">{error}</div>}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={!comment.trim() || saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCommentModal;
