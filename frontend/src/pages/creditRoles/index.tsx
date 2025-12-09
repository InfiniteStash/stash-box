import type { FC } from "react";
import { Route, Routes, useParams } from "react-router-dom";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import Title from "src/components/title";
import { useGetCreditRoles } from "src/graphql";

import CreditRole from "./CreditRole";
import CreditRoleAdd from "./CreditRoleAdd";
import CreditRoleEdit from "./CreditRoleEdit";
import CreditRoles from "./CreditRoles";

const CreditRoleLoader: FC = () => {
  const { id } = useParams();
  const { data, loading } = useGetCreditRoles();

  if (loading) return <LoadingIndicator message="Loading credit role..." />;

  if (!id) return <ErrorMessage error="Credit Role ID is missing" />;

  const creditRole = data?.getCreditRoles?.find((r) => r.id.toString() === id);
  if (!creditRole) return <ErrorMessage error="Credit Role not found." />;

  return (
    <Routes>
      <Route
        path="/edit"
        element={
          <>
            <Title page={`Edit Credit Role "${creditRole.name}"`} />
            <CreditRoleEdit creditRole={creditRole} />
          </>
        }
      />
      <Route
        path="/"
        element={
          <>
            <Title page={`Credit Role "${creditRole.name}"`} />
            <CreditRole creditRole={creditRole} />
          </>
        }
      />
    </Routes>
  );
};

const CreditRoleRoutes: FC = () => (
  <Routes>
    <Route
      path="/"
      element={
        <>
          <Title page="Credit Roles" />
          <CreditRoles />
        </>
      }
    />
    <Route
      path="/add"
      element={
        <>
          <Title page="Add Credit Role" />
          <CreditRoleAdd />
        </>
      }
    />
    <Route path="/:id/*" element={<CreditRoleLoader />} />
  </Routes>
);

export default CreditRoleRoutes;
