import { type FC, useState } from "react";

import { LoadingIndicator } from "src/components/fragments";
import Pagination from "src/components/pagination";
import PerformerCard from "src/components/performerCard";
import SceneCard from "src/components/sceneCard";
import { type PairingSceneFragment, usePairingScenes } from "src/graphql";

interface Props {
  performerId: string;
  partner: React.ComponentProps<typeof PerformerCard>["performer"];
  sceneCount: number;
  firstPage: PairingSceneFragment[];
  perPage: number;
}

// The first page arrives with the partner list, so only later pages query
export const PairingRow: FC<Props> = ({
  performerId,
  partner,
  sceneCount,
  firstPage,
  perPage,
}) => {
  const [page, setPage] = useState(1);

  const { data, loading } = usePairingScenes(
    {
      performerId,
      partnerId: partner.id,
      page,
      per_page: perPage,
    },
    page === 1,
  );

  const scenes =
    page === 1 ? firstPage : (data?.findPerformer?.queryScenes.scenes ?? []);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
      <div className="md:col-span-3">
        <PerformerCard performer={partner} />
      </div>
      <div className="md:col-span-9">
        <div className="flex items-start">
          <b className="mt-2">
            {new Intl.NumberFormat().format(sceneCount)} scenes together
          </b>
          {sceneCount > perPage && (
            <Pagination
              onClick={setPage}
              count={sceneCount}
              perPage={perPage}
              active={page}
            />
          )}
        </div>
        {loading ? (
          <LoadingIndicator message="Loading scenes..." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {scenes.map((scene) => (
              <div key={scene.id}>
                <SceneCard scene={scene} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
