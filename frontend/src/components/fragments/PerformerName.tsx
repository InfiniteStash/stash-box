import type { FC } from "react";
import type { PerformerFragment } from "src/graphql";

interface PerformerNameProps {
  performer: Pick<PerformerFragment, "name" | "disambiguation" | "deleted">;
  as?: string | null;
}

const PerformerName: FC<PerformerNameProps> = ({ performer, as }) => {
  if (!as)
    return (
      <>
        {performer.deleted ? (
          <del>{performer.name}</del>
        ) : (
          <span>{performer.name}</span>
        )}
        {performer.disambiguation && (
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            ({performer.disambiguation})
          </span>
        )}
      </>
    );
  return (
    <>
      <span>{as}</span>
      <span className="ml-1 text-xs font-normal text-muted-foreground">
        ({performer.name})
        {performer.disambiguation && (
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            ({performer.disambiguation})
          </span>
        )}
      </span>
    </>
  );
};

export default PerformerName;
