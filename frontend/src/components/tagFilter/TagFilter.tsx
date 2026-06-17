import { useApolloClient } from "@apollo/client/react";
import type { FC } from "react";
import { AsyncSelect, type ComboboxOption } from "src/components/ui/combobox";
import {
  type SearchTagsQuery,
  type SearchTagsQueryVariables,
  useTag,
} from "src/graphql";
import SearchTagsGQL from "src/graphql/queries/SearchTags.gql";

type Tag = NonNullable<SearchTagsQuery["query"][number]>;

interface TagFilterProps {
  tag: string;
  onChange: (tag: Tag | undefined) => void;
  excludeTags?: string[];
  allowDeleted?: boolean;
}

interface TagOption extends ComboboxOption {
  tag: Tag;
  sublabel: string;
}

const TagFilter: FC<TagFilterProps> = ({
  tag: tagId,
  onChange,
  excludeTags = [],
  allowDeleted = false,
}) => {
  const client = useApolloClient();
  const { data: tagData } = useTag({ id: tagId }, !tagId);
  const selectedTag = tagData?.findTag;

  const handleSearch = async (term: string): Promise<TagOption[]> => {
    const { data } = await client.query<
      SearchTagsQuery,
      SearchTagsQueryVariables
    >({
      query: SearchTagsGQL,
      variables: { term, limit: 25 },
    });

    const { exact, query } = data ?? {};

    const exactResult: TagOption[] =
      exact &&
      (allowDeleted || !exact.deleted) &&
      !excludeTags.includes(exact.id)
        ? [
            {
              value: exact.id,
              label: exact.name,
              sublabel: exact.description ?? "",
              tag: exact,
            },
          ]
        : [];

    const queryResults: TagOption[] = (query ?? [])
      .filter(
        (tag) =>
          !excludeTags.includes(tag.id) &&
          (allowDeleted || !tag.deleted) &&
          tag.id !== exact?.id,
      )
      .map((tag) => ({
        value: tag.id,
        label: tag.name,
        sublabel: tag.description ?? "",
        tag,
      }));

    return [...exactResult, ...queryResults];
  };

  const renderOption = (opt: TagOption) => (
    <div title={opt.tag.aliases.map((a) => `• ${a}`).join("\n")}>
      <div>{opt.tag.deleted ? <del>{opt.label}</del> : opt.label}</div>
      {opt.sublabel && (
        <div className="text-xs text-muted-foreground">{opt.sublabel}</div>
      )}
    </div>
  );

  return (
    <AsyncSelect<TagOption>
      onChange={(opt) => onChange(opt?.tag)}
      loadOptions={handleSearch}
      placeholder="Filter by tag"
      value={
        selectedTag
          ? {
              value: selectedTag.id,
              label: selectedTag.name,
              sublabel: "",
              tag: selectedTag as Tag,
            }
          : null
      }
      isClearable
      renderOption={renderOption}
      noOptionsMessage={(term) =>
        term === "" ? null : `No tags found for "${term}"`
      }
    />
  );
};

export default TagFilter;
