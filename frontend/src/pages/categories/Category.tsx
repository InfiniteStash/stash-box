import type { FC } from "react";
import { Link, useNavigate } from "react-router-dom";
import DeleteButton from "src/components/deleteButton";
import { TagList } from "src/components/list";
import { buttonVariants } from "src/components/ui/button";
import { ROUTE_CATEGORIES, ROUTE_CATEGORY_EDIT } from "src/constants/route";
import { type CategoryQuery, useDeleteCategory } from "src/graphql";
import { useCurrentUser } from "src/hooks";
import { createHref } from "src/utils";

type Category = NonNullable<CategoryQuery["findTagCategory"]>;

interface Props {
  category: Category;
}

const CategoryComponent: FC<Props> = ({ category }) => {
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();

  const [deleteCategory, { loading: deleting }] = useDeleteCategory({
    onCompleted: (result) => {
      if (result) navigate(ROUTE_CATEGORIES);
    },
  });

  const handleDelete = () => {
    deleteCategory({
      variables: {
        input: { id: category.id },
      },
    });
  };

  return (
    <>
      <Link to={ROUTE_CATEGORIES} className="text-link hover:underline">
        <h6 className="mb-4">&larr; Category List</h6>
      </Link>
      <div className="flex">
        <h3 className="mr-auto">
          <em>{category.name}</em>
        </h3>
        <div className="ml-auto flex gap-2">
          {isAdmin && (
            <>
              <Link
                to={createHref(ROUTE_CATEGORY_EDIT, category)}
                className={buttonVariants()}
              >
                Edit
              </Link>
              <DeleteButton
                onClick={handleDelete}
                disabled={deleting}
                message="Do you want to delete category? This is only possible if no tags are attached."
              />
            </>
          )}
        </div>
      </div>
      {category.description && (
        <div className="flex">
          <b className="mr-2">Description:</b>
          <span>{category.description}</span>
        </div>
      )}
      <hr className="my-2 mb-4 border-border" />
      <TagList tagFilter={{ category_id: category.id }} />
    </>
  );
};

export default CategoryComponent;
