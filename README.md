# Captain Hook

Webhook translator powered by [safescript](https://github.com/uriva/safescript).
Transform incoming webhooks and forward them to destinations. The transformation
runs in safescript, which means you know exactly where your data goes before it
runs. No sandbox surprises. Static analysis proves which hosts the script
contacts and which secrets it reads.

## Why this exists

Every webhook infrastructure tool gives you some way to transform payloads.
Hookdeck and Convoy let you write arbitrary JS in a sandbox. AWS EventBridge
gives you JSON templates. The first approach is powerful but opaque. The second
is safe but barely useful.

Safescript sits in the middle. You write real code with HTTP requests, secret
access, and data transformation. But the language is designed so that static
analysis can prove exactly what the code does before it runs. Your script wants
to talk to `api.slack.com` and read `SLACK_TOKEN`? You'll see that in the
signature. It tries to reach `evil.com`? The permission check blocks it.

## Architecture

Two deployments:

**Server** (`server/`) — Deno server on Deno Deploy. Receives webhooks at
`POST /w/:routeId`, looks up the route in InstantDB, parses the safescript,
verifies permissions via `computeSignature`, executes via `interpret`, and
forwards the result to the destination URL.

**Site** (`site/`) — Next.js app on Deno Deploy. Landing page and dashboard.
Users sign in with magic code auth, create routes, write transformation scripts,
manage permissions and secrets, and view event logs.

## Local development

### Server

```sh
cd server
cp .env.example .env
# fill in INSTANT_APP_ID and INSTANT_ADMIN_TOKEN
deno run --allow-all src/main.ts
```

### Site

```sh
cd site
npm install
# create .env.local with NEXT_PUBLIC_INSTANT_APP_ID and INSTANT_ADMIN_TOKEN
npx next dev
```

## How it works

1. You create a route in the dashboard with a destination URL
2. You write a safescript function that takes `{ payload, headers }` and returns
   the transformed payload
3. You set which hosts and secrets the script is allowed to access
4. Captain Hook gives you a webhook URL
5. When that URL receives a POST, the server parses your script, statically
   verifies it stays within permissions, executes it, and forwards the result to
   your destination

The transformation function receives:

```
{
  payload: <parsed JSON body>,
  headers: <object of HTTP headers>
}
```

Whatever it returns gets POSTed to the destination as JSON.

## Example script

Reshape a GitHub push webhook into a Slack message:

```
notifySlack = (input: { payload: string, headers: { x-github-event: string } }): { ok: boolean } => {
  parsed = jsonParse({ text: input.payload })
  token = readSecret({ name: "slack-token" })
  message = stringConcat({ parts: ["Push to ", parsed.value.repository.full_name, " by ", parsed.value.sender.login] })
  body = jsonStringify({ value: { channel: "#deploys", text: message.result } })
  response = httpRequest({
    host: "slack.com",
    method: "POST",
    path: "/api/chat.postMessage",
    headers: { "authorization": stringConcat({ parts: ["Bearer ", token.value] }).result, "content-type": "application/json" },
    body: body.text
  })
  return { ok: response.status == 200 }
}
```

Static analysis of this script tells you: it contacts `slack.com`, reads secret
`slack-token`, and nothing else. You can verify this before the script ever
runs.

## Pricing

100,000 events per month free. Beyond that, get in touch at
uri.valevski@gmail.com.

## License

Open source. MIT.
