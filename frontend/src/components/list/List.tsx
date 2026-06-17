import { type FC, type ReactNode, useEffect, useState } from "react";
import { LoadingIndicator } from "src/components/fragments";
import Pagination from "src/components/pagination";

const PER_PAGE = 20;

interface Props {
  page: number;
  setPage: (page: number) => void;
  perPage?: number;
  listCount?: number;
  loading: boolean;
  filters?: ReactNode;
  entityName?: string;
  children?: React.ReactNode;
}

const List: FC<Props> = ({
  page,
  setPage,
  perPage = PER_PAGE,
  listCount,
  loading,
  filters,
  children,
  entityName = "data",
}) => {
  const [count, setCount] = useState<number | undefined>(listCount);

  useEffect(() => {
    if (!loading && listCount !== undefined) setCount(listCount);
  }, [loading, listCount]);

  const currentCount = count ?? listCount;

  return (
    <div className={`${entityName}-list`}>
      <div className="mt-2 flex flex-wrap items-start gap-3">
        {filters}
        <Pagination
          onClick={setPage}
          count={currentCount ?? 0}
          active={page}
          perPage={perPage}
          showCount
        />
      </div>
      {loading ? (
        <LoadingIndicator message={`Loading ${entityName}...`} />
      ) : currentCount && currentCount > 0 ? (
        children
      ) : currentCount === 0 ? (
        <h4 className="m-4 p-4 text-center text-lg text-muted-foreground">
          No results
        </h4>
      ) : null}
      <div className="mt-4 flex">
        <Pagination
          onClick={setPage}
          count={currentCount ?? 0}
          perPage={perPage}
          active={page}
        />
      </div>
    </div>
  );
};

export default List;
