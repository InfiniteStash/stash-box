import { faTrash } from "@fortawesome/free-solid-svg-icons";
import { sortBy } from "lodash-es";
import type React from "react";
import { Link } from "react-router-dom";
import { Icon, LoadingIndicator, Tooltip } from "src/components/fragments";
import { Button } from "src/components/ui/button";
import { Card, CardBody } from "src/components/ui/card";
import { useDeleteDraft, useDrafts } from "src/graphql";
import {
  formatDistance,
  formatInstant,
  isInstantInFuture,
  parseInstant,
} from "src/utils";

const DraftList: React.FC = () => {
  const { loading, data, refetch } = useDrafts();
  const [deleteDraft, { loading: destroying }] = useDeleteDraft();

  const handleDelete = (id: string) => {
    deleteDraft({ variables: { id } }).then(() => refetch());
  };

  return (
    <>
      <h3 className="mr-4">Drafts</h3>
      <Card>
        <CardBody className="p-4">
          {loading && <LoadingIndicator message="Loading drafts..." />}
          {!loading && data !== undefined && !data?.findDrafts.length && (
            <>
              <h6>No drafts saved.</h6>
              <p>Scene and performer drafts can be submitted from Stash.</p>
            </>
          )}
          <ul className="pl-0">
            {sortBy(data?.findDrafts ?? [], "expires").map((draft) => {
              const expirationDate = parseInstant(draft.expires);
              const expiration =
                expirationDate && isInstantInFuture(expirationDate)
                  ? formatDistance(expirationDate)
                  : "in a moment";
              return (
                <li key={draft.id} className="block">
                  {draft.data.__typename === "PerformerDraft" ? (
                    <Link
                      to={`/drafts/${draft.id}`}
                      className="text-link hover:underline"
                    >
                      Performer {draft.data.id ? "update" : "addition"}:{" "}
                      <b>{draft.data.name}</b>
                    </Link>
                  ) : (
                    <Link
                      to={`/drafts/${draft.id}`}
                      className="text-link hover:underline"
                    >
                      Scene {draft.data.id ? "update" : "addition"}:{" "}
                      <b>{draft.data.title}</b>
                    </Link>
                  )}
                  <span className="ml-2">
                    &bull;
                    <Tooltip
                      delay={200}
                      text={expirationDate ? formatInstant(expirationDate) : ""}
                    >
                      <small className="ml-2">Expires {expiration}</small>
                    </Tooltip>
                  </span>
                  <Button
                    onClick={() => handleDelete(draft.id)}
                    disabled={destroying}
                    title="Delete draft"
                    variant="minimal"
                  >
                    <Icon icon={faTrash} color="red" />
                  </Button>
                </li>
              );
            })}
          </ul>
        </CardBody>
      </Card>
    </>
  );
};

export default DraftList;
