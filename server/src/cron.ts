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

export const handleCronTick = async () => {
  const now = new Date();
  console.log(`[cron] Tick at ${now.toISOString()}`);

  const { routes } = await db.query({
    routes: {
      $: { where: { triggerType: "cron", active: true } },
    },
  });

  // deno-lint-ignore no-explicit-any
  const cronRoutes = (routes as any[]).filter(
    (r) => r.cronExpression && matchesCron(r.cronExpression, now),
  );

  if (cronRoutes.length === 0) {
    console.log("[cron] No matching routes");
    return;
  }

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
};
