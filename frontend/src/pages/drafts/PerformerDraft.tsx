import { FC } from "react";
import { useHistory } from "react-router-dom";

import {
  usePerformerEdit,
  OperationEnum,
  PerformerEditDetailsInput,
  PerformerFragment,
  PerformerDraftFragment,
  DraftFragment,
} from "src/graphql";
import { editHref } from "src/utils";
import { parsePerformerDraft } from "./parse";

import PerformerForm from "src/pages/performers/performerForm";

interface Props {
  draft: Omit<DraftFragment, "data"> & { data: PerformerDraftFragment };
}

const AddPerformerDraft: FC<Props> = ({ draft }) => {
  const history = useHistory();
  const [submitPerformerEdit, { loading: saving }] = usePerformerEdit({
    onCompleted: (data) => {
      if (data.performerEdit.id) history.push(editHref(data.performerEdit));
    },
  });

  const doInsert = (
    updateData: PerformerEditDetailsInput,
    editNote: string
  ) => {
    const details = {
      ...updateData,
      draft_id: draft.id,
    };
    submitPerformerEdit({
      variables: {
        performerData: {
          edit: {
            operation: OperationEnum.CREATE,
            comment: editNote,
          },
          details,
        },
      },
    });
  };

  const [initialPerformer, unparsed] = parsePerformerDraft(draft.data);
  const remainder = Object.entries(unparsed)
    .filter(([, val]) => !!val)
    .map(([key, val]) => (
      <li key={key}>
        <b className="me-2">{key}:</b>
        <span>{val}</span>
      </li>
    ));

  const emptyPerformer = {
    id: "",
    age: null,
    name: "",
    breast_type: null,
    disambiguation: null,
    gender: null,
    birthdate: null,
    career_start_year: null,
    career_end_year: null,
    height: null,
    measurements: {
      waist: null,
      hip: null,
      band_size: null,
      cup_size: null,
      __typename: "Measurements",
    },
    country: null,
    ethnicity: null,
    eye_color: null,
    hair_color: null,
    tattoos: null,
    piercings: null,
    aliases: [],
    urls: [],
    images: [],
    deleted: false,
    is_favorite: false,
    __typename: "Performer",
  } as PerformerFragment;

  return (
    <div>
      <h3>Add new performer draft</h3>
      <hr />
      {remainder.length > 0 && (
        <>
          <h6>Unmatched data:</h6>
          <ul>{remainder}</ul>
          <hr />
        </>
      )}
      <PerformerForm
        performer={emptyPerformer}
        callback={doInsert}
        changeType="create"
        saving={saving}
        initial={initialPerformer}
      />
    </div>
  );
};

export default AddPerformerDraft;
