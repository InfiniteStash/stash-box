import React from "react";
import { useQuery } from "@apollo/client";
import { loader } from "graphql.macro";

import { useEditFilter, usePagination } from "src/hooks";
import Pagination from "src/components/pagination";
import {
  TargetTypeEnum,
  SortDirectionEnum,
  VoteStatusEnum,
  OperationEnum,
} from "src/definitions/globalTypes";
import { Edits, EditsVariables } from "src/definitions/Edits";
import { LoadingIndicator } from "src/components/fragments";
import EditCard from "src/components/editCard";

const EditsQuery = loader("src/queries/Edits.gql");

interface EditsProps {
  type?: TargetTypeEnum;
  id?: string;
  status?: VoteStatusEnum;
  operation?: OperationEnum;
}

const EditListComponent: React.FC<EditsProps> = ({
  id,
  type,
  status,
  operation,
}) => {
  const { page, setPage } = usePagination();
  const {
    editFilter,
    selectedType,
    selectedOperation,
    selectedStatus,
  } = useEditFilter({
    type,
    status,
    operation,
  });
  const { data, loading } = useQuery<Edits, EditsVariables>(EditsQuery, {
    variables: {
      filter: {
        page,
        per_page: 20,
        sort: "created_at",
        direction: SortDirectionEnum.DESC,
      },
      editFilter: {
        target_type: selectedType,
        target_id: id,
        status: selectedStatus,
        operation: selectedOperation,
      },
    },
  });
  if (loading) return <LoadingIndicator />;

  const totalPages = Math.ceil((data?.queryEdits?.count ?? 0) / 20);
  const edits =
    data?.queryEdits?.edits.map((edit) => (
      <EditCard edit={edit} key={edit.id} />
    )) ?? [];

  return (
    <>
      <div className="row no-gutters">
        <div className="col-8">{editFilter}</div>
        <div className="col-4 d-flex justify-content-end">
          <Pagination onClick={setPage} pages={totalPages} active={page} />
        </div>
      </div>
      <div>{edits}</div>
    </>
  );
};

export default EditListComponent;
