import { sortBy } from "lodash-es";
import type { FC } from "react";
import { Button, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import { CreditRoleLink, LoadingIndicator } from "src/components/fragments";
import { ROUTE_CREDIT_ROLE_ADD } from "src/constants/route";
import { useGetCreditRoles } from "src/graphql";
import { useCurrentUser } from "src/hooks";

const CreditRoleList: FC = () => {
  const { isAdmin } = useCurrentUser();
  const { loading, data } = useGetCreditRoles();

  const creditRoles = sortBy(data?.getCreditRoles ?? [], (r) =>
    r.name.toLowerCase(),
  );

  return (
    <>
      <div className="d-flex">
        <h3 className="me-4">Credit Roles</h3>
        {isAdmin && (
          <Link to={ROUTE_CREDIT_ROLE_ADD} className="ms-auto">
            <Button>Create</Button>
          </Link>
        )}
      </div>
      <Card>
        <Card.Body className="p-4">
          {loading && <LoadingIndicator message="Loading credit roles..." />}
          <ul className="ps-0">
            {creditRoles.map((role) => (
              <li key={role.id} className="d-block">
                <CreditRoleLink
                  creditRole={{ id: role.id.toString(), name: role.name }}
                />
                {role.description && (
                  <span className="ms-2">
                    &bull;
                    <small className="ms-2">{role.description}</small>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Card.Body>
      </Card>
    </>
  );
};

export default CreditRoleList;
