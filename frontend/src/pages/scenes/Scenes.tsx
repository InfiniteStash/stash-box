import type { FC } from "react";
import { Link } from "react-router-dom";
import { SceneList } from "src/components/list";
import { Button } from "src/components/ui/button";
import { ROUTE_SCENE_ADD } from "src/constants/route";
import { CriterionModifier, useConfig } from "src/graphql";
import { useCurrentUser, useQueryParams } from "src/hooks";
import { createHref } from "src/utils";

const Scenes: FC = () => {
  const { isEditor } = useCurrentUser();
  const { data: configData } = useConfig();
  const [{ fingerprint }] = useQueryParams({
    fingerprint: { name: "fingerprint", type: "string" },
  });
  const filter = fingerprint
    ? {
        fingerprints: {
          modifier: CriterionModifier.INCLUDES,
          value: [fingerprint],
        },
      }
    : undefined;

  return (
    <>
      <div className="mb-4 flex items-center">
        <h3 className="text-2xl font-semibold">Scenes</h3>
        {isEditor && !configData?.getConfig.require_scene_draft && (
          <Link to={createHref(ROUTE_SCENE_ADD)} className="ml-auto">
            <Button>Create</Button>
          </Link>
        )}
      </div>
      <SceneList filter={filter} favoriteFilter="all" />
    </>
  );
};

export default Scenes;
