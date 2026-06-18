import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";
import { debounce } from "lodash-es";
import { type FC, useCallback, useEffect, useMemo, useRef } from "react";
import {
  NavLink,
  Outlet,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { Icon } from "src/components/fragments";
import Title from "src/components/title";
import { Badge } from "src/components/ui/badge";
import { Input } from "src/components/ui/input";
import { useSearchAll } from "src/graphql";
import { cn } from "src/lib/utils";

const tabClass =
  "-mb-px border-b-2 border-transparent px-4 py-2 text-muted-foreground hover:text-foreground";
const activeTabClass = "border-primary text-foreground";

const CLASSNAME = "SearchPage";
const CLASSNAME_INPUT = `${CLASSNAME}-input`;

export const SearchLayout: FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const term = searchParams.get("q") ?? "";
  const query = term ? `?q=${encodeURIComponent(term)}` : "";

  const inputRef = useRef<HTMLInputElement>(null);
  const inputValueRef = useRef(term);

  useEffect(() => {
    if (inputRef.current && term !== inputValueRef.current) {
      inputRef.current.value = term;
      inputValueRef.current = term;
    }
  }, [term]);

  const debouncedSearch = useMemo(
    () =>
      debounce((searchTerm: string, pathname: string) => {
        const q = searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : "";
        navigate(`${pathname}${q}`, { replace: true });
      }, 200),
    [navigate],
  );

  const handleSearch = useCallback(
    (searchTerm: string) => {
      inputValueRef.current = searchTerm;
      debouncedSearch(searchTerm, location.pathname);
    },
    [debouncedSearch],
  );

  const { data: searchData } = useSearchAll({ term, limit: 10 }, !term);

  const performerCount = searchData?.searchPerformers.count;
  const sceneCount = searchData?.searchScenes.count;

  return (
    <div className={CLASSNAME}>
      <Title page={term || "Search"} />
      <div className={cx(CLASSNAME_INPUT, "mb-3")}>
        <Icon icon={faMagnifyingGlass} />
        <Input
          ref={inputRef}
          defaultValue={term}
          onChange={(e) => handleSearch(e.currentTarget.value)}
          placeholder="Search for performer or scene"
          autoFocus
        />
      </div>

      <nav className="mb-3 flex gap-1 border-b border-border">
        <NavLink
          to={`/search${query}`}
          end
          className={({ isActive }) => cn(tabClass, isActive && activeTabClass)}
        >
          All
        </NavLink>
        <NavLink
          to={`/search/performers${query}`}
          className={({ isActive }) => cn(tabClass, isActive && activeTabClass)}
        >
          Performers
          {performerCount !== undefined && (
            <Badge variant="secondary" className="ml-2">
              {performerCount}
            </Badge>
          )}
        </NavLink>
        <NavLink
          to={`/search/scenes${query}`}
          className={({ isActive }) => cn(tabClass, isActive && activeTabClass)}
        >
          Scenes
          {sceneCount !== undefined && (
            <Badge variant="secondary" className="ml-2">
              {sceneCount}
            </Badge>
          )}
        </NavLink>
      </nav>

      <Outlet />
    </div>
  );
};
