import { CombinedGraphQLErrors } from "@apollo/client";
import { type FC, useState } from "react";

import { NoteInput } from "src/components/form";
import { Button } from "src/components/ui/button";
import { useEditComment } from "src/graphql";
import { useCurrentUser } from "src/hooks";

interface IProps {
  editID: string;
}

const AddComment: FC<IProps> = ({ editID }) => {
  const { isEditor } = useCurrentUser();
  const [showInput, setShowInput] = useState(false);
  const [error, setError] = useState<string>();
  const [comment, setComment] = useState("");
  const [saveComment, { loading: saving }] = useEditComment();

  if (!showInput)
    return (
      <div className="flex">
        {isEditor && (
          <Button
            className="ml-auto"
            variant="minimal"
            onClick={() => setShowInput(true)}
          >
            Add Comment
          </Button>
        )}
      </div>
    );

  const handleSaveComment = async () => {
    const text = comment.trim();
    if (text) {
      const res = await saveComment({
        variables: { input: { id: editID, comment: text } },
      });
      if (CombinedGraphQLErrors.is(res.error)) {
        setError(res.error.message);
      } else {
        setShowInput(false);
        setError("");
      }
    }
  };

  return (
    <div className="mb-3">
      <NoteInput hasError={!!error} onChange={(text) => setComment(text)} />
      {error && (
        <div className="mt-1 text-right text-sm text-destructive">{error}</div>
      )}
      <div className="mt-2 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => setShowInput(false)}>
          Cancel
        </Button>
        <Button
          disabled={saving || !comment.trim()}
          onClick={handleSaveComment}
        >
          Save
        </Button>
      </div>
    </div>
  );
};

export default AddComment;
