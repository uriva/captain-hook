import { db } from "./db.ts";
import { executeRoute } from "./handler.ts";

const matchesCronField = (field: string, value: number): boolean => {
  if (field === "*") return true;
  if (field.startsWith("*/")) return value % parseInt(field.slice(2)) === 0;
  if (field.includes("-")) {
    const [min, max] = field.split("-").map(Number);
    return value >= min && value <= max;
  }
  if (field.includes(",")) {
    return field.split(",").map(Number).includes(value);
  }
  return parseInt(field) === value;
};

const matchesCron = (expression: string, date: Date): boolean => {
  const parts = expression.split(" ");
  if (parts.length !== 5) return false;
  const [_minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  return (
    matchesCronField(hour, date.getUTCHours()) &&
    matchesCronField(dayOfMonth, date.getUTCDate()) &&
    matchesCronField(month, date.getUTCMonth() + 1) &&
    matchesCronField(dayOfWeek, date.getUTCDay())
  );
};

export const handleTick = async () => {
  const now = new Date();
  const nowMs = now.getTime();
  console.log(`[tick] Tick at ${now.toISOString()}`);

  // 1. Process Cron-like Triggers (Only on minute 0, i.e. hourly)
  if (now.getUTCMinutes() === 0) {
    console.log(`[tick] Running hourly cron triggers...`);
    const { routes } = await db.query({
      routes: {
        $: { where: { triggerType: "cron", active: true } },
      },
    });

    // deno-lint-ignore no-explicit-any
    const cronRoutes = (routes as any[]).filter(
      (r) => r.cronExpression && matchesCron(r.cronExpression, now),
    );

    if (cronRoutes.length > 0) {
      console.log(`[cron] Executing ${cronRoutes.length} routes`);
      const results = await Promise.allSettled(
        cronRoutes.map((route) => executeRoute(route.id, {})),
      );

      results.forEach((result, i) => {
        if (result.status === "rejected") {
          console.error(
            `[cron] Failed route ${cronRoutes[i].id}:`,
            result.reason,
          );
        } else if (!result.value.ok) {
          console.error(
            `[cron] Error in route ${cronRoutes[i].id}: ${result.value.error}`,
          );
        } else {
          console.log(`[cron] Route ${cronRoutes[i].id} completed`);
        }
      });
    } else {
      console.log("[cron] No matching routes");
    }
  }

  // 2. Process Scheduled Runs (Every minute)
  console.log(`[tick] Checking for scheduled runs...`);
  const { scheduledRuns } = await db.query({
    scheduledRuns: {
      route: {},
      $: { where: { status: "pending" } },
    },
  });

  // deno-lint-ignore no-explicit-any
  const dueRuns = (scheduledRuns as any[]).filter(
    (run) => run.timestamp <= nowMs,
  );

  if (dueRuns.length > 0) {
    console.log(`[tick] Executing ${dueRuns.length} due scheduled runs`);

    await Promise.all(
      dueRuns.map(async (run) => {
        const routeId = run.route?.id;
        if (!routeId) {
          console.error(`[tick] Scheduled run ${run.id} has no linked route`);
          await db.transact(
            // deno-lint-ignore no-explicit-any
            (db.tx as any).scheduledRuns[run.id].update({
              status: "failed",
              errorMessage: "Linked route not found",
            }),
          );
          return;
        }

        let parsedPayload: unknown = {};
        if (run.payload) {
          try {
            parsedPayload = JSON.parse(run.payload);
          } catch {
            parsedPayload = run.payload;
          }
        }

        try {
          console.log(
            `[tick] Running scheduled route ${routeId} (Run: ${run.id})`,
          );
          const result = await executeRoute(routeId, {
            payload: parsedPayload,
          });

          await db.transact(
            // deno-lint-ignore no-explicit-any
            (db.tx as any).scheduledRuns[run.id].update({
              status: result.ok ? "completed" : "failed",
              errorMessage: result.ok ? null : result.error,
            }),
          );
          console.log(
            `[tick] Scheduled run ${run.id} updated with status: ${
              result.ok ? "completed" : "failed"
            }`,
          );
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error(
            `[tick] Scheduled run ${run.id} failed to execute:`,
            errMsg,
          );
          await db.transact(
            // deno-lint-ignore no-explicit-any
            (db.tx as any).scheduledRuns[run.id].update({
              status: "failed",
              errorMessage: errMsg,
            }),
          );
        }
      }),
    );
  } else {
    console.log("[tick] No pending scheduled runs due");
  }
};
