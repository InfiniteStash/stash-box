import { useLazyQuery } from "@apollo/client/react";
import { faArrowRight, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { type FC, useState } from "react";
import { Icon } from "src/components/fragments";
import { Button } from "src/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "src/components/ui/dialog";
import { Label } from "src/components/ui/field";
import { Input } from "src/components/ui/input";
import { SceneDocument, type SceneQuery } from "src/graphql";
import { useToast } from "src/hooks";
import { extractIdFromUrl, formatDuration } from "src/utils";

interface Props {
  show: boolean;
  selectedCount: number;
  moving: boolean;
  onHide: () => void;
  onMove: (targetSceneId: string) => Promise<boolean | undefined>;
}

export const MoveFingerprintsModal: FC<Props> = ({
  show,
  selectedCount,
  moving,
  onHide,
  onMove,
}) => {
  const addToast = useToast();
  const [targetSceneId, setTargetSceneId] = useState("");
  const [targetScene, setTargetScene] = useState<
    SceneQuery["findScene"] | null
  >(null);

  const [fetchScene, { loading: loadingScene }] = useLazyQuery(SceneDocument);

  const handleTargetSceneIdChange = async (input: string) => {
    const id = extractIdFromUrl(input);
    setTargetSceneId(id);
    setTargetScene(null);

    if (id) {
      try {
        const result = await fetchScene({ variables: { id } });
        setTargetScene(result.data?.findScene ?? null);
      } catch {
        setTargetScene(null);
        addToast({
          variant: "danger",
          content: "Scene not found",
        });
      }
    }
  };

  const handleMove = async () => {
    if (!targetSceneId || selectedCount === 0) {
      addToast({
        variant: "danger",
        content: "Please select fingerprints and enter a target scene ID",
      });
      return;
    }

    const success = await onMove(targetSceneId);
    if (success) {
      setTargetSceneId("");
      setTargetScene(null);
    }
  };

  const handleClose = () => {
    setTargetSceneId("");
    setTargetScene(null);
    onHide();
  };

  return (
    <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogTitle>Move Fingerprint Submissions</DialogTitle>
        <p>Move {selectedCount} fingerprint submission(s) to another scene.</p>
        <div className="mb-3 flex flex-col gap-1">
          <Label htmlFor="move-target-scene">Target Scene ID</Label>
          <Input
            id="move-target-scene"
            type="text"
            placeholder="Enter scene ID"
            value={targetSceneId}
            onChange={(e) => handleTargetSceneIdChange(e.target.value)}
          />
        </div>
        {loadingScene && (
          <div className="my-3 text-center">
            <Icon icon={faSpinner} className="fa-spin" /> Loading scene...
          </div>
        )}
        {targetScene && (
          <div className="flex items-center rounded border border-border p-3">
            {targetScene.images.length > 0 && (
              <img
                src={targetScene.images[0].url}
                alt={targetScene.title || "Scene"}
                className="mr-3 h-20 w-[120px] object-cover"
              />
            )}
            <div>
              <h6 className="mb-1">{targetScene.title || "Untitled"}</h6>
              <small className="text-muted-foreground">
                {targetScene.studio?.name && `${targetScene.studio.name} • `}
                {targetScene.release_date}
                {targetScene.duration
                  ? ` • ${formatDuration(targetScene.duration)}`
                  : ""}
              </small>
            </div>
          </div>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={moving || !targetScene}>
            {moving ? (
              <>
                <Icon icon={faSpinner} className="mr-1 fa-spin" />
                Moving...
              </>
            ) : (
              <>
                <Icon icon={faArrowRight} className="mr-1" />
                Move
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
