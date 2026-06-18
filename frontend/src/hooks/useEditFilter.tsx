import {
  faSortAmountDown,
  faSortAmountUp,
} from "@fortawesome/free-solid-svg-icons";
import { Icon } from "src/components/fragments";
import { Button } from "src/components/ui/button";
import { SelectCombobox } from "src/components/ui/combobox";
import { Label } from "src/components/ui/field";
import { Select } from "src/components/ui/select";
import { Switch } from "src/components/ui/switch";
import {
  EditOperationTypes,
  EditStatusTypes,
  EditTargetTypes,
  UserVotedFilterTypes,
} from "src/constants/enums";
import {
  EditSortEnum,
  OperationEnum,
  SortDirectionEnum,
  TargetTypeEnum,
  UserVotedFilterEnum,
  VoteStatusEnum,
} from "src/graphql";
import { useQueryParams } from "src/hooks";
import { ensureEnum, resolveEnum } from "src/utils";

const sortOptions = [
  { value: EditSortEnum.CREATED_AT, label: "Date created" },
  { value: EditSortEnum.CLOSED_AT, label: "Date closed" },
  { value: EditSortEnum.UPDATED_AT, label: "Date updated" },
];

const botOptions = [
  {
    label: "Include",
    value: "include",
  },
  {
    label: "Exclude",
    value: "exclude",
  },
  {
    label: "Only",
    value: "only",
  },
];

interface EditFilterProps {
  sort?: EditSortEnum;
  direction?: SortDirectionEnum;
  type?: TargetTypeEnum;
  status?: VoteStatusEnum;
  operation?: OperationEnum;
  voted?: UserVotedFilterEnum;
  favorite?: boolean;
  bot?: boolean;
  userSubmitted?: boolean;
  showFavoriteOption?: boolean;
  showVotedFilter?: boolean;
  defaultVoteStatus?: VoteStatusEnum | "all";
  defaultVoted?: UserVotedFilterEnum;
  defaultBot?: "include" | "exclude" | "only";
  defaultUserSubmitted?: boolean;
}

const useEditFilter = ({
  sort: fixedSort,
  direction: fixedDirection,
  type: fixedType,
  status: fixedStatus,
  operation: fixedOperation,
  voted: fixedVoted,
  favorite: fixedFavorite,
  bot: fixedBot,
  userSubmitted: fixedUserSubmitted,
  showFavoriteOption = true,
  showVotedFilter = true,
  defaultVoteStatus = "all",
  defaultVoted,
  defaultBot = "include",
  defaultUserSubmitted = true,
}: EditFilterProps) => {
  const [params, setParams] = useQueryParams({
    query: { name: "query", type: "string", default: "" },
    sort: { name: "sort", type: "string", default: EditSortEnum.CREATED_AT },
    direction: { name: "dir", type: "string", default: SortDirectionEnum.DESC },
    operation: { name: "operation", type: "string", default: "" },
    voted: {
      name: "voted",
      type: "string",
      default: defaultVoted,
    },
    status: { name: "status", type: "string", default: defaultVoteStatus },
    type: { name: "type", type: "string", default: "" },
    favorite: { name: "favorite", type: "string", default: "false" },
    bot: { name: "bot", type: "string", default: defaultBot },
    user_submitted: {
      name: "user_submitted",
      type: "string",
      default: defaultUserSubmitted.toString(),
    },
  });

  const sort = ensureEnum(EditSortEnum, params.sort);
  const direction = ensureEnum(SortDirectionEnum, params.direction);
  const operation = resolveEnum(OperationEnum, params.operation);
  const voted = resolveEnum(UserVotedFilterEnum, params.voted);
  const status = resolveEnum(VoteStatusEnum, params.status, undefined);
  const type = resolveEnum(TargetTypeEnum, params.type);
  const favorite = params.favorite === "true";
  const userSubmitted = params.user_submitted !== "false";

  const selectedSort = fixedSort ?? sort;
  const selectedDirection = fixedDirection ?? direction;
  const selectedStatus = fixedStatus ?? status;
  const selectedType = fixedType ?? type;
  const selectedOperation = fixedOperation ?? operation;
  const selectedVoted = fixedVoted ?? voted;
  const selectedFavorite = fixedFavorite ?? favorite;
  const selectedBot = fixedBot ?? params.bot;
  const selectedUserSubmitted = fixedUserSubmitted ?? userSubmitted;

  const enumToOptions = (e: Record<string, string>) =>
    Object.keys(e).map((key) => (
      <option key={key} value={key}>
        {e[key]}
      </option>
    ));

  const editFilter = (
    <div className="flex flex-wrap items-end gap-x-2 font-bold">
      <div className="mb-3 flex flex-col gap-1">
        <Label>Order</Label>
        <div className="flex gap-2">
          <Select
            onChange={(e) => setParams("sort", e.currentTarget.value)}
            defaultValue={selectedSort}
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
                selectedDirection === SortDirectionEnum.DESC
                  ? SortDirectionEnum.ASC
                  : SortDirectionEnum.DESC,
              )
            }
          >
            <Icon
              icon={
                selectedDirection === SortDirectionEnum.ASC
                  ? faSortAmountUp
                  : faSortAmountDown
              }
            />
          </Button>
        </div>
      </div>
      <div className="mb-3 flex flex-col gap-1">
        <Label>Type</Label>
        <Select
          onChange={(e) => setParams("type", e.currentTarget.value)}
          value={selectedType}
          disabled={!!fixedType}
        >
          <option value={""} key="all-targets">
            All
          </option>
          {enumToOptions(EditTargetTypes)}
        </Select>
      </div>
      <div className="mb-3 flex flex-col gap-1">
        <Label>Status</Label>
        <Select
          onChange={(e) => setParams("status", e.currentTarget.value)}
          value={selectedStatus}
          disabled={!!fixedStatus}
        >
          <option value="all" key="all-statuses">
            All
          </option>
          {enumToOptions(EditStatusTypes)}
        </Select>
      </div>
      <div className="mb-3 flex flex-col gap-1">
        <Label>Operation</Label>
        <Select
          onChange={(e) => setParams("operation", e.currentTarget.value)}
          value={selectedOperation}
          disabled={!!fixedOperation}
        >
          <option value="" key="all-operations">
            All
          </option>
          {enumToOptions(EditOperationTypes)}
        </Select>
      </div>
      {showVotedFilter && (
        <div className="mb-3 flex flex-col gap-1">
          <Label>Voted</Label>
          <Select
            onChange={(e) => setParams("voted", e.currentTarget.value)}
            value={selectedVoted}
            disabled={!!fixedVoted}
          >
            <option value="all" key="all-voted">
              All
            </option>
            {enumToOptions(UserVotedFilterTypes)}
          </Select>
        </div>
      )}
      {showFavoriteOption && (
        <div className="mb-3 flex flex-col gap-1 text-center">
          <Label>Favorites</Label>
          <Switch
            className="mt-2 justify-center"
            defaultChecked={favorite}
            onCheckedChange={(checked) =>
              setParams("favorite", checked.toString())
            }
          />
        </div>
      )}
      <div className="mb-3 ml-3 flex flex-col gap-1 text-center">
        <Label>Bot Edits</Label>
        <SelectCombobox
          className="BotFilter"
          onChange={(v) => setParams("bot", v ?? "")}
          options={botOptions}
          value={selectedBot ? String(selectedBot) : undefined}
        />
      </div>
      {fixedUserSubmitted === undefined && (
        <div className="mb-3 ml-3 flex flex-col gap-1 text-center">
          <Label>My Edits</Label>
          <Switch
            className="mt-2 justify-center"
            defaultChecked={userSubmitted}
            onCheckedChange={(checked) =>
              setParams("user_submitted", checked.toString())
            }
          />
        </div>
      )}
    </div>
  );

  return {
    editFilter,
    selectedSort,
    selectedDirection,
    selectedType,
    selectedStatus,
    selectedOperation,
    selectedVoted,
    selectedFavorite,
    selectedBot,
    selectedUserSubmitted,
  };
};

export default useEditFilter;
