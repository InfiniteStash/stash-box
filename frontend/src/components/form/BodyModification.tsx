import type { Lens } from "@hookform/lenses";
import { type ChangeEvent, type FC, type KeyboardEvent, useState } from "react";
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import { useFieldArray } from "react-hook-form";
import { Input } from "src/components/ui/input";

export type BodyModItem = {
  location: string;
  description?: string | null | undefined;
};

interface BodyModificationProps {
  name: string;
  lens: Lens<BodyModItem[]>;
  locationPlaceholder: string;
  descriptionPlaceholder: string;
  formatLabel: (text: string) => string;
}

const CLASSNAME = "BodyModification";

const BodyModification: FC<BodyModificationProps> = ({
  name,
  locationPlaceholder,
  descriptionPlaceholder,
  lens,
}) => {
  const interop = lens.interop();
  const {
    fields: modifications,
    append,
    remove,
    update,
  } = useFieldArray({
    control: interop.control,
    name: interop.name,
    keyName: "key",
  });

  const [location, setLocation] = useState("");

  const isNewLocationValid = (inputValue: string): boolean =>
    !!inputValue &&
    !modifications.find(({ location: loc }) => inputValue === loc);

  const addLocation = () => {
    const value = location.trim();
    if (isNewLocationValid(value)) append({ location: value });
    setLocation("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addLocation();
    }
  };

  const modificationList = modifications.map((mod, index) => (
    <Row key={mod.location} className="mb-1">
      <InputGroup className="col">
        <InputGroup.Text className="fw-bold">Location</InputGroup.Text>
        <Form.Control defaultValue={mod.location} readOnly />
        <Form.Control
          defaultValue={mod.description ?? ""}
          placeholder={descriptionPlaceholder}
          onInput={(e: ChangeEvent<HTMLInputElement>) =>
            update(index, {
              location: mod.location,
              description: e.currentTarget.value,
            })
          }
        />
        <Button variant="danger" onClick={() => remove(index)}>
          Remove
        </Button>
      </InputGroup>
    </Row>
  ));

  return (
    <>
      <Row className={CLASSNAME}>
        <Col className="mb-3">
          <Form.Label className="text-capitalize">{name}</Form.Label>
          <Input
            name={name}
            placeholder={locationPlaceholder}
            value={location}
            onChange={(e) => setLocation(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            onBlur={addLocation}
          />
        </Col>
      </Row>
      {modificationList}
    </>
  );
};

export default BodyModification;
