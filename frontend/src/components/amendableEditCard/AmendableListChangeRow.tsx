import { faUndo, faXmark } from "@fortawesome/free-solid-svg-icons";

import { Icon } from "src/components/fragments";
import { Button } from "src/components/ui/button";
import { cn } from "src/lib/utils";
import { useAmendment } from "./AmendmentContext";

interface AmendableListChangeRowProps<T> {
  added?: T[] | null;
  removed?: T[] | null;
  renderItem: (o: T) => JSX.Element | undefined;
  getKey: (o: T) => string;
  name: string;
  field: string;
  showDiff?: boolean;
}

const CLASSNAME = "ListChangeRow";

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
const AmendableListChangeRow = <T,>({
  added,
  removed,
  name,
  field,
  getKey,
  renderItem,
  showDiff,
}: AmendableListChangeRowProps<T>) => {
  const {
    state,
    clearAddedItem,
    clearRemovedItem,
    restoreAddedItem,
    restoreRemovedItem,
  } = useAmendment();

  const removedAddedIndices = state.removedAddedItems.get(field);
  const removedRemovedIndices = state.removedRemovedItems.get(field);

  if ((added ?? []).length === 0 && (removed ?? []).length === 0) return null;

  return (
    <div className={`${CLASSNAME}-${name} grid grid-cols-12 gap-x-3`}>
      <b className="col-span-2 text-right">{name}</b>
      {showDiff && (
        <div className="col-span-4">
          {(removed ?? []).length > 0 && (
            <>
              <h6>Removed</h6>
              <div className={CLASSNAME}>
                <ul>
                  {(removed ?? []).map((u, index) => {
                    const isRemoved = removedRemovedIndices?.has(index);
                    return (
                      <li
                        key={getKey(u)}
                        className={cn(
                          "flex items-center",
                          isRemoved && "line-through opacity-50",
                        )}
                      >
                        <span className="grow">{renderItem(u)}</span>
                        {!isRemoved && (
                          <Button
                            variant="danger"
                            size="sm"
                            className="ml-2"
                            onClick={() => clearRemovedItem(field, index)}
                            title="Remove this item from the edit"
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
                            title="Restore this item"
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
        {(added ?? []).length > 0 && (
          <>
            {showDiff && <h6>Added</h6>}
            <div className={CLASSNAME}>
              <ul>
                {(added ?? []).map((u, index) => {
                  const isRemoved = removedAddedIndices?.has(index);
                  return (
                    <li
                      key={getKey(u)}
                      className={cn(
                        "flex items-center",
                        isRemoved && "line-through opacity-50",
                      )}
                    >
                      <span className="grow">{renderItem(u)}</span>
                      {!isRemoved && (
                        <Button
                          variant="danger"
                          size="sm"
                          className="ml-2"
                          onClick={() => clearAddedItem(field, index)}
                          title="Remove this item from the edit"
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
                          title="Restore this item"
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

export default AmendableListChangeRow;
