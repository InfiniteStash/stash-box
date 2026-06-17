import { debounce } from "lodash-es";
import type { FC } from "react";
import { Link } from "react-router-dom";
import { ErrorMessage } from "src/components/fragments";
import { Card, CardBody } from "src/components/ui/card";
import { Input } from "src/components/ui/input";
import { ROUTE_CATEGORIES } from "src/constants/route";
import {
  SortDirectionEnum,
  type TagQueryInput,
  TagSortEnum,
  useTags,
} from "src/graphql";
import { usePagination, useQueryParams } from "src/hooks";
import { createHref, tagHref } from "src/utils/route";
import List from "./List";

const PER_PAGE = 40;

interface TagListProps {
  tagFilter: Partial<TagQueryInput>;
  showCategoryLink?: boolean;
}

const TagList: FC<TagListProps> = ({ tagFilter, showCategoryLink = false }) => {
  const [{ name }, setParams] = useQueryParams({
    name: { name: "query", type: "string", default: "" },
  });
  const { page, setPage } = usePagination();
  const { loading, data } = useTags({
    input: {
      names: name.trim(),
      page,
      per_page: PER_PAGE,
      sort: TagSortEnum.NAME,
      direction: SortDirectionEnum.ASC,
      ...tagFilter,
    },
  });

  const tags = (data?.queryTags?.tags ?? []).map((tag) => (
    <li key={tag.id}>
      <Link to={tagHref(tag)} className="text-link hover:underline">
        {tag.name}
      </Link>
      {tag.description && (
        <span className="ml-2 text-muted-foreground">
          &bull;
          <small className="ml-2">{tag.description}</small>
        </span>
      )}
    </li>
  ));

  const debouncedHandler = debounce(setParams, 200);

  const filters = (
    <Input
      id="tag-query"
      onChange={(e) => debouncedHandler("name", e.currentTarget.value)}
      placeholder="Filter tag name"
      defaultValue={name}
      className="w-full sm:w-64"
    />
  );

  if (!loading && !data) return <ErrorMessage error="Failed to load tags." />;

  return (
    <List
      entityName="tags"
      page={page}
      setPage={setPage}
      perPage={PER_PAGE}
      filters={filters}
      loading={loading}
      listCount={data?.queryTags.count}
    >
      <Card className="mt-4">
        <CardBody>
          {showCategoryLink && (
            <Link
              to={createHref(ROUTE_CATEGORIES)}
              className="text-link hover:underline"
            >
              <h5 className="mb-2 text-lg font-semibold">List of Categories</h5>
            </Link>
          )}
          <ul className="space-y-1">{tags}</ul>
        </CardBody>
      </Card>
    </List>
  );
};

export default TagList;
