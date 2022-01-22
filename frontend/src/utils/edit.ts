import {
  Edit,
  StudioFragment as Studio,
  TagFragment as Tag,
  PerformerFragment as Performer,
  SceneFragment as Scene,
  OldTagEditDetailsFragment as OldTagEdit,
  OldSceneEditDetailsFragment as OldSceneEdit,
  OldStudioEditDetailsFragment as OldStudioEdit,
  OldPerformerEditDetailsFragment as OldPerformerEdit,
  NewTagEditDetailsFragment as TagEdit,
  NewPerformerEditDetailsFragment as PerformerEdit,
  NewStudioEditDetailsFragment as StudioEdit,
  NewSceneEditDetailsFragment as SceneEdit,
} from "src/graphql";

type Target = Studio | Tag | Performer | Scene;
type Details = Edit["details"];

import { ROUTE_HOME } from "src/constants/route";
import { performerHref, tagHref, studioHref, sceneHref } from "./route";

interface TypeName {
  __typename?: string | undefined;
}

export const isTag = (entity: TypeName | null | undefined): entity is Tag =>
  entity?.__typename === "Tag";

export const isPerformer = (
  entity: TypeName | null | undefined
): entity is Performer => entity?.__typename === "Performer";

export const isTagDetails = (details?: TypeName | null): details is TagEdit =>
  details?.__typename === "TagEdit";

export const isPerformerDetails = (
  details?: TypeName | null
): details is PerformerEdit => details?.__typename === "PerformerEdit";

export const isStudio = (
  entity: TypeName | null | undefined
): entity is Studio => entity?.__typename === "Studio";

export const isStudioDetails = (
  details?: TypeName | null
): details is StudioEdit => details?.__typename === "StudioEdit";

export const isStudioOldDetails = (
  details?: TypeName | null
): details is OldStudioEdit => details?.__typename === "StudioEdit";

export const isTagOldDetails = (
  details?: TypeName | null
): details is OldTagEdit => details?.__typename === "TagEdit";

export const isPerformerOldDetails = (
  details?: TypeName | null
): details is OldPerformerEdit => details?.__typename === "PerformerEdit";

export const isScene = (entity: TypeName | null | undefined): entity is Scene =>
  entity?.__typename === "Scene";

export const isSceneDetails = (
  details?: TypeName | null | undefined
): details is SceneEdit => details?.__typename === "SceneEdit";

export const isSceneOldDetails = (
  details?: TypeName | null
): details is OldSceneEdit => details?.__typename === "SceneEdit";

export const isValidEditTarget = (
  target: Target | null | undefined
): target is Performer | Tag | Studio | Scene =>
  (isPerformer(target) ||
    isTag(target) ||
    isStudio(target) ||
    isScene(target)) &&
  target !== undefined;

export const getEditTargetRoute = (target: Target): string => {
  if (isTag(target)) {
    return tagHref(target);
  }
  if (isPerformer(target)) {
    return performerHref(target);
  }
  if (isStudio(target)) {
    return studioHref(target);
  }
  if (isScene(target)) {
    return sceneHref(target);
  }

  return ROUTE_HOME;
};

export const getEditTargetName = (target: Target | null): string => {
  if (isScene(target)) {
    return target?.title ?? target.id;
  }

  return target?.name ?? target?.id ?? "-";
};

export const getEditTargetEntity = (target: Target) => {
  if (isTag(target)) {
    return "Tag";
  }
  if (isPerformer(target)) {
    return "Performer";
  }
  if (isStudio(target)) {
    return "Studio";
  }
  if (isScene(target)) {
    return "Scene";
  }
};

export const getEditDetailsName = (details: Details | null): string => {
  if (isSceneDetails(details)) {
    return details.title ?? "-";
  }

  return details?.name ?? "-";
};
