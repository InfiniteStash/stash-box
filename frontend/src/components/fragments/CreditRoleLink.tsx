import type { FC } from "react";
import { Link } from "react-router-dom";
import { creditRoleHref } from "src/utils/route";

interface Props {
  creditRole: {
    id: string;
    name: string;
  };
}

const CreditRoleLink: FC<Props> = ({ creditRole }) => (
  <Link to={creditRoleHref(creditRole)}>{creditRole.name}</Link>
);

export default CreditRoleLink;
