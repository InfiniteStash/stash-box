import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "src/components/ui/button";

interface Props {
  disabled?: boolean;
}

export const SubmitButtons: FC<Props> = ({ disabled = false }) => {
  const navigate = useNavigate();
  return (
    <div className="mt-2 flex justify-end gap-2">
      <Button variant="danger" onClick={() => navigate(-1)}>
        Cancel
      </Button>
      {/* Hidden first submit so Enter submits without triggering the last button. */}
      <Button type="submit" disabled className="hidden" aria-hidden="true" />
      <Button type="submit" disabled={disabled}>
        Submit Edit
      </Button>
    </div>
  );
};
