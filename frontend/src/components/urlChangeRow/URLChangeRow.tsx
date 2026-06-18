import type { FC } from "react";
import { SiteLink } from "src/components/fragments";

const CLASSNAME = "URLChangeRow";

export interface URL {
  url: string;
  site: {
    id: string;
    name: string;
    icon: string;
  };
}

const URLChanges: FC<{ urls: URL[] }> = ({ urls }) => (
  <div className={CLASSNAME}>
    <ul className="pl-0">
      {urls.map((url) => (
        <li key={url.url} className="flex items-start">
          <SiteLink site={url.site} />
          <a
            href={url.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-1/2 grow break-words text-link hover:underline"
          >
            {url.url}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

interface URLChangeRowProps {
  newURLs?: URL[] | null;
  oldURLs?: URL[] | null;
  showDiff?: boolean;
}

const URLChangeRow: FC<URLChangeRowProps> = ({ newURLs, oldURLs, showDiff }) =>
  (newURLs ?? []).length > 0 || (oldURLs ?? []).length > 0 ? (
    <div className={`ChangeRow ${CLASSNAME} grid grid-cols-12 gap-x-3`}>
      <b className="col-span-2 text-right">Links</b>
      {showDiff && (
        <div className="col-span-5">
          {(oldURLs ?? []).length > 0 && (
            <>
              <h6>Removed</h6>
              <URLChanges urls={oldURLs ?? []} />
            </>
          )}
        </div>
      )}
      <div className={showDiff ? "col-span-5" : "col-span-10"}>
        {(newURLs ?? []).length > 0 && (
          <>
            {showDiff && <h6>Added</h6>}
            <URLChanges urls={newURLs ?? []} />
          </>
        )}
      </div>
    </div>
  ) : null;

export default URLChangeRow;
