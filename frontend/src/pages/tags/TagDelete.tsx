import { yupResolver } from "@hookform/resolvers/yup";
import type { FC } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { EditNote } from "src/components/form";
import { Button } from "src/components/ui/button";

import {
  OperationEnum,
  type TagFragment as Tag,
  useTagEdit,
} from "src/graphql";
import { editHref } from "src/utils";
import * as yup from "yup";

const schema = yup.object({
  id: yup.string().required(),
  note: yup.string().required("An edit note is required."),
});
export type FormData = yup.Asserts<typeof schema>;

interface Props {
  tag: Tag;
}

const TagDelete: FC<Props> = ({ tag }) => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    mode: "onBlur",
  });
  const [deleteTagEdit, { loading: deleting }] = useTagEdit({
    onCompleted: (data) => {
      if (data.tagEdit.id) navigate(editHref(data.tagEdit));
    },
  });

  const handleDelete = (data: FormData) =>
    deleteTagEdit({
      variables: {
        tagData: {
          edit: {
            operation: OperationEnum.DESTROY,
            id: data.id,
            comment: data.note,
          },
        },
      },
    });

  return (
    <form className="TagDeleteForm" onSubmit={handleSubmit(handleDelete)}>
      <h4>
        Delete tag <em>{tag.name}</em>
      </h4>
      <input type="hidden" value={tag.id} {...register("id")} />
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

export default TagDelete;
