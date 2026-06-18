import { faTrashCan, faVideo } from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { Link } from "react-router-dom";
import { Icon } from "src/components/fragments";
import { Button } from "src/components/ui/button";
import type {
  FingerprintAlgorithm,
  ScenesWithFingerprintsQuery,
} from "src/graphql";
import { formatDuration, sceneHref, studioHref } from "src/utils";
import { UserFingerprint } from "./UserFingerprint";

interface Props {
  scene: ScenesWithFingerprintsQuery["queryScenes"]["scenes"][number];
  deleteFingerprints: (
    fingerprints: {
      scene_id: string;
      hash: string;
      algorithm: FingerprintAlgorithm;
      duration: number;
    }[],
  ) => void;
}

const UserSceneLine: FC<Props> = ({ scene, deleteFingerprints }) => (
  <>
    <tr key={scene.id}>
      <td>
        <Button
          variant="link"
          className="text-destructive"
          onClick={() =>
            deleteFingerprints(
              scene.fingerprints.map((fp) => ({ ...fp, scene_id: scene.id })),
            )
          }
        >
          <Icon
            icon={faTrashCan}
            className="mr-1"
            title="Delete all of your submitted fingerprints for this scene"
          />
        </Button>
      </td>
      <td>
        <Link to={sceneHref(scene)} className="text-link hover:underline">
          {scene.title}
        </Link>
      </td>
      <td>
        {scene.studio && (
          <Link
            to={studioHref(scene.studio)}
            className="SceneCard-studio-name truncate text-link hover:underline"
          >
            <Icon icon={faVideo} className="mr-1" />
            {scene.studio.name}
          </Link>
        )}
      </td>
      <td>{scene.duration ? formatDuration(scene.duration) : ""}</td>
      <td>{scene.release_date}</td>
    </tr>
    <tr key={`${scene.id}-fps`}>
      <td colSpan={4}>
        <ul>
          {scene.fingerprints.map((fp) => (
            <UserFingerprint
              fingerprint={fp}
              deleteFingerprint={() =>
                deleteFingerprints([{ ...fp, scene_id: scene.id }])
              }
              key={fp.hash}
            />
          ))}
        </ul>
      </td>
    </tr>
  </>
);

export default UserSceneLine;
