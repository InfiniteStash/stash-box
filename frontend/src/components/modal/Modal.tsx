import type { FC, ReactNode } from "react";

import { Button } from "src/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "src/components/ui/dialog";

interface ModalProps {
  callback: (status: boolean) => void;
  cancelTerm?: string;
  acceptTerm?: string;
}

interface MessageProps {
  message: string;
  children?: never;
}
interface ElementProps {
  children: ReactNode;
  message?: never;
}

const ModalComponent: FC<ModalProps & (MessageProps | ElementProps)> = ({
  message,
  children,
  callback,
  cancelTerm = "Cancel",
  acceptTerm = "Delete",
}) => {
  const handleCancel = () => callback(false);
  const handleAccept = () => callback(true);

  const content = message || children;

  return (
    <Dialog open onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent>
        <DialogTitle>Warning</DialogTitle>
        <div>{content}</div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="danger" onClick={handleAccept}>
            {acceptTerm}
          </Button>
          <Button onClick={handleCancel}>{cancelTerm}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalComponent;
