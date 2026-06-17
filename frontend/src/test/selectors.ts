import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

/**
 * Choose an option from a Base UI combobox (src/components/ui/combobox).
 * Types `typed` to trigger/filter, then clicks the option named `optionLabel`.
 */
export const selectComboboxOption = async (
  user: UserEvent,
  typed: string,
  optionLabel: string,
  container?: HTMLElement,
) => {
  const root = container ?? document.body;
  const input = (root.querySelector('input[role="combobox"]') ??
    root.querySelector("input")) as HTMLInputElement | null;
  if (!input) throw new Error("combobox input not found");
  await user.click(input);
  // Clear any pre-filled selection label so typing searches a fresh term.
  await user.clear(input);
  await user.type(input, typed);
  // Prefer an exact label match (distinguishes e.g. "READ" from "READ_ONLY");
  // fall back to substring since option names may include sublabels, gender
  // icons, or thumbnail alt text alongside the label.
  const options = await screen.findAllByRole("option");
  const option =
    options.find((o) => o.textContent?.trim() === optionLabel) ??
    options.find((o) => o.textContent?.includes(optionLabel));
  if (!option) throw new Error(`combobox option "${optionLabel}" not found`);
  await user.click(option);
};

/** Click the clear (×) button of a Base UI combobox. */
export const clearCombobox = async (
  user: UserEvent,
  container?: HTMLElement,
) => {
  const root = container ?? document.body;
  const clearBtn = root.querySelector(
    '[aria-label="Clear"]',
  ) as HTMLElement | null;
  if (!clearBtn) throw new Error("combobox clear button not found");
  await user.click(clearBtn);
};

/**
 * Add a free-text value to a TagsInput (src/components/ui/tags-input): type it
 * and press Enter.
 */
export const addTagsInputValue = async (
  user: UserEvent,
  value: string,
  container?: HTMLElement,
) => {
  const root = container ?? document.body;
  const input = root.querySelector("input") as HTMLInputElement | null;
  if (!input) throw new Error("tags input not found");
  await user.click(input);
  await user.type(input, value);
  await user.keyboard("{Enter}");
};

/** Remove a chip from a TagsInput by its label. */
export const removeTagsInputValue = async (
  user: UserEvent,
  label: string,
  container?: HTMLElement,
) => {
  const root = container ?? document.body;
  const removeBtn = root.querySelector(
    `[aria-label="Remove ${label}"]`,
  ) as HTMLElement | null;
  if (!removeBtn) throw new Error(`chip "${label}" not found`);
  await user.click(removeBtn);
};
