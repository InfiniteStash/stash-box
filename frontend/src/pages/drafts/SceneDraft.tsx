import { type FC, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LoadingIndicator } from "src/components/fragments";
import { Alert } from "src/components/ui/alert";
import {
  type DraftQuery,
  FingerprintAlgorithm,
  OperationEnum,
  type SceneEditDetailsInput,
  useScene,
  useSceneEdit,
  useSites,
} from "src/graphql";
import { editHref } from "src/utils";
import { sceneHref } from "src/utils/route";
import { parseSceneDraft } from "./parse";

type Draft = NonNullable<DraftQuery["findDraft"]>;
type SceneDraft = Draft["data"] & { __typename: "SceneDraft" };

import SceneForm from "src/pages/scenes/sceneForm";

interface Props {
  draft: Omit<Draft, "data"> & { data: SceneDraft };
}

const SceneDraftAdd: FC<Props> = ({ draft }) => {
  const isUpdate = Boolean(draft.data.id);
  const navigate = useNavigate();
  const [submissionError, setSubmissionError] = useState("");
  const [submitSceneEdit, { loading: saving }] = useSceneEdit({
    onCompleted: (data) => {
      if (submissionError) setSubmissionError("");
      if (data.sceneEdit.id) navigate(editHref(data.sceneEdit));
    },
    onError: (error) => setSubmissionError(error.message),
  });
  const { data: scene, loading: loadingScene } = useScene(
    { id: draft.data.id ?? "" },
    !isUpdate,
  );

  const doInsert = (updateData: SceneEditDetailsInput, editNote: string) => {
    const details: SceneEditDetailsInput = {
      ...updateData,
      fingerprints: !isUpdate ? draft.data.fingerprints : undefined,
      draft_id: draft.id,
    };

    submitSceneEdit({
      variables: {
        sceneData: {
          edit: {
            id: draft.data.id,
            operation: isUpdate ? OperationEnum.MODIFY : OperationEnum.CREATE,
            comment: editNote,
          },
          details,
        },
      },
    });
  };
  const { data: sitesData, loading: loadingSites } = useSites();

  if (loadingScene || loadingSites) return <LoadingIndicator />;

  const [initialScene, unparsed] = parseSceneDraft(
    draft.data,
    scene?.findScene ?? undefined,
    sitesData?.querySites.sites ?? [],
  );
  const remainder = Object.entries(unparsed)
    .filter(([, val]) => !!val)
    .map(([key, val]) => (
      <li key={key}>
        <b className="mr-2">{key}:</b>
        <span>{val}</span>
      </li>
    ));

  const phashMissing =
    !isUpdate &&
    draft.data.fingerprints.filter(
      (f) => f.algorithm === FingerprintAlgorithm.PHASH,
    ).length === 0;

  return (
    <div>
      <h3>{isUpdate ? "Update" : "Add new"} scene from draft</h3>
      {isUpdate && scene?.findScene && (
        <h6>
          Scene:{" "}
          <Link
            to={sceneHref(scene.findScene)}
            className="text-link hover:underline"
          >
            {scene.findScene?.title}
          </Link>
        </h6>
      )}
      <hr className="border-border" />
      {remainder.length > 0 && (
        <>
          <h6>Unmatched data:</h6>
          <ul>{remainder}</ul>
          <hr className="border-border" />
        </>
      )}
      {phashMissing && (
        <div className="w-3/4">
          <Alert variant="warning">
            <b>Warning</b>: The draft does not include a perceptual hash (PHASH)
            for your scene, so it might not pass voting.
          </Alert>
        </div>
      )}
      <SceneForm
        scene={scene?.findScene ?? undefined}
        initial={initialScene}
        callback={doInsert}
        saving={saving}
        isCreate={!isUpdate}
        draftFingerprints={draft.data.fingerprints}
      />
      {submissionError && (
        <div className="w-3/4 text-right text-destructive">
          Error: {submissionError}
        </div>
      )}
    </div>
  );
};

export default SceneDraftAdd;
