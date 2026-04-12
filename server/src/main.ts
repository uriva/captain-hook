import { handleWebhook } from "./handler.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const parseJsonBody = async (request: Request): Promise<unknown> => {
  const text = await request.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
};

const extractHeaders = (request: Request): Record<string, string> => {
  const result: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
};

const handleRequest = async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const match = url.pathname.match(/^\/w\/([a-zA-Z0-9_-]+)$/);

  if (match && request.method === "POST") {
    const routeId = match[1];
    const body = await parseJsonBody(request);
    const headers = extractHeaders(request);
    const response = await handleWebhook(routeId, body, headers);

    // Add CORS headers to response
    const responseHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  }

  if (url.pathname === "/health") {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
};

const port = parseInt(Deno.env.get("PORT") ?? "8000");

Deno.serve({ port }, handleRequest);
