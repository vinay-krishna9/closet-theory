# Personal Stylist — Design System

Status: implementation specification · Cool charcoal revision approved 12 November 2026 · Comfortable density

Original specification finalized: 6 November 2026. The explicit darker, sleeker direction approved on 12 November 2026 supersedes the warm palette and light-workspace wording below; section 17 is authoritative for color roles and section 18 for the newly approved font pairing. Other layout, interaction and product rules remain in effect.

## 1. Authority and provenance

This file is the visual and interaction source of truth for the Personal Stylist app. Read it before implementing or changing a page or component. Reuse its semantic tokens and shared components rather than creating page-specific variations.

Source: **Project Handoff Summary**, conversation `6aeda87f-d7f4-83eb-b52c-a0d02e782352`. All 15 user-approved decisions are recorded below. Numeric values explicitly proposed in that conversation are preserved in the tables marked **source values**.

**Provenance:** the source's proposed Colors section contained no hex values. The warm palette supplied in this document was subsequently accepted in the follow-up discussion. Other originally missing metrics, including exact font weights, line heights, shadows, navigation heights, drawer width, upload limits and chart details, remain labelled implementation defaults. They are not quotations or historical approvals. The Orvante reference's colors, fixed artboard scaling, imagery, copy and lengthy animations are not Personal Stylist tokens.

Priority: explicit future user decisions → approved decisions in this file → exact source values → completion defaults. Do not silently reinterpret an approved decision.

## 2. Approved decisions

| #   | Area               | Approved decision                                                    |
| --- | ------------------ | -------------------------------------------------------------------- |
| 01  | Direction          | Editorial Minimalism                                                 |
| 02  | Palette            | Cool charcoal and graphite; see revision 17                          |
| 03  | Accent             | Monochrome only                                                      |
| 04  | Typography         | Space Grotesk + Manrope                                                |
| 05  | Motion             | Balanced                                                             |
| 06  | Theme              | Dark workspace; no theme toggle or OS-driven switching               |
| 07  | Desktop navigation | Top navigation                                                       |
| 08  | Wardrobe cards     | Image-first minimal cards                                            |
| 09  | Corners            | Soft corners, 8–12px                                                 |
| 10  | Landing            | Editorial marketing landing page                                     |
| 11  | Outfits            | Outfit composition on neutral canvas                                 |
| 12  | Mobile navigation  | Bottom tab navigation                                                |
| 13  | Density            | Comfortable                                                          |
| 14  | Add/edit           | Desktop side drawer; mobile full-screen form                         |
| 15  | Photo treatment    | Automatically remove backgrounds on upload                           |

### Follow-up decisions and final implementation choices

- **Shared components:** shadcn/ui, customized to this design system; custom wardrobe cards, composition canvas and upload workflow.
- **Icons:** Lucide outline icons. Use Heart for “Favorite” and CircleSlash for “Not for me”; these glyph choices are final implementation defaults following the requested replacement of thumbs. Use consistent 20px icons, 24px for primary navigation, and a 1.75px stroke. Icons sit inside targets of at least 44 × 44px.
- **Outfit preference:** three states—favorite, no opinion, disliked. New suggestions start with no opinion and never require feedback. A heart means favorite; there is no separate favorite field. No stars or thumbs controls.
- **Ordering:** favorites first, then no-opinion suggestions. Hide disliked outfits by default; “Show disliked” reveals them last. Rank within each group by the existing outfit score with deterministic ties.
- **Wardrobe:** no individual-item favorites or favorite filter.
- **Wear logging:** “I wore this” logs today immediately, confirms success and offers Undo.
- **Staples:** realistic sample garment photos, with appropriate licensing and consistent treatment.
- **Uploads:** review the processed preview before saving; offer Retry, Use original and Choose another photo. On failure, let the user explicitly choose to save the original; do not silently save it.
- **Base palette, revised:** Paper `#E9E3D9`, Surface `#E4DED4`, Canvas `#D5CCBF`, Charcoal `#191919`. This darker warm stone palette supersedes the earlier white/off-white surface values. No pure white in interface surfaces, labels, focus rings or icons; real garment photos retain their natural colors.
- **Light/dark composition:** alternate warm light and charcoal sections on the public landing page. Use charcoal app navigation above a warm light workspace. These are contextual surfaces on the same page, not user-selectable themes. Do not add a light/dark toggle or automatically invert the UI based on operating-system theme.
- **Adaptive image backgrounds:** final completion default adopts the recommended muted garment-derived tint. This extends the original neutral canvas with restrained near-neutral variation at the updated darker lightness; retain neutral fallback and monochrome controls. The exact algorithm below is an implementation choice, not a previously approved source token.

The interface is quiet, spacious and fashion editorial. Clothing colors remain accurate and provide natural visual variety; monochrome applies to interface branding, not garment photography. Marketing may be expressive; everyday wardrobe operations stay direct and fast. Avoid glass effects, decorative gradients, oversized dashboard typography, fixed-artboard scaling and scroll-jacking.

## 3. Semantic CSS tokens

The base warm palette was accepted in follow-up. Supporting semantic colors and supplementary metrics complete the system. Token names express roles so components do not depend on raw color values. Statuses use monochrome surfaces, explicit text and distinct icons. The source allowed accessible semantic status colors but did not require them; do not add a decorative brand accent. The only garment-derived interface color is the bounded image/canvas tint described below.

```css
:root {
  color-scheme: light;
  --color-background: #e9e3d9;
  --color-surface: #e4ded4;
  --color-surface-subtle: #ddd6ca;
  --color-canvas: #d5ccbf;
  --color-garment-canvas: var(--color-canvas); /* overridden per media region */
  --color-text: #191919;
  --color-text-muted: #5e5a54;
  --color-border: #bcb3a6;
  --color-border-control: #787167;
  --color-primary: #191919;
  --color-primary-hover: #333333;
  --color-on-primary: #e9e3d9;
  --color-hover: #d9d1c5;
  --color-selected: #cec4b6;
  --color-section-dark: #191919;
  --color-on-dark: #e9e3d9;
  --color-on-dark-muted: #c3bbae;
  --color-border-dark: #827a6e;
  --color-dark-hover: #33312e;
  --color-inverse-action: #e9e3d9;
  --color-on-inverse-action: #191919;
  --color-focus: #191919;
  --color-overlay: rgb(0 0 0 / 40%);
  --color-disabled-bg: #d9d1c5;
  --color-disabled-text: #5e5a54;
  --color-error-text: #191919;
  --color-error-bg: #ddd6ca;
  --color-success-text: #191919;
  --color-success-bg: #ddd6ca;
  --color-warning-text: #191919;
  --color-warning-bg: #ddd6ca;

  --font-display: "Space Grotesk", Arial, sans-serif;
  --font-ui: "Manrope", Arial, sans-serif;
  --text-hero: 2.75rem; /* 44px mobile */
  --text-page: 2rem; /* 32px mobile */
  --text-section: 1.625rem; /* 26px mobile */
  --text-card: 1rem; /* 16px mobile */
  --text-body: 1rem;
  --text-meta: 0.875rem;
  --text-label: 0.75rem;
  --leading-hero: 1.05;
  --leading-heading: 1.15;
  --leading-card: 1.35;
  --leading-body: 1.5;
  --leading-meta: 1.45;
  --tracking-display: -0.04em;
  --tracking-heading: -0.025em;
  --tracking-label: 0.06em;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-24: 6rem;
  --content-max: 80rem;
  --page-gutter: 1rem;
  --radius-control: 0.5rem;
  --radius-card: 0.75rem;
  --radius-dialog: 0.75rem;
  --border-width: 1px;
  --control-height: 3rem;
  --target-min: 2.75rem;
  --nav-height: 4rem;
  --mobile-tabs-height: 4rem;
  --drawer-width: 30rem;
  --focus-width: 2px;
  --focus-offset: 3px;
  --shadow-card-hover: 0 6px 18px rgb(0 0 0 / 6%);
  --shadow-overlay: 0 12px 40px rgb(0 0 0 / 14%);
  --z-header: 20;
  --z-tabs: 30;
  --z-overlay: 40;
  --z-dialog: 50;
  --z-toast: 60;

  --motion-button: 150ms;
  --motion-card: 200ms;
  --motion-dialog: 250ms;
  --motion-page: 250ms;
  --motion-reveal-min: 500ms;
  --motion-reveal-max: 700ms;
  --motion-outfit-min: 250ms;
  --motion-outfit-max: 350ms;
  --ease-expressive: cubic-bezier(0.22, 1, 0.36, 1);
}

@media (min-width: 768px) {
  :root {
    --page-gutter: 2rem;
  }
}
@media (min-width: 1024px) {
  :root {
    --page-gutter: 3rem;
    --text-hero: 5.5rem;
    --text-page: 3rem;
    --text-section: 2rem;
    --text-card: 1.125rem;
  }
}

body {
  margin: 0;
  background: var(--color-background);
  color: var(--color-text);
  font-family: var(--font-ui);
  font-size: var(--text-body);
  line-height: var(--leading-body);
}
.page-shell {
  width: 100%;
  max-width: calc(var(--content-max) + 2 * var(--page-gutter));
  margin-inline: auto;
  padding-inline: var(--page-gutter);
  box-sizing: border-box;
}
:focus-visible {
  outline: var(--focus-width) solid var(--color-focus);
  outline-offset: var(--focus-offset);
}
/* Warm paper ring on dark surfaces; ink outer ring separates light surroundings. */
.focus-on-dark:focus-visible {
  outline: 2px solid var(--color-on-dark);
  outline-offset: 2px;
  box-shadow: 0 0 0 5px var(--color-focus);
}
.section-dark {
  background: var(--color-section-dark);
  color: var(--color-on-dark);
}
.section-dark .text-muted {
  color: var(--color-on-dark-muted);
}
.section-dark .action-primary {
  background: var(--color-inverse-action);
  color: var(--color-on-inverse-action);
}
.section-dark .action-primary:focus-visible {
  outline-color: var(--color-on-dark);
  outline-offset: 3px;
}
```

Use the quiet border for decoration and cards. Use `--color-border-control` wherever a boundary is needed to identify a field or control; the decorative border is not sufficiently strong for that purpose. Never apply opacity to an entire control to create its disabled state.

## 4. Typography

**Source values:**

| Role            | Font        | Desktop | Mobile |
| --------------- | ----------- | ------- | ------ |
| Hero display    | Space Grotesk     | 88px    | 44px   |
| Page heading    | Space Grotesk     | 48px    | 32px   |
| Section heading | Space Grotesk     | 32px    | 26px   |
| Card heading    | Manrope | 18px    | 16px   |
| Body            | Manrope | 16px    | 16px   |
| Metadata        | Manrope | 14px    | 14px   |
| Small label     | Manrope | 12px    | 12px   |

Completion defaults: Space Grotesk hero weight 600, page/section weight 600; Manrope card and buttons weight 600, navigation and labels 500, body and metadata 400. Use the line heights and tracking above. Use normal width for Space Grotesk; do not import the reference's condensed artboard typography. Tablet uses mobile type sizes until the desktop breakpoint. Allow wrapping; do not force a hero onto a single line or shrink body text to fit.

Use sentence case for controls and copy. Uppercase 12px labels may identify short editorial sections; never use them for paragraphs or essential instructions. Use tabular numerals for statistics. Keep prose around 60–70 characters per line. One semantic `h1` per page; choose heading levels by document structure rather than visual size.

## 5. Layout, spacing and responsive behavior

**Source values:** spacing scale **4, 8, 12, 16, 24, 32, 48, 64, 96px**; content maximum **1280px**; padding **48px desktop / 32px tablet / 16px mobile**; card radius **12px**; button/input radius **8px**; dialog radius **12px**; minimum touch target **44 × 44px**.

| Range   | Source breakpoint | Layout behavior                                          |
| ------- | ----------------- | -------------------------------------------------------- |
| Mobile  | Below 768px       | Bottom app tabs, single-column forms, full-screen editor |
| Tablet  | 768–1023px        | Top app navigation, 32px gutters, side drawer            |
| Desktop | 1024px and above  | Top app navigation, 48px gutters, side drawer            |

Completion defaults for grids: wardrobe one column below 360px, two columns at 360–767px, three at 768–1279px, four at 1280px+. Use 16px mobile and 24px larger grid gaps. Preserve 3:4 media ratios; allow names to wrap. Outfits use one column on mobile and two on tablet/desktop; statistics tiles use one, two and four respectively. Never squeeze controls to maintain a column count.

Use 8–12px within a tightly related group, 16–24px inside components, 24–32px between component groups, 48–64px between app sections, and 64–96px between marketing sections. Use the scale rather than arbitrary margins. At 320px and at 400% zoom, content must reflow without page-level horizontal scrolling. Charts may use a clearly labelled local scroll region if a readable alternative is also supplied.

Fixed bottom tabs reserve their own height plus `env(safe-area-inset-bottom)` in page padding. A sticky header must not cover headings, anchor targets or focused elements; use appropriate scroll padding. Avoid simultaneous sticky layers that leave too little mobile workspace.

## 6. Navigation

### Desktop and tablet app navigation

Use a top header with the wordmark **STYLIST.**, links **Wardrobe**, **Outfits**, **Statistics**, and an account/Profile control. Completion default height: 64px. The header uses charcoal `--color-section-dark`, warm paper text/icons and a restrained dark-surface bottom rule. It may be sticky. Use dark-context hover, focus and active states; never inherit ink-colored links onto charcoal. The active route uses weight and an underline plus `aria-current="page"`; do not rely on color alone. Keep links keyboard reachable and avoid animated sliding navigation pills.

### Mobile app navigation

Below 768px, use fixed bottom tabs: **Wardrobe**, **Outfits**, **Statistics**, **Profile**. Each is a real route link with a 20–24px icon, visible label and at least 44px target. Use a 64px bar plus safe-area inset. Mark the active route accessibly. Keep a compact charcoal top header for page identity and context actions, without duplicating the desktop link row. Bottom tabs use warm stone `--color-surface` with ink icons/text and a strong active indicator; preserve safe-area spacing. “Add item” belongs in the page toolbar, not as a fifth primary tab. Tabs are navigation links, not an ARIA tablist.

The public marketing page uses a public top header with product links and sign-in/primary CTA. It does not show signed-in app bottom tabs. On small screens, collapse secondary marketing links into an accessible menu if needed.

## 7. Shared component specifications

All interactive components define default, hover, focus-visible, active, disabled, loading and error states where applicable. Hover effects only run on devices that support hover. Never nest buttons inside links or make an entire card clickable around other interactive controls.

### Buttons and links

Source: primary solid ink; secondary transparent with border; tertiary text-only. The updated palette uses warm paper labels on ink buttons, never pure white. In charcoal sections, invert the primary action to warm paper fill with ink text; secondary/tertiary actions use warm paper text and appropriate dark-surface borders. Heights **44–48px** and hover transitions **150–200ms**. Default here is 48px; a shared 44px compact variant is allowed. Radius 8px, horizontal padding 16–24px. Icon-only actions still need a 44px target and an accessible name. Use an anchor for navigation and a button for an action. Loading keeps width stable, exposes busy state and prevents duplicate submissions. Disabled controls retain legible labels; explain the blocking requirement nearby when helpful.

Use labels such as “Add item”, “Save item”, “Suggest outfits” and “I wore this”. Destructive controls must include an explicit verb such as “Delete item”; an ambiguous trash icon alone is insufficient in a confirmation.

### Fields and selection controls

Source: always-visible labels, **44–48px** input height, helper/error text, visible focus indicators; selection chips for season, formality and clothing type where helpful. Default height 48px, radius 8px. Inputs use a strong control border. Placeholder text provides examples, never the only label. Associate errors with `aria-describedby`, set `aria-invalid`, preserve submitted values and focus the first invalid field after failed validation.

Use native select/checkbox/radio semantics or a fully keyboard-accessible equivalent. Chips use checkboxes for multiple seasons and radio selection for one category/formality choice. Show selection with a check/icon and border change. Color selectors include a text name; extracted color is editable. Do not treat Enter in a multiline field as form submission.

### Wardrobe cards

Source: **3:4 image ratio**, neutral image area, **12px radius**, name and category below the image. Follow-up removes item favorites. Show edit actions on **selection, hover or keyboard focus**. Do not expose individual-item wear logging in the MVP; log outfits and update their item counts automatically. Use a quiet surface with minimal framing and no permanent heavy shadow. Cards remain image-first; secondary details belong in the item editor/details view.

Use `object-fit: contain` with consistent internal breathing room for cutouts and staples. Avoid cropping sleeves, hems or footwear. On touch, offer a persistent visible action-menu trigger or explicit selection control; essential actions cannot require hover. Desktop quick actions appear with `:focus-within` as well as hover. A card detail link and its action buttons are siblings. Skeletons preserve the media ratio and label space. Broken images show a garment placeholder plus “Photo unavailable”, with edit/retry access. Do not add item-heart controls or item-favorite data.

### Outfit cards and neutral composition canvas

Source: clothing composition on a **neutral canvas**, consistent item positions, styling reason and **“I wore this”** actions. Follow-up consolidates rating and favorite into one three-state preference. **Ranking scores remain internal** by default. The later component proposal takes precedence over the earlier illustrative suggestion to show a score.

Completion default: a 4:3 canvas, radius 12px, with a stable two-column, three-row internal grid. Place top upper left, bottom lower left spanning remaining rows, outerwear upper right, shoes lower right and accessories in remaining right-hand space. Dresses/one-pieces are outside the launch catalog; support that layout only after a future scope decision. Garments use `contain` and remain separated, with no decorative overlap or depth tricks. Missing optional slots leave balanced space; absent required slots produce an explanation rather than a fabricated outfit. Absolute positioning, if used inside this bounded canvas, must remain proportional and never position page layout.

Below the composition, show outfit name, a one-line rule-based styling reason and readable item names via a list or details control. Use two labelled toggle buttons: Heart **“Favorite”** and CircleSlash **“Not for me”**. Both unpressed means **no opinion**, the default. Selecting one clears the other; selecting the active button again clears feedback to no opinion. This clearing behavior is the final implementation default. Feedback is optional and never interrupts browsing. Use `aria-pressed`, keyboard activation and a visible selected state, such as a filled heart plus stronger outline; do not rely on color or tooltips alone. Use Lucide SVG icons rather than platform-dependent emoji glyphs.

Persist one value, `preference: 'favorite' | 'neutral' | 'disliked'`, against stable outfit identity, not list index. No record is equivalent to neutral; there is no additional `is_favorite` field or numeric star rating. An existing table named `outfit_ratings` may store this preference enum; the name does not imply stars. Filter candidates for current wardrobe availability, season and formality before ordering favorites, neutral and optionally disliked groups. “Show disliked” is off by default and places disliked results last. Favorite status does not override missing garments or incompatible active filters. Preserve deterministic score ordering within each group. A saved-favorites view, if provided, derives from this same value.

### Garment-derived canvas tint

Keep the base page, labels, action rows, navigation and controls in the accepted monochrome palette. Limit adaptive color to the wardrobe media region or entire outfit composition canvas; never tint the full card's text area. Use one uniform background per outfit, not one colored tile per constituent garment.

Completion algorithm: use the corrected dominant foreground garment color; convert to HSL, retain hue, cap saturation at 12%, and set lightness to 82%. This replaces the earlier 95% value so image backgrounds do not reintroduce near-white areas into the darker palette. If the source garment saturation is below 10%, extraction is uncertain, or only an unprocessed original with an unknown background is available, use `--color-canvas`. For outfits, derive from the primary top or one-piece, then bottom if unavailable; use stable item IDs as the final tie-breaker. This intentional deterministic rule avoids shifting backgrounds when item order changes. Persist/cache the derived value and update it if garment color changes.

Apply the resulting validated color only through a scoped `--color-garment-canvas` custom property. Do not generate arbitrary Tailwind class names from user data. Never use complementary/high-saturation backgrounds by default. Keep this decorative calculation separate from harmony scoring and color labels. Very pale garments may need the standard warmer neutral canvas to retain a readable silhouette; use that fallback after visual review. Text/action areas remain on fixed surfaces with verified contrast. This tint never implies that an outfit has better or worse harmony.

“I wore this” records one intentional wear event for the outfit and constituent items, confirms success and offers Undo. Disable repeated submissions while pending. Display a date when relevant; do not silently multiply logs on retries. Use an idempotency mechanism in the application layer. Announce results politely without moving focus.

### Drawers and dialogs

Approved add/edit pattern: **side drawer on desktop/tablet; full-screen form on mobile**. Completion default: right-aligned drawer width `min(480px, 100vw)`, viewport height, solid surface, overlay and subtle shadow. Rounded exposed left corners may use 12px on larger screens; full-screen mobile panels have square viewport edges. Use `100dvh` with a fallback and allow the body to scroll independently of header/footer.

Provide title, named close button, scrollable form body, and persistent Cancel/Save footer. Footer respects the keyboard and safe area; content cannot be hidden behind it. Treat the modal drawer as a dialog: label it, trap focus, make the background inert, lock background scrolling and restore focus to its opener on close. Initial focus goes to the heading or first meaningful field without unexpectedly opening the mobile keyboard. Escape closes unless a nested confirmation is active. Unsaved edits require a discard confirmation; preserve data if the user stays. Backdrop activation follows the same unsaved-change rule.

Small confirmations use a centred dialog with 12px radius, clear consequences and Cancel/explicit action buttons. Focus Cancel initially for destructive confirmation. Do not open stacked drawers. Do not put an entire item editor in a small centred modal.

### Filters, notices and feedback

Wardrobe toolbar contains search, category/season filters, result count and Add item. Wrap controls on narrow screens; advanced filters may use a separate dialog. Show active filter chips and “Clear filters”. Preserve filter state across item editing. Debounce search only if needed; never steal focus when results update.

Empty states give a short explanation and one next action. Distinguish an empty wardrobe from no matching results and from a loading failure. Error banners include a clear recovery action. Use short nonblocking status messages for saves, favorites and wear logs; important errors remain visible until resolved or dismissed. Announce status using `role="status"`; urgent submission errors may use an alert. No repeated screen-reader announcements for every processing frame.

### Statistics

Account-only page with an All time label, outfit-event total, item-wear totals, restrained charts and current most/least/never-worn lists. Lifetime totals retain non-undone historical wears of removed items; current lists include only active wardrobe items. History labels removed garments and uses matching existing catalog imagery or a placeholder after personal photos are deleted. Removal also excludes dependent outfits from new suggestions; nothing is added to the shared catalog. Explain empty history with a link to suggestions. No date-range picker, fabricated counts or visitor statistics.

## 8. Upload, background removal and image lifecycle

Automatic background removal is part of the approved default flow, including the MVP. It does not make the outfit recommendation engine AI-based: outfit matching remains deterministic and rule-based.

### User flow and states

1. Offer a labelled file picker and optional drag-and-drop. Mobile may offer camera capture but must retain file-library selection. Explain supported formats and limits before selection.
2. Validate the actual file content, type, pixel dimensions and file size. Completion default: JPEG, PNG and WebP; maximum 10 MB and 25 megapixels. Reject unsupported formats such as HEIC with conversion guidance unless a converter is deliberately implemented. Repeat validation server-side.
3. Correct orientation, strip EXIF/location metadata, resize safely, and generate a local preview. Do not assume renaming a file changes its type. Decode defensively and reject malformed files.
4. Begin background removal automatically. Keep the form usable while processing. Show “Removing background…” and an indeterminate indicator unless real progress is available. Allow cancel/reselect. Keep the source preview available.
5. Show the cutout preview on the garment-derived pale canvas, or `--color-canvas` fallback; allow comparison with the original and require the user's Save action before committing. Offer Retry, Use original and Choose another photo even after technically successful processing. Extract dominant garment color from the foreground result where possible, excluding transparent pixels; let the user correct it. If using the original, disclose that the background may affect extraction.
6. Save tags and the selected image atomically enough to prevent a successful-looking item with a missing asset. Distinguish processing, upload and metadata-save failures. Preserve form values on recoverable failure.

State model: `idle → validating → processing → preview-ready → uploading → saving → saved`; failures retain the last usable preview and relevant recovery controls. Cancellation and file replacement must invalidate obsolete work so a late result cannot overwrite the new selection.

### Graceful fallback

Background removal failure, unsupported browser capability, timeout or poor result must never strand the user. Display: **“We couldn’t remove the background. You can keep this photo or try again.”** Offer **Retry**, **Use original** and **Choose another photo**. Also provide “Use original” when a technically successful cutout damages the garment. Original fallback uses `contain` on the same neutral surface and preserves the original photo's colors. Record which variant is displayed; never call a fallback image a processed cutout. A processing failure alone must not erase tags or block saving with the original.

Completion default processing timeout: 30 seconds before showing recovery; the user can opt into the original earlier. Do not show fabricated percentage progress or silently retry forever. If processing is on-device, lazy-load it and use a worker where supported; release image buffers and object URLs when no longer needed. If remote processing is required, disclose the provider and transfer before sending photos and obtain any required user choice. A service outage must retain the original fallback path.

### Image rendering and privacy

- Preserve true garment color; do not grayscale user clothing to match the UI. Avoid filters and marketing-style image crops on wardrobe items.
- Store processed transparency in an alpha-capable format. Generate appropriate responsive sizes; reserve aspect-ratio space to prevent layout shifts. Load below-the-fold wardrobe images lazily. Prioritize only the actual above-the-fold marketing image when justified.
- Use descriptive alt text such as “Navy cotton shirt”. When an adjacent name and link already communicate the same information, use empty alt text to avoid repetition. Composition imagery may be decorative when an accessible item list fully describes the outfit.
- Keep wardrobe assets private, scoped to their owner, with authorization at every data/storage boundary. Use private storage and short-lived authorized access where applicable; never expose a service credential in client code.
- Document what is stored: sanitized original, cutout, thumbnails and tags. Completion default: retain the sanitized original for comparison and fallback until the item is deleted. Discard the raw metadata-bearing upload after sanitization. Explain retention in the product privacy information.
- Delete originals, cutouts and derivatives when the user deletes the item/account, according to a documented deletion and backup policy. Avoid orphan files after failed saves. Explain effects on historical outfit records before deletion.
- Do not include user photos, file contents, signed URLs or location metadata in analytics, error logs, public demo fixtures or screenshots. Do not reuse user photos for training or marketing without separate explicit permission.
- Provide clear privacy information at upload and in Profile, plus account/data deletion access. Specify actual processors, retention and export behavior before release; this design document does not establish legal compliance by itself.
- Marketing uses licensed or owned imagery and clearly identified demo wardrobes. Staples use realistic sample garment photos, with consistent framing, accurate color and clean cutouts where possible. Use owned or appropriately licensed generic garment imagery; record source/license information and avoid implying brand endorsement. Sample photos are illustrative, not photos of the user's actual garment; label staples “Sample photo” in onboarding/details. A staple is marked as such and can be replaced with a real photo without losing its item history. SVGs are reserved for interface icons or unavailable-image placeholders, not the primary staples library.

## 9. Page patterns

### Editorial marketing landing

Warm paper public header and editorial hero → charcoal three-step feature section → warm stone product demonstration and supporting features → charcoal final CTA and footer with privacy/accessibility/contact links. Suggested hero: **“Your wardrobe. Reimagined.”** Supporting copy: **“Less searching. Better outfits. More of what you already own.”** Use a clear primary action such as “Build your wardrobe” and a visitor action “Try with quick-add clothes”. There is no separate demo mode or prefilled wardrobe. These phrases reflect the source's illustrative direction; they are not required product claims.

Use 88px desktop / 44px mobile Space Grotesk hero type and generous whitespace. Pair copy with original garment photography or a representative neutral composition. A two-column desktop hero stacks in a logical reading order on mobile. Include actual product UI so the service is understandable. Use restrained 500–700ms reveals only below the fold; hero content must be visible and usable without animation or JavaScript. Do not copy Orvante media, agency copy, counters, glass plates or absolute page coordinates. No fake testimonials, users or performance claims.

### Section color composition

Use full-width charcoal bands for the landing feature explanation and final CTA/footer, with shared max-width inner containers aligned to the light sections. Charcoal is a structural section background, not a separate theme. The hero and product demonstration stay warm light. Keep garment media on neutral/muted canvases, even when a card is placed within a dark section.

Use `--color-on-dark` for headings/body/icons, `--color-on-dark-muted` for supporting text, and `--color-border-dark` for necessary boundaries on charcoal. Inverse filled buttons use warm paper and ink. Do not reduce opacity on an entire dark section or rely on inherited light-context text colors. Review focus rings, links, menus and disabled states in their actual context.

Wardrobe, outfits, statistics, forms and modal editors stay in the warm light workspace; charcoal top navigation provides contrast. Do not alternate dark backgrounds through routine management forms. Surface `#E4DED4` applies to cards, inputs, drawers, dialogs and supporting panels; Paper `#E9E3D9` applies to page backgrounds. Avoid near-white cards inserted by component-library defaults.

The accompanying `warm-stone-charcoal-preview.png` is an approximate visual reference. These semantic token values and behavior rules take precedence over generated image pixels or illustrative copy.

### Onboarding

After authentication, offer Quick-add clothes or Upload a photo, with Skip. Automatically import any visitor selections once after signup or existing-account sign-in; explain carryover beforehand without an extra import-choice dialog. Empty accounts get no automatically selected clothes. The quick-add catalog uses named color swatches and realistic sample photos: Tops → T-shirt/shirt/sweater; Bottoms → jeans/chinos/shorts; Shoes → sneakers; Outerwear → simple jacket. Defaults are editable. Visitors can use this catalog without signup; personal uploads require an account. Preserve selections and tag edits on failures.

### Wardrobe

Page title, concise supporting count, Add item, search/filters, then the comfortable image-first grid. Empty wardrobe offers Add item and Browse staples. No-results state offers Clear filters. Selecting edit opens the drawer; saving updates the appropriate card without resetting scroll/filter state. Loading uses stable skeletons; failures provide Retry. Expose a never-worn filter without turning cards into dense dashboards. No wardrobe-item favorite filter or favorite action.

### Add/edit item

Drawer/full-screen header → image upload/processing preview → item name → clothing group → specific type → editable detected color → formality → multi-season selection → optional additional tags → footer actions. Explain required fields before submission. Editing reuses current media until a replacement is successfully saved. Deletion is separate from Save and requires an explicit confirmation. Processing and save errors remain associated with the relevant step.

### Outfit suggestions

Page title → season and formality controls (Casual, Smart-casual, Formal, with Any) → Suggest outfits → up to six compatible compositions → Show more for additional distinct matches. Complete outfits require top, bottom and shoes; jacket is optional. No extra occasion step. Explain missing groups with a quick-add/upload link; offer filter relaxation explicitly when no compatible result exists. Never fabricate six matches or silently change filters. Visitors get suggestions but no saved feedback or wear logging. Account holders get optional Heart/CircleSlash feedback and I wore this. Reasons reflect actual rules; scores stay internal.

### Statistics

All time label → total outfit wears and item-wear totals → restrained distribution chart → current most worn, least worn and never worn lists. No date-range selector in the MVP. Lifetime totals retain removed-item history, while current lists exclude removed garments. Historical images use matching catalog imagery or a placeholder after private photos are deleted. Outfit wear events and summed item wears are different metrics. A first-use state explains how “I wore this” populates the page. Today uses the saved account timezone, initialized from the device and editable in Profile; preserve event-local historical dates.

### Profile and account

Account identity, settings, privacy information and deletion/export entry points. Mobile Profile is a bottom-tab route; desktop exposes it from the account control. Authentication pages use the same type, controls and warm surfaces, with concise error handling and password-manager-friendly fields. The release uses a warm light workspace with contextual charcoal sections and navigation. Do not add a theme toggle, a separate dark theme or operating-system-driven color inversion.

## 10. Motion and reduced motion

**Exact source motion values:**

| Interaction       | Duration  | Behavior                          |
| ----------------- | --------- | --------------------------------- |
| Button hover      | 150ms     | Subtle elevation or surface shift |
| Card hover        | 200ms     | Lift by 3px                       |
| Dialog entrance   | 250ms     | Fade and slight upward motion     |
| Page transition   | 250ms     | Gentle opacity transition         |
| Landing reveal    | 500–700ms | Fade and rise                     |
| Outfit generation | 250–350ms | Results enter progressively       |

Source expressive easing: **`cubic-bezier(0.22, 1, 0.36, 1)`**. Use the 150ms button token as the default within the component's permitted 150–200ms hover range. Use a small 8–16px rise for reveals and dialogs as a completion default. Avoid animating layout dimensions; use opacity/transform. Drawer entrance can combine the source dialog fade/upward treatment with a restrained side-panel transition, without extending 250ms. Exit defaults to the same duration.

Progressive outfit entry must not postpone actions or add 350ms per card to a long list. Cap total stagger delay at 150ms. These durations animate already available results; they do not justify an artificial loading wait. Only animate a card on meaningful entry, not every filter render or rating change. Do not fade out an entire focused page during navigation.

```css
@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  .wardrobe-card {
    transition:
      transform var(--motion-card) var(--ease-expressive),
      box-shadow var(--motion-card) var(--ease-expressive);
  }
  .wardrobe-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-card-hover);
  }
}
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
  [data-reveal] {
    opacity: 1 !important;
    transform: none !important;
  }
}
```

Also handle reduced motion in JavaScript animation code. Content and counters render in their final state; do not rely on animation events for saving, closing, focusing or revealing content. Replace animated loading indicators with static text/status where appropriate. No parallax, scroll-jacking, flashing, autoplaying decorative media or unnecessary animation during wardrobe management.

## 11. Accessibility requirements

- Target WCAG 2.2 AA. Verify actual rendered color combinations: at least 4.5:1 for normal text, 3:1 for large text and 3:1 for necessary control boundaries and state indicators. Decorative card rules may be quieter. Verify focus visibility on both light and ink surfaces.
- All actions work with keyboard, touch and pointer. Targets are at least the source's 44 × 44px. Never expose an essential action only on hover, drag, swipe or color change.
- Use semantic landmarks, a skip-to-content link, ordered headings, meaningful link names and visible labels. Icon-only controls have accessible names. Current routes, selected states, errors and success include non-color cues.
- Modal drawers/dialogs implement focus containment, inert background, Escape behavior, labelled titles and focus restoration. Tab order follows visual reading order. Focus must remain visible above sticky bars and the mobile keyboard.
- Support text zoom, reflow at 320 CSS pixels, browser font scaling and long translated/user-entered strings. Do not disable pinch zoom or use fixed-height text containers that clip content.
- Forms announce errors and preserve values. Ratings, chips, filters and upload controls expose their actual state. Provide file input access alongside drag/drop. Toasts never become the only place to find a critical error.
- Charts have equivalent text/table information. Images have appropriate alt treatment; outfit compositions have an accessible item list. Heart and CircleSlash feedback buttons have explicit labels and pressed states, not only glyphs. No opinion is valid and requires no action.
- Announce meaningful async completion/failure with restrained live regions. Keep loading skeletons out of the accessibility tree and expose a concise loading status. Respect reduced motion and forced-colors modes; do not remove native outlines without an equivalent.

## 12. Next.js, TypeScript and Tailwind implementation guidance

These are implementation conventions, not a requirement to scaffold or build the app as part of this file delivery. Match the installed framework versions and repository conventions; do not combine Tailwind configuration styles from different major versions.

1. Put source tokens in one global stylesheet. Map Tailwind semantic colors, typography, spacing, radii and shadows to CSS variables; avoid scattering hex literals or arbitrary pixel classes through JSX. For Tailwind versions using config-based themes, extend the theme with `var(--color-...)`; for CSS-first themes, expose the same roles through the supported theme mechanism. Keep aliases separate from the source variables to avoid circular references.
2. Align responsive variants explicitly: `sm: 360px` for the narrow wardrobe grid if used, `md: 768px`, `lg: 1024px`, `xl: 1280px`. The app's navigation switch is `md`, not Tailwind's default `sm`. Media-query thresholds cannot use ordinary runtime CSS custom properties; keep breakpoint definitions synchronized with this document.
3. Load Space Grotesk and Manrope using Next.js font facilities with local licensed files or the supported font loader, `display: swap`, latin subset where appropriate, and stable fallback metrics. Connect generated font variables to `--font-display`/`--font-ui` without defining a variable in terms of itself. Keep body text visible while fonts load.
4. Use **shadcn/ui** as the shared component foundation, installed selectively into `components/ui` and customized to these semantic tokens. Reuse its buttons, fields, selection controls, menus, dialogs, sheets, tooltips, alerts and skeletons as appropriate. Pick one supported underlying primitive family consistently; follow the installed version's APIs rather than mixing examples across families or versions. Preserve accessible behavior while changing styles. The defaults do not override this file's fonts, colors, radii, control heights, breakpoint rules or motion. Do not import a generic dashboard/sidebar template. Build custom `SelectionChip`, `AppHeader`, `MobileTabs`, `WardrobeCard`, `OutfitCanvas`, `OutfitCard`, `OutfitFeedback`, `ItemEditor`, `UploadField`, `StatusMessage`, `EmptyState` and `StatCard` around these foundations. Use **Lucide outline** icons through one shared icon wrapper. Reuse one item form across drawer/full-screen presentations. Adapt the sheet/dialog shell to a right-side drawer at 768px+ and full-screen below 768px; a default mobile bottom sheet is not the approved editor. Test focus, scrolling and dismissal after customization.
5. Use App Router server rendering for noninteractive layout and initial data where appropriate. Isolate client components for forms, dialogs, upload processing and interactive feedback. Lazy-load background-removal code; it must not inflate the public landing page bundle or block first render.
6. Use Next.js image rendering with explicit dimensions or a correctly constrained fill container and an accurate `sizes` value. Configure only required image hosts. Private image delivery must preserve authorization: use an authorized delivery route or an appropriate private-image strategy, and verify caching behavior. Never assume a public optimizer/cache can safely handle owner-only media. Alpha cutouts must preserve transparency.
7. Keep data operations outside presentation components. Model upload/processing states with a typed state machine or discriminated union. Validate authorization and inputs server-side. Guard duplicate saves/wear events, handle cancellation, and clean up abandoned media. Keep secrets server-only.
8. Keep deterministic outfit scoring independent of React, decorative canvas tinting and image processing. The three-state preference attaches to the stable hash of sorted item IDs. UI explanations reflect scoring rules. Apply eligibility filters, then group favorite → neutral → disliked (only when revealed), with score/freshness ordering within each group. Do not add a separate favorite field or star rating. Reconcile optimistic feedback changes on failure and preserve no-opinion behavior.
9. Keep route-level loading/error boundaries consistent with the design. Preserve local form/filter state through recoverable failures. Provide a real recovery action instead of an endlessly spinning skeleton.
10. Do not introduce a motion library solely for these transitions. CSS and small browser-native interactions are sufficient unless the repository already uses an appropriate library. Content must remain readable when animation or optional client processing fails.

Suggested organization (adapt to the existing repository):

```text
app/                 routes, layouts, loading and error boundaries
components/ui/       shared accessible primitives
components/wardrobe/ cards, upload and item editor
components/outfits/  canvas, feedback and wear actions
components/stats/    metrics, chart and equivalent table
lib/outfits/         deterministic scoring and identity
lib/images/          validation, processing and storage interfaces
styles/tokens.css    semantic tokens and shared type roles
```

## 13. Design rules for Codex

- Read this file before each UI task. Preserve approved decisions and source metrics; record intentional future changes here before propagating them.
- Build reusable components before duplicating patterns. Use semantic tokens for all interface colors and type roles. Garment colors, actual image content and the specified scoped muted media tint are the bounded exceptions to the monochrome UI rule.
- Keep content in responsive flow. Use CSS grid/flex and bounded composition canvases, not a scaled 1440px page or absolute screen coordinates.
- Use 8px controls and 12px cards/dialogs. Full-screen viewport edges and circular icons/avatars are functional exceptions; do not introduce a new decorative radius system.
- Keep wardrobe metadata quiet. Do not turn each card into a dense tag list or overlay important text on unpredictable photography.
- Show accurate product states and actual data. Do not fake completed uploads, successful cutouts, matching reasons, progress percentages or wear counts.
- Every feature has loading, empty, error and recovery behavior where relevant. Every pointer interaction has a keyboard/touch equivalent.
- Do not add dark mode, shopping/affiliate flows, AI-generated outfit claims, extra brand accent colors, item favorites or new primary navigation destinations without a product decision. Adaptive muted media tint must follow the specified algorithm and never become a new global accent.

## 14. Acceptance criteria

### Visual and responsive

- [ ] All 15 approved decisions are implemented. Warm stone surfaces, charcoal sections, monochrome UI, Space Grotesk headings and Manrope UI are consistent across routes. No pure-white interface surfaces or controls.
- [ ] Source typography sizes, 4–96px spacing scale, 1280px content maximum, 48/32/16px gutters, 8/12px radii and exact breakpoint boundaries are respected.
- [ ] Check 320, 390, 767, 768, 1023, 1024, 1280 and 1440px widths. No unintended page overflow, clipped labels or unreachable controls. Check 200% text zoom and reflow at 400% browser zoom.
- [ ] Desktop/tablet use top app navigation; below 768px uses four labelled bottom links with correct active state and safe-area/content clearance.
- [ ] Wardrobe cards retain 3:4 media; cutouts and realistic sample-photo staples remain fully visible. Comfortable desktop grids show 3–4 columns. Touch users can find every card action. No item favorites are present.
- [ ] Outfits use stable near-neutral compositions with readable reasons and item lists, not an equal-photo item grid or decorative overlapping collage. Internal ranking scores are hidden. Muted garment-derived tint is limited to media regions, uses one background per outfit and falls back safely for uncertain colors or poor garment separation.
- [ ] Marketing uses editorial hierarchy and a clear product demonstration, with honest claims and owned/licensed imagery.

### Functional interactions and image handling

- [ ] Add/edit uses a side drawer at 768px+ and a full-screen mobile form below it. Long forms, the onscreen keyboard, safe areas and footer actions remain usable.
- [ ] A valid upload automatically attempts background removal. Test success, damaged cutout, timeout, unsupported capability, malformed/oversize file, network failure, cancel and rapid file replacement.
- [ ] Retry, Use original and Choose another photo work without losing tags. Original fallback is accurately labelled and can be saved.
- [ ] Color extraction ignores transparency where possible and remains editable. Garment colors are not altered by interface styling.
- [ ] Save/upload failures preserve recoverable work; duplicate submissions and stale processing results do not create duplicate or mismatched items.
- [ ] Heart favorites, CircleSlash dislikes and neutral/no-opinion states persist across regeneration. New outfits start neutral; active feedback can be cleared. No stars, thumbs, separate favorite field or forced feedback. Favorites appear first, neutral suggestions next, and disliked suggestions are hidden unless revealed last.
- [ ] “I wore this” logs today immediately, updates outfit/item statistics once per intentional event and supports Undo. Neutral or disliked feedback does not prevent intentional wear logging.
- [ ] Empty wardrobe, insufficient outfit categories, no filtered results, no wear history, loading failure and broken image states each have useful recovery.

### Accessibility, motion and privacy

- [ ] Keyboard-only traversal covers navigation, uploads, chips, cards, ratings and dialogs. Focus is visible, logically ordered, contained in modal editors and restored on close.
- [ ] Screen-reader checks cover labels, active routes, errors, async announcements, composition descriptions, chart alternatives and feedback pressed states.
- [ ] Verify contrast against actual surfaces; touch targets meet 44 × 44px; no essential information depends only on color or hover.
- [ ] Source motion timings are used. With reduced motion enabled, content is immediately visible, transforms/reveals stop and all workflows remain functional.
- [ ] Owner-only media remains inaccessible to other users; test direct asset requests and cross-account access, not only hidden UI. Raw metadata is stripped, derivatives follow deletion policy and logs contain no private image URLs/content.
- [ ] Test remote-processing failure if a service is used; disclosed processing choices and original fallback remain available. Privacy information matches actual processors and retention behavior.

### Implementation review

- [ ] shadcn/ui shared components consume central semantic tokens and Lucide outline icons; no unexplained page-specific colors, typography or radius variants. Custom garment components preserve the editorial identity rather than inheriting generic dashboard styling.
- [ ] Appropriate automated checks cover deterministic outfit scoring, authorization, state transitions and duplicate-event protection. Interaction checks cover the drawer, upload fallback and keyboard access; visual review covers responsive layouts.
- [ ] Type checking, linting and relevant existing project checks pass. Review the real rendered pages; automated accessibility checks alone do not establish completion.
- [ ] Document any intentionally changed completion default in this file. Do not describe these gap-filling defaults as exact values approved in the source conversation.

## 15. Palette revision acceptance checks

- [ ] Paper is `#E9E3D9`, Surface `#E4DED4`, Canvas `#D5CCBF`, and Charcoal `#191919`; supporting semantic states use the updated tokens.
- [ ] No pure-white UI color remains, including shadcn/ui defaults, button labels, focus rings, skeletons and modal backgrounds. White garments in photography are unchanged.
- [ ] Landing sections alternate warm light → charcoal → warm light → charcoal. The signed-in workspace uses charcoal top navigation and warm light content; mobile bottom navigation remains warm stone.
- [ ] No theme toggle or automatic operating-system theme switch is present.
- [ ] Dark-section headings, secondary text, controls, borders, focus states and inverse CTA buttons use explicit contextual tokens.
- [ ] Muted garment-derived media tint uses the revised 82% HSL lightness and neutral fallback rather than the earlier near-white treatment.
- [ ] Verify normal text contrast, control boundaries and focus visibility against the actual updated surfaces before release.

## 16. Confirmed visitor and account boundaries

Visitors start with an empty quick-add wardrobe, persist catalog selections in the same browser, and receive real filtered suggestions without authentication. No separate demo, prefilled sample history, personal uploads, favorites or wear logging. React context/reducer plus browser storage is the starting approach. Clearly explain account benefits without blocking suggestions.

Clerk provides Google/email-password signup and sign-in. Import visitor selections automatically once after either flow; only clear the source after successful account persistence. Sign-out clears private caches and starts a fresh visitor wardrobe. Supabase stores owner-scoped account data/private photos; Vercel hosts the app. Browser background removal is the approved approach, subject to early mobile feasibility checks.

Read docs/MVP.md for release scope and docs/architecture.md for technical decisions. One garment is uploaded at a time, with Add another after successful saving. Quick-add tags have editable defaults; uploaded garments require group/type, formality and season confirmation, with editable detected color. Account deletion must remove personal account history according to the approved privacy policy; it is distinct from preserving history after removing one garment.

## Resolved PLAN-02 decisions

Follow [agreed product decisions](docs/product-decisions.md) for optional quick-add customization, exact matching versus similarity warnings, upload/catalog photo choice, season/formality/jacket rules, style-first diverse ranking, patterns, verification, timezone, Undo and visitor navigation. These decisions supersede older provisional wording; only technical defaults and implementation checks remain open.

### Quick-add customization and similar-item UI

Choose type/color and Add immediately with basic defaults, or expand Customize for relevant neckline/collar, sleeve length and pattern choices. Display representative sample imagery honestly with selected details. Warn on similar active wardrobe items with Keep existing, Replace photo/details or confirmed Add as a different garment. Exact matches include customizations; repeated catalog clicks never create copies. For a confirmed upload/catalog match, offer My uploaded photo or Catalog photo without creating two items. Use confirmed metadata, not claimed image recognition.

### Updated recommendation and account interactions

Allow multiple Spring/Summer/Autumn/Winter tags or All seasons. Prefer exact formality, allow adjacent levels with a reason and never mix Casual directly with Formal. Add compatible jackets only for explicit Autumn/Winter; missing jackets do not block results. Any/Spring/Summer results are jacket-free. Keep style ahead of freshness and diversify close-scoring tops/bottoms within preference groups. Prefer one patterned item but allow multiple with lower ranking.

Undo appears for 10 seconds after confirmed outfit logging, pausing dismissal while focused/hovered/interacted with. Profile exposes saved timezone, password recovery where applicable and recent-auth confirmed account deletion. Gate personal saves/import on verified identity while preserving visitor selections.

## 17. Cool charcoal revision — approved 12 November 2026

User direction: “Use more darker tones. This feels warm. I want more darker sleek design.” This replaces the earlier warm-stone palette, light workspace and alternating warm-light landing guidance. Earlier palette tables, token values, examples and color-specific acceptance checks are historical where they conflict with this section; do not reintroduce them. No theme toggle or operating-system theme switching is added.

Use a cool charcoal workspace, near-black navigation, graphite surfaces and subdued neutral borders. Preserve Space Grotesk/Manrope, responsive flow, spacing, accessible targets, monochrome controls, real garment colors and the existing flat composition while mannequin feasibility is investigated separately. No glow, glass panels, decorative gradients or altered garment colors.

| Role | Value |
| --- | --- |
| Page/background | `#101214` |
| Surface, inputs, panels | `#191C20` |
| Subtle/selected supporting surface | `#22262B` |
| Neutral garment canvas | `#343A42` |
| Navigation/background band | `#0A0C0F` |
| Main text/focus | `#E4E7EB` |
| Muted text | `#A4AAB3` |
| Decorative border | `#41464F` |
| Control-identifying border | `#78818D` |
| Hover surface | `#303640` |
| Primary action fill / text | `#D8DDE5` / `#111419` |
| Primary action hover | `#BDC5D0` |

Use `color-scheme: dark` for native controls. Main text and primary-action fill are separate roles; never use the text token as a header background. Secondary actions stay dark with visible borders. Use the fixed neutral canvas during review; defer any adaptive garment tint until it is revalidated for dark surfaces, rather than applying the former 82% lightness algorithm. Dark garments may need a lighter neutral media surface after visual review. Check text, focus, borders and image separation against the actual surfaces; do not grayscale or brighten garment assets.

## 18. Typography revision — approved 12 November 2026

Space Grotesk replaces Archivo for display headings and the wordmark. Manrope replaces Inter Tight for navigation, controls, garment details and body text. The font names elsewhere in this document reflect this new decision; the earlier font pairing is superseded, while source sizes and responsive rules remain unchanged.

Self-host Latin variable WOFF2 assets with `next/font/local`, `display: swap`, and Arial/sans-serif fallbacks. Space Grotesk supports weights 300–700; use 600 for display headings and 700 for the wordmark, without synthesizing heavier weights. Manrope supports 200–800; retain 400 body/metadata, 500 labels/navigation and 600 buttons. Preserve readable body sizes and allow headings to wrap naturally on mobile. Do not load third-party font stylesheets or impose a single-line heading.

## 19. Pictorial selection — approved 13 November 2026

Use selectable pictorial tiles for garment options and outfit season/formality filters, with an icon or garment drawing above a centered visible name. Season drawings use a flower for Spring, sun for Summer, leaf for Autumn and snowflake for Winter. Neckline drawings must visibly distinguish crew neck, V-neck and collared garments; sleeve and pattern options use relevant line drawings. These are interface illustrations, not replacements for sample garment photography.

Use native radio semantics for one choice (including Any in outfit filters) and checkboxes for multiple garment seasons. Preserve keyboard arrow/Space behavior, visible focus, a checkmark plus border/surface selection cues, readable names and at least 44px targets. Wrap tiles rather than hiding labels or squeezing controls on narrow screens. The separate design-review state selector can remain a dropdown; it is not product UI.

Color choices label the garment's color; they do not recolor its photo. Show names with swatches, an explicit selected color and the helper “Choose the closest color to your garment.” In mockups, explain plainly that the selection does not recolor the sample image. No image recoloring or new catalog behavior is approved by this change.
