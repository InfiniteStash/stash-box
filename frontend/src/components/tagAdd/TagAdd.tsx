import React from "react";
import { useMutation } from "@apollo/react-hooks";
import { useHistory } from "react-router-dom";
import { loader } from "graphql.macro";

import { Tag_findTag as Tag } from "src/definitions/Tag";
import { AddTagMutation as AddTag } from "src/definitions/AddTagMutation";
import { TagCreateInput } from "src/definitions/globalTypes";

import TagForm from "src/components/tagForm";

const AddTagMutation = loader("src/mutations/AddTag.gql");

const TagAddComponent: React.FC = () => {
  const history = useHistory();
  const [insertStudio] = useMutation<AddTag>(AddTagMutation, {
    onCompleted: (data) => {
      if (data.tagCreate?.name) history.push(`/tags/${data.tagCreate.name}`);
    },
  });

  const doInsert = (insertData: TagCreateInput) => {
    insertStudio({ variables: { tagData: insertData } });
  };

  const emptyTag = {
    id: "",
    name: "",
    description: "",
  } as Tag;

  return (
    <div>
      <h2>Add new tag</h2>
      <hr />
      <TagForm tag={emptyTag} callback={doInsert} />
    </div>
  );
};

export default TagAddComponent;
