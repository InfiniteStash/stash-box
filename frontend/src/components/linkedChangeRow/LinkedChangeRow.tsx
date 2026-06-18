import type { FC } from "react";
import { Link } from "react-router-dom";
import { cn } from "src/lib/utils";

interface Change {
  name: string | null | undefined;
  link: string | null | undefined;
}

interface LinkedChangeRowProps {
  name: string;
  oldEntity?: Change | null;
  newEntity?: Change | null;
  showDiff?: boolean;
}

const LinkedChangeRow: FC<LinkedChangeRowProps> = ({
  name,
  newEntity,
  oldEntity,
  showDiff = false,
}) => {
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
    <div className="ChangeRow mb-2 grid grid-cols-12 gap-x-3">
      <b className="col-span-2 pt-1 text-right">{name}</b>
      {showDiff && (
        <div className="col-span-5" key={oldEntity?.name}>
          <div className="EditDiff bg-destructive">{getValue(oldEntity)}</div>
        </div>
      )}
      <div
        className={showDiff ? "col-span-5" : "col-span-10"}
        key={newEntity?.name}
      >
        <div className={cn("EditDiff", showDiff && "bg-success")}>
          {getValue(newEntity)}
        </div>
      </div>
    </div>
  );
};

export default LinkedChangeRow;
