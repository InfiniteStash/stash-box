import type { FC } from "react";
import { LoadingIndicator } from "src/components/fragments";
import { Card, CardBody } from "src/components/ui/card";
import { Label } from "src/components/ui/field";
import { SLIDER_MIN, SLIDER_STEP } from "../hooks/useClusterDistance";

interface Props {
  distance: number;
  max: number;
  loading: boolean;
  onChange: (n: number) => void;
}

export const ClusterDistanceCard: FC<Props> = ({
  distance,
  max,
  loading,
  onChange,
}) => (
  <Card className="mb-3">
    <CardBody>
      <div className="flex flex-wrap items-center gap-3">
        <Label htmlFor="cluster-distance" className="mb-0">
          Distance: {distance}
        </Label>
        <input
          id="cluster-distance"
          type="range"
          className="ClusterDistanceSlider"
          min={SLIDER_MIN}
          max={max}
          step={SLIDER_STEP}
          value={distance}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        {loading && <LoadingIndicator message="Computing clusters..." />}
      </div>
    </CardBody>
  </Card>
);
