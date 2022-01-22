import { FC } from "react";
import { addSeconds, formatDistance } from "date-fns";

import { Tooltip } from "src/components/fragments";
import { useConfig, VoteStatusEnum, EditFragment } from "src/graphql";

interface Props {
  edit: EditFragment;
}

const TooltipMessage: FC<{ pass: boolean; time: Date }> = ({ pass, time }) => (
  <span>
    If no other votes are cast the edit will{" "}
    <b className={pass ? "text-success" : "text-danger"}>
      {pass ? "pass" : "fail"}
    </b>{" "}
    at {time.toLocaleString()}
  </span>
);

const ExpirationNotification: FC<Props> = ({ edit }) => {
  const { data } = useConfig();
  const config = data?.getConfig;

  if (!config || edit.status !== VoteStatusEnum.PENDING) return <></>;

  // Pending edits that have reached the voting threshold have shorter voting periods.
  // This will happen for destructive edits, or when votes are not unanimous.
  const shortVotingPeriod =
    config.vote_application_threshold > 0 &&
    edit.vote_count >= config.vote_application_threshold;

  const expirationTime = addSeconds(
    new Date(edit.created),
    shortVotingPeriod
      ? config.min_destructive_voting_period
      : config.voting_period
  );
  const expirationDistance =
    expirationTime > new Date()
      ? formatDistance(expirationTime, new Date())
      : " a moment";

  const threshold = edit.destructive ? 1 : 0;
  const pass = shortVotingPeriod || edit.vote_count >= threshold;

  return (
    <div>
      <Tooltip
        delay={0}
        text={<TooltipMessage pass={pass} time={expirationTime} />}
      >
        <span>
          Voting closes in{" "}
          <b>
            <u>{expirationDistance}</u>
          </b>
        </span>
      </Tooltip>
    </div>
  );
};

export default ExpirationNotification;
