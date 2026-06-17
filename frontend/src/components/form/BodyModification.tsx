import type { Lens } from "@hookform/lenses";
import { type ChangeEvent, type FC, type KeyboardEvent, useState } from "react";
import { useFieldArray } from "react-hook-form";
import { Button } from "src/components/ui/button";
import { Label } from "src/components/ui/field";
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
    <div key={mod.location} className="flex items-center gap-2">
      <span className="whitespace-nowrap text-sm font-bold">Location</span>
      <Input defaultValue={mod.location} readOnly className="w-40" />
      <Input
        defaultValue={mod.description ?? ""}
        placeholder={descriptionPlaceholder}
        className="flex-1"
        onInput={(e: ChangeEvent<HTMLInputElement>) =>
          update(index, {
            location: mod.location,
            description: e.currentTarget.value,
          })
        }
      />
      <Button variant="danger" size="sm" onClick={() => remove(index)}>
        Remove
      </Button>
    </div>
  ));

  return (
    <div className={`${CLASSNAME} mb-3`}>
      <Label className="capitalize">{name}</Label>
      <Input
        name={name}
        placeholder={locationPlaceholder}
        value={location}
        onChange={(e) => setLocation(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        onBlur={addLocation}
      />
      {modificationList.length > 0 && (
        <div className="mt-2 space-y-1">{modificationList}</div>
      )}
    </div>
  );
};

export default BodyModification;
