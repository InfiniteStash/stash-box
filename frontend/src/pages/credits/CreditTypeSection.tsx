import { type FC, useState } from "react";
import { Button, Card, Form, InputGroup } from "react-bootstrap";
import DeleteButton from "src/components/deleteButton";
import { LoadingIndicator } from "src/components/fragments";
import {
  type GetCreditTypesQuery,
  useCreateCreditType,
  useDeleteCreditType,
  useGetCreditTypes,
  useUpdateCreditType,
} from "src/graphql";
import { useCurrentUser } from "src/hooks";

type CreditType = NonNullable<GetCreditTypesQuery["getCreditTypes"]>[number];

interface FormProps {
  initialName?: string;
  initialDescription?: string;
  onSave: (name: string, description: string) => void;
  onCancel: () => void;
}

const CreditTypeForm: FC<FormProps> = ({
  initialName = "",
  initialDescription = "",
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);

  return (
    <InputGroup className="my-2">
      <Form.Control
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
      />
      <Form.Control
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.currentTarget.value)}
      />
      <Button
        variant="primary"
        disabled={!name.trim()}
        onClick={() => onSave(name.trim(), description.trim())}
      >
        Save
      </Button>
      <Button variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
    </InputGroup>
  );
};

const CreditTypeSection: FC = () => {
  const { isAdmin } = useCurrentUser();
  const { data, loading } = useGetCreditTypes();
  const [createCreditType] = useCreateCreditType();
  const [updateCreditType] = useUpdateCreditType();
  const [deleteCreditType] = useDeleteCreditType();

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const creditTypes = data?.getCreditTypes ?? [];

  const handleCreate = (name: string, description: string) => {
    createCreditType({ variables: { input: { name, description } } });
    setAdding(false);
  };

  const handleUpdate = (id: number, name: string, description: string) => {
    updateCreditType({ variables: { input: { id, name, description } } });
    setEditingId(null);
  };

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex align-items-center">
        <h4 className="me-auto mb-0">Credit Types</h4>
        {isAdmin && !adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            Add
          </Button>
        )}
      </Card.Header>
      <Card.Body>
        {loading && <LoadingIndicator message="Loading credit types..." />}
        {adding && (
          <CreditTypeForm
            onSave={handleCreate}
            onCancel={() => setAdding(false)}
          />
        )}
        <ul className="ps-0 mb-0">
          {creditTypes.map((ct: CreditType) =>
            editingId === ct.id ? (
              <li key={ct.id} className="d-block">
                <CreditTypeForm
                  initialName={ct.name}
                  initialDescription={ct.description}
                  onSave={(name, description) =>
                    handleUpdate(ct.id, name, description)
                  }
                  onCancel={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li
                key={ct.id}
                className="d-flex align-items-center py-1 border-bottom"
              >
                <b className="me-2">{ct.name}</b>
                {ct.description && (
                  <small className="text-muted">{ct.description}</small>
                )}
                {isAdmin && (
                  <span className="ms-auto d-flex align-items-center">
                    <Button
                      size="sm"
                      variant="link"
                      onClick={() => setEditingId(ct.id)}
                    >
                      Edit
                    </Button>
                    <DeleteButton
                      onClick={() =>
                        deleteCreditType({
                          variables: { input: { id: ct.id } },
                        })
                      }
                      message="Delete this credit type? This is only possible if no scene credits are using it."
                    />
                  </span>
                )}
              </li>
            ),
          )}
        </ul>
      </Card.Body>
    </Card>
  );
};

export default CreditTypeSection;
