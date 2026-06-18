import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { Icon } from "src/components/fragments";
import { Tooltip } from "src/components/ui/tooltip";

interface Props {
  message: string;
}

const Help: FC<Props> = ({ message }) => (
  <Tooltip content={message} side="bottom">
    <button
      type="button"
      className="text-muted-foreground transition-colors hover:text-foreground"
    >
      <Icon icon={faQuestionCircle} />
    </button>
  </Tooltip>
);

export default Help;
