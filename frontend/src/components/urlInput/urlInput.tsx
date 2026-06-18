import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import type { Lens } from "@hookform/lenses";
import { type FC, useRef, useState } from "react";
import type { FieldError, FieldErrorsImpl, Merge } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import { Icon } from "src/components/fragments";
import { Button, buttonVariants } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import { Select } from "src/components/ui/select";

import { type SiteQuery, useSites, type ValidSiteTypeEnum } from "src/graphql";
import { cleanURL } from "src/utils";

type Site = NonNullable<SiteQuery["findSite"]>;

const CLASSNAME = "URLInput";

export type URLItem = {
  url: string;
  site: {
    id: string;
    name: string;
    icon: string;
  };
};

type ErrorsType = Merge<
  FieldError,
  (Merge<FieldError, FieldErrorsImpl<URLItem>> | undefined)[]
>;

interface URLInputProps {
  lens: Lens<URLItem[]>;
  type: ValidSiteTypeEnum;
  errors?: ErrorsType;
}

const URLInput: FC<URLInputProps> = ({ lens, type, errors }) => {
  const interop = lens.interop();
  const {
    fields: urls,
    append,
    remove,
  } = useFieldArray({
    control: interop.control,
    name: interop.name,
    keyName: "key",
  });
  const [newURL, setNewURL] = useState("");
  const [selectedSite, setSelectedSite] = useState<Site>();
  const selectRef = useRef<HTMLSelectElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { data, loading } = useSites();

  if (loading) return null;
  const sites = (data?.querySites.sites ?? []).filter((s) =>
    s.valid_types.includes(type),
  );

  const handleAdd = () => {
    const trimmedURL = newURL.trim();
    if (!trimmedURL || !selectedSite) return;
    const cleanedURL = cleanURL(selectedSite?.regex, trimmedURL);

    const url = cleanedURL ?? trimmedURL;
    if (!urls.some((u) => u.url === url))
      append({
        url,
        site: selectedSite,
      });

    if (selectRef.current) selectRef.current.value = "";
    if (inputRef.current) inputRef.current.value = "";
    setSelectedSite(undefined);
    setNewURL("");
  };

  const handleInput = (rawURL: string) => {
    if (!inputRef.current || !selectRef.current) return;

    const url = rawURL.trim();
    if (url !== rawURL) inputRef.current.value = url;

    const site = sites.find((s) => s.regex && new RegExp(s.regex).test(url));

    if (site && selectedSite?.id !== site.id) {
      setSelectedSite(site);
      selectRef.current.value = site.id;
    } else if (url && !site && selectedSite?.regex) {
      setSelectedSite(undefined);
      selectRef.current.value = "";
    }

    if (site?.regex && url) {
      const updatedURL = cleanURL(site.regex, url);
      if (updatedURL) {
        inputRef.current.value = updatedURL;
        return true;
      }
    }
    return false;
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const match = handleInput(e.clipboardData.getData("text/plain"));
    if (match) {
      e.preventDefault();
      setNewURL(e.currentTarget.value);
    }
  };

  const handleSiteSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const site = sites.find((s) => s.id === e.currentTarget.value);
    if (site) setSelectedSite(site);
  };

  return (
    <div className={CLASSNAME}>
      <ul>
        {urls.map((u, i) => (
          <li key={u.url}>
            <div className="flex items-center gap-2">
              <Button variant="danger" onClick={() => remove(i)}>
                Remove
              </Button>
              <b className="whitespace-nowrap">{u.site.name}</b>
              <span className="grow overflow-hidden text-ellipsis">
                {u.url}
              </span>
              <a
                href={u.url}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({ variant: "primary" })}
              >
                <Icon icon={faExternalLinkAlt} />
              </a>
            </div>
            {errors?.[i]?.url && (
              <div className="text-destructive">
                {errors?.[i]?.url?.message}
              </div>
            )}
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap">Add new link</span>
        <Select
          disabled={sites.length === 0}
          ref={selectRef}
          onChange={handleSiteSelect}
          defaultValue=""
          className="w-auto"
        >
          <option disabled value="">
            Select site
          </option>
          {sites.length === 0 ? (
            <option>No valid sites</option>
          ) : (
            sites.map((s) => (
              <option value={s.id} key={s.id}>
                {s.name}
              </option>
            ))
          )}
        </Select>
        <Input
          ref={inputRef}
          onBlur={(e) => handleInput(e.currentTarget.value)}
          placeholder="URL"
          onChange={(e) => setNewURL(e.currentTarget.value)}
          onPaste={handlePaste}
        />
        <Button onClick={handleAdd} disabled={!newURL || !selectedSite}>
          Add
        </Button>
      </div>
    </div>
  );
};

export default URLInput;
