import type { FC } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "src/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "src/components/ui/tabs";

import {
  CriterionModifier,
  type StudioQuery,
  TargetTypeEnum,
  usePendingEditsCount,
} from "src/graphql";

type Studio = NonNullable<StudioQuery["findStudio"]>;

import { FavoriteStar, HighlightedLinks } from "src/components/fragments";
import { EditList, SceneList, URLList } from "src/components/list";
import { ROUTE_STUDIO_DELETE, ROUTE_STUDIO_EDIT } from "src/constants/route";
import { useCurrentUser } from "src/hooks";
import {
  createHref,
  formatPendingEdits,
  getImage,
  getUrlBySite,
  studioHref,
} from "src/utils";
import {
  StudioPerformers,
  SubStudioList,
  SubStudioPreview,
} from "./components";

const DEFAULT_TAB = "scenes";

interface Props {
  studio: Studio;
}

const StudioComponent: FC<Props> = ({ studio }) => {
  const { isEditor } = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.hash?.slice(1) || DEFAULT_TAB;

  const { data: editData } = usePendingEditsCount({
    type: TargetTypeEnum.STUDIO,
    id: studio.id,
  });
  const pendingEditCount = editData?.queryEdits.count;

  const studioImage = getImage(studio.images, "landscape");
  const hasSubStudios = studio.sub_studios.count > 0;

  const setTab = (tab: string | null) =>
    navigate({ hash: tab === DEFAULT_TAB ? "" : `#${tab}` });

  const homeURL = getUrlBySite(studio.urls, "Home");

  return (
    <>
      <div className="flex items-start gap-4">
        <div className="mr-auto">
          <h3 className="text-2xl font-semibold">
            {studio.deleted ? (
              <del>{studio.name}</del>
            ) : (
              <span>{studio.name}</span>
            )}
            <FavoriteStar
              entity={studio}
              entityType="studio"
              interactable
              className="ml-2 align-middle"
            />
          </h3>
          {homeURL && (
            <h6 className="text-sm">
              {homeURL.site.name !== "Home" && (
                <b className="mr-2">{homeURL.site.name}:</b>
              )}
              <a
                href={homeURL.url}
                target="_blank"
                rel="noreferrer noopener"
                className="text-link hover:underline"
              >
                {homeURL.url}
              </a>
            </h6>
          )}
          {studio.parent && (
            <span>
              Part of{" "}
              <b>
                <Link
                  to={studioHref(studio.parent)}
                  className="text-link hover:underline"
                >
                  {studio.parent.name}
                </Link>
              </b>
            </span>
          )}
          {studio.aliases.length > 0 && (
            <div className="flex gap-2">
              <b>Aliases:</b>
              <span>{studio.aliases.join(", ")}</span>
            </div>
          )}
        </div>
        {studioImage && (
          <img
            src={getImage(studio.images, "landscape")}
            alt="Studio logo"
            className="max-h-24 object-contain"
          />
        )}
        {isEditor && !studio.deleted && (
          <div className="flex gap-2">
            <Link to={createHref(ROUTE_STUDIO_EDIT, studio)}>
              <Button>Edit</Button>
            </Link>
            <Link to={createHref(ROUTE_STUDIO_DELETE, studio)}>
              <Button variant="danger">Delete</Button>
            </Link>
          </div>
        )}
      </div>
      {hasSubStudios && (
        <>
          <h6 className="mt-2 font-semibold">Sub Studios</h6>
          <SubStudioPreview
            id={studio.id}
            onViewAll={() => setTab("sub-studios")}
          />
        </>
      )}
      <HighlightedLinks urls={studio.urls} />
      <Tabs value={activeTab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="scenes">
            {hasSubStudios ? "All Scenes" : "Scenes"}
          </TabsTrigger>
          {hasSubStudios && (
            <TabsTrigger value="studio-scenes">Studio Scenes</TabsTrigger>
          )}
          {hasSubStudios && (
            <TabsTrigger value="sub-studios">Sub Studios</TabsTrigger>
          )}
          <TabsTrigger value="performers">Performers</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger
            value="edits"
            className={pendingEditCount ? "text-warning" : undefined}
          >
            {`Edits${formatPendingEdits(pendingEditCount)}`}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="scenes">
          <SceneList
            filter={{ parentStudio: studio.id }}
            favoriteFilter="performer"
          />
        </TabsContent>
        {hasSubStudios && (
          <TabsContent value="studio-scenes">
            <SceneList
              filter={{
                studios: {
                  value: [studio.id],
                  modifier: CriterionModifier.INCLUDES,
                },
              }}
            />
          </TabsContent>
        )}
        {hasSubStudios && (
          <TabsContent value="sub-studios">
            <SubStudioList id={studio.id} />
          </TabsContent>
        )}
        <TabsContent value="performers">
          <StudioPerformers id={studio.id} />
        </TabsContent>
        <TabsContent value="links">
          <URLList urls={studio.urls} />
        </TabsContent>
        <TabsContent value="edits">
          <EditList type={TargetTypeEnum.STUDIO} id={studio.id} />
        </TabsContent>
      </Tabs>
    </>
  );
};

export default StudioComponent;
