import { FC } from "react";
import { Badge } from "react-bootstrap";

import {
  OperationEnum,
  TargetTypeEnum,
  VoteStatusEnum,
  useEdits,
} from "src/graphql";

const CLASSNAME = "PendingEditStatus";

interface Props {
  id: string;
  type: TargetTypeEnum;
}

export const PendingEditStatus: FC<Props> = ({ id, type }) => {
  const { data: pendingEdits } = useEdits({
    editFilter: {
      target_id: id,
      target_type: type,
      status: VoteStatusEnum.PENDING,
    },
  });

  if (!pendingEdits?.queryEdits?.edits || pendingEdits?.queryEdits?.count === 0)
    return <div>&nbsp;</div>;

  const editCount = pendingEdits.queryEdits.count;
  const hasDelete =
    pendingEdits.queryEdits.edits.find(
      (e) => e.operation === OperationEnum.DESTROY
    ) !== undefined;
  const hasMerge =
    pendingEdits.queryEdits.edits.find(
      (e) => e.operation === OperationEnum.MERGE && e.target?.id !== id
    ) !== undefined;

  const destructive = [
    ...(hasDelete ? ["deletion edit"] : []),
    ...(hasMerge ? ["merge edit"] : []),
  ];
  const destructiveMessage =
    destructive.length > 0
      ? `, including a ${destructive.join(" and a ")}`
      : "";
  const color = destructive.length > 0 ? "danger" : "warning";

  const typeText = type.charAt(0).toUpperCase() + type.toLowerCase().slice(1);

  return (
    <Badge bg={color} className={CLASSNAME}>
      {(hasDelete || hasMerge) && editCount === 1 ? (
        <span>{`${typeText} has a pending ${
          hasDelete ? "deletion" : "merge"
        } edit.`}</span>
      ) : (
        <span>{`${typeText} has ${editCount} pending edit${
          editCount > 1 ? "s" : ""
        }${destructiveMessage}`}</span>
      )}
    </Badge>
  );
};
