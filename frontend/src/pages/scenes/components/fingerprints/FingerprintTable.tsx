import {
  faArrowRight,
  faProjectDiagram,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { type FC, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "src/components/fragments";
import { Button, buttonVariants } from "src/components/ui/button";
import { Table } from "src/components/ui/table";
import { ROUTE_SCENE_FINGERPRINT_CLUSTERS } from "src/constants/route";
import { useCurrentUser } from "src/hooks";
import { DeleteFingerprintsModal } from "./DeleteFingerprintsModal";
import { FingerprintTableHeader } from "./FingerprintTableHeader";
import { FingerprintTableRow } from "./FingerprintTableRow";
import { MoveFingerprintsModal } from "./MoveFingerprintsModal";
import type { FingerprintTableProps } from "./types";
import { useFingerprintOperations } from "./useFingerprintOperations";
import { useFingerprintSelection } from "./useFingerprintSelection";
import { useFingerprintSort } from "./useFingerprintSort";

export const FingerprintTable: FC<FingerprintTableProps> = ({ scene }) => {
  const { isModerator, isEditor } = useCurrentUser();
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    selectedFingerprints,
    toggleFingerprint,
    toggleFingerprintRange,
    toggleAllFingerprints,
    clearSelection,
  } = useFingerprintSelection();

  const { sortColumn, sortDirection, handleSort, sortedFingerprints } =
    useFingerprintSort(scene.fingerprints);

  const orderedHashes = useMemo(
    () => sortedFingerprints.map((fp) => fp.hash),
    [sortedFingerprints],
  );

  const handleSelect = (hash: string, shiftKey: boolean) => {
    if (shiftKey) toggleFingerprintRange(hash, orderedHashes);
    else toggleFingerprint(hash);
  };

  const {
    handleFingerprintUnmatch,
    handleMoveFingerprints,
    handleDeleteFingerprints,
    unmatching,
    moving,
    deleting,
  } = useFingerprintOperations(scene.id);

  const handleMove = async (targetSceneId: string) => {
    const fingerprints = scene.fingerprints
      .filter((fp) => selectedFingerprints.has(fp.hash))
      .map((fp) => ({
        hash: fp.hash,
        algorithm: fp.algorithm,
      }));

    const success = await handleMoveFingerprints(fingerprints, targetSceneId);
    if (success) {
      clearSelection();
      setShowMoveModal(false);
    }
    return success;
  };

  const handleDelete = async () => {
    const fingerprints = scene.fingerprints
      .filter((fp) => selectedFingerprints.has(fp.hash))
      .map((fp) => ({
        hash: fp.hash,
        algorithm: fp.algorithm,
      }));

    const success = await handleDeleteFingerprints(fingerprints);
    if (success) {
      clearSelection();
      setShowDeleteModal(false);
    }
    return success;
  };

  return (
    <div className="scene-fingerprints my-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="mb-0">Fingerprints:</h4>
        <div className="flex gap-2">
          {isEditor && scene.fingerprints.length > 0 && (
            <Link
              to={ROUTE_SCENE_FINGERPRINT_CLUSTERS.replace(":id", scene.id)}
              className={buttonVariants({ variant: "link", size: "sm" })}
            >
              <Icon icon={faProjectDiagram} className="mr-1" />
              View clusters
            </Link>
          )}
          {isModerator && scene.fingerprints.length > 0 && (
            <>
              <Button
                size="sm"
                disabled={selectedFingerprints.size === 0 || moving}
                onClick={() => setShowMoveModal(true)}
              >
                <Icon icon={faArrowRight} className="mr-1" />
                Move Selected ({selectedFingerprints.size})
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={selectedFingerprints.size === 0 || deleting}
                onClick={() => setShowDeleteModal(true)}
              >
                <Icon icon={faTrash} className="mr-1" />
                Delete Selected ({selectedFingerprints.size})
              </Button>
            </>
          )}
        </div>
      </div>
      {scene.fingerprints.length === 0 ? (
        <h6>No fingerprints found for this scene.</h6>
      ) : (
        <Table striped>
          <FingerprintTableHeader
            isModerator={isModerator}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            selectedCount={selectedFingerprints.size}
            totalCount={orderedHashes.length}
            onSort={handleSort}
            onToggleAll={() => toggleAllFingerprints(orderedHashes)}
          />
          <tbody>
            {sortedFingerprints.map((fingerprint) => (
              <FingerprintTableRow
                key={fingerprint.hash}
                fingerprint={fingerprint}
                isModerator={isModerator}
                isSelected={selectedFingerprints.has(fingerprint.hash)}
                unmatching={unmatching}
                onSelect={handleSelect}
                onUnmatch={handleFingerprintUnmatch}
              />
            ))}
          </tbody>
        </Table>
      )}

      <MoveFingerprintsModal
        show={showMoveModal}
        selectedCount={selectedFingerprints.size}
        moving={moving}
        onHide={() => setShowMoveModal(false)}
        onMove={handleMove}
      />

      <DeleteFingerprintsModal
        show={showDeleteModal}
        selectedCount={selectedFingerprints.size}
        deleting={deleting}
        onHide={() => setShowDeleteModal(false)}
        onDelete={handleDelete}
      />
    </div>
  );
};
