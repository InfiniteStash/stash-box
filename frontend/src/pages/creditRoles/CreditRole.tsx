import type { FC } from "react";
import { Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import DeleteButton from "src/components/deleteButton";
import { CreditRoleLink, TagLink } from "src/components/fragments";
import {
  ROUTE_CREDIT_ROLE_EDIT,
  ROUTE_CREDIT_ROLES,
} from "src/constants/route";
import { type GetCreditRolesQuery, useDeleteCreditRole } from "src/graphql";
import { useCurrentUser } from "src/hooks";
import { createHref } from "src/utils";
import { tagHref } from "src/utils/route";

type CreditRole = NonNullable<GetCreditRolesQuery["getCreditRoles"]>[number];

interface Props {
  creditRole: CreditRole;
}

const CreditRoleComponent: FC<Props> = ({ creditRole }) => {
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();

  const [deleteCreditRole, { loading: deleting }] = useDeleteCreditRole({
    onCompleted: (result) => {
      if (result) navigate(ROUTE_CREDIT_ROLES);
    },
  });

  const handleDelete = () => {
    deleteCreditRole({
      variables: {
        input: { id: creditRole.id },
      },
    });
  };

  return (
    <>
      <Link to={ROUTE_CREDIT_ROLES}>
        <h6 className="mb-4">&larr; Credit Role List</h6>
      </Link>
      <div className="d-flex">
        <h3 className="me-auto">
          <CreditRoleLink
            creditRole={{ id: creditRole.id.toString(), name: creditRole.name }}
          />
        </h3>
        {isAdmin && (
          <div className="ms-auto">
            <Link
              to={createHref(ROUTE_CREDIT_ROLE_EDIT, {
                id: creditRole.id.toString(),
              })}
              className="me-2"
            >
              <Button>Edit</Button>
            </Link>
            <DeleteButton
              onClick={handleDelete}
              disabled={deleting}
              message="Do you want to delete this credit role? This is only possible if no scene credits are using it."
            />
          </div>
        )}
      </div>
      <dl>
        <dt>Description:</dt>
        <dd>{creditRole.description || "N/A"}</dd>
        {creditRole.valid_tags && creditRole.valid_tags.length > 0 && (
          <>
            <dt>Valid Tags:</dt>
            <dd>
              {creditRole.valid_tags.map((tag) => (
                <span key={tag.id} className="me-2">
                  <TagLink
                    title={tag.name}
                    description={tag.description}
                    link={tagHref(tag)}
                    disabled
                  />
                </span>
              ))}
            </dd>
          </>
        )}
      </dl>
    </>
  );
};

export default CreditRoleComponent;
