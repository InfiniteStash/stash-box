import { groupBy, sortBy } from "lodash-es";
import type { FC } from "react";
import { Link } from "react-router-dom";
import { LoadingIndicator } from "src/components/fragments";
import { buttonVariants } from "src/components/ui/button";
import { Card, CardBody } from "src/components/ui/card";
import { ROUTE_CATEGORY, ROUTE_CATEGORY_ADD } from "src/constants/route";
import { useCategories } from "src/graphql";
import { useCurrentUser } from "src/hooks";
import { createHref } from "src/utils";

const CategoryList: FC = () => {
  const { isAdmin } = useCurrentUser();
  const { loading, data } = useCategories();

  const categoryGroups = groupBy(
    sortBy(data?.queryTagCategories?.tag_categories ?? [], (cat) => cat.name),
    (cat) => cat.group,
  );

  const categories = Object.keys(categoryGroups).map((group) => (
    <div key={group}>
      <h6>{group}</h6>
      <ul>
        {categoryGroups[group].map((category) => (
          <li key={category.id}>
            <Link
              to={createHref(ROUTE_CATEGORY, category)}
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
        ))}
      </ul>
    </div>
  ));

  return (
    <>
      <div className="flex">
        <h3 className="mr-4">Categories</h3>
        {isAdmin && (
          <Link
            to={ROUTE_CATEGORY_ADD}
            className={`ml-auto ${buttonVariants()}`}
          >
            Create
          </Link>
        )}
      </div>
      <Card>
        <CardBody className="p-4">
          {loading && <LoadingIndicator message="Loading categories..." />}
          {!loading && categories}
        </CardBody>
      </Card>
    </>
  );
};

export default CategoryList;
