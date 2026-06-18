import { faUndo, faXmark } from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { Link } from "react-router-dom";

import { Icon } from "src/components/fragments";
import { Button } from "src/components/ui/button";
import { cn } from "src/lib/utils";
import { useAmendment } from "./AmendmentContext";

interface Change {
  name: string | null | undefined;
  link: string | null | undefined;
}

interface AmendableLinkedChangeRowProps {
  name: string;
  field: string;
  oldEntity?: Change | null;
  newEntity?: Change | null;
  showDiff?: boolean;
}

const AmendableLinkedChangeRow: FC<AmendableLinkedChangeRowProps> = ({
  name,
  field,
  newEntity,
  oldEntity,
  showDiff = false,
}) => {
  const { state, clearField, restoreField } = useAmendment();
  const isRemoved = state.removedFields.has(field);

  function getValue(value: Change | null | undefined) {
    if (!value?.name) {
      return;
    }

    if (!value.link) {
      return value.name;
    }

    return (
      <Link to={value.link} className="text-link hover:underline">
        {value.name}
      </Link>
    );
  }

  if (!newEntity?.link && !oldEntity?.link) return null;

  return (
    <div
      className={cn(
        "mb-2 grid grid-cols-12 gap-x-3",
        isRemoved && "line-through opacity-50",
      )}
    >
      <b className="col-span-2 pt-1 text-right">{name}</b>
      {showDiff && (
        <div className="col-span-4" key={oldEntity?.name}>
          <div className="EditDiff bg-destructive">{getValue(oldEntity)}</div>
        </div>
      )}
      <div
        className={showDiff ? "col-span-4" : "col-span-8"}
        key={newEntity?.name}
      >
        <div className={cn("EditDiff", showDiff && "bg-success")}>
          {getValue(newEntity)}
        </div>
      </div>
      <div className="col-span-2 text-right">
        {!isRemoved && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => clearField(field)}
            title={`Remove ${name} change`}
          >
            <Icon icon={faXmark} />
          </Button>
        )}
        {isRemoved && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => restoreField(field)}
            title={`Restore ${name} change`}
          >
            <Icon icon={faUndo} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default AmendableLinkedChangeRow;
