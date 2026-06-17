import { computeSignature, interpret, parse, tokenize } from "@uri/safescript";
import type { ExecutionContext, Signature } from "@uri/safescript";
import { db } from "./db.ts";

type Route = {
  readonly id: string;
  readonly triggerType: "webhook" | "cron";
  readonly cronExpression?: string;
  readonly destinationUrl?: string;
  readonly active: boolean;
  readonly scriptCode: string;
  readonly scriptFunctionName: string;
  readonly allowedHosts: readonly string[];
  readonly allowedSecrets: readonly string[];
};

type Secret = {
  readonly name: string;
  readonly value: string;
};

type ExecutionResult =
  | {
    readonly ok: true;
    readonly result: unknown;
    readonly latencyMs: number;
  }
  | {
    readonly ok: false;
    readonly error: string;
    readonly latencyMs: number;
    readonly status: number;
  };

const fetchRoute = async (
  routeId: string,
): Promise<{ route: Route; secrets: readonly Secret[] } | null> => {
  const { routes } = await db.query({
    routes: {
      secrets: {},
      $: { where: { id: routeId } },
    },
  });
  // deno-lint-ignore no-explicit-any
  const raw = routes[0] as any;
  if (!raw) return null;
  return {
    route: {
      id: raw.id,
      triggerType: raw.triggerType ?? "webhook",
      cronExpression: raw.cronExpression,
      destinationUrl: raw.destinationUrl,
      active: raw.active,
      scriptCode: raw.scriptCode,
      scriptFunctionName: raw.scriptFunctionName,
      allowedHosts: raw.allowedHosts ?? [],
      allowedSecrets: raw.allowedSecrets ?? [],
    },
    secrets: (raw.secrets ?? []).map(
      // deno-lint-ignore no-explicit-any
      (s: any) => ({ name: s.name, value: s.value }),
    ),
  };
};

const verifyPermissions = (
  signature: Signature,
  route: Route,
): string | null => {
  const disallowedHosts = [...signature.hosts].filter(
    (h) => !route.allowedHosts.includes(h),
  );
  if (disallowedHosts.length > 0) {
    return `Script accesses disallowed hosts: ${disallowedHosts.join(", ")}`;
  }
  const disallowedSecrets = [...signature.secretsRead].filter(
    (s) => !route.allowedSecrets.includes(s),
  );
  if (disallowedSecrets.length > 0) {
    return `Script reads disallowed secrets: ${disallowedSecrets.join(", ")}`;
  }
  const disallowedWriteSecrets = [...signature.secretsWritten].filter(
    (s) => !route.allowedSecrets.includes(s),
  );
  if (disallowedWriteSecrets.length > 0) {
    return `Script writes disallowed secrets: ${
      disallowedWriteSecrets.join(", ")
    }`;
  }
  return null;
};

const buildContext = (secrets: readonly Secret[]): ExecutionContext => {
  const secretMap = new Map(secrets.map((s) => [s.name, s.value]));
  return {
    readSecret: (_name: string) =>
      Promise.resolve(secretMap.get(_name)).then((val) => {
        if (val === undefined) throw new Error(`Secret "${_name}" not found`);
        return val;
      }),
    writeSecret: (_name: string, _value: string) => Promise.resolve(),
    fetch: globalThis.fetch,
  };
};

const logEvent = async (
  routeId: string,
  userId: string,
  status: "success" | "error",
  latencyMs: number,
  errorMessage?: string,
) => {
  const id = crypto.randomUUID();
  await db.transact(
    // deno-lint-ignore no-explicit-any
    (db.tx.events as any)[id].update({
      routeId,
      userId,
      status,
      latencyMs,
      errorMessage: errorMessage ?? null,
      timestamp: Date.now(),
    }),
  );
};

export const executeRoute = async (
  routeId: string,
  args: Record<string, unknown>,
): Promise<ExecutionResult> => {
  const start = performance.now();

  const fetched = await fetchRoute(routeId);
  if (!fetched) {
    return { ok: false, error: "Route not found", latencyMs: 0, status: 404 };
  }
  const { route, secrets } = fetched;

  if (!route.active) {
    return { ok: false, error: "Route is inactive", latencyMs: 0, status: 403 };
  }
  if (!route.scriptCode) {
    return {
      ok: false,
      error: "No script configured",
      latencyMs: 0,
      status: 500,
    };
  }

  try {
    const tokens = tokenize(route.scriptCode);
    const program = parse(tokens);
    const signature = computeSignature(program, route.scriptFunctionName);

    const permError = verifyPermissions(signature, route);
    if (permError) {
      const latencyMs = performance.now() - start;
      await logEvent(route.id, "", "error", latencyMs, permError);
      return { ok: false, error: permError, latencyMs, status: 403 };
    }

    const ctx = buildContext(secrets);
    const result = await interpret(
      program,
      route.scriptFunctionName,
      args,
      ctx,
    );

    const latencyMs = performance.now() - start;
    await logEvent(route.id, "", "success", latencyMs);
    return { ok: true, result, latencyMs };
  } catch (err) {
    const latencyMs = performance.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    await logEvent(route.id, "", "error", latencyMs, message);
    return { ok: false, error: message, latencyMs, status: 500 };
  }
};

export const handleWebhook = async (
  routeId: string,
  body: unknown,
  headers: Record<string, string>,
): Promise<Response> => {
  const result = await executeRoute(routeId, { payload: body, headers });

  // If this was triggered by Upstash QStash, update the database record!
  const qstashMessageId = headers["upstash-message-id"];
  if (qstashMessageId) {
    try {
      const { scheduledRuns } = await db.query({
        scheduledRuns: {
          $: { where: { qstashMessageId } },
        },
      });
      if (scheduledRuns && scheduledRuns.length > 0) {
        const runId = scheduledRuns[0].id;
        await db.transact(
          // deno-lint-ignore no-explicit-any
          (db.tx as any).scheduledRuns[runId].update({
            status: result.ok ? "completed" : "failed",
            errorMessage: result.ok ? null : result.error,
          }),
        );
        console.log(
          `[webhook] Updated QStash scheduled run ${runId} to ${
            result.ok ? "completed" : "failed"
          }`,
        );
      }
    } catch (err) {
      console.error(
        `[webhook] Failed to update QStash scheduled run status:`,
        err,
      );
    }
  }

  if (result.ok) {
    return new Response(
      JSON.stringify({
        ok: true,
        result: result.result,
        latencyMs: Math.round(result.latencyMs),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }
  return new Response(JSON.stringify({ error: result.error }), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
};

export const handleSchedule = async (
  routeId: string,
  body: unknown,
  request: Request,
): Promise<Response> => {
  if (!body || typeof body !== "object") {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { timestamp, payload } = body as Record<string, unknown>;

  if (timestamp === undefined || timestamp === null) {
    return new Response(
      JSON.stringify({ error: "Missing required field: timestamp" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Parse timestamp (ISO 8601 string, numeric timestamp in ms, etc.)
  let parsedTimestamp: number;
  if (typeof timestamp === "number") {
    parsedTimestamp = timestamp;
  } else if (typeof timestamp === "string") {
    const d = new Date(timestamp);
    parsedTimestamp = d.getTime();
    if (isNaN(parsedTimestamp)) {
      return new Response(
        JSON.stringify({ error: "Invalid timestamp string" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  } else {
    return new Response(
      JSON.stringify({ error: "Timestamp must be a number or string" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Validate route exists
  const { routes } = await db.query({
    routes: {
      $: { where: { id: routeId } },
    },
  });
  if (routes.length === 0) {
    return new Response(JSON.stringify({ error: "Route not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // If QSTASH_TOKEN is configured, use QStash!
  const qstashToken = Deno.env.get("QSTASH_TOKEN");
  let qstashMessageId: string | null = null;

  if (qstashToken) {
    const origin = new URL(request.url).origin;
    const targetUrl = `${origin}/w/${routeId}`;

    try {
      console.log(
        `[schedule] Scheduling via QStash for URL: ${targetUrl} at timestamp: ${parsedTimestamp}`,
      );
      const qstashRes = await fetch(
        `https://qstash.upstash.io/v2/publish/${targetUrl}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${qstashToken}`,
            "Content-Type": "application/json",
            "Upstash-Not-Before": String(Math.floor(parsedTimestamp / 1000)),
          },
          body: JSON.stringify(payload ?? {}),
        },
      );

      if (!qstashRes.ok) {
        const errText = await qstashRes.text();
        throw new Error(
          `QStash response error (${qstashRes.status}): ${errText}`,
        );
      }

      const qstashData = await qstashRes.json();
      qstashMessageId = qstashData.messageId;
      console.log(
        `[schedule] Successfully scheduled in QStash. MessageId: ${qstashMessageId}`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[schedule] QStash scheduling failed:`, msg);
      return new Response(
        JSON.stringify({ error: `Failed to schedule with QStash: ${msg}` }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  } else {
    console.log(
      `[schedule] No QSTASH_TOKEN env var configured. Falling back to local minutely-cron polling.`,
    );
  }

  // Insert scheduled run
  const id = crypto.randomUUID();
  try {
    await db.transact([
      // deno-lint-ignore no-explicit-any
      (db.tx as any).scheduledRuns[id].update({
        timestamp: parsedTimestamp,
        payload: payload ? JSON.stringify(payload) : null,
        status: qstashToken ? "scheduled" : "pending",
        qstashMessageId,
      }),
      // deno-lint-ignore no-explicit-any
      (db.tx as any).scheduledRuns[id].link({ route: routeId }),
    ]);

    return new Response(
      JSON.stringify({
        ok: true,
        id,
        routeId,
        timestamp: parsedTimestamp,
        status: qstashToken ? "scheduled" : "pending",
        qstashMessageId,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: `Failed to save scheduled run: ${msg}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
