import { type FC, useState } from "react";
import { Link } from "react-router-dom";

import { Badge } from "src/components/ui/badge";
import { Button } from "src/components/ui/button";
import { Card, CardBody, CardFooter } from "src/components/ui/card";
import { useCurrentUser } from "src/hooks";
import { cn as cx } from "src/lib/utils";
import { formatDateTime, Markdown, userHref } from "src/utils";
import EditCommentModal from "./EditCommentModal";
import HideCommentModal from "./HideCommentModal";

const CLASSNAME = "EditComment";

interface Props {
  id: string;
  comment: string;
  date: string;
  updated?: string | null;
  hidden?: boolean;
  isPrimary?: boolean;
  user?: { name: string; id: string } | null;
  /** Rendered as a draft preview (e.g. NoteInput) - suppresses moderator controls */
  preview?: boolean;
}

const EditComment: FC<Props> = ({
  id,
  comment,
  date,
  updated,
  hidden,
  isPrimary,
  user,
  preview,
}) => {
  const { isModerator } = useCurrentUser();
  const [showEdit, setShowEdit] = useState(false);
  const [showHide, setShowHide] = useState(false);

  const showControls = isModerator && !preview;

  return (
    <Card
      id={`comment-${id}`}
      className={cx(CLASSNAME, hidden && "EditComment-hidden")}
    >
      <CardBody className="pb-0">
        <Markdown text={comment} unique={id} />
      </CardBody>
      <CardFooter className="flex flex-wrap items-center justify-end gap-1">
        {showControls && (
          <span className="EditComment-actions mr-auto flex gap-2">
            <Button
              size="sm"
              variant="danger"
              onClick={() => setShowEdit(true)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={isPrimary}
              title={
                isPrimary ? "The submission comment can't be hidden" : undefined
              }
              onClick={() => setShowHide(true)}
            >
              {hidden ? "Unhide" : "Hide"}
            </Button>
          </span>
        )}
        {hidden && (
          <Badge variant="danger" className="mr-2">
            Hidden by moderator
          </Badge>
        )}
        {user ? (
          <Link to={userHref(user)} className="text-link hover:underline">
            {user.name}
          </Link>
        ) : (
          <span>Deleted User</span>
        )}
        <span className="mx-1">&bull;</span>
        <span>{formatDateTime(date, false)}</span>
        {updated && (
          <span className="ml-1" title={formatDateTime(updated, false)}>
            (edited by moderator)
          </span>
        )}
      </CardFooter>
      {showControls && (
        <>
          <EditCommentModal
            commentId={id}
            text={comment}
            show={showEdit}
            onHide={() => setShowEdit(false)}
          />
          <HideCommentModal
            commentId={id}
            hidden={hidden ?? false}
            show={showHide}
            onHide={() => setShowHide(false)}
          />
        </>
      )}
    </Card>
  );
};

export default EditComment;
