import type { FC } from "react";
import { useSearchParams } from "react-router-dom";
import { LoadingIndicator } from "src/components/fragments";
import { useSearchAll } from "src/graphql";

import { PerformerCard } from "./PerformerCard";
import { SceneCard } from "./SceneCard";

export const SearchAll: FC = () => {
  const [searchParams] = useSearchParams();
  const term = searchParams.get("q") ?? "";

  const { data, loading } = useSearchAll({ term, limit: 10 }, !term);

  if (!term) return null;

  if (loading) {
    return <LoadingIndicator message="Searching..." />;
  }

  if (!data) return null;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <h3>Performers</h3>
        <div>
          {data.searchPerformers.performers.map((p) => (
            <PerformerCard performer={p} key={p.id} />
          ))}
        </div>
      </div>
      <div>
        <h3>Scenes</h3>
        {data.searchScenes.scenes.map((s) => (
          <SceneCard scene={s} key={s.id} />
        ))}
      </div>
    </div>
  );
};
