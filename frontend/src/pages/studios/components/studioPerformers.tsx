import {
  faSortAmountDown,
  faSortAmountUp,
} from "@fortawesome/free-solid-svg-icons";
import { debounce } from "lodash-es";
import type { FC } from "react";
import { Icon } from "src/components/fragments";
import { List } from "src/components/list";
import PerformerCard from "src/components/performerCard";
import SceneCard from "src/components/sceneCard";
import { Button } from "src/components/ui/button";
import { ButtonGroup } from "src/components/ui/button-group";
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
import { usePagination, useQueryParams } from "src/hooks";
import { ensureEnum, resolveEnum } from "src/utils";

const PER_PAGE = 25;

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
  });

  const performers = data?.queryPerformers.performers;

  const debouncedHandler = debounce(setParams, 200);

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
      <ButtonGroup className="ml-2 mr-3">
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
      </ButtonGroup>
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
        <div key={p.id}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-3">
              <PerformerCard performer={p} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:col-span-9">
              {p.scenes.map((s) => (
                <SceneCard scene={s} key={s.id} />
              ))}
            </div>
          </div>
          {i < performers.length - 1 && <hr className="my-4 border-border" />}
        </div>
      ))}
    </List>
  );
};
