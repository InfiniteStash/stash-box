import { type FC, useState } from "react";
import { Button, Card, Form } from "react-bootstrap";
import DeleteButton from "src/components/deleteButton";
import { LoadingIndicator } from "src/components/fragments";
import {
  type GetCreditAttributesQuery,
  useCreateCreditAttribute,
  useCreditAttributeSetCreditTypes,
  useDeleteCreditAttribute,
  useGetCreditAttributes,
  useGetCreditTypes,
  useUpdateCreditAttribute,
} from "src/graphql";
import { useCurrentUser } from "src/hooks";

type CreditAttribute = NonNullable<
  GetCreditAttributesQuery["getCreditAttributes"]
>[number];

interface FormProps {
  creditTypes: { id: number; name: string }[];
  initialName?: string;
  initialDescription?: string;
  initialTypeIds?: number[];
  onSave: (name: string, description: string, typeIds: number[]) => void;
  onCancel: () => void;
}

const CreditAttributeForm: FC<FormProps> = ({
  creditTypes,
  initialName = "",
  initialDescription = "",
  initialTypeIds = [],
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [typeIds, setTypeIds] = useState<Set<number>>(new Set(initialTypeIds));

  const toggleType = (id: number) => {
    setTypeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="my-2 p-2 border rounded">
      <Form.Control
        className="mb-2"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
      />
      <Form.Control
        className="mb-2"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.currentTarget.value)}
      />
      <div className="mb-2">
        <small className="text-muted d-block mb-1">
          Applicable credit types:
        </small>
        {creditTypes.map((ct) => (
          <Form.Check
            inline
            key={ct.id}
            type="checkbox"
            id={`attr-type-${ct.id}`}
            label={ct.name}
            checked={typeIds.has(ct.id)}
            onChange={() => toggleType(ct.id)}
          />
        ))}
      </div>
      <Button
        variant="primary"
        className="me-2"
        disabled={!name.trim()}
        onClick={() => onSave(name.trim(), description.trim(), [...typeIds])}
      >
        Save
      </Button>
      <Button variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
};

const CreditAttributeSection: FC = () => {
  const { isAdmin } = useCurrentUser();
  const { data, loading } = useGetCreditAttributes();
  const { data: typesData } = useGetCreditTypes();
  const [createCreditAttribute] = useCreateCreditAttribute();
  const [updateCreditAttribute] = useUpdateCreditAttribute();
  const [deleteCreditAttribute] = useDeleteCreditAttribute();
  const [setCreditTypes] = useCreditAttributeSetCreditTypes();

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const attributes = data?.getCreditAttributes ?? [];
  const creditTypes = typesData?.getCreditTypes ?? [];

  const handleCreate = async (
    name: string,
    description: string,
    typeIds: number[],
  ) => {
    const { data: created } = await createCreditAttribute({
      variables: { input: { name, description } },
    });
    const id = created?.creditAttributeCreate?.id;
    if (id != null) {
      await setCreditTypes({
        variables: { input: { attribute_id: id, credit_type_ids: typeIds } },
      });
    }
    setAdding(false);
  };

  const handleUpdate = async (
    id: number,
    name: string,
    description: string,
    typeIds: number[],
  ) => {
    await updateCreditAttribute({
      variables: { input: { id, name, description } },
    });
    await setCreditTypes({
      variables: { input: { attribute_id: id, credit_type_ids: typeIds } },
    });
    setEditingId(null);
  };

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex align-items-center">
        <h4 className="me-auto mb-0">Credit Attributes</h4>
        {isAdmin && !adding && (
          <Button size="sm" onClick={() => setAdding(true)}>
            Add
          </Button>
        )}
      </Card.Header>
      <Card.Body>
        {loading && <LoadingIndicator message="Loading credit attributes..." />}
        {adding && (
          <CreditAttributeForm
            creditTypes={creditTypes}
            onSave={handleCreate}
            onCancel={() => setAdding(false)}
          />
        )}
        <ul className="ps-0 mb-0">
          {attributes.map((attr: CreditAttribute) =>
            editingId === attr.id ? (
              <li key={attr.id} className="d-block">
                <CreditAttributeForm
                  creditTypes={creditTypes}
                  initialName={attr.name}
                  initialDescription={attr.description}
                  initialTypeIds={attr.credit_types.map((t) => t.id)}
                  onSave={(name, description, typeIds) =>
                    handleUpdate(attr.id, name, description, typeIds)
                  }
                  onCancel={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li
                key={attr.id}
                className="d-flex align-items-center py-1 border-bottom"
              >
                <b className="me-2">{attr.name}</b>
                {attr.credit_types.map((t) => (
                  <span key={t.id} className="badge bg-secondary me-1">
                    {t.name}
                  </span>
                ))}
                {attr.description && (
                  <small className="text-muted ms-2">{attr.description}</small>
                )}
                {isAdmin && (
                  <span className="ms-auto d-flex align-items-center">
                    <Button
                      size="sm"
                      variant="link"
                      onClick={() => setEditingId(attr.id)}
                    >
                      Edit
                    </Button>
                    <DeleteButton
                      onClick={() =>
                        deleteCreditAttribute({
                          variables: { input: { id: attr.id } },
                        })
                      }
                      message="Delete this credit attribute? This is only possible if no scene credits are using it."
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

export default CreditAttributeSection;
