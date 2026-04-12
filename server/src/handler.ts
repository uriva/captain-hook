import {
  computeSignature,
  interpret,
  parse,
  tokenize,
} from "@uri/safescript";
import type { ExecutionContext, Signature } from "@uri/safescript";
import { db } from "./db.ts";

type Route = {
  readonly id: string;
  readonly destinationUrl: string;
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
    readSecret: async (name: string) => {
      const val = secretMap.get(name);
      if (val === undefined) throw new Error(`Secret "${name}" not found`);
      return val;
    },
    writeSecret: async (_name: string, _value: string) => {
      // No-op in webhook context for now
    },
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

export const handleWebhook = async (
  routeId: string,
  body: unknown,
  headers: Record<string, string>,
): Promise<Response> => {
  const start = performance.now();

  const result = await fetchRoute(routeId);
  if (!result) {
    return new Response(JSON.stringify({ error: "Route not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  const { route, secrets } = result;

  if (!route.active) {
    return new Response(JSON.stringify({ error: "Route is inactive" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!route.scriptCode) {
    return new Response(
      JSON.stringify({ error: "No script configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const tokens = tokenize(route.scriptCode);
    const program = parse(tokens);
    const signature = computeSignature(program, route.scriptFunctionName);

    const permError = verifyPermissions(signature, route);
    if (permError) {
      const latency = performance.now() - start;
      await logEvent(route.id, "", "error", latency, permError);
      return new Response(JSON.stringify({ error: permError }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const ctx = buildContext(secrets);
    const transformed = await interpret(
      program,
      route.scriptFunctionName,
      { payload: body, headers },
      ctx,
    );

    const forwardResponse = await fetch(route.destinationUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transformed),
    });

    const latency = performance.now() - start;
    await logEvent(route.id, "", "success", latency);

    return new Response(
      JSON.stringify({
        ok: true,
        forwarded: forwardResponse.status,
        latencyMs: Math.round(latency),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    const latency = performance.now() - start;
    const message = err instanceof Error ? err.message : String(err);
    await logEvent(route.id, "", "error", latency, message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
