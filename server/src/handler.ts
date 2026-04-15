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
