import {
  faSortAmountDown,
  faSortAmountUp,
} from "@fortawesome/free-solid-svg-icons";
import { type FC, Fragment } from "react";
import { Icon } from "src/components/fragments";
import { List } from "src/components/list";
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
  useStudioPerformers,
} from "src/graphql";
import { useDebouncedCallback, usePagination, useQueryParams } from "src/hooks";
import { ensureEnum, resolveEnum } from "src/utils";
import { StudioPerformerRow } from "./studioPerformerRow";

const PER_PAGE = 25;
const SCENES_PER_PAGE = 12;

const genderOptions = Object.entries(GenderFilterEnum).map(([, value]) => ({
  value,
  label: GenderFilterTypes[value],
}));
const sortOptions = [
  { value: PerformerSortEnum.LAST_SCENE, label: "Latest Scene" },
  { value: PerformerSortEnum.DEBUT, label: "First Scene" },
  { value: PerformerSortEnum.NAME, label: "Name" },
  { value: PerformerSortEnum.SCENE_COUNT, label: "Scene Count" },
];

interface Props {
  id: string;
}

export const StudioPerformers: FC<Props> = ({ id }) => {
  const [params, setParams] = useQueryParams({
    query: { name: "query", type: "string", default: "" },
    gender: { name: "gender", type: "string" },
    direction: { name: "dir", type: "string", default: SortDirectionEnum.DESC },
    sort: {
      name: "sort",
      type: "string",
      default: PerformerSortEnum.LAST_SCENE,
    },
    favorite: { name: "favorite", type: "string", default: "false" },
  });
  const gender = resolveEnum(GenderFilterEnum, params.gender);
  const direction = ensureEnum(SortDirectionEnum, params.direction);
  const sort = ensureEnum(PerformerSortEnum, params.sort);
  const favorite = params.favorite === "true" || undefined;
  const names = params.query || undefined;
  const { page, setPage } = usePagination();

  const { data, loading } = useStudioPerformers({
    studioId: id,
    gender,
    favorite,
    names,
    page,
    per_page: PER_PAGE,
    sort,
    direction,
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
        label="Only favorites"
        defaultChecked={favorite}
        onCheckedChange={(checked) => setParams("favorite", checked.toString())}
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
      {performers?.map((p, i) => (
        <Fragment key={p.id}>
          <StudioPerformerRow
            studioId={id}
            performer={p}
            sceneCount={p.queryScenes.count}
            firstPage={p.queryScenes.scenes}
            perPage={SCENES_PER_PAGE}
          />
          {i < performers.length - 1 && <hr />}
        </Fragment>
      ))}
    </List>
  );
};
