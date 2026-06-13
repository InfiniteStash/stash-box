import { type FC, useMemo } from "react";
import Select from "react-select";
import { useGetCreditTypes } from "src/graphql/queries";

interface CreditTypeOption {
  value: number;
  label: string;
  description?: string | null;
}

interface CreditTypeSelectProps {
  value?: number | null;
  onChange: (creditTypeId: number | null) => void;
  isClearable?: boolean;
  placeholder?: string;
}

const CLASSNAME = "CreditTypeSelect";

const CreditTypeSelect: FC<CreditTypeSelectProps> = ({
  value,
  onChange,
  isClearable = true,
  placeholder = "Filter by credit type",
}) => {
  const { data, loading } = useGetCreditTypes();
  const creditTypes = data?.getCreditTypes ?? [];

  const options = useMemo(
    () =>
      creditTypes.map((ct) => ({
        value: ct.id,
        label: ct.name,
        description: ct.description,
      })),
    [creditTypes],
  );

  const selectedOption = options.find((o) => o.value === value);

  const handleChange = (option: CreditTypeOption | null) => {
    onChange(option?.value ?? null);
  };

  return (
    <Select
      classNamePrefix="react-select"
      className={`react-select ${CLASSNAME}`}
      value={selectedOption}
      onChange={handleChange}
      options={options}
      isClearable={isClearable}
      isLoading={loading}
      placeholder={placeholder}
    />
  );
};

export default CreditTypeSelect;
