import { useApolloClient } from "@apollo/client/react";
import { type FC, useState } from "react";
import { TagLink } from "src/components/fragments";
import {
  AsyncSearchAdd,
  type ComboboxOption,
} from "src/components/ui/combobox";

import type { SearchTagsQuery, SearchTagsQueryVariables } from "src/graphql";
import SearchTagsGQL from "src/graphql/queries/SearchTags.gql";
import { compareByName } from "src/utils";
import { tagHref } from "src/utils/route";

type Tag = NonNullable<SearchTagsQuery["query"][number]>;

type TagSlim = {
  id: string;
  name: string;
  description?: string | null | undefined;
  aliases: string[];
};

interface TagSelectProps {
  tags?: TagSlim[];
  onChange: (tags: TagSlim[]) => void;
  message?: string;
  excludeTags?: string[];
  allowDeleted?: boolean;
  inputId?: string;
}

interface TagOption extends ComboboxOption {
  tag: Tag;
  sublabel: string;
}

const TagSelect: FC<TagSelectProps> = ({
  tags: initialTags = [],
  onChange,
  message = "Add tag:",
  excludeTags = [],
  allowDeleted = false,
  inputId,
}) => {
  const client = useApolloClient();
  const [tags, setTags] = useState(initialTags);
  const excluded = [...excludeTags, ...tags.map((t) => t.id)];

  const handleSelect = (option: TagOption) => {
    const newTags = [...tags, option.tag];
    setTags(newTags);
    onChange(newTags);
  };

  const removeTag = (id: string) => {
    const newTags = tags.filter((tag) => tag.id !== id);
    setTags(newTags);
    onChange(newTags);
  };

  const tagList = [...(tags ?? [])]
    .sort(compareByName)
    .map((tag) => (
      <TagLink
        title={tag.name}
        description={tag.description}
        link={tagHref(tag)}
        onRemove={() => removeTag(tag.id)}
        key={tag.id}
        disabled
      />
    ));

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
      exact && !excluded.includes(exact.id) && (allowDeleted || !exact.deleted)
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
          !excluded.includes(tag.id) &&
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
    <div className="space-y-2">
      {tagList.length > 0 && (
        <div className="flex flex-wrap gap-2">{tagList}</div>
      )}
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {message}
        </span>
        <div className="flex-1">
          <AsyncSearchAdd<TagOption>
            inputId={inputId}
            onSelect={handleSelect}
            loadOptions={handleSearch}
            placeholder="Search for tag"
            renderOption={renderOption}
            noOptionsMessage={(term) =>
              term === "" ? null : `No tags found for "${term}"`
            }
          />
        </div>
      </div>
    </div>
  );
};

export default TagSelect;
