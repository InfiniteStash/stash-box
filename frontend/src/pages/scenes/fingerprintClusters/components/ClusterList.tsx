import {
  faClock,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";
import type { FC } from "react";
import { Icon } from "src/components/fragments";
import { Badge } from "src/components/ui/badge";
import { useClusterPage } from "../ClusterPageContext";
import { clusterDurationLabel, clusterSceneSummaries } from "../utils";
import { SceneChip } from "./SceneChip";

interface Props {
  onSelect: (index: number) => void;
}

const truncate = (s: string, n: number) =>
  s.length > n ? `${s.slice(0, n - 1)}…` : s;

export const ClusterList: FC<Props> = ({ onSelect }) => {
  const { clusters, activeIndex, seedSceneId, paletteFor } = useClusterPage();
  if (clusters.length === 0) {
    return (
      <div className="py-3 text-center text-muted-foreground">
        No clusters found.
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {clusters.map((c, i) => {
        const isActive = i === activeIndex;
        const sceneSummaries = clusterSceneSummaries(c);
        const totalSubs = sceneSummaries.reduce(
          (s, x) => s + x.submissionCount,
          0,
        );
        const memberCount = c.members.length;
        const durationLabel = clusterDurationLabel(c);
        const warn = sceneSummaries.some((s) => s.scene.id !== seedSceneId);
        return (
          <button
            key={c.members[0].hash}
            type="button"
            onClick={() => onSelect(i)}
            className={cx("ClusterListItem", {
              "ClusterListItem-active": isActive,
            })}
          >
            <div className="mb-1 flex items-center gap-2">
              <strong>Cluster {i + 1}</strong>
              {warn && (
                <Badge variant="warning">
                  <Icon icon={faExclamationTriangle} className="mr-1" />
                  cross-scene
                </Badge>
              )}
            </div>
            <div className="mb-2 text-sm text-muted-foreground">
              <div>
                <span className="whitespace-nowrap">
                  {memberCount} phash{memberCount === 1 ? "" : "es"}
                </span>
                {" · "}
                <span className="whitespace-nowrap">
                  {totalSubs} submission{totalSubs === 1 ? "" : "s"}
                </span>
              </div>
              {durationLabel && (
                <div>
                  <Icon icon={faClock} className="mr-1" />
                  {durationLabel}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {sceneSummaries.map((s) => (
                <SceneChip
                  key={s.scene.id}
                  color={paletteFor(s.scene.id)}
                  isSeed={s.scene.id === seedSceneId}
                  title={s.scene.title || "Untitled"}
                >
                  {truncate(s.scene.title || "Untitled", 22)} · {s.memberCount}
                </SceneChip>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
};
