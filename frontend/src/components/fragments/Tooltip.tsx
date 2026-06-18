import type { FC, ReactElement } from "react";
import { Tooltip as UITooltip } from "src/components/ui/tooltip";

type Side = "top" | "bottom" | "left" | "right";
type Align = "start" | "center" | "end";

interface Props {
  text: string | ReactElement;
  placement?: string;
  children: ReactElement;
  delay?: number;
}

const parsePlacement = (placement: string): { side: Side; align: Align } => {
  const [side, suffix] = placement.split("-");
  return {
    side: (["top", "bottom", "left", "right"].includes(side)
      ? side
      : "bottom") as Side,
    align: suffix === "start" ? "start" : suffix === "end" ? "end" : "center",
  };
};

const Tooltip: FC<Props> = ({
  children,
  text,
  delay = 200,
  placement = "bottom-end",
}) => {
  const { side, align } = parsePlacement(placement);
  return (
    <UITooltip content={text} delay={delay} side={side} align={align}>
      {children}
    </UITooltip>
  );
};

export default Tooltip;
