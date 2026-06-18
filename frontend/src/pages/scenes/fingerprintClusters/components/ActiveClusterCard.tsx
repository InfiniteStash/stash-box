import type { FC } from "react";
import { Card, CardBody } from "src/components/ui/card";
import { useClusterPage } from "../ClusterPageContext";
import { ClusterActionBar } from "./ClusterActionBar";
import { ClusterMembersTable } from "./ClusterMembersTable";

export const ActiveClusterCard: FC = () => {
  const { clusters, activeCluster, activeIndex, isModerator } =
    useClusterPage();
  if (!activeCluster) return null;
  return (
    <Card className="mb-3">
      <CardBody>
        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Showing cluster {activeIndex + 1} of {clusters.length}
          </span>
        </div>

        {isModerator && <ClusterActionBar />}

        <ClusterMembersTable />
      </CardBody>
    </Card>
  );
};
