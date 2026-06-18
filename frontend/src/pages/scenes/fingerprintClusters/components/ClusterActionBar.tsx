import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { Icon } from "src/components/fragments";
import { Button } from "src/components/ui/button";
import { useClusterPage } from "../ClusterPageContext";
import { multiSceneHashes } from "../utils";

export const ClusterActionBar: FC = () => {
  const { activeCluster, selection, moving, openMoveModal } = useClusterPage();
  const multiScene = multiSceneHashes(activeCluster);
  const selectedCount = selection.selectedHashes.size;
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant="secondary"
        onClick={selection.clear}
        disabled={selectedCount === 0}
      >
        Clear ({selectedCount})
      </Button>
      <div className="ml-auto flex gap-2">
        <Button
          size="sm"
          onClick={() => {
            selection.clear();
            selection.setMany(multiScene, true);
          }}
          disabled={multiScene.length === 0}
        >
          Select conflicting hashes ({multiScene.length})
        </Button>
        <Button
          size="sm"
          disabled={selectedCount === 0 || moving}
          onClick={openMoveModal}
        >
          <Icon icon={faArrowRight} className="mr-1" />
          Move hashes ({selectedCount})
        </Button>
      </div>
    </div>
  );
};
