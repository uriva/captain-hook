# Captain Hook

## Project structure

- `server/` — Deno webhook server (deployed to Deno Deploy)
- `site/` — Next.js landing page + dashboard (deployed to Deno Deploy)
- `bot-prompt.md` — System prompt for the AI script assistant bot (on
  prompt2bot)

## Coding conventions

Functional programming style. Arrow functions only, no `function` keyword, no
classes, no `let`. Use `map`/`filter`/`reduce` instead of loops. No
`export default` except where Next.js requires it (page components). No comments
unless necessary.

Use gamla pipes when applicable. Prefer point-free style.

Components are `const` arrow functions with named exports.

Avoid `as` type assertions. Prefer type guards.

## Server (`server/`)

Deno project. Deps in `server/deno.json`.

Key deps: `@uri/safescript`, `jsr:@uri/gamla`, `@instantdb/admin`.

Entry point: `server/src/main.ts`.

Routes:

- `POST /w/:routeId` — receive webhook, transform, forward
- `POST /analyze` — accepts `{ code, functionName }`, returns serialized
  `computeSignature` result
- `GET /health` — health check
- `Deno.cron("hourly-tick", "0 * * * *", handler)` — hourly cron ticker

Trigger types:

- **Webhook** (`triggerType: "webhook"`): HTTP trigger via `POST /w/:routeId`.
  Script receives `{ payload, headers }`.
- **Cron** (`triggerType: "cron"`): Scheduled trigger. Script receives `{}`
  (empty object). `cronExpression` field stores 5-field cron expression. Server
  runs hourly ticker via `Deno.cron`, matches cron expressions against UTC time.
- Existing routes without `triggerType` default to `"webhook"` (handled with
  `?? "webhook"` fallback in all code paths).

Key files:

- `server/src/handler.ts` — `executeRoute` (shared execution logic),
  `handleWebhook` (HTTP wrapper). Route type includes `triggerType` and
  `cronExpression`.
- `server/src/cron.ts` — `matchesCron`, `matchesCronField`, `handleCronTick`.
  Cron matching handles `*`, `*/N`, `N-M` ranges, `N,M` lists, exact numbers.
  Minute field is ignored (ticker runs at minute 0).
- `server/src/db.ts` — InstantDB admin client.

Deployed at `https://captain-hook-server.uriva.deno.net`.

Type check with:
`deno fmt --check && deno lint && deno check server/src/main.ts`

## Site (`site/`)

Next.js project with npm deps. `site/deno.json` has `"nodeModulesDir": "auto"`.

Deno LSP shows false errors for npm packages in this directory. These are not
real issues. The actual build check is `npx next build` from `site/`.

shadcn/ui with base-nova style, 0rem radius, oklch colors, crimson accent
(`--hook`). DM Sans + JetBrains Mono fonts.

Key patterns:

- `lucide-react` has no `Github` icon. Use inline SVG component `GithubIcon`.
- shadcn Button has no `asChild`. Use `buttonVariants` for links styled as
  buttons.
- InstantDB `i.json<string[]>()` stores actual arrays. Pass arrays directly to
  `update()`, not `JSON.stringify()`.

Deployed at `https://captain-hook.uriva.deno.net`.

## InstantDB

App ID: `edd6ccb0-9a8b-4d4c-97e9-cd46528ce442`

Schema in `site/instant.schema.ts`. Permissions in `site/instant.perms.ts`.

Entities: routes, secrets, events. Routes link to owner ($users), secrets, and
events. Route fields include `triggerType` (optional string, indexed) and
`cronExpression` (optional string).

Push permissions with: `npx instant-cli push perms --yes` from `site/`.

## Deno Deploy

Both apps deploy via `deno deploy --prod` from their respective directories.

Server org: `uriva`, app: `captain-hook-server`. Site org: `uriva`, app:
`captain-hook`.

URL format: `https://{app}.{org}.deno.net`

Site uses `.npmrc` with `ignore-scripts=true` to avoid msw postinstall failures.
`shadcn` must be in devDependencies.

## AI assistant

The route detail page has a split-screen layout: inline chat (left) and tabs
(right) for diagram, settings, and events. The chat connects to a prompt2bot bot
whose system prompt is in `bot-prompt.md`.

alice-and-bot chat is loaded via `next/dynamic` with `ssr: false` to avoid
`crypto.subtle` SSR issues. Uses `@alice-and-bot/core` from JSR (installed via
`npx jsr add`). `useCredentials("User", "captain-hook-chat")` requires a truthy
name string.

The bot's public key goes in `NEXT_PUBLIC_BOT_PUBLIC_KEY` env var (on Deno
Deploy and in `.env.local`). Without the key, the widget does not render.

The widget loads from
`https://storage.googleapis.com/alice-and-bot/widget/dist/widget.iife.js`.

## Pre-commit hook

`.git/hooks/pre-commit` runs:

- `deno fmt --check && deno lint && deno check` on server
- `npx next build` on site
