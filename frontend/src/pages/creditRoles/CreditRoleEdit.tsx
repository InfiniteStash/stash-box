import type { FC } from "react";
import { useNavigate } from "react-router-dom";

import {
  type CreditRoleCreateInput,
  type GetCreditRolesQuery,
  useCreditRoleSetTags,
  useUpdateCreditRole,
} from "src/graphql";
import { creditRoleHref } from "src/utils/route";
import CreditRoleForm from "./creditRoleForm/CreditRoleForm";

type CreditRole = NonNullable<GetCreditRolesQuery["getCreditRoles"]>[number];

type TagSlim = {
  id: string;
  name: string;
  description?: string | null;
  aliases: string[];
};

interface Props {
  creditRole: CreditRole;
}

const UpdateCreditRole: FC<Props> = ({ creditRole }) => {
  const navigate = useNavigate();
  const [updateCreditRole] = useUpdateCreditRole();
  const [setTags] = useCreditRoleSetTags();

  const doUpdate = async (
    insertData: CreditRoleCreateInput,
    tags: TagSlim[],
  ) => {
    try {
      const { data } = await updateCreditRole({
        variables: {
          input: {
            id: creditRole.id,
            ...insertData,
          },
        },
      });

      if (data?.creditRoleUpdate?.id) {
        const roleId = data.creditRoleUpdate.id;

        // Always update tags (even if empty, to clear them)
        await setTags({
          variables: {
            input: {
              role_id: roleId,
              tag_ids: tags.map((t) => t.id),
            },
          },
        });

        navigate(creditRoleHref({ id: roleId.toString() }));
      }
    } catch (error) {
      console.error("Error updating credit role:", error);
    }
  };

  return (
    <div>
      <h3>
        Update <em>{creditRole.name}</em>
      </h3>
      <hr />
      <CreditRoleForm callback={doUpdate} creditRole={creditRole} />
    </div>
  );
};

export default UpdateCreditRole;
