import { ApolloClient, ApolloLink, Observable } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import {
  type SceneCountQuery,
  SceneSortEnum,
  type ScenesQuery,
} from "src/graphql";
import { createCache } from "src/utils/createClient";
import { describe, expect, it, vi } from "vitest";
import SceneList from "../SceneList";

vi.mock("src/components/tagFilter", () => ({ default: () => null }));

const rows = (...titles: string[]): ScenesQuery => ({
  __typename: "Query",
  queryScenes: {
    __typename: "QueryScenesResultType",
    scenes: titles.map((title) => ({
      __typename: "Scene",
      id: title,
      title,
      release_date: null,
      duration: null,
      urls: [],
      images: [],
      studio: null,
      performers: [],
    })),
  },
});
const total = (count: number): SceneCountQuery => ({
  __typename: "Query",
  queryScenes: { __typename: "QueryScenesResultType", count },
});

function setup() {
  const requests: {
    name: string;
    reply: (data: ScenesQuery | SceneCountQuery) => void;
  }[] = [];
  const client = new ApolloClient({
    cache: createCache(),
    link: new ApolloLink(
      (operation) =>
        new Observable((observer) => {
          requests.push({
            name: operation.operationName ?? "anonymous",
            reply(data) {
              observer.next({ data });
              observer.complete();
            },
          });
        }),
    ),
  });
  const user = userEvent.setup();
  render(
    <ApolloProvider client={client}>
      <MemoryRouter>
        <SceneList perPage={2} />
      </MemoryRouter>
    </ApolloProvider>,
  );
  async function reply(name: string, data: ScenesQuery | SceneCountQuery) {
    await waitFor(() =>
      expect(requests.some((request) => request.name === name)).toBe(true),
    );
    const index = requests.findIndex((request) => request.name === name);
    const [request] = requests.splice(index, 1);
    await act(async () => request.reply(data));
  }
  return { user, reply, requests };
}

describe("scene list loading", () => {
  it("shows fetched cards before the total arrives and keeps them mounted afterward", async () => {
    const { reply, requests } = setup();
    await reply("Scenes", rows("First", "Second"));
    const first = await screen.findByText("First");
    expect(screen.queryByText("Loading scenes...")).not.toBeInTheDocument();
    await reply("SceneCount", total(40));
    await screen.findByText("40 results");
    expect(screen.getByText("First")).toBe(first);
    expect(requests).toHaveLength(0);
  });

  it("keeps the current grid mounted while filters load, without count-driven refetches", async () => {
    const { user, reply, requests } = setup();
    await reply("Scenes", rows("Original first", "Original second"));
    await reply("SceneCount", total(40));
    await screen.findByText("40 results");
    const original = screen.getByText("Original first");
    await user.selectOptions(screen.getByRole("combobox"), SceneSortEnum.TITLE);
    expect(original).toBeInTheDocument();
    expect(screen.queryByText("Loading scenes...")).not.toBeInTheDocument();
    expect(document.querySelector(".scenes-list")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    await reply("Scenes", rows("Filtered first", "Filtered second"));
    const filtered = await screen.findByText("Filtered first");
    expect(original).not.toBeInTheDocument();
    await reply("SceneCount", total(8));
    await screen.findByText("8 results");
    expect(screen.getByText("Filtered first")).toBe(filtered);
    expect(document.querySelector(".scenes-list")).toHaveAttribute(
      "aria-busy",
      "false",
    );
    expect(requests).toHaveLength(0);
  });

  it("does not let an old zero count hide new cards while the new count loads", async () => {
    const { user, reply } = setup();
    await reply("Scenes", rows());
    await reply("SceneCount", total(0));
    await screen.findByText("No results");
    await user.selectOptions(screen.getByRole("combobox"), SceneSortEnum.TITLE);
    await reply("Scenes", rows("New first", "New second"));
    const first = await screen.findByText("New first");
    expect(screen.queryByText("No results")).not.toBeInTheDocument();
    await reply("SceneCount", total(2));
    await screen.findByText("2 results");
    expect(screen.getByText("New first")).toBe(first);
  });

  it("replaces old cards with the empty state when a filter actually returns no rows", async () => {
    const { user, reply } = setup();
    await reply("Scenes", rows("Original first", "Original second"));
    await reply("SceneCount", total(40));
    await screen.findByText("40 results");
    await user.selectOptions(screen.getByRole("combobox"), SceneSortEnum.TITLE);
    await reply("Scenes", rows());
    await screen.findByText("No results");
    expect(screen.queryByText("Original first")).not.toBeInTheDocument();
    await reply("SceneCount", total(0));
    expect(screen.getByText("No results")).toBeInTheDocument();
  });
});
