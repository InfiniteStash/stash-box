import type { FC } from "react";
import { Route, Routes } from "react-router-dom";
import Title from "src/components/title";

import Credits from "./Credits";

const CreditRoutes: FC = () => (
  <Routes>
    <Route
      path="/"
      element={
        <>
          <Title page="Credits" />
          <Credits />
        </>
      }
    />
  </Routes>
);

export default CreditRoutes;
