import type { FC } from "react";

import { formatDateTime } from "src/utils";

interface EditCommentDeleteData {
  comment_id: string;
  edit_id: string;
  comment_user_id: { UUID: string; Valid: boolean } | null;
  comment_text: string;
  comment_date: string;
  deleted_by: string;
  deleted_at: string;
}

const CommentDeleteAuditDetails: FC<{ data: string }> = ({ data }) => {
  let parsed: EditCommentDeleteData;
  try {
    parsed = JSON.parse(data) as EditCommentDeleteData;
  } catch {
    return null;
  }

  return (
    <div className="p-3 bg-dark">
      <h6>Comment Details</h6>
      <div className="mb-2">
        <strong>Comment ID:</strong> {parsed.comment_id}
      </div>
      <div className="mb-2">
        <strong>Edit ID:</strong> {parsed.edit_id}
      </div>
      <div className="mb-2">
        <strong>Posted:</strong> {formatDateTime(parsed.comment_date)}
      </div>
      <div className="mb-2">
        <strong>Author ID:</strong>{" "}
        {parsed.comment_user_id?.Valid ? (
          parsed.comment_user_id.UUID
        ) : (
          <em>Deleted User</em>
        )}
      </div>
      <div className="mt-3">
        <strong>Comment:</strong>
        <pre className="mt-2 p-2 bg-secondary rounded">
          <code>{parsed.comment_text}</code>
        </pre>
      </div>
    </div>
  );
};

export default CommentDeleteAuditDetails;
