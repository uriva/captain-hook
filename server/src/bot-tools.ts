import { db } from "./db.ts";
import { executeRoute } from "./handler.ts";

// deno-lint-ignore no-explicit-any
const queryRoute = async (routeId: string): Promise<any | null> => {
  const { routes } = await db.query({
    routes: {
      secrets: {},
      $: { where: { id: routeId } },
    },
  });
  return routes[0] ?? null;
};

export const handleGetRoute = async (
  body: Record<string, unknown>,
): Promise<Response> => {
  const routeId = body.routeId as string | undefined;
  if (!routeId) {
    return jsonResponse({ error: "Missing routeId" }, 400);
  }
  const route = await queryRoute(routeId);
  if (!route) {
    return jsonResponse({ error: "Route not found" }, 404);
  }
  return jsonResponse({
    id: route.id,
    name: route.name,
    triggerType: route.triggerType ?? "webhook",
    cronExpression: route.cronExpression ?? null,
    scriptCode: route.scriptCode ?? "",
    scriptFunctionName: route.scriptFunctionName ?? "",
    allowedHosts: route.allowedHosts ?? [],
    allowedSecrets: route.allowedSecrets ?? [],
    active: route.active,
  });
};

export const handleSaveScript = async (
  body: Record<string, unknown>,
): Promise<Response> => {
  const routeId = body.routeId as string | undefined;
  const scriptCode = body.scriptCode as string | undefined;
  const scriptFunctionName = body.scriptFunctionName as string | undefined;
  if (!routeId || !scriptCode || !scriptFunctionName) {
    return jsonResponse(
      { error: "Missing routeId, scriptCode, or scriptFunctionName" },
      400,
    );
  }
  const route = await queryRoute(routeId);
  if (!route) {
    return jsonResponse({ error: "Route not found" }, 404);
  }
  await db.transact(
    // deno-lint-ignore no-explicit-any
    (db.tx.routes as any)[routeId].update({ scriptCode, scriptFunctionName }),
  );
  return jsonResponse({ success: true });
};

export const handleUpdatePermissions = async (
  body: Record<string, unknown>,
): Promise<Response> => {
  const routeId = body.routeId as string | undefined;
  const allowedHosts = body.allowedHosts as string[] | undefined;
  const allowedSecrets = body.allowedSecrets as string[] | undefined;
  if (!routeId) {
    return jsonResponse({ error: "Missing routeId" }, 400);
  }
  const route = await queryRoute(routeId);
  if (!route) {
    return jsonResponse({ error: "Route not found" }, 404);
  }
  const updates: Record<string, unknown> = {};
  if (allowedHosts !== undefined) updates.allowedHosts = allowedHosts;
  if (allowedSecrets !== undefined) updates.allowedSecrets = allowedSecrets;
  if (Object.keys(updates).length === 0) {
    return jsonResponse(
      { error: "Provide allowedHosts or allowedSecrets" },
      400,
    );
  }
  await db.transact(
    // deno-lint-ignore no-explicit-any
    (db.tx.routes as any)[routeId].update(updates),
  );
  return jsonResponse({ success: true });
};

export const handleTestScript = async (
  body: Record<string, unknown>,
): Promise<Response> => {
  const routeId = body.routeId as string | undefined;
  const testInput = (body.testInput as Record<string, unknown>) ?? {};
  if (!routeId) {
    return jsonResponse({ error: "Missing routeId" }, 400);
  }
  const result = await executeRoute(routeId, testInput);
  return jsonResponse(result);
};

const jsonResponse = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
