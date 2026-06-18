import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { type FC, useState } from "react";
import { Icon } from "src/components/fragments";
import { Button } from "src/components/ui/button";
import { useVote, VoteStatusEnum, VoteTypeEnum } from "src/graphql";
import { useCurrentUser } from "src/hooks";
import { cn } from "src/lib/utils";
import type { EditCardEdit } from "./types";

const CLASSNAME = "VoteBar";
const CLASSNAME_SAVE = `${CLASSNAME}-save`;

const VOTE_OPTIONS = [
  { value: VoteTypeEnum.ACCEPT, label: "Yes", active: "bg-success text-white" },
  {
    value: VoteTypeEnum.REJECT,
    label: "No",
    active: "bg-destructive text-white",
  },
  {
    value: VoteTypeEnum.ABSTAIN,
    label: "Abstain",
    active: "bg-warning text-white",
  },
];

interface Props {
  edit: EditCardEdit;
}

const VoteBar: FC<Props> = ({ edit }) => {
  const { isVoter, isSelf } = useCurrentUser();
  const userVote = (edit.votes ?? []).find((v) => v.user?.id && isSelf(v.user));
  const [vote, setVote] = useState<VoteTypeEnum | null>(userVote?.vote ?? null);
  const [submitVote, { loading: savingVote }] = useVote();

  if (edit.status !== VoteStatusEnum.PENDING) return null;

  const currentVote = (
    <h6>
      <span className="me-2">Current Vote:</span>
      <span>{`${edit.vote_count > 0 ? "+" : ""}${
        edit.vote_count === 0 ? "-" : edit.vote_count
      }`}</span>
    </h6>
  );

  // Only show vote total for edit owner and users without vote role
  if (!isVoter || isSelf(edit.user)) return <div>{currentVote}</div>;

  const handleSave = () => {
    if (!vote) return;

    submitVote({
      variables: {
        input: {
          id: edit.id,
          vote,
        },
      },
    });
  };

  return (
    <div className={CLASSNAME}>
      <div className={CLASSNAME_SAVE}>
        {currentVote}
        {vote && vote !== userVote?.vote && (
          <Button
            variant="secondary"
            onClick={handleSave}
            disabled={savingVote}
          >
            <span className="me-2">Save</span>
            <Icon icon={faCheck} color="green" />
          </Button>
        )}
      </div>
      <div className="flex overflow-hidden rounded-md border border-input">
        {VOTE_OPTIONS.map(({ value, label, active }) => (
          <label
            key={value}
            className={cn(
              "cursor-pointer border-l border-input px-4 py-1.5 text-sm transition-colors first:border-l-0",
              vote === value ? active : "hover:bg-accent",
              userVote?.vote === value && "font-semibold",
            )}
          >
            <input
              type="radio"
              name={`${edit.id}-vote`}
              className="sr-only"
              checked={vote === value}
              onChange={() => setVote(value)}
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
};

export default VoteBar;
