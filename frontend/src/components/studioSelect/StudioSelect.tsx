import { useApolloClient } from "@apollo/client/react";
import type { FC } from "react";
import { AsyncSelect } from "src/components/ui/combobox";
import {
  SortDirectionEnum,
  type StudioQuery,
  type StudioQueryVariables,
  StudioSortEnum,
  type StudiosQuery,
  type StudiosQueryVariables,
} from "src/graphql";
import StudioGQL from "src/graphql/queries/Studio.gql";
import StudiosGQL from "src/graphql/queries/Studios.gql";
import { isUUID } from "src/utils";

type Studio = NonNullable<StudioQuery["findStudio"]>;
type StudioParent = { id: string; name: string } | null;
type StudioSlim = Pick<Studio, "id" | "name"> & { parent?: StudioParent };

interface IOptionType {
  value: string;
  label: string;
  sublabel: string | undefined;
  parent: StudioParent;
}

interface StudioSelectProps {
  initialStudio?: StudioSlim | null;
  excludeStudio?: string;
  onChange: (studio: StudioSlim | null) => void;
  onBlur?: React.FocusEventHandler;
  networkSelect?: boolean;
  isClearable?: boolean;
  inputId?: string;
}

const StudioSelect: FC<StudioSelectProps> = ({
  initialStudio,
  excludeStudio,
  onChange,
  onBlur,
  networkSelect = false,
  isClearable = false,
  inputId,
}) => {
  const client = useApolloClient();

  const fetchStudios = async (term: string): Promise<IOptionType[]> => {
    const value = term.trim();
    if (isUUID(value)) {
      if (value === excludeStudio) {
        return [];
      }

      const { data } = await client.query<StudioQuery, StudioQueryVariables>({
        query: StudioGQL,
        variables: { id: value },
      });

      const studio = data?.findStudio;
      if (!studio || (networkSelect && studio.parent !== null)) {
        return [];
      }

      return [
        {
          value: studio.id,
          label: studio.name,
          sublabel: studio.parent?.name,
          parent: studio.parent ?? null,
        },
      ];
    }

    const { data } = await client.query<StudiosQuery, StudiosQueryVariables>({
      query: StudiosGQL,
      variables: {
        input: {
          name: term,
          has_parent: networkSelect ? false : undefined,
          page: 1,
          per_page: 25,
          sort: StudioSortEnum.NAME,
          direction: SortDirectionEnum.ASC,
        },
      },
    });

    if (!data) return [];

    return data?.queryStudios?.studios
      .map((s) => ({
        value: s.id,
        label: s.name,
        sublabel: s.parent?.name,
        parent: s.parent ?? null,
      }))
      .filter((s) => s.value !== excludeStudio);
  };

  const defaultValue: IOptionType | null = initialStudio
    ? {
        value: initialStudio.id,
        label: initialStudio.name,
        sublabel: initialStudio.parent?.name,
        parent: initialStudio.parent ?? null,
      }
    : null;

  const formatStudioName = (opt: IOptionType) => (
    <>
      <span>{opt.label}</span>
      {opt.sublabel && (
        <small className="ml-2 text-muted-foreground">
          &bull; {opt.sublabel}
        </small>
      )}
    </>
  );

  return (
    <AsyncSelect<IOptionType>
      inputId={inputId}
      onChange={(s) =>
        onChange(s ? { id: s.value, name: s.label, parent: s.parent } : null)
      }
      onBlur={onBlur}
      defaultValue={defaultValue}
      loadOptions={fetchStudios}
      placeholder="Search for studio"
      noOptionsMessage={(term) =>
        term === "" ? null : `No studios found for "${term}"`
      }
      isClearable={isClearable}
      renderOption={formatStudioName}
    />
  );
};

export default StudioSelect;
