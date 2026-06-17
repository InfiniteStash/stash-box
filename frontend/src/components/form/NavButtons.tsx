import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "src/components/ui/button";

interface Props {
  onNext: () => void;
  disabled?: boolean;
}

export const NavButtons: FC<Props> = ({ onNext, disabled = false }) => {
  const navigate = useNavigate();
  return (
    <div className="mt-2 flex justify-end gap-2">
      <Button variant="danger" onClick={() => navigate(-1)}>
        Cancel
      </Button>
      <Button onClick={onNext} disabled={disabled}>
        Next
      </Button>
    </div>
  );
};
