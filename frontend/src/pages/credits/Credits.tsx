import type { FC } from "react";

import CreditAttributeSection from "./CreditAttributeSection";
import CreditTypeSection from "./CreditTypeSection";

const Credits: FC = () => (
  <>
    <h3 className="mb-4">Credits</h3>
    <CreditTypeSection />
    <CreditAttributeSection />
  </>
);

export default Credits;
