import { faVideo } from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { Link } from "react-router-dom";
import { Icon, Thumbnail } from "src/components/fragments";
import { Card } from "src/components/ui/card";
import type { Scene, Studio } from "src/graphql";
import { formatDuration, getImage, sceneHref, studioHref } from "src/utils";

type Performance = Pick<
  Scene,
  "id" | "title" | "images" | "duration" | "release_date"
> & {
  studio?: Pick<Studio, "id" | "name"> | null;
};

const SceneCard: FC<{ scene: Performance }> = ({ scene }) => (
  <Card className="overflow-hidden">
    <Link to={sceneHref(scene)} className="block aspect-video bg-secondary">
      <Thumbnail
        alt={scene.title}
        image={getImage(scene.images, "landscape")}
        size={300}
        className="h-full w-full object-cover"
      />
    </Link>
    <div className="space-y-1 p-2">
      <div className="flex items-center gap-2">
        <Link
          className="min-w-0 flex-1"
          to={sceneHref(scene)}
          title={scene.title ?? ""}
        >
          <h6 className="truncate text-sm font-medium text-link hover:underline">
            {scene.title}
          </h6>
        </Link>
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {scene.duration ? formatDuration(scene.duration) : ""}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <strong className="text-foreground">{scene.release_date}</strong>
        {scene.studio && (
          <Link
            to={studioHref(scene.studio)}
            className="flex items-center gap-1 truncate text-link hover:underline"
          >
            <Icon icon={faVideo} />
            {scene.studio.name}
          </Link>
        )}
      </div>
    </div>
  </Card>
);

export default SceneCard;
