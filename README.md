# Closet Theory

A personal stylist app for outfits from clothes you already own. This branch contains the **BUILD-01 foundation**, not the completed product. The temporary entry page explains that wardrobe, account and upload features are unavailable. Page designs and the shared app shell will be reviewed in BUILD-02.

## Local setup

Use **Node 22.18.0 or newer within Node 22.x**, and **npm 10+**. CI uses Node 22.18.0. From the repository root:

```powershell
npm.cmd ci
npm.cmd run dev
```

Open http://127.0.0.1:3000. Stop the server with Ctrl+C. On shells without PowerShell's script restriction, `npm` and `npx` work without `.cmd`; no execution-policy change is needed.

No environment variables, Clerk application, Supabase project, database, storage bucket or paid service is required for this foundation. Do not add real service credentials to source control. Future adapter work must document exact environment variable names with placeholders and separate development/test services before use. No provisioning, database migrations or deployment is configured here.

## Commands

| Command                    | Purpose                                                             |
| -------------------------- | ------------------------------------------------------------------- |
| `npm.cmd ci`               | Install exact versions from the root npm lockfile                   |
| `npm.cmd run dev`          | Start local development on loopback port 3000                       |
| `npm.cmd run format`       | Apply Prettier formatting                                           |
| `npm.cmd run format:check` | Check formatting without modifying files                            |
| `npm.cmd run lint`         | Run ESLint with Next.js and TypeScript rules; warnings fail         |
| `npm.cmd run lint:fix`     | Apply ESLint's available automatic fixes                            |
| `npm.cmd run typecheck`    | Run strict TypeScript checks                                        |
| `npm.cmd test`             | Run Vitest/React Testing Library component tests once               |
| `npm.cmd run test:watch`   | Run component tests in watch mode                                   |
| `npm.cmd run check`        | Run format check, lint, types and component tests                   |
| `npm.cmd run build`        | Create the production build                                         |
| `npm.cmd start`            | Serve the existing production build on loopback port 3000           |
| `npm.cmd run test:e2e`     | Run Playwright against its own local production server on port 4174 |

For a full local verification:

```powershell
npm.cmd run check
npm.cmd run build
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

The browser suite requires a successful production build. Leave port **4174** free; Playwright starts and stops its own server and deliberately refuses to reuse an existing process. Tests use a fixed loopback URL, cannot be redirected to production via an environment override, and need no accounts or private photos. Pixel-device emulation checks responsive behavior, not physical Android performance. Chromium is the initial smoke-test browser; real Safari/Firefox/device verification remains later work.

Vitest handles synchronous components and pure logic; use browser/integration coverage for async Server Components. Unit/component tests live beside their source. Browser tests cover the entry page, honest feature availability, keyboard skip link, missing-route recovery, runtime errors, external requests and horizontal overflow. Full product journeys will be added with their respective features; there is no fabricated wardrobe or authentication flow in these tests.

## Repository map

```text
src/app/                  App Router pages, layout and co-located tests
src/styles/globals.css    Minimal foundation palette and Tailwind import
tests/setup.ts            Component-test setup and cleanup
tests/e2e/                Playwright journeys
.github/workflows/        Branch/PR checks, without deployment
docs/                     Requirements, decisions, architecture and delivery plan
```

No empty feature, persistence or UI-component folders are created. Shared controls (shadcn/ui), Lucide, Archivo/Inter Tight fonts and full semantic tokens belong to BUILD-02 after design review. The scaffold uses an explicit temporary font fallback and project palette; this is not final product design. The page is marked noindex while incomplete.

## Tooling and CI

Next.js App Router 16.4.6, React 19.3.1, TypeScript 5.9.3 and Tailwind 4.3.5 are pinned in the lockfile. ESLint 9 uses Next's core-web-vitals and TypeScript presets; Prettier is separate, avoiding competing style rules. TSLint is deprecated and was replaced by ESLint with user approval. jsdom 26.1 supports the installed Node 22.18 runtime; newer jsdom releases require a newer Node patch. TypeScript 5.9 stays within the installed typescript-eslint support range (`<6.1`), rather than installing the incompatible current TypeScript major. Upgrade compatible groups deliberately and rerun checks.

Known tooling limitations from the 12 November 2026 install: npm marks ESLint 9.39.5 as out of support, but the React lint plugin in the Next preset currently declares support only through ESLint 9. The install also reports eight moderate development-dependency advisories tracing to minimatch through typescript-eslint ([advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249)). These are not resolved by the passing source checks. Do not run `npm audit fix --force`, downgrade the Next preset to another framework major, or force an unsupported peer combination to hide them. Revisit the maintained preset/plugin combination and patched transitive dependencies before considering tooling fully settled.

Tailwind 4 uses `@tailwindcss/postcss` and a CSS import, not a Tailwind 3 configuration. Next 16 does not run ESLint during `next build`, so lint is an explicit check. Formatting excludes existing product specifications that are outside the scaffold change; lint, types and tests exclude the separate prototype.

GitHub Actions runs installation, formatting, lint, types, component tests, production build and Chromium checks on branch pushes and pull requests. It uses read-only repository permissions, no service secrets and no deployment action. Failure reports/traces are retained for seven days; keep fixtures free of private data. Workflow execution can only be verified after an authorized push. `NEXT_TELEMETRY_DISABLED=1` is set for CI and the browser-test server; it can also be set locally if desired.

## Product references and prototype

- [Repository instructions](AGENTS.md)
- [Design specification](design.md)
- [MVP requirements](docs/MVP.md), [user flows](docs/user-flows.md) and [resolved decisions](docs/product-decisions.md)
- [Architecture](docs/architecture.md) and [development plan](docs/development-plan.md)
- [BUILD-01 verification and limitations](docs/BUILD-01.md)
- Background-removal experiment: [prototype branch](https://github.com/vinay-krishna9/closet-theory/tree/spike/01-browser-background-removal), [recorded findings](https://github.com/vinay-krishna9/closet-theory/blob/70eec67e429787632a893405c0992c8a06f487a5/docs/spikes/SPIKE-01.md). Its code is not merged into the application; local photos and downloaded artifacts remain ignored.

SPIKE-02 will validate Clerk/Supabase owner isolation after visitor features and before account/private-data features. Outstanding physical-mobile image-processing checks remain a gate for personal-photo work. Neither integration is verified by this scaffold.
