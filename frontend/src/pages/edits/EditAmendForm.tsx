import { type FC, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AmendableModifyEdit,
  useAmendment,
} from "src/components/amendableEditCard";
import Title from "src/components/title";
import { Button } from "src/components/ui/button";
import { Card, CardBody, CardHeader } from "src/components/ui/card";
import { Textarea } from "src/components/ui/textarea";
import { EditOperationTypes, EditTargetTypes, ROUTE_EDIT } from "src/constants";
import type { AmendItemRemoval, EditFragment } from "src/graphql";
import { OperationEnum, useAmendEdit } from "src/graphql";
import { createHref, getEditDetailsName, getEditTargetName } from "src/utils";

export interface EditAmendFormProps {
  edit: EditFragment;
}

const EditAmendForm: FC<EditAmendFormProps> = ({ edit }) => {
  const navigate = useNavigate();
  const [amendEdit, { loading: amending }] = useAmendEdit();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { state, hasChanges } = useAmendment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!edit?.id || !reason.trim() || !hasChanges) return;

    setError(null);

    const removeFieldsArray = Array.from(state.removedFields);

    const removeAddedItemsArray: AmendItemRemoval[] = [];
    state.removedAddedItems.forEach((indices, field) => {
      if (indices.size > 0) {
        removeAddedItemsArray.push({
          field,
          indices: Array.from(indices),
        });
      }
    });

    const removeRemovedItemsArray: AmendItemRemoval[] = [];
    state.removedRemovedItems.forEach((indices, field) => {
      if (indices.size > 0) {
        removeRemovedItemsArray.push({
          field,
          indices: Array.from(indices),
        });
      }
    });

    try {
      await amendEdit({
        variables: {
          input: {
            id: edit.id,
            reason: reason.trim(),
            remove_fields: removeFieldsArray,
            remove_added_items: removeAddedItemsArray,
            remove_removed_items: removeRemovedItemsArray,
          },
        },
      });
      navigate(createHref(ROUTE_EDIT, { id: edit.id }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to amend edit");
    }
  };

  const targetName =
    edit.operation === OperationEnum.CREATE
      ? getEditDetailsName(edit.details)
      : getEditTargetName(edit.target);

  return (
    <div>
      <Title
        page={`Amend ${EditOperationTypes[edit.operation]} ${EditTargetTypes[edit.target_type]}${targetName && targetName !== "-" ? ` "${targetName}"` : ""}`}
      />
      <h3 className="text-2xl font-semibold">
        Amend Edit: {EditOperationTypes[edit.operation]}{" "}
        {EditTargetTypes[edit.target_type]}
        {targetName && targetName !== "-" && ` - ${targetName}`}
      </h3>
      <p className="text-muted-foreground">
        Click the X button next to any field or item to mark it for removal from
        this edit. Removed changes will appear dimmed.
      </p>

      <form onSubmit={handleSubmit}>
        <Card className="my-4">
          <CardHeader>
            <div>
              <strong>Edit Details</strong>
              <span className="ml-2 text-muted-foreground">
                (submitted by {edit.user?.name ?? "Unknown"})
              </span>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            <AmendableModifyEdit
              details={edit.details}
              oldDetails={edit.old_details}
              options={edit.options}
            />
          </CardBody>
        </Card>

        <Card className="my-4">
          <CardHeader>
            <strong>Amendment Reason</strong>
          </CardHeader>
          <CardBody className="pt-0">
            <Textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why these fields are being removed from the edit..."
              required
              disabled={amending}
            />
            {error && <div className="mt-3 text-destructive">{error}</div>}
          </CardBody>
        </Card>

        <div className="flex justify-end gap-2">
          <Link to={createHref(ROUTE_EDIT, edit)}>
            <Button variant="secondary" disabled={amending}>
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={!reason.trim() || !hasChanges || amending}
          >
            Amend Edit
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditAmendForm;
