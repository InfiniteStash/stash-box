# Frontend padding, margin, and layout audit

Audited 2026-11-04 on `frontend-tailwind-migration`, including the current uncommitted changes. **Spacing is inconsistent for several independent reasons: reset defaults were removed without replacement, some old rules no longer match, some live legacy rules lose to utilities, and other legacy margins still accumulate with new gaps.** Responsive width constraints introduce additional visible failures.

This is an audit and remediation plan. No production spacing changes were made as part of this audit. The earlier requested studio-filter width fix is already present.

## Scope and measurements

- Inspected the shared card, field, button, button-group, table, tabs, and dialog contracts; page shells; form composition; Markdown; filters; chips; image management; notifications; and fingerprint layouts.
- Inventoried **102 margin/padding/gap declarations across 78 legacy selectors**, alongside JSX utilities and inline spacing.
- Checked generated production CSS rather than assuming old class names still work.
- Used Chromium DevTools to measure **22 source-equivalent fixtures at 375, 768, 1024, and 1440 CSS pixels: 88 cases**, with a 900px viewport height.
- Measurements include bounding boxes, computed margins/padding, gaps, overflow, display, list styles, and table-cell indentation. Fixtures reproduce relevant component classes and ancestor structure; they are not screenshots of every authenticated page or a substitute for testing every data-dependent combination.
- Raw results and diagnostic scripts are saved under `/tmp/frontend-spacing-audit/` for this session.

The audit uses the current production CSS, including the correct `theme → base → components → utilities` layering. Increasing legacy specificity or moving all legacy CSS above utilities would conceal some symptoms while reviving others.

## Findings

### S01 — P1: Markdown has lost paragraph separation, list markers, and nesting indentation

Locations: `src/utils/markdown.tsx:14`, `src/components/editCard/EditComment.tsx`, and the global Preflight reset.

`ReactMarkdown` renders normal HTML without a scoped content-style wrapper. Chromium confirms:

- Consecutive paragraphs have **0px margins** and **0px separation beyond their line boxes**.
- Both top-level and nested lists have **0px padding** and `list-style: none`.
- Nested items begin at the same horizontal position as their parent items.
- Headings and following paragraphs have no block gap.

The old Bootstrap defaults supplied these behaviors. Restoring font sizes did not restore content spacing. GFM checkbox markup also retains the nonexistent `form-check-input` class.

Resolution: give Markdown a scoped content contract for paragraphs, headings, lists, nested lists, blockquotes, code, and tables, including first/last-child edge trimming. Restore list markers/indentation there. Do not add global list margins that would damage UI lists, chip rows, and navigation.

### S02 — P2: classification choices carry an unintended 16px bottom margin

Locations: `src/components/ui/field.tsx:10`, `src/components/image/ImageClassification.tsx`, `src/styles/legacy.css:365`.

Each choice uses `FormGroup`, whose utility classes include `mb-4`. The legacy `.ImageCategorizationFields-option { margin: 0 }` is in components and cannot override utilities. Chromium reports **`margin-bottom: 16px`** on the option wrapper despite the intended zero margin. The group's own 0.3rem gap is added to that when choices wrap.

Resolution: use a purpose-specific choice wrapper without form-row margins, or explicitly pass `mb-0`. Keep label/input spacing inside a field separate from spacing between fields. Remove the losing legacy reset.

### S03 — P2: tag chips combine legacy margins with modern container gaps

Locations: `src/styles/legacy.css:107`, `src/components/fragments/TagLink.tsx`, `src/components/tagSelect/TagSelect.tsx`, `src/pages/scenes/Scene.tsx`.

The chip retains **5px margin on every side**, while tag containers use `gap-2` (**8px**). Chromium measures **18px between adjacent chip boxes**: 5 + 8 + 5. The outer chips also acquire an unintended 5px inset relative to neighboring controls.

Resolution: remove outer margins from the chip and let the container own wrapping and gaps. Give older containers such as `PerformerSelect-list` an explicit gap/stack contract rather than preserving child margins to support them.

### S04 — P2: shared table padding erases nested fingerprint indentation

Locations: `src/components/ui/table.tsx:12`, `src/styles/legacy.css:997`, `src/pages/scenes/fingerprintClusters/components/ClusterMembersTable.tsx`.

Legacy rules request **40px** left padding for OSHASH summary rows and **64px** for their children. The shared table's `[&_td]:px-3` utility is in the higher utilities layer. Chromium reports **12px on normal, summary, and detail cells**. The nesting disappears.

There is a separate density decision: `master` explicitly used **4px vertical cell padding**; the new shared table uses **8px**. This affects all tables even where no override exists and contributes to the changed density despite smaller text.

Resolution: expose a clear table/cell density and indentation mechanism. Apply hierarchical indentation through the component at the same utility layer, or stop the parent from imposing padding on every descendant cell. Do not fix this by making all legacy table selectors `!important`. Choose compact versus comfortable density intentionally per table family.

### S05 — P2: card section spacing has multiple incompatible conventions

Locations: `src/components/ui/card.tsx:17`, `src/components/fragments/EditorCard.tsx`, `src/pages/performers/components/performerInfo.tsx`, `src/pages/scenes/Scene.tsx`.

Defaults give both header and body `p-4`, creating **32px between header text and body text**. `EditorCard` removes header bottom padding and produces **16px**. Scene details remove body top padding; performer details remove body padding entirely and rely on table cells instead. Footer defaults use zero top padding, adding another convention.

These are confirmed differences, not proof that every 32px gap is intrinsically wrong. The problem is that the shared contract does not explain which convention callers should use.

Resolution: choose one card section model—e.g. 16px outer padding, a single 16px internal section gap, and an explicit flush-body/table variant. Avoid having callers independently subtract header/body padding with `pb-0`, `pt-0`, or `p-0` to discover the intended result.

### S06 — P2: broad icon margins and shared button padding defeat local spacing

Locations: `src/styles/legacy.css:939`, `src/components/fragments/Favorite.tsx`, `src/styles/legacy.css:75`, `src/styles/legacy.css:245`.

- `.SearchPage .fa-icon { margin-right: 10px }` applies even in controls already using `gap-1`. Chromium measures **14px** between a facet icon and its label: 10px margin + 4px gap. It also affects nested remove/count icons across the page.
- `.FavoriteStar { padding: 0 }` loses to the shared small button's `px-3`. A 14px icon produces a **40px-wide** control; a heading's `pl-2` produces **36px**, while the old **-4px top margin** still applies. This combines new horizontal padding with an old vertical alignment hack.
- Lightbox navigation requests `padding: 4px 8px` through legacy CSS but receives the standard button's **8px 16px** instead.

Resolution: use explicit icon/button sizes and local gaps. Remove descendant-wide icon margins and the negative favorite offset. A dedicated square icon-button size avoids using a text-button size and then fighting its padding.

### S07 — P2: page gutters and action separation are not owned consistently

Locations: `src/Main.tsx:235`, `src/pages/home/Home.tsx:41`, `src/pages/performers/components/performerInfo.tsx:112`.

The main shell supplies **16px horizontal padding**, while Home adds `mx-4`, making its content begin **32px from the viewport edge**. Other page content starts at 16px. This may be a deliberate Home inset, but it is not expressed through a shared page-width/gutter contract.

Performer actions render immediately before the information grid with no bottom margin or parent gap. Chromium confirms **0px separation** between the action-row box and the following card. Most other page toolbars explicitly use `mb-4`.

Resolution: let the shell own the viewport gutter, use explicit max-width/centering variants for narrower content, and give page heading/action sections a shared separation rule. Decide whether Home needs a different width, rather than adding another arbitrary outer margin.

### S08 — P1: login has a fixed 960px wrapper and overflows phones

Location: `src/styles/legacy.css:1045`, `src/Login.tsx`.

`.LoginPrompt` remains **960px wide**. At a 375px viewport, document width becomes **960px**, and the 384px form is centered inside that oversized box at x=288. The visible phone viewport therefore does not contain the full form. Centering margins cannot repair a container wider than the viewport.

Resolution: use a responsive full-width shell with safe horizontal padding and a bounded form max-width. Use a min-height/centering policy that can yield to short viewports and the keyboard instead of relying on the old fixed desktop wrapper.

### S09 — P1: the header switches to desktop navigation before the contents fit

Location: `src/Main.tsx:180` and its `md:flex` navigation groups.

For the editor/moderator/admin-style link set and a short sample username, measured results are:

| Viewport | Document width | Additional failure |
|---|---:|---|
| 768px | **1178px** | Main navigation grows to 64px tall inside the fixed 56px header; its top is -4px. |
| 1024px | **1242px** | Search and user actions extend beyond the viewport. |
| 1440px | 1440px | The measured set fits. |

The fixture omits the notification control and optional guidelines link, so it does not exaggerate the required width. Shorter role-specific menus may fit earlier; longer names/links need more room.

Resolution: choose collapse behavior based on the actual combined content budget; allow a genuinely flexible search area and keep groups shrinkable where appropriate. A later breakpoint alone still needs testing with long usernames and optional links. Do not hide overflow and thereby hide actions.

### S10 — P1: the lightbox sidebar can consume the entire image pane

Locations: `src/styles/legacy.css:183`, `:223`, `src/components/image/ImageLightbox.tsx`.

The body is a horizontal flex row with responsive side padding, but the sidebar has `flex: 0 1 500px` and `min-width: 240px`. Its `width: 28vw` does not govern the main-axis allocation because the flex basis is 500px.

Measured pane widths:

| Viewport | Image/main pane | Sidebar |
|---|---:|---:|
| 375px | **0px** | 321.5px |
| 768px | **175.2px** | 500px |
| 1024px | 405.6px | 500px |
| 1440px | 780px | 500px |

Resolution: stack or switch the editor/gallery into an alternate pane on small screens. On wider screens, give the sidebar a deliberate bounded width while preserving usable image space. Reducing only the body's padding will not solve the flex-allocation problem.

### S11 — P1: dialog spacing has no safe viewport inset or long-content scrolling

Location: `src/components/ui/dialog.tsx:20`.

The popup uses `w-full max-w-lg`, is centered with a transform, and has 24px padding. It has no viewport gutter, max-height, or overflow policy. At 375px it touches both screen edges. A representative long-content fixture becomes **970px high** in a 900px viewport, with its top at **-35px**. Its internal overflow remains `visible`.

Resolution: bound width by viewport minus gutters, bound height by the dynamic viewport, and provide an explicit scrolling body. Keep title/actions reachable. Verify keyboard focus and scrolling within the modal, including a mobile keyboard. Adding larger padding would worsen this problem.

### S12 — P2: the image uploader retains a desktop column split and a 400px-tall drop zone

Locations: `src/components/editImages/editImages.tsx:103`, `src/styles/legacy.css:646`.

The grid always divides the page into 7/12 gallery and 5/12 upload columns. The drop zone declares 400×400px but is inside a flex container that shrinks its width. The actual behavior is **not necessarily horizontal overflow**:

| Viewport | Upload column | Actual drop zone |
|---|---:|---:|
| 375px | 142.9px | **142.9×400px** |
| 768px | 306.7px | **306.7×400px** |
| 1024px | 413.3px | 400×400px |
| 1440px | 586.7px | 400×400px |

Resolution: stack upload/gallery sections at small widths, restore the split only when it fits, and use a responsive drop-zone width/aspect/min-height. Keep the studio-specific upload sizing as an explicit variant rather than another `.StudioForm .EditImages-drop` override.

### S13 — P2: errors retain a large reserved height but lose centering

Locations: `src/components/fragments/ErrorMessage.tsx:8`, `src/styles/legacy.css:43`.

The wrapper renders `className="row ErrorMessage"`. Bootstrap's `.row` is gone; `.ErrorMessage` supplies align/justify properties but no flex/grid display. Chromium shows `display: block`, **320px height**, and the error heading at **x=0, y=0** of the wrapper. This creates a large empty region without the intended centering.

Resolution: define the error layout explicitly with utilities and a purposeful min-height, or keep it in normal content flow. Remove the obsolete `.row` dependency.

### S14 — P2: sub-studio “View all” retains a negative-indent compensation

Location: `src/pages/studios/components/subStudioPreview.tsx:40`, `src/styles/legacy.css:879`.

The list has no padding/markers after Preflight, but the final item still uses inline **`margin-left: -16px`**. It is laid out in a fixed three-column list even at phone width. The old `btn btn-link` classes also have no generated styles.

Resolution: remove the obsolete indentation compensation and make column count responsive, or use a wrapping grid/list with explicit spacing. Style the action with the shared button/link pattern.

### S15 — P2/P3: old layout classes either do nothing or mean something different

Production CSS checks confirm:

- `.row`, `.btn`, `.btn-link`, `.form-check-input`, `.d-flex`, and `.align-items-center` have no generated rules.
- **`.col-6` and `.col-9` do exist, but mean `grid-column: 6` / `grid-column: 9` in Tailwind**, not Bootstrap's half-width / three-quarter-width columns. They are not a substitute for `col-span-*` or an explicit width.
- `UserAdd` and `UserPassword` retain `col-6`; the forms inside already use `w-full md:w-1/2`, so removing the wrapper class does not automatically require doubling the form width.
- Submission errors retain `col-9` and therefore do not have their old 75% width. Compare the error placement against the actual form max-width rather than mechanically mapping the class.
- `ms-*` and `me-*` remain valid Tailwind logical-margin utilities. Their presence alone is not a migration failure.

Resolution: remove or replace obsolete classes based on current DOM ownership and intent. Include class-name collisions in the migration audit; a “class exists in CSS” test is insufficient.

### S16 — P3: spacing numbers were not a transferable Bootstrap contract

A Bootstrap spacing key and a Tailwind spacing key are not interchangeable:

| Key | Bootstrap 5.2 default | Tailwind current default |
|---|---:|---:|
| 1 | 4px | 4px |
| 2 | 8px | 8px |
| 3 | 16px | 12px |
| 4 | 24px | 16px |
| 5 | 48px | 20px |

This is a migration hazard, not a recommendation to restore all old Bootstrap spacing. The old theme also customized table padding and horizontal-rule margins, so defaults alone do not reproduce the old UI.

The current code mixes 5px chip margins, 10px search-card padding, 20px vote margins, fractional-rem chip padding, shared `p-4`, and parent `gap-*`. Some are valid optical choices; together they need a reviewed scale and ownership rules.

Resolution: choose the new spacing scale by role—control padding, field spacing, card sections, page sections, viewport gutters—and normalize to it. Avoid globally redefining Tailwind's base spacing variable to make a few legacy numbers resemble Bootstrap.

## Dead spacing, duplicates, and composition checks

The [color audit](COLOR_AUDIT.md) identified 30 rules tied to DOM classes no longer emitted. **11 spacing declarations across 10 of those selectors are dead**. They include old loading-indicator, image-card, body-modification, note-preview, scene-tag, studio-logo, and bullet-separator hooks. Some other dead rules control dimensions rather than margin/padding and are outside that count.

Do not remove rules solely by text search: Font Awesome classes and `ListChangeRow-${name}` are generated dynamically. Preserve intended behavior such as merge-target highlighting before deleting the orphaned selector.

Live overrides also need consolidation:

- Classification `margin: 0` loses to `FormGroup`'s `mb-4` (S02).
- Favorite `padding: 0` loses to shared button padding (S06).
- Lightbox navigation padding loses to shared button padding (S06).
- Hierarchical table indentation loses to the table's descendant utilities (S04).
- The duplicate `.ImagePage dd` declaration and split classification blocks should be consolidated.

Not every apparent double margin really adds: the form-panel fixture with a final `FormGroup` (`mb-4`) and following actions (`mt-2`) has a **16px gap**, because the adjacent block margins collapse. The panel's own bottom padding is another 16px. Simply summing declarations would incorrectly report a 24px field/action gap. Flex/grid containers and padding boundaries change these rules, which is another reason to prefer a documented parent gap/stack contract.

## Proposed spacing contract

1. **Page shell:** one owner for viewport gutters and max-width. Use responsive page-width variants instead of nested `mx-*` compensation.
2. **Vertical sections:** parent stacks own section gaps. Titles, intro copy, rules, action rows, and content blocks get deliberate spacing; bare HTML defaults are not the layout system.
3. **Cards:** one outer-padding and inter-section model, with an explicit flush table/media variant. Avoid implicit header + body padding accumulation.
4. **Forms:** field internals own label/control/error gaps; the parent owns spacing between fields. Small choice controls should not inherit full form-row margins.
5. **Chips and repeated items:** containers own outer gaps; items own internal padding. No per-chip outer margins plus parent gaps.
6. **Tables:** explicit density plus cell-level hierarchy overrides that can win over shared defaults.
7. **Icons:** use icon-button sizes and local gaps. No page-wide icon margins or legacy negative alignment offsets.
8. **Responsive overlays:** viewport-safe gutters, scrolling, and a stacked/alternate-pane policy for small screens. Fixed desktop dimensions must be bounded by actual available space.
9. **Markdown:** scoped content defaults with first/last-child trimming and list nesting, separate from UI chrome.

## Remediation order and acceptance checks

1. Fix lost content structure and reachability: S01 Markdown, S08 login, S09 header, S10 lightbox, S11 dialogs.
2. Fix clear spacing regressions: S02 choice margins, S03 chip accumulation, S04 indentation, S06 icon controls, S12 uploader, S13 errors, S14 list compensation.
3. Choose consistent card/page/section contracts (S05/S07/S16), then migrate callers to those patterns.
4. Remove dead/duplicate rules and old class collisions only after preserving useful behaviors.
5. Add browser checks for representative spacing and width states. Assert bounding boxes, scroll widths, and computed padding rather than testing class strings alone.

Acceptance matrix: phone/tablet/laptop/desktop widths; ordinary and long text; role-dependent navigation; nested Markdown; dense tables with expanded children; forms with and without errors/help text; mixed linked/plain/removable chips; modal short/long content; lightbox with/without editor; and upload states before/during/after selecting a file.

Existing React tests can verify behavior but do not prove the production layout is correct. The measurements above establish specific problems; they do not claim every authenticated page/data combination has been visually exercised.

## References

- [Tailwind Preflight: removed margins and unstyled lists](https://tailwindcss.com/docs/preflight)
- [Bootstrap 5.2 spacing scale](https://getbootstrap.com/docs/5.2/utilities/spacing/)
- `master:frontend/src/styles/theme.scss` for the repository's old table and rule spacing overrides.

## Follow-up: missing spacing between sibling sections

The two PerformerInfo reports shared a narrower pattern than general spacing inconsistency: a preceding component and a following component were siblings in an ordinary block/fragment, with no parent stack/gap and no explicit boundary margin. Tailwind's reset no longer supplies the old incidental spacing. The action row now has `mb-4`; `HighlightedLinks` now has `my-3`, container-owned icon gaps, and no empty-row gap. These follow-up fixes postdate the initial audit.

The same pattern remains at these locations:

| Location | Missing boundary |
|---|---|
| `src/pages/home/Home.tsx:44` | Section heading → scene grid, and trending grid → recently-added section. Internal grid gaps do not separate adjacent sections. |
| `src/pages/imageTypes/ImageTypeOrder.tsx:130` | First description paragraph → second description paragraph → sortable groups; the paragraphs and outer group wrapper have no boundary spacing. |
| `src/pages/imageReview/ImageReview.tsx:145` | Page heading → explanatory paragraph; the list's later `mt-2` does not add a gap above that paragraph. |
| `src/pages/users/User.tsx:354` | Profile action/header row → divider → private information grids. The divider changes border color but has no margin, and these siblings have no parent gap. |
| `src/pages/performers/components/scenePairings.tsx:169` | Pairing row → divider → next row; row-internal grid gaps do not separate sibling rows. |
| `src/pages/studios/components/studioPerformers.tsx:156` | Same pairing-row/divider pattern. |
| `src/pages/scenes/Scene.tsx:157` | Info card → tabs when `HighlightedLinks` is empty. The icon row is hidden, so its margins cannot be relied on to separate the other two sections. |
| `src/pages/studios/Studio.tsx:141` | Header → tabs when both sub-studio preview and highlighted links are absent. Optional children should not be the sole source of required section spacing. |
| Add/edit pages such as `src/pages/performers/PerformerAdd.tsx:43`, `src/pages/sites/SiteAdd.tsx:26`, and `src/pages/users/UserAdd.tsx:37` | Title → bare divider → form. Some form contents have their own panel padding, but it does not provide the missing title/divider margin. |
| `src/pages/categories/Categories.tsx:22` | Category group heading → list, and one category group → next; neither group wrapper nor list supplies separation. |

A TypeScript syntax-tree scan found 33 page-level divider usages without explicit vertical-margin utilities. They are review candidates, not 33 independently verified bugs: for example, the divider in the scene Description panel is already inside `space-y-4`. The candidate inventory is saved in `/tmp/section-spacing-candidates.json`.

The systemic fix is to assign section spacing to the nearest stable parent (a stack, gap, or explicit section wrapper), with separate internal spacing inside each child. Conditional children should not be the only source of spacing between mandatory siblings. Scope prose spacing separately, and avoid making every `h3`, `p`, or `hr` globally add margins that would interfere with cards, toolbars, and dialogs.
