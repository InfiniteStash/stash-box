import {
  faBirthdayCake,
  faFlag,
  faVideo,
} from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { Link } from "react-router-dom";
import {
  FavoriteStar,
  GenderIcon,
  Icon,
  PerformerName,
  Thumbnail,
} from "src/components/fragments";
import type { SearchAllQuery } from "src/graphql";
import { getCountryByISO, getImage, performerHref } from "src/utils";

export type Performer = NonNullable<
  SearchAllQuery["searchPerformers"]["performers"][number]
>;

export const PerformerCard: FC<{ performer: Performer }> = ({ performer }) => (
  <Link to={performerHref(performer)} className="SearchPage-performer">
    <div className="flex flex-row gap-3 rounded-lg bg-card p-[10px] text-card-foreground hover:bg-accent">
      <Thumbnail
        orientation="portrait"
        image={getImage(performer.images, "portrait")}
        className="SearchPage-performer-image"
        size={300}
      />
      <div>
        <h4>
          <GenderIcon gender={performer?.gender} />
          <PerformerName performer={performer} />
          <FavoriteStar
            entity={performer}
            entityType="performer"
            className="pl-2"
          />
          {performer.aliases.length > 0 && (
            <h6>
              <small>Aliases: {performer.aliases.join(", ")}</small>
            </h6>
          )}
        </h4>
        <div>
          {performer.birth_date && (
            <div>
              <Icon icon={faBirthdayCake} />
              {performer.birth_date}
            </div>
          )}
          {performer.country && (
            <div>
              <Icon icon={faFlag} />
              {getCountryByISO(performer.country)}
            </div>
          )}
          <div>
            <Icon icon={faVideo} />
            {performer.scene_count} scene{performer.scene_count !== 1 && "s"}
          </div>
        </div>
      </div>
    </div>
  </Link>
);
