import type { FC } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  GenderIcon,
  HighlightedLinks,
  PerformerName,
  TagLink,
} from "src/components/fragments";
import Image from "src/components/image";
import { EditList, URLList } from "src/components/list";
import { Button } from "src/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader } from "src/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "src/components/ui/tabs";
import { ROUTE_SCENE_DELETE, ROUTE_SCENE_EDIT } from "src/constants/route";
import {
  type SceneFragment as Scene,
  TargetTypeEnum,
  usePendingEditsCount,
} from "src/graphql";
import { useCurrentUser } from "src/hooks";
import {
  compareByName,
  createHref,
  formatDuration,
  formatPendingEdits,
  getUrlBySite,
  performerHref,
  studioHref,
  tagHref,
} from "src/utils";
import { FingerprintTable } from "./components/fingerprints/FingerprintTable";

const DEFAULT_TAB = "description";

interface Props {
  scene: Scene;
}

const SceneComponent: FC<Props> = ({ scene }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.hash?.slice(1) || DEFAULT_TAB;
  const { isEditor } = useCurrentUser();

  const { data: editData } = usePendingEditsCount({
    type: TargetTypeEnum.SCENE,
    id: scene.id,
  });
  const pendingEditCount = editData?.queryEdits.count;

  const setTab = (tab: string | null) =>
    navigate({ hash: tab === DEFAULT_TAB ? "" : `#${tab}` });

  const performers = scene.performers
    .map((performance) => {
      const { performer } = performance;
      return (
        <Link
          key={performer.id}
          to={performerHref(performer)}
          className="scene-performer"
        >
          <GenderIcon gender={performer.gender} />
          <PerformerName performer={performer} as={performance.as} />
        </Link>
      );
    })
    .map((p, index) => (index % 2 === 2 ? [" • ", p] : p));

  const tags = [...scene.tags].sort(compareByName).map((tag) => (
    <li key={tag.name}>
      <TagLink
        title={tag.name}
        link={tagHref(tag)}
        description={tag.description}
      />
    </li>
  ));

  const studioURL = getUrlBySite(scene.urls, "Studio");

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-start gap-2">
          <div className="mr-auto">
            <h3 className="text-2xl font-semibold">
              {scene.deleted ? (
                <del>{scene.title}</del>
              ) : (
                <span>{scene.title}</span>
              )}
            </h3>
            <h6 className="text-sm text-muted-foreground">
              {scene.studio && (
                <>
                  <Link
                    to={studioHref(scene.studio)}
                    className="text-link hover:underline"
                  >
                    {scene.studio.name}
                  </Link>
                  <span className="mx-1">•</span>
                </>
              )}
              {scene.release_date}
            </h6>
          </div>
          {isEditor && !scene.deleted && (
            <div className="flex gap-2">
              <Link to={createHref(ROUTE_SCENE_EDIT, { id: scene.id })}>
                <Button>Edit</Button>
              </Link>
              <Link to={createHref(ROUTE_SCENE_DELETE, { id: scene.id })}>
                <Button variant="danger">Delete</Button>
              </Link>
            </div>
          )}
        </CardHeader>
        <CardBody className="pt-0">
          <Image
            images={scene.images}
            emptyMessage="Scene has no image"
            size={1280}
            lightbox
          />
        </CardBody>
        <CardFooter className="flex-wrap gap-x-6 gap-y-1 pt-0">
          <div className="mr-auto flex flex-wrap gap-x-2">{performers}</div>
          {scene.code && (
            <div>
              Studio Code: <strong>{scene.code}</strong>
            </div>
          )}
          {!!scene.duration && (
            <div title={`${scene.duration} seconds`}>
              Duration: <b>{formatDuration(scene.duration)}</b>
            </div>
          )}
          {scene.director && (
            <div>
              Director: <strong>{scene.director}</strong>
            </div>
          )}
          {scene.production_date && (
            <div>
              Produced: <strong>{scene.production_date}</strong>
            </div>
          )}
        </CardFooter>
      </Card>
      <HighlightedLinks urls={scene.urls} />
      <Tabs value={activeTab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="fingerprints">Fingerprints</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger
            value="edits"
            className={pendingEditCount ? "text-warning" : undefined}
          >
            {`Edits${formatPendingEdits(pendingEditCount)}`}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="description" className="space-y-4">
          <div>
            <h4 className="font-semibold">Description:</h4>
            <div>{scene.details}</div>
          </div>
          <div>
            <h6 className="font-semibold">Tags:</h6>
            <ul className="flex flex-wrap gap-2">{tags}</ul>
          </div>
          {studioURL && (
            <>
              <hr className="border-border" />
              <div>
                <b className="mr-2">{studioURL.site.name}:</b>
                <a
                  href={studioURL.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link hover:underline"
                >
                  {studioURL.url}
                </a>
              </div>
            </>
          )}
        </TabsContent>
        <TabsContent value="fingerprints">
          <FingerprintTable scene={scene} />
        </TabsContent>
        <TabsContent value="links">
          <URLList urls={scene.urls} />
        </TabsContent>
        <TabsContent value="edits">
          <EditList type={TargetTypeEnum.SCENE} id={scene.id} />
        </TabsContent>
      </Tabs>
    </>
  );
};

export default SceneComponent;
