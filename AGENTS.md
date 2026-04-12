# Captain Hook

## Project structure

- `server/` — Deno webhook server (deployed to Deno Deploy)
- `site/` — Next.js landing page + dashboard (deployed to Deno Deploy)
- `bot-prompt.md` — System prompt for the AI script assistant bot (on prompt2bot)

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
- `GET /health` — health check

Deployed at `https://captain-hook-server.uriva.deno.net`.

Type check with: `deno fmt --check && deno lint && deno check server/src/main.ts`

## Site (`site/`)

Next.js project with npm deps. `site/deno.json` has
`"nodeModulesDir": "auto"`.

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
events.

Push permissions with: `npx instant-cli push perms --yes` from `site/`.

## Deno Deploy

Both apps deploy via `deno deploy --prod` from their respective directories.

Server org: `uriva`, app: `captain-hook-server`.
Site org: `uriva`, app: `captain-hook`.

URL format: `https://{app}.{org}.deno.net`

Site uses `.npmrc` with `ignore-scripts=true` to avoid msw postinstall failures.
`shadcn` must be in devDependencies.

## AI assistant

The route editor integrates an alice-and-bot chat widget (floating bubble). It
connects to a prompt2bot bot whose system prompt is in `bot-prompt.md`.

The bot's public key goes in `NEXT_PUBLIC_BOT_PUBLIC_KEY` env var (on Deno
Deploy and in `.env.local`). Without the key, the widget does not render.

The widget loads from
`https://storage.googleapis.com/alice-and-bot/widget/dist/widget.iife.js`.

## Pre-commit hook

`.git/hooks/pre-commit` runs:
- `deno fmt --check && deno lint && deno check` on server
- `npx next build` on site
