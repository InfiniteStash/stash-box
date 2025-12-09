import { type FC, useMemo } from "react";
import Select from "react-select";
import { useGetCreditRoles } from "src/graphql/queries";

interface CreditRoleOption {
  value: number;
  label: string;
  description?: string | null;
  tag?: { id: string; name: string };
}

interface RoleTagData {
  role: {
    id: number;
    name: string;
    description?: string | null;
  };
  scene_count: number;
  tags: Array<{
    tag: {
      id: string;
      name: string;
    };
    scene_count: number;
  }>;
}

interface CreditRoleSelectProps {
  value?: number | null;
  onChange: (creditRoleId: number | null) => void;
  isClearable?: boolean;
  placeholder?: string;
  /** Role and tag data with counts for grouped display */
  roleTagData?: RoleTagData[];
}

const CLASSNAME = "CreditRoleSelect";

const CreditRoleSelect: FC<CreditRoleSelectProps> = ({
  value,
  onChange,
  isClearable = true,
  placeholder = "Filter by role",
  roleTagData,
}) => {
  const { data: creditRolesData, loading } = useGetCreditRoles();
  const creditRoles = creditRolesData?.getCreditRoles ?? [];

  const options = useMemo(() => {
    if (roleTagData)
      return roleTagData.flatMap((rd) => [
        {
          value: rd.role.id,
          label: `${rd.role.name} (${rd.scene_count})`,
          description: rd.role.description,
        },
        ...rd.tags.map((t) => ({
          value: rd.role.id,
          label: `${t.tag.name} (${t.scene_count})`,
          description: null,
          tag: t.tag,
        })),
      ]);

    return creditRoles.map((role) => ({
      value: role.id,
      label: role.name,
      description: role.description,
    }));
  }, [roleTagData, creditRoles]);

  const selectedOption = options.find((o) => o.value === value);

  const handleChange = (option: CreditRoleOption | null) => {
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

export default CreditRoleSelect;
