import type { FC } from "react";
import { useNavigate } from "react-router-dom";

import {
  type CreditRoleCreateInput,
  useCreateCreditRole,
  useCreditRoleSetTags,
} from "src/graphql";
import { creditRoleHref } from "src/utils/route";
import CreditRoleForm from "./creditRoleForm/CreditRoleForm";

type TagSlim = {
  id: string;
  name: string;
  description?: string | null;
  aliases: string[];
};

const AddCreditRole: FC = () => {
  const navigate = useNavigate();
  const [createCreditRole] = useCreateCreditRole();
  const [setTags] = useCreditRoleSetTags();

  const doInsert = async (
    insertData: CreditRoleCreateInput,
    tags: TagSlim[],
  ) => {
    try {
      const { data } = await createCreditRole({
        variables: {
          input: insertData,
        },
      });

      if (data?.creditRoleCreate?.id) {
        const roleId = data.creditRoleCreate.id;

        // Set tags if any were selected
        if (tags.length > 0) {
          await setTags({
            variables: {
              input: {
                role_id: roleId,
                tag_ids: tags.map((t) => t.id),
              },
            },
          });
        }

        navigate(creditRoleHref({ id: roleId.toString() }));
      }
    } catch (error) {
      console.error("Error creating credit role:", error);
    }
  };

  return (
    <div>
      <h3>Add new credit role</h3>
      <hr />
      <CreditRoleForm callback={doInsert} />
    </div>
  );
};

export default AddCreditRole;
