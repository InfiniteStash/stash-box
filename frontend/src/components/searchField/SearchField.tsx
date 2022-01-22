import { FC, KeyboardEvent, useRef, useState } from "react";
import { useApolloClient } from "@apollo/client";
import { components, OptionProps, OnChangeValue } from "react-select";
import Async from "react-select/async";
import debounce from "p-debounce";
import { useHistory } from "react-router-dom";

import SearchAllGQL from "src/graphql/queries/SearchAll.gql";
import SearchPerformersGQL from "src/graphql/queries/SearchPerformers.gql";

import {
  SearchPerformersQuery,
  SearchPerformersQueryVariables,
  SearchAllQuery,
  SearchAllQueryVariables,
  SearchPerformerFragment,
  SearchSceneFragment,
} from "src/graphql";
import { formatFuzzyDate, createHref } from "src/utils";
import { ROUTE_SEARCH } from "src/constants/route";

export enum SearchType {
  Performer = "performer",
  Combined = "combined",
}

interface SearchFieldProps {
  onClick?: (result: SceneResult | PerformerResult) => void;
  onClickPerformer?: (result: PerformerResult) => void;
  searchType: SearchType;
  excludeIDs?: string[];
  navigate?: boolean;
  placeholder?: string;
  showAllLink?: boolean;
  autoFocus?: boolean;
}

export type PerformerResult = SearchPerformerFragment;
export type SceneResult = SearchPerformerFragment | SearchSceneFragment;

interface SearchGroup {
  label: string;
  options: SearchResult[];
}
interface SearchResult {
  type: string;
  value?: SceneResult | PerformerResult;
  label?: string;
  subLabel?: string;
}

const Option = (props: OptionProps<SearchResult, false>) => {
  const {
    data: { label, subLabel },
  } = props;
  return (
    <components.Option {...props}>
      <div className="search-value">{label}</div>
      <div className="search-subvalue">{subLabel}</div>
    </components.Option>
  );
};

const resultIsSearchAll = (
  arg: SearchAllQuery | SearchPerformersQuery
): arg is SearchAllQuery =>
  (arg as SearchAllQuery).searchPerformer !== undefined &&
  (arg as SearchAllQuery).searchScene !== undefined;

const valueIsPerformer = (
  arg?: SceneResult | PerformerResult
): arg is PerformerResult => arg?.__typename === "Performer";

function handleResult(
  result: SearchAllQuery | SearchPerformersQuery,
  excludeIDs: string[],
  showAllLink: boolean
): (SearchGroup | SearchResult)[] {
  let performers: SearchResult[] = [];
  let scenes: SearchResult[] = [];

  if (resultIsSearchAll(result)) {
    const performerResults =
      result?.searchPerformer?.filter((p) => p !== null) ?? [];
    performers = performerResults
      .filter((performer) => !excludeIDs.includes(performer.id))
      .map((performer) => ({
        type: "performer",
        value: performer,
        label: `${performer.name}${
          // eslint-disable-next-line prefer-template
          performer.disambiguation ? " (" + performer.disambiguation + ")" : ""
        }`,
        subLabel: [
          performer?.birthdate
            ? `Born: ${formatFuzzyDate(performer.birthdate)}`
            : null,
          performer?.aliases.length
            ? `AKA: ${performer.aliases.join(", ")}`
            : null,
        ]
          .filter((p) => p !== null)
          .join(", "),
      }));

    const sceneResults = result?.searchScene?.filter((p) => p !== null) ?? [];
    scenes = sceneResults
      .filter((scene) => !excludeIDs.includes(scene.id))
      .map((scene) => ({
        type: "scene",
        value: scene,
        label: `${scene.title} ${scene.date ? `(${scene.date})` : ""}`,
        subLabel: `${scene?.studio?.name ?? ""}${
          scene.performers && scene.studio ? " • " : ""
        }
          ${scene.performers.map((p) => p.as || p.performer.name).join(", ")}`,
      }));
  } else {
    const performerResults =
      result?.searchPerformer?.filter((p) => p !== null) ?? [];
    performers = performerResults
      .filter((performer) => !excludeIDs.includes(performer.id))
      .map((performer) => ({
        type: "performer",
        value: performer,
        label: `${performer.name} ${
          // eslint-disable-next-line prefer-template
          performer.disambiguation ? "(" + performer.disambiguation + ")" : ""
        }`,
        subLabel: [
          performer.birthdate
            ? `Born: ${formatFuzzyDate(performer.birthdate)}`
            : null,
          performer.aliases.length
            ? `AKA: ${performer.aliases.join(", ")}`
            : null,
        ]
          .filter((p) => p !== null)
          .join(", "),
      }));
  }

  return [
    ...(showAllLink ? [{ type: "ALL", label: "Show all results" }] : []),
    ...(performers.length
      ? [{ label: "Performers", options: performers }]
      : []),
    ...(scenes.length ? [{ label: "Scenes", options: scenes }] : []),
  ];
}

const SearchField: FC<SearchFieldProps> = ({
  onClick,
  onClickPerformer,
  searchType = SearchType.Performer,
  excludeIDs = [],
  navigate = false,
  placeholder,
  showAllLink = false,
  autoFocus = false,
}) => {
  const client = useApolloClient();
  const history = useHistory();
  const [selectedValue, setSelected] = useState(null);
  const searchTerm = useRef("");

  const handleSearch = async (term: string) => {
    if (term) {
      const { data } = await client.query<
        SearchPerformersQuery | SearchAllQuery,
        SearchAllQueryVariables | SearchPerformersQueryVariables
      >({
        query:
          searchType === SearchType.Performer
            ? SearchPerformersGQL
            : SearchAllGQL,
        variables: { term },
        fetchPolicy: "network-only",
      });
      return handleResult(data, excludeIDs, showAllLink);
    }
    return [];
  };

  const debouncedLoadOptions = debounce(handleSearch, 400);

  const handleLoad = (term: string) => {
    searchTerm.current = term;
    return debouncedLoadOptions(term);
  };

  const handleChange = (result: OnChangeValue<SearchResult, false>) => {
    if (result?.type === "ALL")
      return history.push(
        createHref(ROUTE_SEARCH, { term: searchTerm.current })
      );

    if (result?.value) {
      if (valueIsPerformer(result.value)) onClickPerformer?.(result.value);
      onClick?.(result.value);
      if (navigate) history.push(`/${result.type}s/${result.value.id}`);
    }

    setSelected(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && searchTerm.current && showAllLink) {
      history.push(createHref(ROUTE_SEARCH, { term: searchTerm.current }));
    }
  };

  return (
    <div className="SearchField">
      <Async
        autoFocus={autoFocus}
        classNamePrefix="react-select"
        value={selectedValue}
        loadOptions={handleLoad}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={
          placeholder ??
          (searchType === SearchType.Performer
            ? "Search for performer..."
            : "Search for performer or scene...")
        }
        components={{
          Option,
          DropdownIndicator: () => null,
          IndicatorSeparator: () => null,
        }}
        noOptionsMessage={({ inputValue }) =>
          inputValue === "" ? null : `No result found for "${inputValue}"`
        }
      />
    </div>
  );
};

export default SearchField;
