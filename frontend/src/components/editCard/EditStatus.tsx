import type { FC } from "react";
import { Tooltip } from "src/components/fragments";
import { Badge } from "src/components/ui/badge";
import { EditStatusTypes } from "src/constants/enums";
import { VoteStatusEnum } from "src/graphql";
import { formatDateTime } from "src/utils";

interface Props {
  status: VoteStatusEnum;
  closed?: string | null;
}

const EditStatus: FC<Props> = ({ closed, status }) => {
  let editVariant: "warning" | "danger" | "success" = "warning";
  if (
    status === VoteStatusEnum.REJECTED ||
    status === VoteStatusEnum.IMMEDIATE_REJECTED ||
    status === VoteStatusEnum.FAILED ||
    status === VoteStatusEnum.CANCELED
  )
    editVariant = "danger";
  else if (
    status === VoteStatusEnum.ACCEPTED ||
    status === VoteStatusEnum.IMMEDIATE_ACCEPTED
  )
    editVariant = "success";

  let tooltip = "";
  switch (status) {
    case VoteStatusEnum.REJECTED:
      tooltip = "Edit did not get sufficient votes to pass.";
      break;
    case VoteStatusEnum.CANCELED:
      tooltip = "Edit was canceled by the editor.";
      break;
    case VoteStatusEnum.IMMEDIATE_REJECTED:
      tooltip = "Edit was canceled by an admin.";
      break;
    case VoteStatusEnum.FAILED:
      tooltip =
        "Edit application failed due to an error. See edit note for more details.";
      break;
  }

  const tooltipContent =
    closed || tooltip ? (
      <>
        {closed && (
          <div>
            Closed <b>{formatDateTime(closed)}</b>
          </div>
        )}
        {tooltip}
      </>
    ) : (
      ""
    );

  return (
    <Tooltip text={tooltipContent}>
      <Badge className="uppercase" variant={editVariant}>
        {EditStatusTypes[status]}
      </Badge>
    </Tooltip>
  );
};

export default EditStatus;
