# OUTFITS-01 — Visitor result journey execution plan

Status implemented and verified locally, 17 November 2026. The user approved up to three visitor outfits and an account prompt for more suggestions before this plan was written.

Tracked in [issue #10](https://github.com/vinay-krishna9/closet-theory/issues/10). BUILD-02 (#6), VISITOR-02 (#8) and ENGINE-01 (#9) are closed. The shared visitor provider, validated browser persistence, public catalog images, pictorial filter controls and matching engine are available. The implementation replaces the earlier `/outfits` development placeholder. Authentication is scheduled after this visitor journey and SPIKE-02.

Follow [product decisions](../product/product-decisions.md), [MVP requirements](../product/MVP.md), [user flows](../product/user-flows.md), [architecture](../technical/architecture.md), the [ENGINE-01 contract](ENGINE-01-plan.md) and [design.md](../../design.md), especially sections 17–21.

## Change

- Replace the production Outfits placeholder with real suggestions from the visitor's selected clothes, with season/formality filters and up to three complete compositions.
- Offer account access when additional compatible results exist. Account users retain six-result pages and Show more in their later authenticated journey.
- Include useful restoration, empty, missing-group, no-match, busy, image-error and generation-error states. Keep browser-storage recovery available.
- Reuse the approved charcoal composition design and public catalog imagery, with readable item details and actual rule-derived reasons.

## Implementation

### 1. Connect the route and request lifecycle

- Keep `src/app/(workspace)/outfits/page.tsx` thin. Put the client view, composition cards, visitor result policy and generation runner in `src/features/outfits/`. Co-locate meaningful component/policy tests. Add feature CSS through the established shared stylesheet structure.
- Consume `useVisitorWardrobe`, `toOutfitItems` and `generateOutfits`. Wait until browser restoration finishes before evaluating completeness. An unavailable storage state can still supply the current in-memory items. Reuse the storage notice and its explicit recovery actions.
- Default season/formality to Any. Keep Filters collapsed initially with a visible current-selection summary. Reuse native-radio pictorial choices, including Any, with Season above Formality. Keep Suggest outfits reachable below the form when the filter panel is collapsed or expanded. Preserve selected values when collapsing.
- Generate on the explicit Suggest outfits action. Before the first request, show a concise ready state. Changing filters or wardrobe items invalidates previous results and presents a request/update action, preventing old compositions from being presented as matching the new selection.
- Associate results with the complete wardrobe/filter snapshot and a request ID. Discard outdated responses. Repeated clicks cannot create duplicate work or append new outfits. Repeating unchanged visitor inputs returns the same ordered suggestions.

### 2. Keep generation responsive and bounded

- ENGINE-01 measured about 0.5 seconds for a large synthetic wardrobe in desktop Node. Validate production bundling of a browser module worker early, using the existing Next.js tooling, then run the pure engine in that worker. The runner adapter belongs to the outfits feature. This uses browser capabilities and the installed stack.
- Show the shared Spinner and accurate busy status for actual work. Cancel obsolete work on a new snapshot or route unmount, and correlate all messages with their request ID. A generation/worker startup failure shows Retry with current selections preserved. Worker lifecycle failures need production-browser tests.
- Retain ENGINE-01's normal work/retention limits and diagnostics. Browser measurements must record actual elapsed behavior and whether the interface remains responsive. Validate worker support and packaging before completing the UI integration. A material change of execution strategy should be documented and reviewed if it changes the approved behavior.

### 3. Apply the three-result visitor allowance

- Add one tested visitor policy that takes successful ranked engine results and exposes only the first three candidates. Determine whether further compatible retained candidates exist before choosing account messaging. Keep this policy separate from the generic six-result engine paging helper.
- Treat the allowance as up to three results for the current wardrobe and filters. Visitors can change either and request again. The same snapshot returns the same three. Refresh or repeated Suggest actions cannot append a fourth result for that snapshot.
- Render only the allowed compositions and their item descriptions. The visitor result list has no Show more action. Keep any additional candidates outside the rendered results, including the accessibility tree.
- When fewer than three compatible results exist, show that actual number. When only three or fewer exist, use general account benefits without claiming that signing in produces more matches from that wardrobe. A bounded search can report further matches only when they are actually known.

### 4. Build the compositions and account prompt

- Build custom `OutfitCard`/`OutfitCanvas` components from current item IDs and metadata. Use the approved 4:3 composition with a top, bottom and shoes, plus a jacket only when returned by the engine. Follow the one-column mobile and two-column tablet/desktop grid. Reference the review design's layout and shared tokens while sourcing production data from visitor selections.
- Reuse the selected catalog type/color image references. Adapt `GarmentPhoto` only as needed for canvas sizing, retaining its existing callers' behavior, skeletons, stale-load protection and retry. Keep garments contained, separated and readable on the neutral canvas. State the generated-sample provenance and show confirmed pattern/customization details as text when imagery is representative.
- Include a readable outfit heading, item list and up to two engine explanations, plus its optional jacket hint. Keep engine identity as the React key. Scores remain internal. Visitor actions include changing clothes/filters and account access.
- For further matches, place a concise account panel below the three results. Once authentication is available, use “Create an account or sign in to see more outfit suggestions,” with Create account and Sign in actions and visitor carryover explained.
- For the current OUTFITS-01 stage, use “More outfits with an account,” a visible “Account access is coming soon” explanation, and an account-details action opening the existing availability notice. Extract that dialog/trigger from AppShell into `src/components/account-access.tsx` so shell and Outfits share its wording, keyboard behavior and focus restoration. Returning to browsing preserves selections and results.
- Keep a normal account-benefit explanation available for wardrobes with three or fewer matches. Personal uploads, preferences, wear logging and statistics follow the existing account boundaries.

### 5. Provide recovery and targeted catalog navigation

- Empty wardrobe offers Quick-add. Missing owned tops, bottoms or shoes identifies the absent group and links to its catalog choices. Add a validated initial group parameter to the Quick-add route/component, such as `/quick-add?group=Shoes`. Unknown parameters fall back to the existing all-clothing view. Preserve ordinary catalog search/customization behavior.
- Distinguish missing owned groups from groups eliminated by filters. Explain the active filter restriction and offer an explicit Try Any filters action. That action applies the named change and requests again. Existing choices remain in place until the visitor takes that action.
- With sufficient groups but incompatible combinations, explain the result and offer filter adjustment or wardrobe editing. Keep a budget-limited empty search distinct from exhaustive no-match. With some results from a limited search, retain the allowed results and provide a concise search-limit explanation where needed.
- Image failure preserves the outfit, item names and matching reasons while providing Photo unavailable and Retry. A generation failure preserves wardrobe/filter state. Navigation, removal, clearing the wardrobe and restored external changes invalidate stale results safely.

## Automated checks owned by implementation

- Unit tests for the visitor allowance with zero, one, two, three and more matches, correct account-prompt eligibility, deterministic repeats and public policy separation from account paging.
- Component tests for collapsed filters and native keyboard behavior, explicit submission, restoration before generation, changed snapshots, repeated clicks, stale/failed worker results, retry, actual reasons, truthful empty states, account-dialog focus and intact wardrobe state.
- Playwright journeys from explicit catalog selection through real suggestions, capped results, filters, jackets, item edits/removal, refresh, account messaging and recovery. Exercise the actual worker bundle from the production build. Add missing-group Quick-add navigation, image failure/retry and storage-failure coverage.
- Review desktop and mobile, 320px reflow, enlarged text, touch targets, keyboard focus, radio navigation, reduced motion, forced colors, image separation and meaningful status announcements. Use existing accessibility checks and manual review. Record device/browser limits explicitly.
- Run `npm.cmd run check`, `npm.cmd run build`, then `npm.cmd run test:e2e -- --workers=2` with port 4174 free. Record actual results and representative browser performance. Introduce further test tooling only through the dependency approval workflow if existing tooling leaves a material gap.

## Browser checks for the user after implementation

1. Start the app with `npm.cmd run dev` and open `http://127.0.0.1:3000/outfits` in a fresh browser context. Expect an empty-wardrobe action to Quick-add.
2. Add an owned T-shirt and jeans. Return to Outfits and request suggestions. Expect a message identifying missing shoes, with a link opening the Shoes catalog group.
3. Add sneakers, return to Outfits and use Suggest outfits with Any/Any. Expect one complete composition using those three selections, with readable names, matching colors and a short reason.
4. Add a shirt and chinos as additional owned clothes. These defaults allow four top/bottom/shoe combinations. Suggest again. Expect exactly three visible outfits and the account panel. The visitor list offers no additional-result pagination.
5. Repeat the same request and refresh/revisit with the same Any filters. Expect stable results capped at three. Open the account notice, close it and confirm the clothes and results are preserved.
6. Expand Filters, choose Formal, then Suggest outfits. With the default Casual sneakers, expect an accurate filter-related no-result message. Select the explicit Any-filter recovery action and confirm suggestions return.
7. Add a compatible simple jacket and request Winter suggestions. Expect the owned jacket in returned outfits. Switch to Summer or Any and request again. Expect jacket-free compositions.
8. Edit or remove a garment through Wardrobe, then revisit Outfits. Request fresh suggestions and confirm compositions use current clothes/tags. Removing all shoes should produce the missing-shoes recovery state.
9. Repeat the journey in a narrow mobile viewport and by keyboard. Filters, Suggest outfits, account notice and recovery links should remain readable and reachable. Screenshot review and automated failure injection are handled during implementation.

## Completion and handoff

Update README's actual Outfits behavior, the architecture's integration status, the documentation index and this plan's completion evidence after implementation. Keep the revised three-result visitor rule consistent across product/design documents and issue #10.

This plan adds no dependency or service provisioning. The public catalog and local visitor wardrobe supply the data. SPIKE-02 and account flows follow the established delivery sequence. Implementation approval covers the route, worker runner, result policy/cards, shared account notice, targeted Quick-add navigation, tests and related documentation described here.

The user approved implementation on 17 November 2026. Completion evidence is recorded below.

## Completion evidence

Implemented on `feat/10-visitor-outfits` after the approved plan was committed as `eb5ab39`. The feature supplies real browser-worker suggestions, a three-result visitor policy, the approved composition layout, shared account access notice, targeted Quick-add navigation and recovery. Generated results belong to the current wardrobe/filter snapshot. Obsolete requests are terminated and mismatched responses ignored. A stalled or failed worker offers Retry after a 15-second technical timeout. The worker returns only the allowed candidates plus diagnostics and whether further matches exist.

The shared garment-photo component retains its default wardrobe/editor behavior while supporting canvas sizing and compact photo-error recovery. The account panel offers more suggestions only when further compatible candidates are known. Account entry accurately explains its upcoming availability. Visitors retain no preference or wear controls. The existing shell browser assertion now checks the real empty Outfits state, replacing the obsolete development-placeholder expectation.

| Check                                 | Result                                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `npm.cmd run check`                   | Passed formatting, lint, type checking and all 145 unit/component tests in 15 files                                                     |
| `npm.cmd run build`                   | Passed production compilation, type checking and route generation, including the bundled worker and validated Quick-add query           |
| `npm.cmd run test:e2e -- --workers=2` | Passed all 62 desktop/mobile Chromium checks in 50.3 seconds after the final accessibility changes                                      |
| Focused browser performance check     | Passed both desktop and mobile-emulated Chromium with 50,000 evaluations, three returned candidates and an active main-thread heartbeat |
| Visual review                         | Desktop/mobile result screenshots and 320px photo-error, reduced-motion and forced-colors filter screenshots inspected                  |
| `git diff --check`                    | Passed                                                                                                                                  |

Browser coverage includes explicit catalog selection, missing shoes and targeted catalog navigation, one available outfit, four compatible combinations capped at three, deterministic repeats/reload, accurate account messaging and dialog focus, Formal-filter recovery, seasonal jackets, garment edits/removal, worker startup retry, pending-request cancellation, photo retry, blocked storage, 320px reflow and native radio keyboard use. New unit/hook checks cover allowance boundaries, worker message matching/cancellation/error/timeout, duplicate submissions, changed snapshots and stale completions. Failure/no-result announcements are exposed through a status region. The explicit Any-filter recovery keeps focus on the persistent Filters button.

On this Windows x64 machine, a focused Chromium measurement with 50 tops, 50 bottoms and 50 shoes completed the capped worker request in 486 ms for the desktop project and 489 ms for Pixel 7 emulation. A one-millisecond main-thread timer ran 125 and 126 times respectively during those calls. These observations include worker startup and transport, use synthetic public metadata, and demonstrate responsiveness rather than a physical-device speed guarantee.

The first narrow browser smoke run reported both cases passing but required cleanup of a restricted local server process. Completed full runs used elevated local process permissions for reliable shutdown. No dependency, service credential, database change or private image was introduced.

Account authentication/import, actual six-result account paging and account writes follow their own features. Physical phones, Safari/Firefox, native high-contrast settings and a full screen-reader session remain unverified. Reduced-motion/forced-colors emulation and desktop keyboard checks were performed. The approved flat composition stays in place while the separate mannequin feasibility issue is pending.
