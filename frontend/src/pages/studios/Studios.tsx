import { debounce } from "lodash-es";
import type { FC } from "react";
import { Link } from "react-router-dom";
import { FavoriteStar } from "src/components/fragments";
import { List } from "src/components/list";
import { Button } from "src/components/ui/button";
import { Card, CardBody } from "src/components/ui/card";
import { Input } from "src/components/ui/input";
import { Switch } from "src/components/ui/switch";
import { ROUTE_STUDIO_ADD } from "src/constants/route";
import { SortDirectionEnum, StudioSortEnum, useStudios } from "src/graphql";
import { useCurrentUser, usePagination, useQueryParams } from "src/hooks";
import { cn } from "src/lib/utils";
import { createHref, studioHref } from "src/utils";

const PER_PAGE = 40;

const StudiosComponent: FC = () => {
  const { isEditor } = useCurrentUser();
  const [params, setParams] = useQueryParams({
    query: { name: "query", type: "string", default: "" },
    favorite: { name: "favorite", type: "string", default: "false" },
    parentOnly: { name: "parents", type: "string", default: "false" },
  });
  const favorite = params.favorite === "true" || undefined;
  const parentOnly = params.parentOnly === "true";
  const hasParent = parentOnly ? false : undefined;
  const { page, setPage } = usePagination();
  const { loading, data } = useStudios({
    input: {
      names: params.query,
      is_favorite: favorite,
      has_parent: hasParent,
      page,
      per_page: PER_PAGE,
      direction: SortDirectionEnum.ASC,
      sort: StudioSortEnum.NAME,
    },
  });

  const studioList = data?.queryStudios.studios.map((s) => (
    <li key={s.id} className="flex items-center gap-2">
      <Link
        to={studioHref(s)}
        className={cn(
          "text-link hover:underline",
          s.parent === null && "font-bold",
        )}
      >
        {s.name}
      </Link>
      {s.parent && (
        <small className="text-muted-foreground">
          &bull;{" "}
          <Link to={studioHref(s.parent)} className="hover:underline">
            {s.parent.name}
          </Link>
        </small>
      )}
      <FavoriteStar entity={s} entityType="studio" className="pl-2" />
    </li>
  ));

  const debouncedHandler = debounce(setParams, 200);

  const filters = (
    <>
      <Input
        id="studio-query"
        onChange={(e) => debouncedHandler("query", e.currentTarget.value)}
        placeholder="Filter studio name"
        defaultValue={params.query ?? ""}
        className="w-full sm:w-64"
      />
      <Switch
        id="favorite"
        label="Only favorites"
        defaultChecked={favorite}
        onCheckedChange={(checked) => setParams("favorite", checked.toString())}
      />
      <Switch
        id="parentOnly"
        label="Only parent networks"
        defaultChecked={parentOnly}
        onCheckedChange={(checked) =>
          setParams("parentOnly", checked.toString())
        }
      />
    </>
  );

  return (
    <>
      <div className="mb-4 flex items-center">
        <h3 className="text-2xl font-semibold">Studios</h3>
        {isEditor && (
          <Link to={createHref(ROUTE_STUDIO_ADD)} className="ml-auto">
            <Button>Create</Button>
          </Link>
        )}
      </div>
      <List
        entityName="studios"
        page={page}
        setPage={setPage}
        perPage={PER_PAGE}
        filters={filters}
        loading={loading}
        listCount={data?.queryStudios.count}
      >
        <Card className="mt-4">
          <CardBody>
            <ul className="space-y-1">{studioList}</ul>
          </CardBody>
        </Card>
      </List>
    </>
  );
};

export default StudiosComponent;
