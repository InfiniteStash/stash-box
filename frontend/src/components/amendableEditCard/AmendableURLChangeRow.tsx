import { faUndo, faXmark } from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";

import { Icon, SiteLink } from "src/components/fragments";
import { Button } from "src/components/ui/button";
import type { URL } from "src/components/urlChangeRow";
import { cn } from "src/lib/utils";
import { useAmendment } from "./AmendmentContext";

const CLASSNAME = "URLChangeRow";

interface AmendableURLChangeRowProps {
  field: string;
  newURLs?: URL[] | null;
  oldURLs?: URL[] | null;
  showDiff?: boolean;
}

const AmendableURLChangeRow: FC<AmendableURLChangeRowProps> = ({
  field,
  newURLs,
  oldURLs,
  showDiff,
}) => {
  const {
    state,
    clearAddedItem,
    clearRemovedItem,
    restoreAddedItem,
    restoreRemovedItem,
  } = useAmendment();

  const removedAddedIndices = state.removedAddedItems.get(field);
  const removedRemovedIndices = state.removedRemovedItems.get(field);

  if ((newURLs ?? []).length === 0 && (oldURLs ?? []).length === 0) return null;

  return (
    <div className={`${CLASSNAME} grid grid-cols-12 gap-x-3`}>
      <b className="col-span-2 text-right">Links</b>
      {showDiff && (
        <div className="col-span-4">
          {(oldURLs ?? []).length > 0 && (
            <>
              <h6>Removed</h6>
              <div className={CLASSNAME}>
                <ul className="pl-0">
                  {(oldURLs ?? []).map((url, index) => {
                    const isRemoved = removedRemovedIndices?.has(index);
                    return (
                      <li
                        key={url.url}
                        className={cn(
                          "flex items-start",
                          isRemoved && "line-through opacity-50",
                        )}
                      >
                        <SiteLink site={url.site} />
                        <a
                          href={url.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block grow break-words text-link hover:underline"
                        >
                          {url.url}
                        </a>
                        {!isRemoved && (
                          <Button
                            variant="danger"
                            size="sm"
                            className="ml-2"
                            onClick={() => clearRemovedItem(field, index)}
                            title="Remove this URL change from the edit"
                          >
                            <Icon icon={faXmark} />
                          </Button>
                        )}
                        {isRemoved && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="ml-2"
                            onClick={() => restoreRemovedItem(field, index)}
                            title="Restore this URL"
                          >
                            <Icon icon={faUndo} />
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </>
          )}
        </div>
      )}
      <div className={showDiff ? "col-span-4" : "col-span-8"}>
        {(newURLs ?? []).length > 0 && (
          <>
            {showDiff && <h6>Added</h6>}
            <div className={CLASSNAME}>
              <ul className="pl-0">
                {(newURLs ?? []).map((url, index) => {
                  const isRemoved = removedAddedIndices?.has(index);
                  return (
                    <li
                      key={url.url}
                      className={cn(
                        "flex items-start",
                        isRemoved && "line-through opacity-50",
                      )}
                    >
                      <SiteLink site={url.site} />
                      <a
                        href={url.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block grow break-words text-link hover:underline"
                      >
                        {url.url}
                      </a>
                      {!isRemoved && (
                        <Button
                          variant="danger"
                          size="sm"
                          className="ml-2"
                          onClick={() => clearAddedItem(field, index)}
                          title="Remove this URL from the edit"
                        >
                          <Icon icon={faXmark} />
                        </Button>
                      )}
                      {isRemoved && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="ml-2"
                          onClick={() => restoreAddedItem(field, index)}
                          title="Restore this URL"
                        >
                          <Icon icon={faUndo} />
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </div>
      <div className="col-span-2" />
    </div>
  );
};

export default AmendableURLChangeRow;
