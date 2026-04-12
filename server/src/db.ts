import { init } from "@instantdb/admin";

const appId = Deno.env.get("INSTANT_APP_ID");
const adminToken = Deno.env.get("INSTANT_ADMIN_TOKEN");

if (!appId || !adminToken) {
  throw new Error("INSTANT_APP_ID and INSTANT_ADMIN_TOKEN are required");
}

export const db = init({ appId, adminToken });
