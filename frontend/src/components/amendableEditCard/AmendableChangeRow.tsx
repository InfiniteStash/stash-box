import { faUndo, faXmark } from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";

import { Icon } from "src/components/fragments";
import { Button } from "src/components/ui/button";
import { cn } from "src/lib/utils";
import { useAmendment } from "./AmendmentContext";

export interface AmendableChangeRowProps {
  name?: string;
  field: string;
  newValue?: string | number | null;
  oldValue?: string | number | null;
  showDiff?: boolean;
}

const AmendableChangeRow: FC<AmendableChangeRowProps> = ({
  name,
  field,
  newValue,
  oldValue,
  showDiff = false,
}) => {
  const { state, clearField, restoreField } = useAmendment();
  const isRemoved = state.removedFields.has(field);

  if (!name || (!newValue && !oldValue)) return null;

  return (
    <div
      className={cn(
        "mb-2 grid grid-cols-12 gap-x-3",
        isRemoved && "line-through opacity-50",
      )}
    >
      <b className="col-span-2 pt-1 text-right">{name}</b>
      {showDiff && (
        <div className="col-span-4">
          <div className="EditDiff bg-destructive">{oldValue}</div>
        </div>
      )}
      <div className={showDiff ? "col-span-4" : "col-span-8"}>
        <div className={cn("EditDiff", showDiff && "bg-success")}>
          {newValue}
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

export default AmendableChangeRow;
