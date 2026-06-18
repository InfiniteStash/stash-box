import { faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { Icon } from "src/components/fragments";
import { Button } from "src/components/ui/button";
import type { FingerprintAlgorithm } from "src/graphql";
import { formatDuration } from "src/utils";

interface Props {
  fingerprint: {
    hash: string;
    duration: number;
    algorithm: FingerprintAlgorithm;
  };
  deleteFingerprint: () => void;
}

export const UserFingerprint: FC<Props> = ({
  fingerprint,
  deleteFingerprint,
}) => (
  <li>
    <div key={fingerprint.hash}>
      <b className="mr-2">{fingerprint.algorithm}</b>
      {fingerprint.hash} ({formatDuration(fingerprint.duration)})
      <Button
        className="ml-2 text-destructive"
        title="Submitted by you - click to remove submission"
        onClick={deleteFingerprint}
        variant="link"
      >
        <Icon icon={faTimesCircle} />
      </Button>
    </div>
  </li>
);
