import {
  faSortAmountDown,
  faSortAmountUp,
} from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { ErrorMessage, Icon } from "src/components/fragments";
import SceneCard from "src/components/sceneCard";
import TagFilter from "src/components/tagFilter";
import { Button } from "src/components/ui/button";
import { SelectCombobox } from "src/components/ui/combobox";
import { Select } from "src/components/ui/select";
import { Switch } from "src/components/ui/switch";
import {
  CriterionModifier,
  FavoriteFilter,
  type SceneQueryInput,
  SceneSortEnum,
  SortDirectionEnum,
  useSceneCount,
  useScenes,
} from "src/graphql";
import { usePagination, useQueryParams } from "src/hooks";
import { ensureEnum } from "src/utils";
import List from "./List";

const PER_PAGE = 20;

interface Props {
  perPage?: number;
  filter?: Partial<SceneQueryInput>;
  favoriteFilter?: "performer" | "studio" | "all";
  tagsFilter?: SceneQueryInput["tags"];
}

const sortOptions = [
  { value: SceneSortEnum.DATE, label: "Release Date" },
  { value: SceneSortEnum.TITLE, label: "Title" },
  { value: SceneSortEnum.TRENDING, label: "Trending" },
  { value: SceneSortEnum.POPULARITY, label: "Popularity" },
  { value: SceneSortEnum.CREATED_AT, label: "Created At" },
  { value: SceneSortEnum.UPDATED_AT, label: "Updated At" },
  { value: SceneSortEnum.DURATION, label: "Duration" },
];

const favoriteOptions = [
  {
    label: "All Favorites",
    value: FavoriteFilter.ALL,
  },
  {
    label: "Favorite Performers",
    value: FavoriteFilter.PERFORMER,
  },
  {
    label: "Favorite Studios",
    value: FavoriteFilter.STUDIO,
  },
];

const SceneList: FC<Props> = ({
  perPage = PER_PAGE,
  filter,
  favoriteFilter,
  tagsFilter,
}) => {
  const [params, setParams] = useQueryParams({
    sort: { name: "sort", type: "string", default: SceneSortEnum.DATE },
    dir: { name: "dir", type: "string", default: SortDirectionEnum.DESC },
    favorite: { name: "favorite", type: "string", default: "NONE" },
    tag: { name: "tag", type: "string" },
  });
  const sort = ensureEnum(SceneSortEnum, params.sort);
  const direction = ensureEnum(SortDirectionEnum, params.dir);
  const favorite =
    params.favorite !== "NONE" && ensureEnum(FavoriteFilter, params.favorite);

  const { page, setPage } = usePagination();
  const input: SceneQueryInput = {
    page,
    per_page: perPage,
    sort,
    direction,
    ...filter,
    favorites: (favoriteFilter !== undefined && favorite) || undefined,
    tags:
      tagsFilter ||
      (params.tag
        ? { value: [params.tag], modifier: CriterionModifier.INCLUDES }
        : undefined),
  };

  const { loading, data } = useScenes({ input });

  // A page that isn't full is the last one, so the total is known from the rows.
  const scenes = data?.queryScenes.scenes;
  const derivedCount =
    scenes && scenes.length > 0 && scenes.length < perPage
      ? (page - 1) * perPage + scenes.length
      : undefined;

  // Pinned to page 1 so the cache key is the filter alone and paging within a
  // filter reuses the count rather than recounting.
  const { data: countData } = useSceneCount(
    { input: { ...input, page: 1 } },
    loading || derivedCount !== undefined,
  );
  const count = derivedCount ?? countData?.queryScenes.count;

  if (!loading && !data) return <ErrorMessage error="Failed to load scenes." />;

  const filters = (
    <>
      {!tagsFilter && (
        <TagFilter tag={params.tag} onChange={(t) => setParams("tag", t?.id)} />
      )}
      <div className="scene-sort flex gap-2">
        <Select
          className="w-auto"
          onChange={(e) =>
            setParams("sort", e.currentTarget.value.toLowerCase())
          }
          defaultValue={sort ?? "name"}
        >
          {sortOptions.map((s) => (
            <option value={s.value} key={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
        <Button
          variant="secondary"
          onClick={() =>
            setParams(
              "dir",
              direction === SortDirectionEnum.DESC
                ? SortDirectionEnum.ASC
                : SortDirectionEnum.DESC,
            )
          }
        >
          <Icon
            icon={
              direction === SortDirectionEnum.DESC
                ? faSortAmountDown
                : faSortAmountUp
            }
          />
        </Button>
      </div>
      {favoriteFilter === "performer" || favoriteFilter === "studio" ? (
        <Switch
          className="ml-3"
          label={`Only favorite ${favoriteFilter}s`}
          defaultChecked={!!favorite}
          onCheckedChange={(checked) =>
            setParams(
              "favorite",
              checked ? favoriteFilter.toUpperCase() : "NONE",
            )
          }
        />
      ) : favoriteFilter === "all" ? (
        <SelectCombobox
          className="ml-4 w-44"
          onChange={(v) => setParams("favorite", v ?? "NONE")}
          placeholder="Favorite filter"
          isClearable
          value={favorite || undefined}
          options={favoriteOptions}
        />
      ) : null}
    </>
  );

  const sceneCards = (scenes ?? []).map((scene) => (
    <SceneCard scene={scene} key={scene.id} />
  ));

  return (
    <List
      page={page}
      setPage={setPage}
      perPage={perPage}
      listCount={count}
      loading={loading}
      filters={filters}
      entityName="scenes"
    >
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sceneCards}
      </div>
    </List>
  );
};

export default SceneList;
