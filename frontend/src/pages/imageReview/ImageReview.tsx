import { faFilter } from "@fortawesome/free-solid-svg-icons";
import { type FC, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorMessage, Icon } from "src/components/fragments";
import Image from "src/components/image";
import { List } from "src/components/list";
import Title from "src/components/title";
import { Button } from "src/components/ui/button";
import { Table } from "src/components/ui/table";
import { ROUTE_IMAGE_REVIEW, ROUTE_USER } from "src/constants/route";
import {
  useRevertImageCategorization,
  useSetImageOrganized,
  useUnorganizedImages,
} from "src/graphql";
import {
  useCurrentUser,
  useImageTypeNames,
  usePagination,
  useQueryParams,
} from "src/hooks";
import { createHref, errorMessage, formatDateTime } from "src/utils";
import { performerHref } from "src/utils/route";

const PER_PAGE = 25;

const ImageReview: FC = () => {
  const { isModerator } = useCurrentUser();
  const { page, setPage } = usePagination();
  const { typeName } = useImageTypeNames();
  const [params, setParams] = useQueryParams({
    performer: { name: "performer", type: "string" },
    user: { name: "user", type: "string" },
  });
  const performerFilter = params.performer || null;
  const userFilter = params.user || null;
  const { loading, data } = useUnorganizedImages({
    input: {
      page,
      per_page: PER_PAGE,
      performer_id: performerFilter,
      user_id: userFilter,
    },
  });
  const [setImageOrganized, { loading: organizing }] = useSetImageOrganized();
  const [revertCategorization, { loading: reverting }] =
    useRevertImageCategorization();
  const saving = organizing || reverting;
  const [error, setError] = useState<string>();
  const organize = (id: string) => {
    setError(undefined);
    setImageOrganized({
      variables: { input: { id, organized: true } },
    }).catch((e: unknown) => setError(errorMessage(e)));
  };
  const revert = (id: string) => {
    setError(undefined);
    revertCategorization({ variables: { input: { id } } }).catch((e: unknown) =>
      setError(errorMessage(e)),
    );
  };

  if (!isModerator) return <ErrorMessage error="Forbidden" />;

  if (!loading && !data)
    return <ErrorMessage error="Failed to load the image review feed." />;

  // Feed membership is re-derived from the cache-updated rows rather than
  // refetched, which would blank the table mid-sweep
  const entries = data?.queryUnorganizedImages.images ?? [];
  const visible = entries.filter(
    (image) =>
      !image.organized &&
      image.categorized_at &&
      (!userFilter || image.categorized_by?.id === userFilter),
  );
  const hiddenCount = entries.length - visible.length;

  const rows = visible.map((image) => (
    <tr key={image.id}>
      <td>
        <Image
          images={image}
          size={300}
          loading="lazy"
          alt="Open image"
          lightbox
        />
      </td>
      <td>
        {image.performers.map((performer) => (
          <div key={performer.id}>
            <Link to={performerHref(performer)}>{performer.name}</Link>
          </div>
        ))}
      </td>
      <td>
        {[
          ...image.types.map(typeName),
          ...(image.date ? [image.date] : []),
        ].join(", ")}
      </td>
      <td className="whitespace-nowrap">
        {image.categorized_at ? formatDateTime(image.categorized_at) : null}
      </td>
      <td className="whitespace-nowrap">
        {image.categorized_by && (
          <>
            <Link to={createHref(ROUTE_USER, image.categorized_by)}>
              {image.categorized_by.name}
            </Link>{" "}
            <Button
              variant="link"
              size="sm"
              className="p-0 align-baseline"
              title="Show only this user's categorizations"
              onClick={() => setParams("user", image.categorized_by?.id)}
            >
              <Icon icon={faFilter} />
            </Button>
          </>
        )}
      </td>
      <td>
        <Button size="sm" disabled={saving} onClick={() => organize(image.id)}>
          Mark organized
        </Button>
        <Button
          size="sm"
          variant="danger"
          className="ml-2"
          disabled={saving}
          title="Restore the labels and date from before the last change; if they arrived with the image, clear them"
          onClick={() => revert(image.id)}
        >
          Revert
        </Button>
      </td>
    </tr>
  ));

  return (
    <>
      <Title page="Image Review" />
      <h3>Image Review</h3>
      <p className="text-muted-foreground">
        Images with contributor-set labels or dates awaiting a moderator's
        sign-off. Marking one organized locks its categorization; reverting one
        restores the labels from before the last change.
      </p>
      {error && <div className="text-destructive mb-2">Error: {error}</div>}
      <List
        entityName="images"
        filters={
          (performerFilter || userFilter) && (
            <>
              <span className="text-muted-foreground">
                Filtered to {performerFilter ? "one performer's images" : null}
                {performerFilter && userFilter ? " and " : null}
                {userFilter ? "one user's categorizations" : null}
              </span>
              <Link to={ROUTE_IMAGE_REVIEW} className="ml-2">
                <Button variant="secondary" size="sm">
                  Show everything
                </Button>
              </Link>
            </>
          )
        }
        page={page}
        setPage={setPage}
        perPage={PER_PAGE}
        loading={loading}
        listCount={
          data ? data.queryUnorganizedImages.count - hiddenCount : undefined
        }
      >
        <div className="overflow-x-auto">
          <Table striped>
            <thead>
              <tr>
                <th style={{ width: "120px" }}>Image</th>
                <th>Performers</th>
                <th>Labels</th>
                <th>Categorized</th>
                <th>By</th>
                <th style={{ width: "160px" }}></th>
              </tr>
            </thead>
            <tbody>{rows}</tbody>
          </Table>
        </div>
      </List>
    </>
  );
};

export default ImageReview;
