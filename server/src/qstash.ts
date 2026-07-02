import { Receiver } from "@upstash/qstash";

const currentSigningKey = Deno.env.get("QSTASH_CURRENT_SIGNING_KEY");
const nextSigningKey = Deno.env.get("QSTASH_NEXT_SIGNING_KEY");

const receiver = currentSigningKey && nextSigningKey
  ? new Receiver({ currentSigningKey, nextSigningKey })
  : null;

type VerifyResult =
  | { readonly ok: true; readonly signed: boolean }
  | { readonly ok: false; readonly error: string };

// Verifies a QStash callback signature when present.
// Unsigned requests pass through (the /w/:routeId endpoint is also a public
// webhook receiver). Signed requests must verify against the signing keys.
export const verifyQstashSignature = (
  signature: string | undefined,
  rawBody: string,
  url: string,
): Promise<VerifyResult> => {
  if (!signature) return Promise.resolve({ ok: true, signed: false });
  if (!receiver) {
    return Promise.resolve({
      ok: false,
      error:
        "QStash signature present but signing keys are not configured on the server",
    });
  }
  return receiver
    .verify({ body: rawBody, signature, url })
    .then((valid) =>
      valid
        ? ({ ok: true, signed: true } as const)
        : ({ ok: false, error: "Invalid QStash signature" } as const)
    )
    .catch((err) => ({
      ok: false as const,
      error: err instanceof Error ? err.message : String(err),
    }));
};
