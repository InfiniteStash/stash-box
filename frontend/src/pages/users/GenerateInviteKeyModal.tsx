import { type FC, useMemo, useState } from "react";
import { Button } from "src/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "src/components/ui/dialog";
import { Label } from "src/components/ui/field";
import { Input } from "src/components/ui/input";
import { Select } from "src/components/ui/select";
import type { GenerateInviteCodeInput } from "src/graphql";
import { formatDateTime } from "src/utils";

interface ModalProps {
  callback: (input?: GenerateInviteCodeInput) => void;
}

const ms = 1000;
const minutesInSeconds = 60;
const hoursInSeconds = 60 * minutesInSeconds;
const daysInSeconds = 24 * hoursInSeconds;
const yearsInSeconds = 365 * daysInSeconds;

export const GenerateInviteKeyModal: FC<ModalProps> = ({ callback }) => {
  const [keyAmount, setKeyAmount] = useState(1);
  const [keyUses, setKeyUses] = useState(1);
  const [keyExpireAmount, setKeyExpireAmount] = useState(30);
  const [keyExpireUnit, setKeyExpireUnit] = useState(daysInSeconds);

  const handleCancel = () => callback();
  const handleAccept = () =>
    callback({
      keys: keyAmount,
      uses: keyUses,
      ttl: keyExpireAmount * keyExpireUnit,
    });

  const expireTime = useMemo(() => {
    const ret = new Date();
    ret.setTime(ret.getTime() + keyExpireAmount * keyExpireUnit * ms);
    return ret;
  }, [keyExpireAmount, keyExpireUnit]);

  return (
    <Dialog open onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent>
        <DialogTitle>Generate Invite Keys</DialogTitle>
        <div className="flex flex-col gap-1">
          <Label htmlFor="key-amount">Amount of Keys</Label>
          <Input
            id="key-amount"
            value={keyAmount}
            onChange={(e) => setKeyAmount(parseInt(e.currentTarget.value, 10))}
            type="number"
            min={1}
            max={100}
            placeholder="Enter number of keys"
          />
        </div>
        <div className="mt-4 flex flex-col gap-1">
          <Label htmlFor="key-uses">Uses per key</Label>
          <Input
            id="key-uses"
            value={keyUses}
            onChange={(e) => setKeyUses(parseInt(e.currentTarget.value, 10))}
            type="number"
            min={0}
            max={100}
            placeholder="Uses per key"
          />
          <small className="text-muted-foreground">
            Enter 0 for unlimited uses.
          </small>
        </div>
        <div className="mt-4 flex flex-col gap-1">
          <Label htmlFor="key-expiration">Expire time</Label>
          <Input
            id="key-expiration"
            type="number"
            min={1}
            value={keyExpireAmount}
            onChange={(e) =>
              setKeyExpireAmount(parseInt(e.currentTarget.value, 10))
            }
          />
          <Select
            value={keyExpireUnit}
            onChange={(e) => {
              setKeyExpireUnit(parseInt(e.currentTarget.value, 10));
            }}
            className="mt-2"
          >
            <option value={minutesInSeconds}>Minutes</option>
            <option value={hoursInSeconds}>Hours</option>
            <option value={daysInSeconds}>Days</option>
            <option value={yearsInSeconds}>Years</option>
          </Select>
          <small className="text-muted-foreground">
            Expires at {formatDateTime(expireTime)}
          </small>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={handleAccept}>Generate</Button>
          <Button variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
