import {
  faSortAmountDown,
  faSortAmountUp,
} from "@fortawesome/free-solid-svg-icons";
import { type FC, Fragment } from "react";
import { Icon } from "src/components/fragments";
import { List } from "src/components/list";
import PerformerCard from "src/components/performerCard";
import { Button } from "src/components/ui/button";
import { SelectCombobox } from "src/components/ui/combobox";
import { Input } from "src/components/ui/input";
import { Select } from "src/components/ui/select";
import { Switch } from "src/components/ui/switch";
import { GenderFilterTypes } from "src/constants";
import {
  GenderFilterEnum,
  PerformerSortEnum,
  SortDirectionEnum,
  useScenePairings,
} from "src/graphql";
import { useDebouncedCallback, usePagination, useQueryParams } from "src/hooks";
import { ensureEnum, resolveEnum } from "src/utils";
import { PairingRow } from "./pairingRow";

const PER_PAGE = 25;
const SCENES_PER_PAGE = 12;

const genderOptions = Object.entries(GenderFilterEnum).map(([, value]) => ({
  value,
  label: GenderFilterTypes[value],
}));
const sortOptions = [
  { value: PerformerSortEnum.NAME, label: "Name" },
  { value: PerformerSortEnum.SHARED_SCENE_COUNT, label: "Scenes Together" },
  { value: PerformerSortEnum.BIRTHDATE, label: "Birthdate" },
  { value: PerformerSortEnum.SCENE_COUNT, label: "Scene Count" },
  { value: PerformerSortEnum.CAREER_START_YEAR, label: "Career Start" },
  { value: PerformerSortEnum.DEBUT, label: "Scene Debut" },
  { value: PerformerSortEnum.CREATED_AT, label: "Created At" },
];

interface Props {
  id: string;
}

export const ScenePairings: FC<Props> = ({ id }) => {
  const [params, setParams] = useQueryParams({
    query: { name: "query", type: "string", default: "" },
    gender: { name: "gender", type: "string" },
    direction: { name: "dir", type: "string", default: SortDirectionEnum.DESC },
    sort: {
      name: "sort",
      type: "string",
      default: PerformerSortEnum.SHARED_SCENE_COUNT,
    },
    favorite: { name: "favorite", type: "string", default: "false" },
    scenes: { name: "scenes", type: "string", default: "false" },
  });
  const gender = resolveEnum(GenderFilterEnum, params.gender);
  const direction = ensureEnum(SortDirectionEnum, params.direction);
  const sort = ensureEnum(PerformerSortEnum, params.sort);
  const favorite = params.favorite === "true" || undefined;
  const fetchScenes = params.scenes === "true";
  const { page, setPage } = usePagination();

  const { data, loading } = useScenePairings({
    performerId: id,
    names: params.query,
    gender,
    favorite,
    page,
    per_page: PER_PAGE,
    sort,
    direction,
    fetchScenes,
    scenesPerPage: SCENES_PER_PAGE,
  });

  const performers = data?.queryPerformers.performers;

  const debouncedHandler = useDebouncedCallback(setParams, 200);

  const filters = (
    <>
      <Input
        id="performer-name"
        onChange={(e) => debouncedHandler("query", e.currentTarget.value)}
        placeholder="Filter performer name"
        defaultValue={params.query}
        className="w-auto"
      />
      <SelectCombobox
        inputId="performer-gender"
        options={genderOptions}
        value={gender}
        placeholder="Gender"
        isClearable
        onChange={(v) => setParams("gender", v ?? undefined)}
        className="ml-2 w-40"
      />
      <div className="performer-sort ml-2 mr-3 flex gap-2">
        <Select
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
              "direction",
              direction === SortDirectionEnum.DESC
                ? SortDirectionEnum.ASC
                : undefined,
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
      <Switch
        label="Favorites"
        defaultChecked={favorite}
        onCheckedChange={(checked) => setParams("favorite", checked.toString())}
      />
      <Switch
        className="ml-2"
        label="Scenes"
        defaultChecked={fetchScenes}
        onCheckedChange={(checked) => setParams("scenes", checked.toString())}
      />
    </>
  );

  return (
    <List
      entityName="Scene Pairings"
      page={page}
      filters={filters}
      setPage={setPage}
      perPage={PER_PAGE}
      loading={loading}
      listCount={data?.queryPerformers?.count}
    >
      {fetchScenes ? (
        performers?.map((p, i) => (
          <Fragment key={p.id}>
            <PairingRow
              performerId={id}
              partner={p}
              sceneCount={p.queryScenes.count}
              firstPage={p.queryScenes.scenes ?? []}
              perPage={SCENES_PER_PAGE}
            />
            {i < performers.length - 1 && <hr />}
          </Fragment>
        ))
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {performers?.map((p) => (
            <div key={p.id}>
              <PerformerCard performer={p} />
              <div className="text-center text-muted-foreground mb-3">
                {p.queryScenes.count} scene{p.queryScenes.count !== 1 && "s"}{" "}
                together
              </div>
            </div>
          ))}
        </div>
      )}
    </List>
  );
};
