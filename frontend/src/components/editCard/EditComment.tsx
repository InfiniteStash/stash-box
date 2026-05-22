import { CombinedGraphQLErrors } from "@apollo/client";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { type FC, useState } from "react";
import { Button, Card, Form, Modal } from "react-bootstrap";
import { Link } from "react-router-dom";

import { Icon } from "src/components/fragments";
import { useDeleteEditComment } from "src/graphql";
import { useCurrentUser } from "src/hooks";
import { formatDateTime, Markdown, userHref } from "src/utils";

const CLASSNAME = "EditComment";

interface Props {
  id: string;
  comment: string;
  date: string;
  user?: { name: string; id: string } | null;
}

const EditComment: FC<Props> = ({ id, comment, date, user }) => {
  const { isModerator } = useCurrentUser();
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleteComment, { loading: deleting }] = useDeleteEditComment();

  const handleClose = () => {
    setShowModal(false);
    setReason("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setError(null);
    const res = await deleteComment({
      variables: { input: { id, reason } },
    });
    if (CombinedGraphQLErrors.is(res.error)) {
      setError(res.error.message);
    } else {
      handleClose();
    }
  };

  return (
    <Card className={CLASSNAME}>
      <Card.Body className="pb-0">
        <Markdown text={comment} unique={id} />
      </Card.Body>
      <Card.Footer className="d-flex align-items-center">
        <div className="ms-auto">
          {user ? (
            <Link to={userHref(user)}>{user.name}</Link>
          ) : (
            <span>Deleted User</span>
          )}
          <span className="mx-1">&bull;</span>
          <span>{formatDateTime(date, false)}</span>
        </div>
        {isModerator && (
          <Button
            variant="link"
            className="minimal text-danger ms-2 p-0"
            title="Delete comment"
            onClick={() => setShowModal(true)}
          >
            <Icon icon={faTrash} />
          </Button>
        )}
      </Card.Footer>
      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Comment</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group>
              <Form.Label>
                <strong>Reason for deletion (required):</strong>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter the reason for deleting this comment..."
                required
                disabled={deleting}
              />
            </Form.Group>
            {error && <div className="text-danger mt-3">{error}</div>}
          </Modal.Body>
          <Modal.Footer>
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
              disabled={!reason.trim() || deleting}
            >
              {deleting ? "Deleting..." : "Delete Comment"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Card>
  );
};

export default EditComment;
