import { faCheck, faVideo, faXmark } from "@fortawesome/free-solid-svg-icons";
import { type FC, useMemo } from "react";
import { Link } from "react-router-dom";
import { Icon } from "src/components/fragments";
import { OperationEnum } from "src/graphql";
import {
  getEditTargetName,
  getEditTargetRoute,
  isPerformer,
  isScene,
  isSceneEdit,
  performerHref,
  studioHref,
} from "src/utils";
import type { EditCardEdit, EditCardTarget } from "./types";

const linkClass = "text-link hover:underline";

const renderTargetLink = (obj?: EditCardTarget | null) => {
  if (!obj) return null;

  if (isPerformer(obj)) {
    return (
      <Link to={performerHref(obj)} className={linkClass}>
        {obj.name}
        {obj.disambiguation && (
          <small className="ml-1 text-muted-foreground">
            ({obj.disambiguation})
          </small>
        )}
      </Link>
    );
  } else {
    return (
      <Link to={getEditTargetRoute(obj)} className={linkClass}>
        {getEditTargetName(obj)}
      </Link>
    );
  }
};

const renderTargetAddendum = (obj?: EditCardTarget | null) => {
  if (isScene(obj) && obj?.studio)
    return (
      <>
        <span className="mx-2">•</span>
        <Icon icon={faVideo} className="mr-1" />
        <Link to={studioHref(obj.studio)} className={linkClass}>
          {obj.studio.name}
        </Link>
      </>
    );
  return null;
};

const Label: FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="col-span-2 text-right font-bold">{children}</div>
);

interface EditHeaderProps {
  edit: EditCardEdit;
  compact?: boolean;
}

const EditHeader: FC<EditHeaderProps> = ({ edit, compact = false }) => {
  const header = useMemo(() => {
    switch (edit.operation) {
      case OperationEnum.MODIFY:
        if (!edit.target) return null;
        return (
          <>
            <Label>Modifying {edit.target_type.toLowerCase()}</Label>
            <div className="col-span-10">
              {renderTargetLink(edit.target)}
              {renderTargetAddendum(edit.target)}
            </div>
          </>
        );

      case OperationEnum.CREATE:
        if (edit.applied) {
          return (
            <>
              <Label>Created {edit.target_type.toLowerCase()}</Label>
              <div className="col-span-10 pl-3">
                {renderTargetLink(edit.target)}
                {renderTargetAddendum(edit.target)}
              </div>
            </>
          );
        }

        // For unapplied CREATE edits, show scene info from details if available
        if (compact && isSceneEdit(edit.details) && edit.details.title) {
          return (
            <>
              <Label>Creating {edit.target_type.toLowerCase()}</Label>
              <div className="col-span-10 pl-3">
                <span>{edit.details.title}</span>
                {edit.details.studio && (
                  <>
                    <span className="mx-2">•</span>
                    <Icon icon={faVideo} className="mr-1" />
                    <Link
                      to={studioHref(edit.details.studio)}
                      className={linkClass}
                    >
                      {edit.details.studio.name}
                    </Link>
                  </>
                )}
              </div>
            </>
          );
        }

        return null;

      case OperationEnum.MERGE:
        if (!edit.target) return null;
        return (
          <div className="col-span-12 grid grid-cols-12 gap-x-2 gap-y-1">
            <Label>Merge</Label>
            <div className="col-span-10">
              {edit.merge_sources?.map((target) => (
                <div key={target.id}>
                  {renderTargetLink(target)}
                  {renderTargetAddendum(edit.target)}
                </div>
              ))}
            </div>
            <Label>Into</Label>
            <div className="col-span-10">
              {renderTargetLink(edit.target)}
              {renderTargetAddendum(edit.target)}
            </div>
            {isPerformer(edit.target) && (
              <div className="col-span-10 col-start-3 flex items-center">
                <Icon
                  icon={edit.options?.set_merge_aliases ? faCheck : faXmark}
                  color={edit.options?.set_merge_aliases ? "green" : "red"}
                />
                <span className="ml-1">
                  Set performance aliases to old name
                </span>
              </div>
            )}
          </div>
        );

      case OperationEnum.DESTROY:
        if (!edit.target) return null;
        return (
          <>
            <Label>Deleting</Label>
            <div className="col-span-10">
              <span className="EditDiff bg-destructive">
                {renderTargetLink(edit.target)}
              </span>
              {renderTargetAddendum(edit.target)}
            </div>
          </>
        );
    }
  }, [edit, compact]);

  return header ? (
    <div className="mb-4 grid grid-cols-12 gap-x-2">{header}</div>
  ) : null;
};

export default EditHeader;
