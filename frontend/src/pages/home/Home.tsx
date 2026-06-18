import cx from "classnames";
import type { FC } from "react";
import { Link } from "react-router-dom";
import { LoadingIndicator } from "src/components/fragments";

import SceneCard from "src/components/sceneCard";
import { ROUTE_SCENES } from "src/constants";
import {
  SceneSortEnum,
  SortDirectionEnum,
  useScenesWithoutCount,
} from "src/graphql";

const CLASSNAME = "HomePage";
const CLASSNAME_SCENES = `${CLASSNAME}-scenes`;

const ScenesComponent: FC = () => {
  const { data: sceneData, loading: loadingRecent } = useScenesWithoutCount({
    input: {
      page: 1,
      per_page: 20,
      sort: SceneSortEnum.CREATED_AT,
      direction: SortDirectionEnum.DESC,
    },
  });
  const { data: trendingData, loading: loadingTrending } =
    useScenesWithoutCount({
      input: {
        page: 1,
        per_page: 20,
        sort: SceneSortEnum.TRENDING,
        direction: SortDirectionEnum.DESC,
      },
    });

  if (loadingTrending) return <LoadingIndicator message="Loading..." />;

  const scenes = (sceneData?.queryScenes?.scenes ?? []).map((scene) => (
    <SceneCard scene={scene} key={scene.id} />
  ));
  const trendingScenes = (trendingData?.queryScenes?.scenes ?? []).map(
    (scene) => <SceneCard scene={scene} key={scene.id} />,
  );

  return (
    <div className={cx(CLASSNAME, "mx-4")}>
      {trendingScenes.length > 0 && (
        <>
          <h4>
            <Link
              to={`${ROUTE_SCENES}?sort=trending`}
              className="text-link hover:underline"
            >
              Trending scenes
            </Link>
          </h4>
          <div className={`${CLASSNAME_SCENES} gap-4`}>{trendingScenes}</div>
        </>
      )}
      {!loadingRecent && (
        <>
          <h4>
            <Link
              to={`${ROUTE_SCENES}?sort=created_at`}
              className="text-link hover:underline"
            >
              Recently added scenes
            </Link>
          </h4>
          <div className={`${CLASSNAME_SCENES} gap-4`}>{scenes}</div>
        </>
      )}
    </div>
  );
};

export default ScenesComponent;
