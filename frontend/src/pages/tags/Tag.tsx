import type { FC } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Tooltip } from "src/components/fragments";
import { EditList, SceneList } from "src/components/list";
import { Button } from "src/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "src/components/ui/tabs";
import {
  ROUTE_CATEGORY,
  ROUTE_TAG_DELETE,
  ROUTE_TAG_EDIT,
  ROUTE_TAG_MERGE,
} from "src/constants/route";
import {
  CriterionModifier,
  type TagFragment as Tag,
  TargetTypeEnum,
  usePendingEditsCount,
} from "src/graphql";
import { useCurrentUser } from "src/hooks";
import { createHref, formatPendingEdits, tagHref } from "src/utils";

const DEFAULT_TAB = "scenes";

interface Props {
  tag: Tag;
}

const TagComponent: FC<Props> = ({ tag }) => {
  const { isTagEditor } = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.hash?.slice(1) || DEFAULT_TAB;

  const { data: editData } = usePendingEditsCount({
    type: TargetTypeEnum.TAG,
    id: tag.id,
  });
  const pendingEditCount = editData?.queryEdits.count;

  const setTab = (tab: string | null) =>
    navigate({ hash: tab === DEFAULT_TAB ? "" : `#${tab}` });

  return (
    <>
      <div className="flex items-center">
        <h3 className="text-2xl font-semibold">
          <span className="mr-2">Tag:</span>
          {tag.deleted ? <del>{tag.name}</del> : <em>{tag.name}</em>}
        </h3>
        {isTagEditor && !tag.deleted && (
          <div className="ml-auto flex gap-2">
            <Link to={tagHref(tag, ROUTE_TAG_EDIT)}>
              <Button>Edit</Button>
            </Link>
            <Link to={tagHref(tag, ROUTE_TAG_MERGE)}>
              <Tooltip
                text={
                  <>
                    Merge other tags into <b>{tag.name}</b>
                  </>
                }
              >
                <Button>Merge</Button>
              </Tooltip>
            </Link>
            <Link to={createHref(ROUTE_TAG_DELETE, tag)}>
              <Button variant="danger">Delete</Button>
            </Link>
          </div>
        )}
      </div>
      {tag.description && (
        <div className="flex gap-2">
          <b>Description:</b>
          <span>{tag.description}</span>
        </div>
      )}
      {tag.category && (
        <div className="flex gap-2">
          <b>Category:</b>
          <Link
            to={createHref(ROUTE_CATEGORY, tag.category)}
            className="text-link hover:underline"
          >
            {tag.category.name}
          </Link>
        </div>
      )}
      {tag.aliases.length > 0 && (
        <div className="flex gap-2">
          <b>Aliases:</b>
          <span>{tag.aliases.join(", ")}</span>
        </div>
      )}
      <hr className="my-3 border-border" />
      <Tabs value={activeTab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="scenes">Scenes</TabsTrigger>
          <TabsTrigger
            value="edits"
            className={pendingEditCount ? "text-warning" : undefined}
          >
            {`Edits${formatPendingEdits(pendingEditCount)}`}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="scenes">
          <SceneList
            tagsFilter={{
              value: [tag.id],
              modifier: CriterionModifier.INCLUDES,
            }}
            favoriteFilter="all"
          />
        </TabsContent>
        <TabsContent value="edits">
          <EditList type={TargetTypeEnum.TAG} id={tag.id} />
        </TabsContent>
      </Tabs>
    </>
  );
};

export default TagComponent;
