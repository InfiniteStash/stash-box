import type { FC } from "react";
import { Link } from "react-router-dom";
import {
  FavoriteStar,
  GenderIcon,
  PerformerName,
  Thumbnail,
} from "src/components/fragments";
import { Card } from "src/components/ui/card";
import type { Performer } from "src/graphql";
import { cn } from "src/lib/utils";
import { getImage, performerHref } from "src/utils";

type PerformerType = Pick<
  Performer,
  "id" | "name" | "images" | "gender" | "is_favorite" | "deleted"
>;

interface PerformerCardProps {
  performer: PerformerType;
  className?: string;
}

const PerformerCard: FC<PerformerCardProps> = ({ className, performer }) => (
  <Card className={cn("overflow-hidden", className)}>
    <Link to={performerHref(performer)} className="block">
      <div className="relative aspect-[2/3] bg-secondary">
        <Thumbnail
          image={getImage(performer.images, "portrait")}
          alt={performer.name}
          size={300}
          orientation="portrait"
          className="h-full w-full object-cover"
        />
        <FavoriteStar
          entity={performer}
          entityType="performer"
          className="absolute right-2 top-2"
        />
      </div>
      <div className="p-2">
        <h5 className="flex items-center gap-1.5 truncate text-sm font-medium">
          <GenderIcon gender={performer.gender} />
          <PerformerName performer={performer} />
        </h5>
      </div>
    </Link>
  </Card>
);

export default PerformerCard;
