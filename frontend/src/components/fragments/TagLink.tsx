import { faXmark } from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { Link } from "react-router-dom";
import { Icon } from "src/components/fragments";
import { cn } from "src/lib/utils";

interface IProps {
  title: string;
  link?: string;
  description?: string | null;
  className?: string;
  onRemove?: () => void;
  disabled?: boolean;
}

const TagLink: FC<IProps> = ({
  title,
  link,
  description,
  className,
  onRemove,
  disabled = false,
}) => (
  <span
    className={cn(
      "tag-item inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-sm",
      className,
    )}
  >
    <abbr title={description || undefined} className="no-underline">
      {link && !disabled ? (
        <Link to={link} className="text-link hover:underline">
          {title}
        </Link>
      ) : (
        title
      )}
    </abbr>
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${title}`}
        className="text-muted-foreground hover:text-foreground"
      >
        <Icon icon={faXmark} />
      </button>
    )}
  </span>
);

export default TagLink;
