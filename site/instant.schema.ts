import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
    }),
    routes: i.entity({
      name: i.string(),
      destinationUrl: i.string().optional(),
      scriptCode: i.string(),
      scriptFunctionName: i.string(),
      allowedHosts: i.json<string[]>(),
      allowedSecrets: i.json<string[]>(),
      active: i.boolean().indexed(),
      createdAt: i.number().indexed(),
    }),
    secrets: i.entity({
      name: i.string(),
      value: i.string(),
    }),
    events: i.entity({
      status: i.string().indexed(),
      latencyMs: i.number(),
      errorMessage: i.string().optional(),
      timestamp: i.number().indexed(),
    }),
  },
  links: {
    userRoutes: {
      forward: {
        on: "routes",
        has: "one",
        label: "owner",
        onDelete: "cascade",
      },
      reverse: { on: "$users", has: "many", label: "routes" },
    },
    routeSecrets: {
      forward: {
        on: "secrets",
        has: "one",
        label: "route",
        onDelete: "cascade",
      },
      reverse: { on: "routes", has: "many", label: "secrets" },
    },
    routeEvents: {
      forward: {
        on: "events",
        has: "one",
        label: "route",
        onDelete: "cascade",
      },
      reverse: { on: "routes", has: "many", label: "events" },
    },
    eventUser: {
      forward: {
        on: "events",
        has: "one",
        label: "user",
      },
      reverse: { on: "$users", has: "many", label: "events" },
    },
  },
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export { schema };
export default schema;
