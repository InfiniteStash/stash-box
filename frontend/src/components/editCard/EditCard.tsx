import { faRobot } from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { Link } from "react-router-dom";
import { Icon, Tooltip } from "src/components/fragments";
import { Card, CardBody, CardHeader } from "src/components/ui/card";

import { type EditFragment, OperationEnum } from "src/graphql";

import { cn } from "src/lib/utils";
import { editHref, formatDateTime, formatOrdinals, userHref } from "src/utils";
import AddComment from "./AddComment";
import EditComment from "./EditComment";
import EditExpiration from "./EditExpiration";
import EditHeader from "./EditHeader";
import EditStatus from "./EditStatus";
import ModifyEdit from "./ModifyEdit";
import type { EditCardEdit } from "./types";
import VoteBar from "./VoteBar";
import Votes from "./Votes";

const CLASSNAME = "EditCard";

type Props = { showVotes?: boolean } & (
  | { edit: EditCardEdit; compact: true }
  | { edit: EditFragment; compact?: false }
);

const EditCardComponent: FC<Props> = (props) => {
  const { edit, showVotes = false } = props;
  const compact = props.compact === true;
  const title = `${edit.operation.toLowerCase()} ${edit.target_type.toLowerCase()}`;
  const created = new Date(edit.created);

  return (
    <Card className={cn(CLASSNAME, "mb-3")}>
      <CardHeader className="flex flex-row flex-wrap justify-between gap-4">
        <div className="flex flex-col">
          <Link to={editHref(edit)} className="text-link hover:underline">
            <h5 className="capitalize">{title.toLowerCase()}</h5>
          </Link>
          <div>
            <b className="mr-2">Author:</b>
            {edit.user ? (
              <Link
                to={userHref(edit.user)}
                className="text-link hover:underline"
              >
                <span>{edit.user.name}</span>
              </Link>
            ) : (
              <span>Deleted User</span>
            )}
            {edit.bot && (
              <Tooltip
                text="Edit submitted by an automated script"
                delay={50}
                placement="auto"
              >
                <span>
                  <Icon icon={faRobot} className="ml-2" />
                </span>
              </Tooltip>
            )}
          </div>
          <div>
            <b className="mr-2">Created:</b>
            <span>{formatDateTime(created)}</span>
          </div>
          {edit.updated && edit.update_count > 0 && (
            <div>
              <b className="mr-2">Updated:</b>
              <span>{formatDateTime(edit.updated)}</span>
              <small className="ml-2 align-text-top text-muted-foreground">{`${formatOrdinals(edit.update_count)} revision`}</small>
            </div>
          )}
        </div>
        <div className="flex flex-col text-right">
          <div>
            <b className="mr-2">Status:</b>
            <EditStatus {...edit} />
            <EditExpiration edit={edit} />
            {!compact && <VoteBar edit={edit} />}
          </div>
        </div>
      </CardHeader>
      <hr className="border-border" />
      <CardBody>
        <EditHeader edit={edit} compact={compact} />
        {props.compact ? (
          showVotes && <Votes edit={edit} />
        ) : (
          <>
            {props.edit.operation === OperationEnum.CREATE && (
              <ModifyEdit details={props.edit.details} />
            )}
            {props.edit.operation !== OperationEnum.CREATE && (
              <ModifyEdit
                details={props.edit.details}
                oldDetails={props.edit.old_details}
                options={props.edit.options ?? undefined}
              />
            )}
            <div className="mt-2 grid grid-cols-12">
              <div className="col-span-12 md:col-span-8 md:col-start-5">
                {showVotes && <Votes edit={edit} />}
                {(props.edit.comments ?? []).map((comment, index) => (
                  <EditComment
                    {...comment}
                    isPrimary={index === 0}
                    key={comment.id}
                  />
                ))}
                <AddComment editID={edit.id} />
              </div>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
};

export default EditCardComponent;
