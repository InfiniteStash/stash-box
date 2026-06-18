interface ListChangeRowProps<T> {
  added?: T[] | null;
  removed?: T[] | null;
  renderItem: (o: T) => JSX.Element | undefined;
  getKey: (o: T) => string;
  name: string;
  showDiff?: boolean;
}

const CLASSNAME = "ListChangeRow";

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
const ListChangeRow = <T,>({
  added,
  removed,
  name,
  getKey,
  renderItem,
  showDiff,
}: ListChangeRowProps<T>) =>
  (added ?? []).length > 0 || (removed ?? []).length > 0 ? (
    <div className={`ChangeRow ${CLASSNAME}-${name} grid grid-cols-12 gap-x-3`}>
      <b className="col-span-2 text-right">{name}</b>
      {showDiff && (
        <div className="col-span-5">
          {(removed ?? []).length > 0 && (
            <>
              <h6>Removed</h6>
              <div className={CLASSNAME}>
                <ul>
                  {(removed ?? []).map((u) => (
                    <li key={getKey(u)}>{renderItem(u)}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      )}
      <div className={showDiff ? "col-span-5" : "col-span-10"}>
        {(added ?? []).length > 0 && (
          <>
            {showDiff && <h6>Added</h6>}
            <div className={CLASSNAME}>
              <ul>
                {(added ?? []).map((u) => (
                  <li key={getKey(u)}>{renderItem(u)}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  ) : null;

export default ListChangeRow;
