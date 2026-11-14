# Frontend color and legacy-style audit

Audited 2026-11-04 on `frontend-tailwind-migration`, including the current uncommitted migration fixes. **The migration still has confirmed color regressions.** This report records findings and a proposed remediation order; the findings below have not been silently changed during the audit.


See also [the padding, margin, and layout audit](SPACING_AUDIT.md), including browser measurements at four viewport widths.

## Scope and evidence

- Inventoried 358 production TS/TSX/CSS files, excluding generated GraphQL code, tests, and the unrelated untracked `components/select` directory.
- Parsed all 209 rules in `styles/legacy.css`; 80 contain color, background, border, shadow, or opacity declarations.
- Checked theme definitions, custom-property references, dynamically constructed utility classes, and actual generated production CSS.
- Measured 44 representative DOM samples in Chromium using the production CSS. Samples include the components' real classes and relevant inherited backgrounds. Checked six additional elements in default, forced-hover, and forced-focus-visible states through DevTools: 18 state measurements.
- Calculated sRGB relative-luminance contrast, compositing alpha backgrounds/foregrounds. This is targeted contrast screening, not a claim that every authenticated page/state meets WCAG.
- Production CSS: `index-BPndjyBt.css`, SHA-256 `08d5ced2cb14f7be2a502cdfd5c53f9f8ec56e056d06b2cdbf2541146b2e2047`.
- Raw inventory, browser results, and diagnostic scripts are saved in `/tmp/frontend-color-audit/` for this session.

Current CSS layer ordering is correct: theme → base → components → utilities. Legacy CSS is loaded once, in components. Font Awesome has its own unlayered stylesheet. Moving the legacy styles into a lower layer exposed conflicts where components still depend on legacy declarations to override utilities. The answer is to give each component a single source of styling, not to restore global specificity battles.

## Confirmed findings

### C01 — P1: sortable image-type rows have near-white text on white

Locations: `src/styles/legacy.css:1066`, `src/components/dragList/DragList.tsx`, `src/pages/imageTypes/ImageTypeOrder.tsx`, `src/pages/users/UserImageTypePreferences.tsx`.

`.DragList-row` uses `background-color: var(--input-bg)` (white), but its labels inherit the card's `#f5f8fa`. Type rows inside the sortable cards therefore have **1.07:1** contrast. Muted descriptions have **1.64:1**. Outer `is-block` rows deliberately clear their background; inner type rows still use white.

Resolution: use a dark card/secondary surface for the rows and its paired foreground. A light row is also viable, but then every child—including descriptions and handles—needs a light-surface foreground pair. Do not reuse the field-surface token for generic sortable rows.

### C02 — P1: selected tag and performer chips inherit the wrong foreground

Locations: `src/components/fragments/TagLink.tsx:26`, `src/styles/legacy.css:107`, `src/components/performerSelect/PerformerSelect.tsx`, `src/components/tagSelect/TagSelect.tsx`.

`TagLink` supplies `bg-secondary`, overriding the legacy light background, but leaves the legacy dark `color: #182026` in place. Plain/disabled chip text has **1.83:1** contrast against `#394b59`. Both form selectors intentionally render disabled links as plain text, so this is a reachable state. Linked tag text escapes the problem through its own `text-link` utility (**8.47:1**), explaining why some tags look correct.

Resolution: put the complete surface/foreground pair on `TagLink` (`bg-secondary text-secondary-foreground`) and remove the legacy chip color declarations. Keep removable controls and metadata paired with that same surface. Do not rely on a nested link to supply the text color.

### C03 — P1: errors and urgent notification indicators request a nonexistent color

Locations: `src/components/fragments/Icon.tsx:18`, `src/pages/notifications/Notification.tsx:186`, `src/components/editCard/EditExpiration.tsx:24`, and 12 add/edit/update pages for performers, studios, scenes, and tags.

There are 13 explicit production occurrences of `text-danger`. The theme exposes `destructive`, not `danger`; the production stylesheet contains **no `.text-danger` rule**. Submission errors, failed-edit tooltip text, urgent notification dots, and danger icons inherit normal foreground color instead of the intended error color. The `info` icon variant is also exposed but has no generated `text-info` utility; no current literal `info` caller was found.

`Icon` additionally constructs `text-${variant}` dynamically. Tailwind cannot guarantee generation from that expression; other variants currently work because literal usages elsewhere happen to emit those classes.

Resolution: use a complete static variant map in `Icon`; map the public `danger` variant to an actual destructive foreground utility. Replace the 13 old error-class occurrences. Give error text a foreground token with enough contrast (C07), rather than only renaming the class. Either define and use an info token explicitly or remove the unsupported API variant.

### C04 — P2: fingerprint unmatch status colors are overridden by shared link-button styles

Locations: `src/pages/scenes/components/fingerprints/FingerprintTableRow.tsx:35`, `src/styles/legacy.css:834`, `src/components/ui/button.tsx`.

The `user-submitted` button is supposed to be green normally and red on hover. It also receives `variant="link"`, which adds `text-link` in the utilities layer. Chromium reports **`#f5f8fa` in both states**: the legacy success/destructive colors lose to the utility, regardless of their greater selector specificity.

Resolution: express normal, hover, and loading colors on the component through explicit utilities/variants. Keep those colors out of a competing legacy rule. Verify the alternate check/x icons and loading spinner still show the intended state.

### C05 — P2: additional live legacy state styles lose to utilities

| Component | Legacy intention | Browser result | Resolution |
|---|---|---|---|
| Favorite star (`Favorite.tsx`, `legacy.css:79`) | Disabled display-only favorites stay fully opaque | Shared `disabled:opacity-50` wins; opacity is 0.5 | Explicitly distinguish display-only favorite indicators from disabled interactive buttons; move the chosen opacity behavior to the component. |
| Notification read control (`Notification.tsx:199`, `legacy.css:794`) | White underline on hover | Border stays transparent; the shared button's 1px border also wins over the legacy 2px bottom border | Put the underline and hover border on this component; remove the overridden legacy declarations. |
| Edit comment (`EditComment.tsx`, `legacy.css:605`) | Custom dark/translucent comment surface | Card's `bg-card` wins; computed surface is `#30404d` | Retain the new card surface or explicitly choose an alternative in the component, then remove the losing rule. This is an obsolete override, not a readability failure. |
| Classification “None” (`ImageClassification.tsx`, `legacy.css:355`) | Legacy muted label | Explicit light-field foreground wins | Keep the explicit readable foreground; remove the superseded legacy color. Do not restore the old pale text on white. |

These are confirmed cascade outcomes. Which decorative behaviors to retain is a component decision; they should not remain contradictory declarations.

### C06 — P2: deleted-image placeholder references a removed Bootstrap variable

Location: `src/styles/legacy.css:1168`.

`color: var(--bs-gray-400)` has no defined variable or fallback. The declaration becomes invalid and the placeholder inherits its parent's foreground. It currently looks readable in the measured card context, but the intended muted treatment has disappeared and its behavior depends on its parent.

Resolution: use `--muted-foreground` or an explicit utility. This is the only unresolved legacy Bootstrap custom property found. `--thumb-height` is not an error: the lightbox supplies it inline at runtime.

### C07 — P2: fill colors are reused as text colors without foreground-safe variants

Measured small-text contrast:

| Foreground | On page `#202b33` | On card `#30404d` |
|---|---:|---:|
| Success `#0f9960` | 3.95:1 | 2.92:1 |
| Destructive `#db3737` | 3.17:1 | 2.35:1 |
| Primary `#137cbd` | 3.19:1 | 2.36:1 |
| Warning `#d9822b` | 4.93:1 | 3.65:1 |
| Muted foreground `#bfccd6` | 8.81:1 | 6.52:1 |
| Selected-tab accent `#48aff0` | 5.96:1 | 4.41:1 |

Examples include `FieldError`, save-success messages, edit-expiration text, and notification preference indicators. A color suitable for a filled button is not necessarily suitable for small text on a dark surface. The tab accent is adequate on its current page background; it needs a slight adjustment if used as small text on cards.

Resolution: introduce role-specific foreground tokens, e.g. success/error/warning text or a status-foreground palette, separately from filled-control backgrounds. Check page, card, and popover surfaces. Preserve ordinary foreground text for long explanatory content.

### C08 — P2: success/warning badges, voting, toasts, and edit diffs lack suitable foreground pairs

Locations: `src/components/ui/badge.tsx:13`, `src/hooks/useToast.tsx:19`, `src/components/editCard/VoteBar.tsx:13`, `src/components/changeRow/ChangeRow.tsx`, and the linked/amendable change-row components.

- White on success: **3.65:1**.
- White on warning: **2.93:1**.
- Inherited app foreground on success edit diff: **3.43:1**.
- Inherited app foreground on destructive edit diff: **4.27:1**.

Primary and destructive filled controls deliberately use white and narrowly pass at **4.52:1** and **4.55:1**. Replacing their white foreground with the slightly darker app foreground would lose that margin.

Resolution: define explicit foreground pairs for every filled semantic surface, including success and warning. For diffs, prefer readable text on subtle tinted surfaces plus a colored edge/label, or explicitly pair the solid background and foreground. Update badges, votes, toasts, and all diff implementations together.

### C09 — P2: nine of ten scene-chip palette colors have insufficient contrast with fixed white text

Locations: `src/pages/scenes/fingerprintClusters/hooks/usePalette.ts:3`, `src/pages/scenes/fingerprintClusters/components/SceneChip.tsx`, `src/styles/legacy.css:944`.

The scene palette is legitimate data-driven styling, but `SceneChip` always uses white text. Ratios, in palette order: **4.55, 2.42, 3.68, 2.29, 3.16, 1.61, 3.42, 1.98, 4.10, 2.12**. The yellow and pink chips are particularly poor.

Resolution: derive a readable foreground per palette color, or use the scene color as a border/swatch beside readable neutral text. Preserve stable scene-to-color mapping and keep canvas and chips in sync. Do not simply replace all palette colors with one theme token.

### C10 — P2: input placeholders are too low contrast

Locations: `src/components/ui/input.tsx:4`, `textarea.tsx`, `combobox.tsx`, `tags-input.tsx`.

`placeholder:text-input-foreground/50` composites to **3.24:1** on white. The actual typed text has **16.49:1** contrast and is correct. Disabled fields should be assessed separately from enabled fields.

Resolution: use a dedicated input-placeholder token or a stronger foreground opacity, then verify it across all light-field variants. Do not change the general dark-page muted token to fix a light-surface placeholder.

### C11 — P2: dead merge selectors represent lost visual behavior

Locations: `src/styles/legacy.css:806`, `src/pages/performers/PerformerMerge.tsx:139`, `src/components/performerCard/PerformerCard.tsx`.

The target card still receives `TargetCard`, but the rules for `.PerformerMerge .TargetCard .PerformerCard-image` cannot match: `PerformerCard` no longer renders `.PerformerCard-image`. The old target outline and merge-specific image sizing therefore do nothing.

Resolution: restore a clear target distinction using current card markup/utilities before deleting these selectors. An unused selector can indicate missing behavior, not merely harmless extra CSS.

### C12 — P3: the selected lightbox thumbnail uses the destructive color

Location: `src/styles/legacy.css:473`.

Chromium confirms the normal selected thumbnail has a `#db3737` border. This is a semantic inconsistency rather than an unknown cascade effect: ordinary selection is presented with the deletion/error color.

Resolution: use the selection/focus accent token, reserving destructive colors for destructive states. Check selection against varied photo backgrounds; a neutral outer outline may still be needed.

## Dead and duplicated style inventory

The first static pass flagged 43 rules. After accounting for vendor-generated Font Awesome classes and the runtime `ListChangeRow-${name}` class, **30 rules refer to DOM classes no longer emitted by the current components**:

| Family | Rules/locations in `legacy.css` | Why they cannot match |
|---|---|---|
| Old loading indicator | 26, 36, 39, 411, 689, 699 | New spinner-based `LoadingIndicator` renders utility classes, not `LoadingIndicator*`. Overlay/upload rules referencing that class are also orphaned. |
| Radio wrapper | 490 | Classification uses native inputs/labels and no `.radio-control`. |
| Old performer card | 540, 545, 552, 555 | `.PerformerCard-image` / `.PerformerCard-star` were replaced with utility markup. |
| Old scene card | 562, 566, 574, 581 | `.SceneCard-body` / `.SceneCard-image` no longer exist. |
| Favorite filter wrapper | 597 | `.FavoriteFilter` is not emitted; the GraphQL enum with the same name is not a CSS class. |
| Body modification wrapper | 726 | No `.BodyModification-location` remains. |
| Old image form card | 738, 742, 746, 754 | `ImageInput` now uses direct utility classes. |
| Note preview wrapper | 757 | `NoteInput` uses Tabs and no longer emits `.NoteInput`. |
| Merge card descendants | 806, 810 | Old card-image class is gone; address C11 before deleting. |
| Old scene detail wrappers | 828, 831 | `.scene-description` and `.scene-tags` were replaced with utilities. |
| Old studio logo wrapper | 864, 870 | Current studio detail renders an image with utility classes, not `.studio-photo`. |
| User API-key column | 896 | No `.apikey` cell remains. |
| Bullet separator | 1052 | No `.bullet-separator` is emitted. |

Also:

- `@keyframes fade-in` has no animation reference.
- `.ImagePage dd` is declared twice with the same margin.
- `.ImageCategorizationFields-option` and its `label` selector are split across multiple blocks; consolidate them after removing superseded typography/color declarations.
- `SearchHint` appears to have no rendered caller. Its hard-coded black icon should not be “fixed” as though it were an active UI regression; verify whether the component should be removed instead.
- The untracked `src/components/select/styles.scss` is not imported by the production app and is outside this change's cleanup scope.

**Do not purge solely by literal-string search.** Font Awesome supplies classes such as `.fa-mars` and `.fa-envelope`; `ListChangeRow-Tags` is assembled dynamically; `.selected`, `.is-dragging`, `.is-target`, and Base UI data attributes are runtime states. Those were preserved in the analysis.

## What is healthy, and what should stay intentional

- Current layer ordering and the single legacy import are correct. Do not move legacy rules above utilities to hide component conflicts.
- Primary/destructive button-link backgrounds and borders now resolve correctly. The earlier transparent-base conflict has been fixed.
- Inputs, textareas, selects, and editable combobox/tag fields now use 16px text. The prominent search-page field remains 18px. The compact studio filter measures 224px inside an 800px container.
- Tabs now use a dedicated blue accent rather than the ordinary link token; pending-edit tabs retain their warning state.
- Light text fields correctly pair white surfaces with `#182026` typed text. Their white-on-white border is not by itself a boundary-contrast failure: the white field surface is clearly distinct from the surrounding dark page. Placeholder contrast is a separate finding.
- Gender-icon hues, scene palette values, photo overlays, and SVG graph strokes are intentional categories of non-theme color. They should be documented/tested, not blanket-deleted as “hard-coded CSS.”
- Disabled controls and photo-overlay labels need context-specific checks; an opacity or a translucent backdrop is not automatically a defect.

## Proposed remediation order

1. **Restore basic readable states:** C01 sortable rows, C02 selected chips, C03 errors/urgent indicators, C06 missing variable.
2. **Make color ownership explicit:** move fingerprint/read-control/favorite states to their components, remove losing declarations, decide the comment surface, restore merge target highlighting. Avoid two owners for the same property.
3. **Complete semantic foreground pairs:** separate status text from filled backgrounds, add success/warning foregrounds, fix diffs/votes/toasts, improve placeholders, and derive palette-chip foregrounds. Recheck all actual surfaces, not just the root background.
4. **Prune dead CSS:** remove the 30 orphaned rules and unused animation after preserving intended behaviors; consolidate duplicate blocks. Replace repeated semantic literals with tokens while retaining legitimate data/photo colors.
5. **Automate the guardrails:** validate Icon variants against generated CSS; reject `--bs-*` and old Bootstrap color utilities in production sources; add browser computed-style assertions for representative states and contrast pairs. Keep a reviewed allowlist for dynamic/vendor classes and data colors. Existing React/jsdom tests do not validate the production CSS cascade.

Acceptance checks should cover light-field chips and placeholders, dark page/card/popover text, normal/hover/focus/selected/disabled states, ordinary versus pending-edit tabs, merge targets, and every scene-chip palette slot. Include screenshot checks on authenticated pages with representative data before calling the entire migration visually complete.

## Reference criteria and limits

For ordinary small text, the screening target is 4.5:1; the relaxed 3:1 criterion applies to sufficiently large text. State icons and control boundaries need their own non-text checks. These are design-quality measurements, not a blanket compliance certification.

- [W3C: Understanding Contrast (Minimum)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum)
- [Tailwind: Detecting classes in source files](https://tailwindcss.com/docs/detecting-classes-in-source-files)
- [Tailwind: Adding custom styles and layers](https://tailwindcss.com/docs/adding-custom-styles)

The audit exercises representative production styles in Chromium, including forced states. It does not enumerate every data-dependent live authenticated screen, every image background, browser forced-color mode, or every possible external SVG asset. Source-confirmed dead rules, browser-confirmed overrides, contrast measurements, and design recommendations are distinguished above rather than treated as equivalent evidence.
