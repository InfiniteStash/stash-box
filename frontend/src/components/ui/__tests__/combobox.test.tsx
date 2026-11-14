import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AsyncSearchAdd } from "../combobox";

describe("AsyncSearchAdd", () => {
  it("preserves spaces while typing a multi-word search", async () => {
    const user = userEvent.setup();
    const loadOptions = vi.fn().mockResolvedValue([]);
    render(<AsyncSearchAdd loadOptions={loadOptions} onSelect={vi.fn()} />);
    const input = screen.getByRole("combobox");

    await user.type(input, "Jane ");
    expect(input).toHaveValue("Jane ");
    await user.type(input, "Doe");
    expect(input).toHaveValue("Jane Doe");
    await waitFor(() =>
      expect(loadOptions).toHaveBeenLastCalledWith("Jane Doe"),
    );
  });

  it("extracts an entity ID for the query without replacing pasted text", async () => {
    const user = userEvent.setup();
    const loadOptions = vi.fn().mockResolvedValue([]);
    const id = "12345678-1234-4234-8234-123456789abc";
    const url = `${window.location.origin}/performers/${id}`;
    render(<AsyncSearchAdd loadOptions={loadOptions} onSelect={vi.fn()} />);
    const input = screen.getByRole("combobox");

    await user.click(input);
    await user.paste(url);
    expect(input).toHaveValue(url);
    await waitFor(() => expect(loadOptions).toHaveBeenLastCalledWith(id));
  });
});
