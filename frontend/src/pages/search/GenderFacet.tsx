import { faTimes } from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { GenderIcon, Icon } from "src/components/fragments";
import { Badge, badgeVariants } from "src/components/ui/badge";
import { GenderTypes } from "src/constants";
import type { GenderEnum, GenderFacet as GenderFacetType } from "src/graphql";
import { cn } from "src/lib/utils";

interface Props {
  genders: GenderFacetType[];
  selected?: GenderEnum | null;
  onClick?: (gender: GenderEnum | null) => void;
}

export const GenderFacet: FC<Props> = ({ genders, selected, onClick }) => {
  if (!genders || genders.length === 0) return null;

  return (
    <div className="SearchPage-facets">
      <small className="mr-2 text-muted-foreground">Gender:</small>
      <div className="flex flex-wrap gap-2">
        {genders.map((g) => {
          const isSelected = selected === g.gender;
          return (
            <button
              key={g.gender}
              type="button"
              className={cn(
                badgeVariants({
                  variant: isSelected ? "primary" : "secondary",
                }),
                "gap-1",
                onClick ? "cursor-pointer" : "cursor-default",
              )}
              onClick={() => onClick?.(isSelected ? null : g.gender)}
            >
              <GenderIcon gender={g.gender} />
              {GenderTypes[g.gender] ?? g.gender}
              <Badge variant="secondary" className="ml-1">
                {g.count}
              </Badge>
              {isSelected && <Icon icon={faTimes} className="ml-1" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
