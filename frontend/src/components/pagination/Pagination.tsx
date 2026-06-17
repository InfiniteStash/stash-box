import {
  faAngleLeft,
  faAngleRight,
  faAnglesLeft,
  faAnglesRight,
} from "@fortawesome/free-solid-svg-icons";
import type { FC, ReactNode } from "react";
import { Icon } from "src/components/fragments";
import { cn } from "src/lib/utils";

interface PaginationProps {
  active: number;
  onClick: (page: number) => void;
  count: number;
  perPage: number;
  showCount?: boolean;
}

interface PageButtonProps {
  page: number;
  active?: boolean;
  disabled?: boolean;
  onClick: (page: number) => void;
  children: ReactNode;
  label?: string;
}

const PageButton: FC<PageButtonProps> = ({
  page,
  active = false,
  disabled = false,
  onClick,
  children,
  label,
}) => (
  <button
    type="button"
    disabled={disabled}
    aria-label={label}
    aria-current={active ? "page" : undefined}
    onClick={() => onClick(page)}
    className={cn(
      "inline-flex h-9 min-w-9 items-center justify-center rounded-md border-0 px-3 text-sm transition-colors disabled:pointer-events-none disabled:opacity-40",
      active
        ? "bg-primary text-primary-foreground"
        : "bg-secondary text-foreground hover:bg-accent",
    )}
  >
    {children}
  </button>
);

const PaginationComponent: FC<PaginationProps> = ({
  active,
  perPage,
  onClick,
  count,
  showCount = false,
}) => {
  const pages = Math.ceil(count / perPage);
  const totalPages = pages === 0 ? 1 : pages;
  const showFirst = totalPages > 5 && active > 3;
  const showLast = totalPages > 5 && active < totalPages - 3;

  const maxVal = Math.max(
    Math.min(active + 2, totalPages),
    Math.min(totalPages, 5),
  );
  const minVal = Math.max(maxVal - 4, 1);
  const totalItems = maxVal - minVal + 1;

  const pageNumbers = [...Array(totalItems)].map((_, arrayIndex) => {
    const index = arrayIndex + minVal;
    return (
      <PageButton
        key={index}
        page={index}
        active={active === index}
        onClick={onClick}
      >
        {index}
      </PageButton>
    );
  });

  return (
    <div className="ml-auto mt-auto flex flex-wrap items-center justify-end gap-2">
      {showCount && count > 0 && (
        <b className="mr-2">{new Intl.NumberFormat().format(count)} results</b>
      )}
      <div className="flex flex-wrap items-center justify-end gap-1">
        {showFirst && (
          <PageButton page={1} onClick={onClick} label="First page">
            <Icon icon={faAnglesLeft} />
          </PageButton>
        )}
        <PageButton
          page={active - 1}
          disabled={active === 1}
          onClick={onClick}
          label="Previous page"
        >
          <Icon icon={faAngleLeft} />
        </PageButton>
        {pageNumbers}
        <PageButton
          page={active + 1}
          disabled={active === totalPages}
          onClick={onClick}
          label="Next page"
        >
          <Icon icon={faAngleRight} />
        </PageButton>
        {showLast && (
          <PageButton page={totalPages} onClick={onClick} label="Last page">
            <Icon icon={faAnglesRight} />
          </PageButton>
        )}
      </div>
    </div>
  );
};

export default PaginationComponent;
