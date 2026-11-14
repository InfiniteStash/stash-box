import type { FC } from "react";

import { Link, NavLink, Route, Routes } from "react-router-dom";
import { ErrorMessage } from "src/components/fragments";
import Title from "src/components/title";
import { Card, CardBody } from "src/components/ui/card";
import { ROUTE_ADMIN } from "src/constants/route";
import { useCurrentUser } from "src/hooks";
import Audits from "src/pages/audits";
import Categories from "src/pages/categories";
import ImageTypes from "src/pages/imageTypes";
import SiteCategories from "src/pages/siteCategories";
import Sites from "src/pages/sites";
import Users from "src/pages/users";

const sections = [
  {
    path: "image-types",
    title: "Image Types",
    description: "Manage image label ordering and enabled types.",
  },
  {
    path: "users",
    title: "Users",
    description: "Create users and manage accounts and roles.",
  },
  {
    path: "audits",
    title: "Audits",
    description: "Review moderation activity.",
  },
  {
    path: "categories",
    title: "Tag categories",
    description: "Create and edit tag categories.",
  },
  { path: "sites", title: "Sites", description: "Create and edit sites." },
  {
    path: "site-categories",
    title: "Site categories",
    description: "Create and edit site categories.",
  },
];

const Admin: FC = () => {
  const { isAdmin } = useCurrentUser();
  if (!isAdmin)
    return (
      <ErrorMessage error="Access denied. Administrator access is required." />
    );

  return (
    <>
      <Title page="Admin" />
      <h2>Admin</h2>
      <nav
        aria-label="Admin sections"
        className="mb-4 flex flex-wrap gap-1 border-b border-border"
      >
        <div>
          <NavLink
            to={ROUTE_ADMIN}
            end
            className={({ isActive }) =>
              `block rounded-t-md px-4 py-2 text-sm ${isActive ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:bg-accent"}`
            }
          >
            Overview
          </NavLink>
        </div>
        {sections.map(({ path, title }) => (
          <div key={path}>
            <NavLink
              to={`${ROUTE_ADMIN}/${path}`}
              className={({ isActive }) =>
                `block rounded-t-md px-4 py-2 text-sm ${isActive ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:bg-accent"}`
              }
            >
              {title}
            </NavLink>
          </div>
        ))}
      </nav>
      <Routes>
        <Route
          index
          element={
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {sections.map(({ path, title, description }) => (
                <div className="min-w-0" key={path}>
                  <Card className="h-full">
                    <CardBody>
                      <h3 className="text-lg font-semibold">
                        <Link to={`${ROUTE_ADMIN}/${path}`}>{title}</Link>
                      </h3>
                      <p className="mb-0">{description}</p>
                    </CardBody>
                  </Card>
                </div>
              ))}
            </div>
          }
        />
        <Route path="image-types" element={<ImageTypes />} />
        <Route path="users/*" element={<Users />} />
        <Route path="audits/*" element={<Audits />} />
        <Route path="categories/*" element={<Categories />} />
        <Route path="sites/*" element={<Sites />} />
        <Route path="site-categories/*" element={<SiteCategories />} />
        <Route
          path="*"
          element={<ErrorMessage error="Admin page not found." />}
        />
      </Routes>
    </>
  );
};

export default Admin;
