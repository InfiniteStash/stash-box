import type { FC } from "react";
import { cn } from "src/lib/utils";

export interface ChangeRowProps {
  name?: string;
  newValue?: string | number | null;
  oldValue?: string | number | null;
  showDiff?: boolean;
}

const ChangeRow: FC<ChangeRowProps> = ({
  name,
  newValue,
  oldValue,
  showDiff = false,
}) =>
  name && (newValue || oldValue) ? (
    <div className="ChangeRow mb-2 grid grid-cols-12 gap-x-3">
      <b className="col-span-2 pt-1 text-right">{name}</b>
      {showDiff && (
        <div className="col-span-5">
          <div className="EditDiff bg-destructive">{oldValue}</div>
        </div>
      )}
      <div className={showDiff ? "col-span-5" : "col-span-10"}>
        <div className={cn("EditDiff", showDiff && "bg-success")}>
          {newValue}
        </div>
      </div>
    </div>
  ) : null;

export default ChangeRow;
