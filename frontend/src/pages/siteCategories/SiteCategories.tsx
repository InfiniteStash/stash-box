import { sortBy } from "lodash-es";
import type { FC } from "react";
import { Link } from "react-router-dom";
import { LoadingIndicator } from "src/components/fragments";
import { buttonVariants } from "src/components/ui/button";
import { Card, CardBody } from "src/components/ui/card";
import {
  ROUTE_SITE_CATEGORY,
  ROUTE_SITE_CATEGORY_ADD,
} from "src/constants/route";
import { useSiteCategories } from "src/graphql";
import { useCurrentUser } from "src/hooks";
import { createHref } from "src/utils";

const SiteCategoryList: FC = () => {
  const { isAdmin } = useCurrentUser();
  const { loading, data } = useSiteCategories();

  const categories = sortBy(data?.querySiteCategories?.site_categories ?? [], [
    (cat) => cat.sort_order,
    (cat) => cat.name.toLowerCase(),
  ]).map((category) => (
    <li key={category.id}>
      <Link
        to={createHref(ROUTE_SITE_CATEGORY, category)}
        className="text-link hover:underline"
      >
        {category.name}
      </Link>
      {category.description && (
        <span className="ml-2">
          &bull;
          <small className="ml-2">{category.description}</small>
        </span>
      )}
    </li>
  ));

  return (
    <>
      <div className="flex">
        <h3 className="mr-4">Site Categories</h3>
        {isAdmin && (
          <Link
            to={ROUTE_SITE_CATEGORY_ADD}
            className={`ml-auto ${buttonVariants()}`}
          >
            Create
          </Link>
        )}
      </div>
      <Card>
        <CardBody className="p-4">
          {loading && <LoadingIndicator message="Loading site categories..." />}
          {!loading && <ul>{categories}</ul>}
        </CardBody>
      </Card>
    </>
  );
};

export default SiteCategoryList;
