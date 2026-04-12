import { handleWebhook } from "./handler.ts";
import { computeSignature, parse, tokenize } from "@uri/safescript";

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

const serializeSignature = (sig: {
  name: string;
  params: readonly { name: string; type: unknown }[];
  returnType: unknown;
  secretsRead: ReadonlySet<string>;
  secretsWritten: ReadonlySet<string>;
  hosts: ReadonlySet<string>;
  envReads: ReadonlySet<string>;
  dataFlow: ReadonlyMap<string, ReadonlySet<string>>;
  returnSources: ReadonlySet<string>;
  memoryBytes: number;
  runtimeMs: number;
  diskBytes: number;
}) => ({
  name: sig.name,
  params: sig.params.map((p) => ({
    name: p.name,
    type: String(p.type),
  })),
  returnType: sig.returnType ? String(sig.returnType) : null,
  secretsRead: [...sig.secretsRead],
  secretsWritten: [...sig.secretsWritten],
  hosts: [...sig.hosts],
  envReads: [...sig.envReads],
  dataFlow: Object.fromEntries(
    [...sig.dataFlow.entries()].map(([k, v]) => [k, [...v]]),
  ),
  returnSources: [...sig.returnSources],
  memoryBytes: sig.memoryBytes,
  runtimeMs: sig.runtimeMs,
  diskBytes: sig.diskBytes,
});

const handleAnalyze = async (request: Request): Promise<Response> => {
  const body = (await parseJsonBody(request)) as {
    code?: string;
    functionName?: string;
  };
  if (!body.code || !body.functionName) {
    return new Response(
      JSON.stringify({ error: "Missing code or functionName" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  }
  try {
    const tokens = tokenize(body.code);
    const program = parse(tokens);
    const signature = computeSignature(program, body.functionName);
    return new Response(JSON.stringify(serializeSignature(signature)), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 422,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

const withCorsHeaders = (response: Response): Response => {
  const responseHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    responseHeaders.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
};

const handleRequest = async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(request.url);

  if (url.pathname === "/analyze" && request.method === "POST") {
    return handleAnalyze(request);
  }

  const match = url.pathname.match(/^\/w\/([a-zA-Z0-9_-]+)$/);

  if (match && request.method === "POST") {
    const routeId = match[1];
    const body = await parseJsonBody(request);
    const headers = extractHeaders(request);
    const response = await handleWebhook(routeId, body, headers);
    return withCorsHeaders(response);
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
