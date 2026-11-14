import { SceneCountDocument, SceneSortEnum, ScenesDocument } from "src/graphql";
import { createCache } from "src/utils/createClient";
import { describe, expect, it } from "vitest";

const variables = { input: { page: 1, per_page: 2, sort: SceneSortEnum.DATE } };
const scenes = {
  __typename: "Query" as const,
  queryScenes: { __typename: "QueryScenesResultType" as const, scenes: [] },
};
const count = {
  __typename: "Query" as const,
  queryScenes: { __typename: "QueryScenesResultType" as const, count: 40 },
};

describe("scene query cache", () => {
  it.each([
    "rows first",
    "count first",
  ])("retains both selections when separate responses arrive: %s", (order) => {
    const cache = createCache();
    const writeRows = () =>
      cache.writeQuery({ query: ScenesDocument, variables, data: scenes });
    const writeCount = () =>
      cache.writeQuery({ query: SceneCountDocument, variables, data: count });
    if (order === "rows first") {
      writeRows();
      writeCount();
    } else {
      writeCount();
      writeRows();
    }
    expect(cache.readQuery({ query: ScenesDocument, variables })).toEqual({
      queryScenes: scenes.queryScenes,
    });
    expect(cache.readQuery({ query: SceneCountDocument, variables })).toEqual({
      queryScenes: count.queryScenes,
    });
  });

  it("keeps pages and filters independent", () => {
    const cache = createCache();
    cache.writeQuery({ query: ScenesDocument, variables, data: scenes });
    for (const input of [
      { ...variables.input, page: 2 },
      { ...variables.input, sort: SceneSortEnum.TITLE },
    ]) {
      cache.writeQuery({
        query: SceneCountDocument,
        variables: { input },
        data: count,
      });
      expect(
        cache.readQuery({ query: ScenesDocument, variables: { input } }),
      ).toBeNull();
    }
    expect(cache.readQuery({ query: ScenesDocument, variables })).toEqual({
      queryScenes: scenes.queryScenes,
    });
    expect(
      cache.readQuery({ query: SceneCountDocument, variables }),
    ).toBeNull();
  });
});
