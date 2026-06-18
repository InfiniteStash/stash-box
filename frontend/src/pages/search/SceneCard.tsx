import {
  faCalendar,
  faUsers,
  faVideo,
} from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { Link } from "react-router-dom";
import { Icon, Thumbnail } from "src/components/fragments";
import type { SearchAllQuery } from "src/graphql";
import { formatDuration, getImage, sceneHref } from "src/utils";

export type Scene = NonNullable<
  SearchAllQuery["searchScenes"]["scenes"][number]
>;

export const SceneCard: FC<{ scene: Scene }> = ({ scene }) => (
  <Link to={sceneHref(scene)} className="SearchPage-scene">
    <div className="flex flex-row gap-3 rounded-lg bg-card p-[10px] text-card-foreground hover:bg-accent">
      <Thumbnail
        image={getImage(scene.images, "landscape")}
        className="SearchPage-scene-image"
        size={300}
      />
      <div className="w-full">
        <h5>
          {scene.title}
          <small className="ml-2 text-muted-foreground">
            {formatDuration(scene.duration)}
          </small>
        </h5>
        <div>
          <div>
            <Icon icon={faCalendar} />
            {scene.release_date}
          </div>
          <div>
            <Icon icon={faVideo} />
            {scene.studio?.name ?? "Unknown"}
            <small className="ml-2 text-muted-foreground">{scene.code}</small>
          </div>
          {scene.performers.length > 0 && (
            <div>
              <Icon icon={faUsers} />
              {scene.performers.map((p) => p.as ?? p.performer.name).join(", ")}
            </div>
          )}
        </div>
      </div>
    </div>
  </Link>
);
