import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CreatableSelect from "../CreatableSelect";
import Select from "../Select";

describe("Select", () => {
  it("supports keyboard selection and clearing predefined values", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const options = [
      { label: "One", value: "1" },
      { label: "Two", value: "2" },
    ];
    render(
      <Select
        options={options}
        onChange={onChange}
        placeholder="Number"
        isClearable
      />,
    );
    screen.getByRole("combobox", { name: "Number" }).focus();
    await user.keyboard("{ArrowDown}");
    await screen.findByRole("option", { name: "Two" });
    await user.keyboard("{End}{Enter}");
    expect(onChange).toHaveBeenLastCalledWith(options[1]);
    await user.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("keeps the latest search results when requests resolve out of order", async () => {
    const user = userEvent.setup();
    type Result = { label: string; value: string };
    const pending = new Map<string, (results: Result[]) => void>();
    const loadOptions = vi.fn(
      (input: string) =>
        new Promise<Result[]>((resolve) => pending.set(input, resolve)),
    );
    render(<Select loadOptions={loadOptions} placeholder="Search" />);
    const input = screen.getByRole("combobox", { name: "Search" });
    await user.type(input, "a");
    await waitFor(() => expect(pending.has("a")).toBe(true));
    await user.type(input, "b");
    await waitFor(() => expect(pending.has("ab")).toBe(true));
    await act(async () =>
      pending.get("ab")?.([{ label: "Latest", value: "latest" }]),
    );
    expect(await screen.findByRole("option", { name: "Latest" })).toBeVisible();
    await act(async () =>
      pending.get("a")?.([{ label: "Stale", value: "stale" }]),
    );
    expect(
      screen.queryByRole("option", { name: "Stale" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Latest" })).toBeVisible();
  });

  it("extracts a Stash ID when pasting a URL", async () => {
    const user = userEvent.setup();
    const loadOptions = vi.fn(async () => []);
    render(<Select loadOptions={loadOptions} placeholder="Search" />);
    await user.click(screen.getByRole("combobox", { name: "Search" }));
    const id = "12345678-1234-1234-1234-123456789abc";
    await user.paste(`${window.location.origin}/performers/${id}`);
    await waitFor(() => expect(loadOptions).toHaveBeenLastCalledWith(id));
  });

  it("reports failed searches and allows searching again", async () => {
    const user = userEvent.setup();
    const loadOptions = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue([{ label: "Found", value: "found" }]);
    render(<Select loadOptions={loadOptions} placeholder="Search" />);
    await user.type(screen.getByRole("combobox", { name: "Search" }), "a");
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Unable to load options",
    );
    await user.type(screen.getByRole("combobox", { name: "Search" }), "b");
    expect(await screen.findByRole("option", { name: "Found" })).toBeVisible();
  });

  it("creates values with Enter and removes selected chips", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CreatableSelect isMulti onChange={onChange} placeholder="Alias" />);
    await user.type(
      screen.getByRole("combobox", { name: "Alias" }),
      "New Alias",
    );
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenLastCalledWith([
      { label: "New Alias", value: "New Alias" },
    ]);
    await user.click(screen.getByRole("button", { name: "Remove New Alias" }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});
