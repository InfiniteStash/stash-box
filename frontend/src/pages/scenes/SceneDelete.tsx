import { yupResolver } from "@hookform/resolvers/yup";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { EditNote } from "src/components/form";
import { Button } from "src/components/ui/button";

import {
  OperationEnum,
  type SceneFragment as Scene,
  useSceneEdit,
} from "src/graphql";
import { editHref } from "src/utils";
import * as yup from "yup";

const schema = yup.object({
  id: yup.string().required(),
  note: yup.string().required("An edit note is required."),
});
export type FormData = yup.Asserts<typeof schema>;

interface Props {
  scene: Scene;
}

const SceneDelete: FC<Props> = ({ scene }) => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    mode: "onBlur",
  });
  const [deleteSceneEdit, { loading: deleting }] = useSceneEdit({
    onCompleted: (data) => {
      if (data.sceneEdit.id) navigate(editHref(data.sceneEdit));
    },
  });

  const handleDelete = (data: FormData) =>
    deleteSceneEdit({
      variables: {
        sceneData: {
          edit: {
            operation: OperationEnum.DESTROY,
            id: data.id,
            comment: data.note,
          },
        },
      },
    });

  return (
    <form className="SceneDeleteForm" onSubmit={handleSubmit(handleDelete)}>
      <h4>
        Delete scene <em>{scene.title}</em>
      </h4>
      <input type="hidden" value={scene.id} {...register("id")} />
      <div className="my-4 md:w-1/2">
        <EditNote register={register} error={errors.note} />
        <div className="mt-2 flex gap-2">
          <Button
            variant="danger"
            className="ml-auto"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled
            className="hidden"
            aria-hidden="true"
          />
          <Button type="submit" disabled={deleting}>
            Submit Edit
          </Button>
        </div>
      </div>
    </form>
  );
};

export default SceneDelete;
