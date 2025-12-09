import type {
  OldSceneDetails,
  SceneDetails,
} from "src/components/editCard/ModifyEdit";

import type { SceneFragment } from "src/graphql";
import {
  diffArray,
  diffImages,
  diffURLs,
  diffValue,
  genderEnum,
  parseDuration,
} from "src/utils";

import type { SceneFormData } from "./schema";

type OmittedKeys = "draft_id" | "added_fingerprints" | "removed_fingerprints";

type SceneCredit = {
  performer: Pick<
    SceneFragment["credits"][number]["performer"],
    "id" | "name" | "gender" | "disambiguation" | "deleted"
  >;
  as?: string | null;
  credit_role: {
    id: number;
    name: string;
    description: string;
  };
  tags: Array<{
    id: string;
    name: string;
    description?: string | null;
  }>;
};

type Tag = {
  id: string;
  name: string;
  description?: string | null;
};

const selectSceneDetails = (
  data: SceneFormData,
  original: SceneFragment | null | undefined,
): [Required<OldSceneDetails>, Required<Omit<SceneDetails, OmittedKeys>>] => {
  const [addedCredits, removedCredits] = diffArray<SceneCredit>(
    (data.credits ?? []).flatMap((c) =>
      c.performerId && c.name
        ? [
            {
              performer: {
                id: c.performerId,
                name: c.name,
                gender: genderEnum(c.gender),
                disambiguation: c.disambiguation ?? null,
                deleted: c.deleted ?? false,
              },
              as: c.alias || null,
              credit_role: {
                id: c.creditRoleId,
                name: c.creditRoleName,
                description: "",
              },
              tags: c.tags ?? [],
            },
          ]
        : [],
    ),
    original?.credits ?? [],
    (s) =>
      `${s.performer.id}|${s.credit_role.id}|${s.as ?? ""}|${s.tags
        .map((t) => t.id)
        .sort()
        .join(",")}`,
  );

  const [addedTags, removedTags] = diffArray<Tag>(
    (data.tags ?? []).flatMap((t) =>
      t.id && t.name
        ? [
            {
              id: t.id,
              name: t.name,
              description: t.description ?? null,
            },
          ]
        : [],
    ),
    original?.tags ?? [],
    (t) => t.id,
  );

  const [addedImages, removedImages] = diffImages(
    data.images,
    original?.images ?? [],
  );
  const [addedUrls, removedUrls] = diffURLs(data.urls, original?.urls ?? []);

  return [
    {
      title: diffValue(original?.title, data.title),
      details: diffValue(original?.details, data.details),
      date: diffValue(original?.release_date, data.date),
      production_date: diffValue(
        original?.production_date,
        data.production_date,
      ),
      duration: diffValue(original?.duration, parseDuration(data.duration)),
      code: diffValue(original?.code, data.code),
      studio:
        original?.studio?.id !== data.studio?.id &&
        original?.studio?.id &&
        original?.studio.name
          ? {
              id: original.studio.id,
              name: original.studio.name,
            }
          : null,
    },
    {
      title: diffValue(data.title, original?.title),
      details: diffValue(data.details, original?.details),
      date: diffValue(data.date, original?.release_date),
      production_date: diffValue(
        data.production_date,
        original?.production_date,
      ),
      duration: diffValue(parseDuration(data.duration), original?.duration),
      code: diffValue(data.code, original?.code),
      studio:
        data.studio?.id !== original?.studio?.id &&
        data.studio?.id &&
        data.studio?.name
          ? {
              id: data.studio.id,
              name: data.studio.name,
            }
          : null,
      added_urls: addedUrls,
      removed_urls: removedUrls,
      added_credits: addedCredits,
      removed_credits: removedCredits,
      added_tags: addedTags,
      removed_tags: removedTags,
      added_images: addedImages,
      removed_images: removedImages,
    },
  ];
};

export default selectSceneDetails;
