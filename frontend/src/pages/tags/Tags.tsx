import type { FC } from "react";
import { Link } from "react-router-dom";

import { TagList } from "src/components/list";
import { Button } from "src/components/ui/button";
import { ROUTE_TAG_ADD } from "src/constants/route";
import { useCurrentUser } from "src/hooks";
import { createHref } from "src/utils";

const Tags: FC = () => {
  const { isTagEditor } = useCurrentUser();
  return (
    <>
      <div className="mb-4 flex items-center">
        <h3 className="text-2xl font-semibold">Tags</h3>
        {isTagEditor && (
          <Link to={createHref(ROUTE_TAG_ADD)} className="ml-auto">
            <Button>Create</Button>
          </Link>
        )}
      </div>
      <TagList tagFilter={{}} showCategoryLink />
    </>
  );
};

export default Tags;
