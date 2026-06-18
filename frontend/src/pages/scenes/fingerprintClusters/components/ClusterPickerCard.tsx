import type { FC } from "react";
import { Card, CardBody } from "src/components/ui/card";
import { useClusterPage } from "../ClusterPageContext";
import { ClusterCanvas } from "./ClusterCanvas";
import { ClusterList } from "./ClusterList";

export const ClusterPickerCard: FC = () => {
  const { activeCluster, switchTo, selection } = useClusterPage();
  return (
    <Card className="mb-3">
      <CardBody>
        <div className="ClusterPicker">
          <div className="ClusterPicker-list">
            <ClusterList
              onSelect={(index) => {
                if (switchTo(index)) selection.clear();
              }}
            />
          </div>
          <div className="ClusterPicker-canvas">
            {activeCluster ? (
              <ClusterCanvas />
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                Select a cluster from the list to inspect it.
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
