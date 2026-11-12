# BUILD-01 — Foundation setup

Implemented on branch `build/01-foundation`, 12 November 2026. No service provisioning, database changes, deployment, commit or push is included in this task.

## Result

- Next.js App Router with strict TypeScript, Tailwind 4/PostCSS, npm and a root lockfile.
- Routes/layout in `src/app/`; minimal foundation styling in `src/styles/globals.css`. No parallel root `app/`, empty feature folders or persistence abstractions.
- Temporary entry page with an honest unavailable-feature message, skip link, metadata and noindex. A 404 page offers a route home. No fabricated wardrobe, account controls, uploads or external requests.
- ESLint with Next/TypeScript presets and Prettier, documented in `AGENTS.md` as requested. User approved ESLint instead of deprecated TSLint, and Prettier for “pretify”.
- Vitest/React Testing Library plus Playwright against a fixed loopback production server. Browser targets are desktop and emulated Pixel 7 Chromium, not physical devices.
- Read-only GitHub Actions branch/PR workflow for installation, format, lint, types, component tests, build and browser tests. It has no deploy step or service secrets.
- Setup, actual scripts, test isolation, layout and prototype references documented in the root README. No environment variables are needed for the current app.

## Version choices

Installed Node is 22.18.0 with npm 10.9.3; package engines and CI reflect that runtime. Next 16.4.6 and React 19.3.1 are installed together. Tailwind 4.3.5 uses its matching PostCSS adapter. TypeScript 5.9.3 is within typescript-eslint's declared support range; current TypeScript 7 is not. jsdom 26.1 runs on the installed Node patch; current jsdom 31 requires Node 22.22.2 or newer. Vitest 5.1 and the React plugin 6.3 support Node 22.18.

## Verification

- Initial install succeeded.
- `npm run check` passed: formatting, lint (zero warnings), route type generation/strict TypeScript, and one component smoke test.
- `npm run build` passed with static entry and not-found routes.
- Initial `npm run test:e2e` passed four checks (two checks in each viewport): honest entry behavior, keyboard skip-link focus, local-only requests, no page errors, no horizontal overflow, HTTP 404 and home recovery.
- Clean `npm ci` succeeded using the committed-intent root lockfile; no service credentials or production data were used.
- Final `npm run check`, a fresh `npm run build`, and all four `npm run test:e2e` checks passed after the responsive fix. The added 320px/200% root-text-size check initially exposed long-word overflow; `overflow-wrap: anywhere` fixes it and the regression check now passes. Text scaling is not a claim of manual browser zoom or physical-device verification.
- Desktop (1440px) and emulated phone (393px) production screenshots were visually reviewed for readable wrapping, contained content and warm surfaces. Gutters use the design's 768px/1024px boundaries. Screenshot evidence is in ignored `test-results/`.
- `npm audit --omit=dev` reported zero production dependency vulnerabilities. Full audit still reports eight moderate development-tooling advisories, as detailed below.

## Limitations and follow-up

The dependency audit reports eight moderate development-tooling advisories, tracing to minimatch through typescript-eslint. ESLint 9 is end-of-support; the React plugin in the installed Next preset declares peers only through ESLint 9. See the root README for details. These issues are disclosed, not hidden with forced updates or unsupported peer combinations. Tooling cannot be considered fully settled until a maintained compatible configuration and patched dependency path are available or separately reviewed.

GitHub Actions has been configured but not run remotely because this branch has not been pushed. No hosted CI success is claimed. Full accessibility auditing, physical phones, Firefox/Safari and actual product journeys are outside the verified foundation smoke checks.

BUILD-02 begins with mobile/desktop design review for Wardrobe, Quick-add and Outfits using `design.md`, then approved shared tokens, fonts, controls and shell implementation. The temporary font fallback and foundation page are not final designs. SPIKE-02 remains required before private-data features; image-processing mobile evidence remains outstanding before personal-photo work.
