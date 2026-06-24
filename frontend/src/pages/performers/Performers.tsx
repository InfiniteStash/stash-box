import {
  faSortAmountDown,
  faSortAmountUp,
} from "@fortawesome/free-solid-svg-icons";
import { debounce } from "lodash-es";
import type { FC } from "react";
import { Link } from "react-router-dom";
import { ErrorMessage, Icon } from "src/components/fragments";
import { List } from "src/components/list";
import PerformerCard from "src/components/performerCard";
import { Button } from "src/components/ui/button";
import { ButtonGroup } from "src/components/ui/button-group";
import { SelectCombobox } from "src/components/ui/combobox";
import { Input } from "src/components/ui/input";
import { Select } from "src/components/ui/select";
import { Switch } from "src/components/ui/switch";
import { GenderFilterTypes, ROUTE_PERFORMER_ADD } from "src/constants";
import {
  GenderFilterEnum,
  PerformerSortEnum,
  SortDirectionEnum,
  usePerformers,
} from "src/graphql";
import { useCurrentUser, usePagination, useQueryParams } from "src/hooks";
import { ensureEnum, resolveEnum } from "src/utils";

const PER_PAGE = 25;

const genderOptions = Object.entries(GenderFilterEnum).map(([, value]) => ({
  value,
  label: GenderFilterTypes[value],
}));
const sortOptions = [
  { value: PerformerSortEnum.NAME, label: "Name" },
  { value: PerformerSortEnum.BIRTHDATE, label: "Birthdate" },
  { value: PerformerSortEnum.SCENE_COUNT, label: "Scene Count" },
  { value: PerformerSortEnum.CAREER_START_YEAR, label: "Career Start" },
  { value: PerformerSortEnum.DEBUT, label: "Scene Debut" },
  { value: PerformerSortEnum.LAST_SCENE, label: "Latest Scene" },
  { value: PerformerSortEnum.POPULARITY, label: "Popularity" },
  { value: PerformerSortEnum.CREATED_AT, label: "Created At" },
  { value: PerformerSortEnum.UPDATED_AT, label: "Updated At" },
];

const PerformersComponent: FC = () => {
  const { isEditor } = useCurrentUser();
  const [params, setParams] = useQueryParams({
    query: { name: "query", type: "string", default: "" },
    gender: { name: "gender", type: "string" },
    direction: { name: "dir", type: "string", default: SortDirectionEnum.ASC },
    sort: { name: "sort", type: "string", default: PerformerSortEnum.NAME },
    favorite: { name: "favorite", type: "string", default: "false" },
  });
  const gender = resolveEnum(GenderFilterEnum, params.gender);
  const direction = ensureEnum(SortDirectionEnum, params.direction);
  const sort = ensureEnum(PerformerSortEnum, params.sort);
  const favorite = params.favorite === "true" || undefined;
  const { page, setPage } = usePagination();
  const { loading, data } = usePerformers({
    input: {
      names: params.query,
      gender,
      is_favorite: favorite,
      page,
      per_page: PER_PAGE,
      sort,
      direction,
    },
  });

  if (!loading && !data)
    return <ErrorMessage error="Failed to load performers" />;

  const performers = (data?.queryPerformers.performers ?? []).map(
    (performer) => <PerformerCard performer={performer} key={performer.id} />,
  );

  const debouncedHandler = debounce(setParams, 200);

  const filters = (
    <>
      <Input
        id="performer-name"
        onChange={(e) => debouncedHandler("query", e.currentTarget.value)}
        placeholder="Filter performer name"
        defaultValue={params.query}
        className="w-full sm:w-56"
      />
      <SelectCombobox
        inputId="performer-gender"
        options={genderOptions}
        value={gender}
        placeholder="Gender"
        isClearable
        onChange={(v) => setParams("gender", v ?? undefined)}
        className="w-40"
      />
      <ButtonGroup>
        <Select
          defaultValue={sort ?? "name"}
          onChange={(e) =>
            setParams("sort", e.currentTarget.value.toLowerCase())
          }
        >
          {sortOptions.map((s) => (
            <option value={s.value} key={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
        <Button
          variant="secondary"
          aria-label="Toggle sort direction"
          onClick={() =>
            setParams(
              "direction",
              direction === SortDirectionEnum.ASC
                ? SortDirectionEnum.DESC
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
        id="favorite"
        label="Only favorites"
        defaultChecked={favorite}
        onCheckedChange={(checked) => setParams("favorite", checked.toString())}
      />
    </>
  );

  return (
    <>
      <div className="mb-4 flex items-center">
        <h3 className="text-2xl font-semibold">Performers</h3>
        {isEditor && (
          <Link to={ROUTE_PERFORMER_ADD} className="ml-auto">
            <Button>Create</Button>
          </Link>
        )}
      </div>
      <List
        entityName="performers"
        page={page}
        filters={filters}
        setPage={setPage}
        perPage={PER_PAGE}
        loading={loading}
        listCount={data?.queryPerformers.count}
      >
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {performers}
        </div>
      </List>
    </>
  );
};

export default PerformersComponent;
