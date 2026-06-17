import { useApolloClient } from "@apollo/client/react";
import { type FC, type KeyboardEvent, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GenderIcon, Thumbnail } from "src/components/fragments";
import {
  AsyncSearchAdd,
  type ComboboxOption,
} from "src/components/ui/combobox";
import type { SearchAllQuery, SearchPerformersQuery } from "src/graphql";
import SearchAllGQL from "src/graphql/queries/SearchAll.gql";
import SearchPerformersGQL from "src/graphql/queries/SearchPerformers.gql";
import { getImage } from "src/utils";
import {
  handleResult,
  type PerformerResult,
  type SceneResult,
  type SearchGroup,
  type SearchResult,
} from "./handleResult";

export type { PerformerResult, SceneResult };

export enum SearchType {
  Performer = "performer",
  Combined = "combined",
}

interface SearchFieldProps {
  onClick?: (result: SceneResult | PerformerResult) => void;
  onClickPerformer?: (result: PerformerResult) => void;
  searchType: SearchType;
  excludeIDs?: string[];
  nav?: boolean;
  placeholder?: string;
  showAllLink?: boolean;
  autoFocus?: boolean;
  /** When provided, performers who have performed for this studio's network will be sorted to the top */
  studioId?: string;
  inputId?: string;
}

const ALL_VALUE = "__all__";

interface SearchOption extends ComboboxOption {
  type: string;
  sublabel?: string;
  result?: SceneResult | PerformerResult;
}

const valueIsPerformer = (
  arg?: SceneResult | PerformerResult,
): arg is PerformerResult => arg?.__typename === "Performer";

const toOption = (r: SearchResult): SearchOption => ({
  value: r.value?.id ?? ALL_VALUE,
  label: r.label ?? "",
  sublabel: r.sublabel,
  type: r.type,
  result: r.value,
});

const flatten = (entries: (SearchGroup | SearchResult)[]): SearchOption[] =>
  entries.flatMap((entry) =>
    "options" in entry ? entry.options.map(toOption) : [toOption(entry)],
  );

const renderOption = (opt: SearchOption) => {
  if (opt.type === "ALL") return <span>{opt.label}</span>;
  return (
    <div className="flex gap-2">
      {valueIsPerformer(opt.result) && (
        <Thumbnail
          image={getImage(opt.result.images, "portrait")}
          className="h-12 w-9 shrink-0 rounded object-cover"
          alt={opt.result.name}
          size={300}
          orientation="portrait"
        />
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-1">
          {valueIsPerformer(opt.result) && (
            <GenderIcon gender={opt.result.gender} />
          )}
          {opt.result?.deleted ? <del>{opt.label}</del> : opt.label}
        </div>
        {opt.sublabel && (
          <div className="text-xs text-muted-foreground">{opt.sublabel}</div>
        )}
      </div>
    </div>
  );
};

const SearchField: FC<SearchFieldProps> = ({
  onClick,
  onClickPerformer,
  searchType = SearchType.Performer,
  excludeIDs = [],
  nav = false,
  placeholder,
  showAllLink = false,
  autoFocus = false,
  studioId,
  inputId,
}) => {
  const client = useApolloClient();
  const navigate = useNavigate();
  const searchTerm = useRef("");

  const loadOptions = async (term: string): Promise<SearchOption[]> => {
    if (!term) return [];
    const { data } = await client.query<SearchPerformersQuery | SearchAllQuery>(
      {
        query:
          searchType === SearchType.Performer
            ? SearchPerformersGQL
            : SearchAllGQL,
        variables: {
          term,
          ...(searchType === SearchType.Performer && studioId
            ? { studioId, hasStudioId: true }
            : {}),
        },
        fetchPolicy: "network-only",
      },
    );
    if (!data) return [];
    return flatten(handleResult(data, excludeIDs, showAllLink, studioId));
  };

  const handleSelect = (opt: SearchOption) => {
    if (opt.type === "ALL") {
      navigate(`/search?q=${encodeURIComponent(searchTerm.current)}`);
      return;
    }
    const result = opt.result;
    if (!result) return;
    if (valueIsPerformer(result)) onClickPerformer?.(result);
    onClick?.(result);
    if (nav) navigate(`/${opt.type}s/${result.id}`);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && searchTerm.current && showAllLink) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.current)}`);
    }
  };

  return (
    <AsyncSearchAdd<SearchOption>
      inputId={inputId}
      autoFocus={autoFocus}
      onSelect={handleSelect}
      loadOptions={loadOptions}
      onInputChange={(term) => {
        searchTerm.current = term;
      }}
      onKeyDown={handleKeyDown}
      renderOption={renderOption}
      placeholder={
        placeholder ??
        (searchType === SearchType.Performer
          ? "Search for performer..."
          : "Search for performer or scene...")
      }
      noOptionsMessage={(term) =>
        term === "" ? null : `No result found for "${term}"`
      }
    />
  );
};

export default SearchField;
